// src/components/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChatsCircle } from '@phosphor-icons/react';
import { X } from 'lucide-react';

export default function Header() {
    // --- Mock auth (replace with real useAuth) ---
    const [user, setUser] = useState<null | { id: string; email: string }>(null);
    const [profile, setProfile] = useState<null | { role: string; full_name: string }>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    const inboxPath =
        profile?.role === 'influencer'
            ? '/dashboard/influencer/inbox'
            : profile?.role === 'brand'
                ? '/dashboard/brand/inbox'
                : null;

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-12 px-6 bg-[#0D0D0B] text-white text-[11px] tracking-[0.08em] uppercase font-medium">
            {/* Logo – using SVG from public folder */}
            <Link href="/" className="flex items-center h-full">
                <Image
                    src="/hyipe_logo_2.svg"
                    alt="HYIPE"
                    width={0}                // tells Next.js to ignore intrinsic size
                    height={0}               // allows pure CSS sizing
                    className="h-10 w-auto"  // height 64px inside 80px header – prominent
                    priority
                />
            </Link>

            {/* Main navigation – left side links */}
            <nav className="flex items-center gap-5">
                <Link href="/marketplace" className="text-white/60 hover:text-white transition-colors">
                    Marketplace
                </Link>
                <Link href="/how-it-works" className="text-white/60 hover:text-white transition-colors">
                    How it Works
                </Link>
                <Link href="/for-brands" className="text-white/60 hover:text-white transition-colors">
                    For Brands
                </Link>
                <Link href="/for-creators" className="text-white/60 hover:text-white transition-colors">
                    For Creators
                </Link>

                {user ? (
                    <>
            <span className="text-gray-400 normal-case text-[11px] tracking-normal ml-4">
              {profile?.full_name || user.email}
            </span>
                        <Link
                            href={`/dashboard/${profile?.role}/profile`}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            Dashboard
                        </Link>

                        {/* Inbox Popover */}
                        {inboxPath && (
                            <div className="relative">
                                <button
                                    onClick={() => setOpen(!open)}
                                    className="relative p-1 text-white/80 hover:text-white hover:bg-transparent"
                                >
                                    <ChatsCircle className="w-6 h-6" weight="regular" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 min-w-[16px] px-1 text-[9px] font-bold rounded-full flex items-center justify-center bg-blue-100 text-blue-700 border border-blue-200">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                                    )}
                                </button>

                                {open && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                        <span className="font-semibold text-gray-700 text-sm normal-case tracking-normal">
                          Notifications
                        </span>
                                                <button
                                                    onClick={() => setOpen(false)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="max-h-72 overflow-y-auto">
                                                {messages.length === 0 ? (
                                                    <p className="px-4 py-6 text-sm text-gray-500 text-center normal-case tracking-normal">
                                                        No recent messages
                                                    </p>
                                                ) : (
                                                    messages.map((m) => (
                                                        <Link
                                                            key={m.id}
                                                            href={`${inboxPath}?partner=${m.sender_id}`}
                                                            onClick={() => setOpen(false)}
                                                            className={`block px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-100 ${
                                                                !m.read
                                                                    ? 'bg-blue-100 border-l-4 border-l-blue-600 font-semibold'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm line-clamp-2">{m.content}</p>
                                                                {!m.read && (
                                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-1 mt-0.5" />
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-400 mt-1 block">
                                {new Date(m.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                              </span>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                            <Link
                                                href={inboxPath}
                                                onClick={() => setOpen(false)}
                                                className="block text-center px-4 py-3 text-blue-600 text-sm font-medium hover:bg-gray-50 border-t bg-gray-50/20 transition rounded-b-lg normal-case tracking-normal"
                                            >
                                                Open Inbox →
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setUser(null)}
                            className="text-red-400 hover:text-red-300 hover:underline p-0 h-auto uppercase text-[11px] tracking-[0.08em] ml-2"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3 ml-4">
                        <Link
                            href="/auth"
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/auth?signup=true"
                            className="bg-white text-[#0D0D0B] px-4 py-1.5 text-[11px] uppercase tracking-[0.06em] hover:bg-gray-200 transition-colors"
                        >
                            Sign up
                        </Link>
                    </div>
                )}
            </nav>

            {/* Hint text (hidden on mobile) */}
            <div className="text-gray-500 text-[10px] tracking-wider hidden md:block">
                ↑ Click to navigate screens
            </div>
        </header>
    );
}