'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const supabase = createClient();

type Profile = {
    id: string;
    full_name: string | null;
    role: 'influencer' | 'brand' | 'admin' | 'superadmin' | null;
    email: string | null;
    status?: string;
    avatar_url?: string;
    logo_url?: string;
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

const ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click',
];

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // ⚠️ FIX: Don't call impure function during render. Initialize with 0.
    const lastActivityRef = useRef<number>(0);
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
    }, []);

    // Activity listeners
    useEffect(() => {
        if (!user) return;

        ACTIVITY_EVENTS.forEach((event) =>
            window.addEventListener(event, resetActivity, { passive: true })
        );

        return () => {
            ACTIVITY_EVENTS.forEach((event) =>
                window.removeEventListener(event, resetActivity)
            );
        };
    }, [user, resetActivity]);

    // Inactivity check
    useEffect(() => {
        if (!user) {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
            return;
        }

        inactivityTimerRef.current = setInterval(() => {
            const idleTime = Date.now() - lastActivityRef.current;
            if (idleTime >= INACTIVITY_TIMEOUT) {
                supabase.auth.signOut();
                router.push('/');
            }
        }, 10_000);

        return () => {
            if (inactivityTimerRef.current) {
                clearInterval(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [user, router]);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, role, email, status, avatar_url, logo_url')
            .eq('id', userId)
            .single();
        if (data) {
            setProfile(data as Profile);
        }
    }, []);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
                resetActivity(); // Set initial activity time
            }
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                resetActivity();
            } else {
                setProfile(null);
            }
            setLoading(false);
            router.refresh();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, fetchProfile, resetActivity]);

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
