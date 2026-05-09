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
    const [info, setInfo] = useState('');      // ✅ friendly info message (e.g., "No account found")
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect to dashboard
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
                data: {
                    full_name: fullName,
                    role: role,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // If user already exists
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setError('An account with this email already exists.');
            setLoading(false);
            return;
        }

        // Email confirmation required
        if (!data.session) {
            setStep('verify');
        } else {
            // Email auto‑confirmed
            router.push(`/dashboard/${role}`);
        }

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
            // ✅ If the error is about invalid credentials, it means no account exists → switch to sign‑up
            if (
                loginError.message?.includes('Invalid login credentials') ||
                loginError.code === 'invalid_credentials'
            ) {
                setInfo('No account found with that email. Please sign up below.');
                setTab('signup');
                setPassword('');
                setLoading(false);
                return;
            }
            // Other errors (e.g., network, email not confirmed, etc.)
            setError(loginError.message);
            setLoading(false);
            return;
        }

        // Fetch profile role and redirect
        const { user: loggedUser } = data;
        if (loggedUser) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', loggedUser.id)
                .single();

            const redirectRole = profileData?.role || 'influencer';
            router.push(`/dashboard/${redirectRole}`);
        } else {
            router.push('/dashboard/influencer');
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
        if (error) {
            setError(error.message);
        } else {
            setInfo('Verification email resent. Check your inbox.');
        }
    };

    if (authLoading) {
        return (
            <div className="auth-wrap grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-48px)]">
                <div className="col-span-full flex items-center justify-center">
                    <p>Loading…</p>
                </div>
            </div>
        );
    }

    if (user && profile?.role) {
        return null;
    }

    return (
        <div className="auth-wrap grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-48px)]">
            {/* Left dark panel */}
            <div className="auth-left bg-[#0D0D0B] text-white px-16 py-16 flex flex-col justify-between order-2 md:order-1">
                <div>
                    <div className="auth-left-brand font-['Playfair_Display'] text-4xl font-bold mb-2">HYIPE</div>
                    <div className="auth-left-sub text-xs text-white/45 leading-relaxed">Pakistan&apos;s creator marketplace</div>
                </div>
                <blockquote className="auth-left-quote font-['Playfair_Display'] text-2xl italic text-white/80 max-w-xs">
                    “The safest way to collaborate between brands and creators in Pakistan.”
                </blockquote>
                <div className="auth-left-meta text-[11px] text-white/30 uppercase tracking-[0.06em]">www.thehyipe.com</div>
            </div>

            {/* Right form panel */}
            <div className="auth-right bg-[#FAFAF7] px-16 py-16 flex flex-col justify-center order-1 md:order-2">
                {step === 'choose' && (
                    <form className="auth-form max-w-[380px] w-full" onSubmit={tab === 'signup' ? handleSignUp : handleLogin}>
                        <h2 className="auth-title font-['Playfair_Display'] text-3xl font-bold mb-2">Join HYIPE</h2>
                        <p className="auth-subtitle text-sm text-[#888880] mb-8">Sign in or create your account to continue.</p>

                        {/* Tabs */}
                        <div className="auth-toggle flex border border-[#E5E5DF] rounded overflow-hidden mb-8">
                            <button
                                type="button"
                                className={`flex-1 py-2.5 text-xs uppercase tracking-[0.06em] font-medium ${
                                    tab === 'signup' ? 'bg-[#0D0D0B] text-white' : 'text-[#888880]'
                                }`}
                                onClick={() => { setTab('signup'); setError(''); setInfo(''); }}
                            >
                                Sign Up
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2.5 text-xs uppercase tracking-[0.06em] font-medium ${
                                    tab === 'login' ? 'bg-[#0D0D0B] text-white' : 'text-[#888880]'
                                }`}
                                onClick={() => { setTab('login'); setError(''); setInfo(''); }}
                            >
                                Log In
                            </button>
                        </div>

                        {/* Info message (non‑error) */}
                        {info && (
                            <div className="bg-[#E8F0FE] text-[#1A56DB] border border-[#B6D4E8] rounded p-3 mb-4 text-xs">
                                {info}
                            </div>
                        )}

                        {tab === 'signup' && (
                            <>
                                <p className="text-xs text-[#888880] mb-4">I am a:</p>
                                <div className="auth-tab-select flex gap-2 mb-7">
                                    <button
                                        type="button"
                                        className={`px-4 py-2 border text-xs uppercase tracking-[0.06em] ${
                                            role === 'influencer' ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]' : 'border-[#E5E5DF] text-[#3A3A36]'
                                        }`}
                                        onClick={() => setRole('influencer')}
                                    >
                                        Creator / Influencer
                                    </button>
                                    <button
                                        type="button"
                                        className={`px-4 py-2 border text-xs uppercase tracking-[0.06em] ${
                                            role === 'brand' ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]' : 'border-[#E5E5DF] text-[#3A3A36]'
                                        }`}
                                        onClick={() => setRole('brand')}
                                    >
                                        Brand
                                    </button>
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Ayesha Noor"
                                        required
                                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans"
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@email.com"
                                        required
                                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans"
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        required
                                        minLength={8}
                                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-[13px] uppercase tracking-[0.06em] mt-2 disabled:opacity-50"
                                >
                                    {loading ? 'Creating account...' : 'Create Account →'}
                                </button>
                                <p className="text-xs text-[#888880] mt-3 text-center leading-relaxed">
                                    By signing up, you agree to HYIPE&apos;s <u>Terms of Service</u> and <u>Privacy Policy</u>.
                                </p>
                            </>
                        )}

                        {tab === 'login' && (
                            <>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@email.com"
                                        required
                                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans"
                                    />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Your password"
                                        required
                                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-[13px] uppercase tracking-[0.06em] disabled:opacity-50"
                                >
                                    {loading ? 'Logging in...' : 'Log In →'}
                                </button>
                                <p className="text-center mt-3 text-xs text-[#888880]">
                                    <button type="button" className="underline" onClick={() => alert('Password reset not yet implemented')}>
                                        Forgot password?
                                    </button>
                                </p>
                            </>
                        )}
                    </form>
                )}

                {step === 'verify' && (
                    <div className="auth-form max-w-[380px] text-center">
                        <div className="verify-state">
                            <div className="verify-icon w-16 h-16 border-2 border-[#0D0D0B] rounded-full mx-auto mb-6 flex items-center justify-center text-2xl">✉</div>
                            <h2 className="font-['Playfair_Display'] text-2xl mb-3">Check your inbox</h2>
                            <p className="text-sm text-[#3A3A36] mb-2">We&apos;ve sent a verification link to:</p>
                            <div className="email-pill bg-[#F0F0EA] py-1.5 px-4 rounded-full text-xs inline-block mb-6">{email}</div>
                            <p className="text-sm text-[#3A3A36] mb-6">
                                Click the link in the email to verify your account.<br />
                                Check your spam folder if you don&apos;t see it.
                            </p>
                            <button
                                className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-xs uppercase tracking-[0.06em] mb-3"
                                onClick={() => setStep('welcome')}
                            >
                                I&apos;ve verified my email →
                            </button>
                            <p className="text-xs text-[#888880]">
                                Didn&apos;t receive it?{' '}
                                <button type="button" onClick={resendVerification} className="underline cursor-pointer">
                                    Resend email
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {step === 'welcome' && (
                    <div className="auth-form max-w-[380px] text-center">
                        <div className="verify-state">
                            <div className="verify-icon w-16 h-16 border-2 border-[#3B6D11] text-[#3B6D11] rounded-full mx-auto mb-6 flex items-center justify-center text-2xl">✓</div>
                            <h2 className="font-['Playfair_Display'] text-2xl mb-3">You&apos;re verified!</h2>
                            <p className="text-sm text-[#3A3A36] mb-8">
                                Welcome to HYIPE. Your account is ready.<br />
                                Head to the login page and sign in to complete your profile and start exploring.
                            </p>
                            <button
                                className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-xs uppercase tracking-[0.06em]"
                                onClick={() => {
                                    setStep('choose');
                                    setTab('login');
                                }}
                            >
                                Go to Login →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}