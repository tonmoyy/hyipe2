// src/app/auth/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';

type Step = 'choose' | 'verify' | 'welcome';

export default function AuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, loading: authLoading } = useAuth();
    const supabase = createClient();

    const [step, setStep] = useState<Step>('choose');
    const [tab, setTab] = useState<'signup' | 'login'>(
        searchParams.get('signup') === 'true' ? 'signup' : 'login'
    );
    const [role, setRole] = useState<'influencer' | 'brand'>('influencer');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!authLoading && user && profile?.role) {
            router.replace(`/dashboard/${profile.role}`);
        }
    }, [user, profile, authLoading, router]);

    const handleSignUp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setError('An account with this email already exists.');
            setLoading(false);
            return;
        }

        if (!data.session) setStep('verify');
        else router.push(`/dashboard/${role}`);

        setLoading(false);
    };

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');
        setInfo('');
        setLoading(true);

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (loginError) {
            if (
                loginError.message?.includes('Invalid login credentials') ||
                loginError.code === 'invalid_credentials'
            ) {
                setInfo('No account found. Please sign up.');
                setTab('signup');
                setPassword('');
                setLoading(false);
                return;
            }

            setError(loginError.message);
            setLoading(false);
            return;
        }

        const { user: loggedUser } = data;

        if (loggedUser) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', loggedUser.id)
                .single();

            const redirectRole = profileData?.role || 'influencer';
            router.push(`/dashboard/${redirectRole}`);
        }

        setLoading(false);
    };

    const resendVerification = async () => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) setError(error.message);
        else setInfo('Verification email resent.');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-[#888880]">
                Loading…
            </div>
        );
    }

    if (user && profile?.role) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
            {/* LEFT PANEL (desktop only) */}
            <div className="hidden md:flex bg-[#0D0D0B] text-white px-10 lg:px-16 py-12 flex-col justify-between">
                <div>
                    <div className="font-['Playfair_Display'] text-3xl lg:text-4xl font-bold mb-2">
                        HYIPE
                    </div>
                    <p className="text-xs text-white/50">
                        Pakistan&apos;s creator marketplace
                    </p>
                </div>

                <blockquote className="font-['Playfair_Display'] text-xl lg:text-2xl italic text-white/80 max-w-xs">
                    “The safest way to collaborate between brands and creators.”
                </blockquote>

                <div className="text-[10px] text-white/30 uppercase tracking-[0.08em]">
                    www.thehyipe.com
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="bg-[#FAFAF7] px-5 sm:px-10 md:px-14 lg:px-16 py-10 md:py-16 flex items-center justify-center">
                <div className="w-full max-w-[420px]">
                    {/* MOBILE HEADER (visible only on small screens) */}
                    <div className="md:hidden bg-[#0D0D0B] text-white -mx-5 sm:-mx-10 px-5 sm:px-10 pt-6 pb-8 mb-8">
                        <button
                            onClick={() => router.push('/')}
                            className="text-white/80 text-sm mb-5 inline-block hover:text-white transition-colors"
                        >
                            ← Back to site
                        </button>

                        {/* HYIPE LOGO white on dark */}
                        <div className="hyipe-logo logo-md" style={{ color: 'white', marginBottom: '12px' }}>
                            <div className="wordmark" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                                <span className="hy">HY</span>
                                <span className="i-wrap" style={{ display: 'inline-block', margin: '0 2px' }}>
                                    <span
                                        className="i-dot"
                                        style={{
                                            display: 'block',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            margin: '0 auto 2px',
                                        }}
                                    ></span>
                                    <span
                                        className="i-stem"
                                        style={{
                                            display: 'block',
                                            width: '2px',
                                            height: '18px',
                                            background: 'white',
                                            margin: '0 auto',
                                        }}
                                    ></span>
                                </span>
                                <span className="pe">PE</span>
                            </div>
                            <div className="tagline" style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>
                                Influencer Marketplace
                            </div>
                        </div>

                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', marginTop: '4px', lineHeight: 1.55 }}>
                            Pakistan&apos;s creator marketplace. Escrow-protected · EasyPaisa / JazzCash · Verified brands
                        </p>
                    </div>

                    {/* DESKTOP HEADING (hidden on mobile) */}
                    <h2 className="hidden md:block font-['Playfair_Display'] text-2xl sm:text-3xl font-bold mb-2">
                        Join HYIPE
                    </h2>
                    <p className="text-xs sm:text-sm text-[#888880] mb-6 sm:mb-8">
                        Sign in or create your account.
                    </p>

                    {/* TAB SWITCH */}
                    <div className="flex border border-[#E5E5DF] mb-6 rounded-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setTab('signup')}
                            className={`flex-1 py-3 text-xs uppercase tracking-[0.06em] ${
                                tab === 'signup'
                                    ? 'bg-[#0D0D0B] text-white'
                                    : 'text-[#888880]'
                            }`}
                        >
                            Sign Up
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('login')}
                            className={`flex-1 py-3 text-xs uppercase tracking-[0.06em] ${
                                tab === 'login'
                                    ? 'bg-[#0D0D0B] text-white'
                                    : 'text-[#888880]'
                            }`}
                        >
                            Log In
                        </button>
                    </div>

                    {info && (
                        <div className="mb-4 text-xs p-3 bg-blue-50 border border-blue-200 text-blue-700">
                            {info}
                        </div>
                    )}

                    {/* SIGNUP */}
                    {tab === 'signup' && (
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <div className="flex gap-2 flex-wrap mb-2">
                                {['influencer', 'brand'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r as any)}
                                        className={`px-3 py-2 text-xs uppercase border ${
                                            role === r
                                                ? 'bg-[#0D0D0B] text-white'
                                                : 'border-[#E5E5DF]'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <input
                                className="w-full p-3 border text-sm"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />

                            <input
                                className="w-full p-3 border text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <div className="relative">
                                <input
                                    className="w-full p-3 border text-sm pr-12"
                                    placeholder="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        // Eye‑off icon (password visible → hide action)
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        // Eye icon (password hidden → show action)
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {error && <p className="text-xs text-red-500">{error}</p>}

                            <button
                                disabled={loading}
                                className="w-full py-3 bg-[#0D0D0B] text-white text-xs uppercase"
                            >
                                {loading ? 'Creating...' : 'Create Account →'}
                            </button>
                        </form>
                    )}

                    {/* LOGIN */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                className="w-full p-3 border text-sm"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <div className="relative">
                                <input
                                    className="w-full p-3 border text-sm pr-12"
                                    placeholder="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {error && <p className="text-xs text-red-500">{error}</p>}

                            <button
                                disabled={loading}
                                className="w-full py-3 bg-[#0D0D0B] text-white text-xs uppercase"
                            >
                                {loading ? 'Logging in...' : 'Log In →'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}