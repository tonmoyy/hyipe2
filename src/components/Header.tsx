// src/components/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { RealtimeChannel, PostgrestError } from '@supabase/supabase-js';
import { ChatsCircle } from '@phosphor-icons/react';
import { X } from 'lucide-react';

type Message = {
    id: string;
    content: string;
    created_at: string;
    read: boolean;
    sender_id: string;
};

export default function Header() {
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const fetchNotificationsRef = useRef<() => Promise<void>>(async () => {});

    // ✅ Updated inbox path – now points to the dashboard with ?tab=inbox
    const inboxPath =
        profile?.role === 'influencer'
            ? '/dashboard/influencer?tab=inbox'
            : profile?.role === 'brand'
                ? '/dashboard/brand?tab=inbox'
                : null;

    // --- fetchNotifications ---
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('messages')
            .select('id, content, created_at, read, sender_id')
            .eq('receiver_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false });

        if (error) {
            if ((error as PostgrestError).code !== 'PGRST204') {
                console.warn('Unread messages fetch issue:', error.message);
            }
            return;
        }

        const unread = (data ?? []) as Message[];

        const latestPerSender = new Map<string, Message>();
        unread.forEach((msg) => {
            if (!latestPerSender.has(msg.sender_id)) {
                latestPerSender.set(msg.sender_id, msg);
            }
        });

        const latestMessages = Array.from(latestPerSender.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        setMessages(latestMessages);
        setUnreadCount(latestPerSender.size);
    }, [user, supabase]);

    useEffect(() => {
        fetchNotificationsRef.current = fetchNotifications;
    }, [fetchNotifications]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setMessages([]);
            setOpen(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        if (!user) return;

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`header-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchNotificationsRef.current();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    fetchNotificationsRef.current();
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    useEffect(() => {
        const handler = () => fetchNotifications();
        window.addEventListener('inbox:read', handler);
        return () => window.removeEventListener('inbox:read', handler);
    }, [fetchNotifications]);

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-12 px-6 bg-[#0D0D0B] text-white text-[11px] tracking-[0.08em] uppercase font-medium">
            {/* Logo */}
            <Link href="/" className="flex items-center h-full">
                <Image
                    src="/Layer 3.svg"
                    alt="HYIPE"
                    width={0}
                    height={0}
                    className="h-8 w-auto"
                    priority
                />
            </Link>

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
                        {/* ✅ Dashboard link now points to the root of the dashboard */}
                        <Link
                            href={`/dashboard/${profile?.role}`}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            Dashboard
                        </Link>

                        {/* Inbox Popover */}
                        {inboxPath && (
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setOpen(!open);
                                        if (!open) fetchNotifications();
                                    }}
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
                                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                        <span className="font-semibold text-gray-700 text-sm normal-case tracking-normal">
                          Notifications
                        </span>
                                                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                                                            key={m.sender_id}
                                                            // ✅ Navigate to inbox tab with partner query
                                                            href={`${inboxPath}&partner=${m.sender_id}`}
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
                                            {/* ✅ "Open Inbox" link now correctly uses the inboxPath (which includes tab=inbox) */}
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
                            onClick={signOut}
                            className="text-red-400 hover:text-red-300 hover:underline p-0 h-auto uppercase text-[11px] tracking-[0.08em] ml-2"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3 ml-4">
                        <Link href="/auth" className="text-white/60 hover:text-white transition-colors">
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

            <div className="text-gray-500 text-[10px] tracking-wider hidden md:block">
                ↑ Click to navigate screens
            </div>
        </header>
    );
}