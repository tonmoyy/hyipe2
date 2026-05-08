'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Profile = {
    id: string;
    full_name: string | null;
    role: 'influencer' | 'brand' | 'admin' | 'superadmin' | null;
    email: string | null;
};

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    signOut: async () => {},
    refreshProfile: async () => {},
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) {
            setProfile(data as Profile);
        }
    }, [supabase]);

    // On mount: get session and subscribe to changes
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
            router.refresh(); // ensure server components re-render
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router, fetchProfile]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, signOut, refreshProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}