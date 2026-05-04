'use client';

import { useState } from 'react';

type Step = 'choose' | 'verify' | 'welcome';

export default function AuthPage() {
    const [step, setStep] = useState<Step>('choose');
    const [tab, setTab] = useState<'signup' | 'login'>('signup');
    const [role, setRole] = useState<'influencer' | 'brand'>('influencer');

    return (
        <div className="auth-wrap grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-48px)]">
            {/* Left dark panel */}
            <div className="auth-left bg-[#0D0D0B] text-white px-16 py-16 flex flex-col justify-between order-2 md:order-1">
                <div>
                    <div className="auth-left-brand font-['Playfair_Display'] text-4xl font-bold mb-2">HYIPE</div>
                    <div className="auth-left-sub text-xs text-white/45 leading-relaxed">Pakistan's creator marketplace</div>
                </div>
                <blockquote className="auth-left-quote font-['Playfair_Display'] text-2xl italic text-white/80 max-w-xs">
                    “The safest way to collaborate between brands and creators in Pakistan.”
                </blockquote>
                <div className="auth-left-meta text-[11px] text-white/30 uppercase tracking-[0.06em]">www.thehyipe.com</div>
            </div>

            {/* Right form panel */}
            <div className="auth-right bg-[#FAFAF7] px-16 py-16 flex flex-col justify-center order-1 md:order-2">
                {step === 'choose' && (
                    <div className="auth-form max-w-[380px] w-full">
                        <h2 className="auth-title font-['Playfair_Display'] text-3xl font-bold mb-2">Join HYIPE</h2>
                        <p className="auth-subtitle text-sm text-[#888880] mb-8">Sign in or create your account to continue.</p>

                        {/* Tabs */}
                        <div className="auth-toggle flex border border-[#E5E5DF] rounded overflow-hidden mb-8">
                            <button
                                className={`flex-1 py-2.5 text-xs uppercase tracking-[0.06em] font-medium ${
                                    tab === 'signup' ? 'bg-[#0D0D0B] text-white' : 'text-[#888880]'
                                }`}
                                onClick={() => setTab('signup')}
                            >
                                Sign Up
                            </button>
                            <button
                                className={`flex-1 py-2.5 text-xs uppercase tracking-[0.06em] font-medium ${
                                    tab === 'login' ? 'bg-[#0D0D0B] text-white' : 'text-[#888880]'
                                }`}
                                onClick={() => setTab('login')}
                            >
                                Log In
                            </button>
                        </div>

                        <p className="text-xs text-[#888880] mb-4">I am a:</p>
                        <div className="auth-tab-select flex gap-2 mb-7">
                            <button
                                className={`px-4 py-2 border text-xs uppercase tracking-[0.06em] ${
                                    role === 'influencer' ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]' : 'border-[#E5E5DF] text-[#3A3A36]'
                                }`}
                                onClick={() => setRole('influencer')}
                            >
                                Creator / Influencer
                            </button>
                            <button
                                className={`px-4 py-2 border text-xs uppercase tracking-[0.06em] ${
                                    role === 'brand' ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]' : 'border-[#E5E5DF] text-[#3A3A36]'
                                }`}
                                onClick={() => setRole('brand')}
                            >
                                Brand
                            </button>
                        </div>

                        {tab === 'signup' ? (
                            <>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Full Name</label>
                                    <input type="text" placeholder="e.g. Ayesha Noor" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans" />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Email Address</label>
                                    <input type="email" placeholder="you@email.com" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans" />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Password</label>
                                    <input type="password" placeholder="Min. 8 characters" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans" />
                                </div>
                                <button className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-[13px] uppercase tracking-[0.06em] mt-2" onClick={() => setStep('verify')}>
                                    Create Account →
                                </button>
                                <p className="text-xs text-[#888880] mt-3 text-center leading-relaxed">
                                    By signing up, you agree to HYIPE's <u>Terms of Service</u> and <u>Privacy Policy</u>.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Email Address</label>
                                    <input type="email" placeholder="you@email.com" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans" />
                                </div>
                                <div className="form-group mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Password</label>
                                    <input type="password" placeholder="Your password" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm font-sans" />
                                </div>
                                <button className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-[13px] uppercase tracking-[0.06em]" onClick={() => window.location.href = '/dashboard/influencer'}>
                                    Log In →
                                </button>
                                <p className="text-center mt-3 text-xs text-[#888880]"><u>Forgot password?</u></p>
                            </>
                        )}
                    </div>
                )}

                {step === 'verify' && (
                    <div className="auth-form max-w-[380px] text-center">
                        <div className="verify-state">
                            <div className="verify-icon w-16 h-16 border-2 border-[#0D0D0B] rounded-full mx-auto mb-6 flex items-center justify-center text-2xl">✉</div>
                            <h2 className="font-['Playfair_Display'] text-2xl mb-3">Check your inbox</h2>
                            <p className="text-sm text-[#3A3A36] mb-2">We've sent a verification link to:</p>
                            <div className="email-pill bg-[#F0F0EA] py-1.5 px-4 rounded-full text-xs inline-block mb-6">you@email.com</div>
                            <p className="text-sm text-[#3A3A36] mb-6">Click the link in the email to verify your account. Check your spam folder if you don't see it within a minute.</p>
                            <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] w-full py-2.5 mb-3 text-xs uppercase tracking-[0.06em]" onClick={() => setStep('welcome')}>
                                I've verified my email →
                            </button>
                            <p className="text-xs text-[#888880]">Didn't receive it? <u className="cursor-pointer">Resend email</u></p>
                        </div>
                    </div>
                )}

                {step === 'welcome' && (
                    <div className="auth-form max-w-[380px] text-center">
                        <div className="verify-state">
                            <div className="verify-icon w-16 h-16 border-2 border-[#3B6D11] text-[#3B6D11] rounded-full mx-auto mb-6 flex items-center justify-center text-2xl">✓</div>
                            <h2 className="font-['Playfair_Display'] text-2xl mb-3">You're verified!</h2>
                            <p className="text-sm text-[#3A3A36] mb-8">Welcome to HYIPE. Your account is ready.<br />Head to the login page and sign in to complete your profile and start exploring.</p>
                            <button className="btn-primary bg-[#0D0D0B] text-white w-full py-3 text-xs uppercase tracking-[0.06em]" onClick={() => { setStep('choose'); setTab('login'); }}>
                                Go to Login →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}