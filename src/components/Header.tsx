'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
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
    campaign_id: string | null;
};

export default function Header() {
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const fetchNotificationsRef = useRef<() => Promise<void>>(async () => {});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const inboxPath =
        profile?.role === 'influencer'
            ? '/dashboard/influencer?tab=inbox'
            : profile?.role === 'brand'
                ? '/dashboard/brand?tab=inbox'
                : null;

    // Lightweight count fetch – used by the inbox:read listener
    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .neq('sender_id', user.id)
            .eq('read', false);
        if (!error) setUnreadCount(count || 0);
    }, [user, supabase]);

    // Full fetch – builds popover list and updates badge
    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('messages')
            .select('id, content, created_at, read, sender_id, campaign_id')
            .eq('receiver_id', user.id)
            .eq('read', false)
            .neq('sender_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            if ((error as PostgrestError).code !== 'PGRST204') {
                console.warn('Unread messages fetch issue:', error.message);
            }
            return;
        }

        const unread = (data ?? []) as Message[];

        // One entry per (sender, campaign) to match thread groups
        const threadMap = new Map<string, Message>();
        unread.forEach((msg) => {
            const key = `${msg.sender_id}::${msg.campaign_id ?? 'none'}`;
            if (!threadMap.has(key)) threadMap.set(key, msg);
        });

        const latestMessages = Array.from(threadMap.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        setMessages(latestMessages);
        setUnreadCount(threadMap.size);
    }, [user, supabase]);

    // Keep ref in sync for real‑time listener
    useEffect(() => {
        fetchNotificationsRef.current = fetchNotifications;
    }, [fetchNotifications]);

    // Reset on logout
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setMessages([]);
            setOpen(false);
        }
    }, [user]);

    // Initial fetch when user becomes available
    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    // Real‑time INSERT listener
    useEffect(() => {
        if (!user) return;

        if (channelRef.current) supabase.removeChannel(channelRef.current);

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
                () => fetchNotificationsRef.current()
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    // Listen for inbox:read – clear badge and re‑fetch actual count
    useEffect(() => {
        const handler = () => {
            setUnreadCount(0);   // optimistic clear
            fetchUnreadCount();  // confirm (usually stays 0)
        };
        window.addEventListener('inbox:read', handler);
        return () => window.removeEventListener('inbox:read', handler);
    }, [fetchUnreadCount]);

    // Route‑based badge refresh – when user navigates to inbox page
    useEffect(() => {
        if (pathname.startsWith('/dashboard/') && pathname.includes('tab=inbox')) {
            fetchUnreadCount();
        }
    }, [pathname, fetchUnreadCount]);

    // Optimistic badge decrease when clicking a notification
    const handleNotificationClick = useCallback(() => {
        setOpen(false);
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Close mobile menu when a link is clicked
    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <>
            {/* ==================== SINGLE HEADER – always dark ==================== */}
            <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-12 px-4 md:px-6 bg-[#0D0D0B] text-white text-[11px] tracking-[0.08em] uppercase font-medium">

                {/* ---------- HYIPE LOGO (custom spans, visible on all screens) ---------- */}
                <Link href="/" className="flex items-center">
                    <div className="flex flex-col items-start leading-none">
                        <div className="flex items-end font-bold tracking-[-0.01em] text-[22px]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                            <span>HY</span>
                            <span className="relative inline-flex flex-col items-center mx-[1px]">
                <span className="w-[6px] h-[6px] bg-[#F5B800] rounded-full mb-[1px]"></span>
                <span className="w-[4.5px] h-[16px] bg-current rounded-sm"></span>
              </span>
                            <span>PE</span>
                        </div>
                        <span className="text-[8px] uppercase tracking-[0.08em] mt-[4px] text-white/45" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Influencer Marketplace
            </span>
                    </div>
                </Link>

                {/* ---------- DESKTOP NAVIGATION (hidden on mobile) ---------- */}
                <nav className="!hidden md:!flex items-center gap-5">
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
                            {/* Profile image */}
                            {profile?.avatar_url || profile?.logo_url ? (
                                <img
                                    src={profile?.avatar_url || profile?.logo_url}
                                    alt={profile?.full_name || 'User'}
                                    className="w-6 h-6 rounded-full object-cover border border-white/20 ml-4"
                                    title={profile?.full_name || user.email}
                                />
                            ) : (
                                <div
                                    className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white ml-4"
                                    title={profile?.full_name || user.email}
                                >
                                    {(profile?.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}

                            <Link
                                href={`/dashboard/${profile?.role}`}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                Dashboard
                            </Link>

                            {/* Inbox popover */}
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
                                                            No unread messages
                                                        </p>
                                                    ) : (
                                                        messages.map((m) => (
                                                            <Link
                                                                key={m.id}
                                                                href={`${inboxPath}&partner=${encodeURIComponent(m.sender_id)}&campaign=${encodeURIComponent(m.campaign_id ?? '')}`}
                                                                onClick={handleNotificationClick}
                                                                className="block px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-100 bg-blue-50 border-l-4 border-l-blue-500"
                                                            >
                                                                <div className="flex justify-between items-start gap-2">
                                                                    <p className="text-sm text-gray-800 normal-case tracking-normal line-clamp-2 font-medium">
                                                                        {m.content}
                                                                    </p>
                                                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                                </div>
                                                                <span className="text-xs text-gray-400 mt-1 block normal-case tracking-normal">
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

                {/* ---------- MOBILE RIGHT SIDE (hamburger + login) ---------- */}
                <div className="flex md:hidden items-center gap-2">
                    {!user && (
                        <Link
                            href="/auth"
                            className="text-[10px] uppercase tracking-[0.06em] border border-white rounded px-3 py-1"
                            style={{ color: '#fff', textDecoration: 'none' }}
                        >
                            Log in
                        </Link>
                    )}
                    <button
                        className="w-9 h-9 flex flex-col justify-center items-center gap-[4px] p-1 bg-transparent border-none cursor-pointer"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <span className="block w-[18px] h-[2px] bg-white rounded-sm"></span>
                        <span className="block w-[14px] h-[2px] bg-white rounded-sm"></span>
                        <span className="block w-[18px] h-[2px] bg-white rounded-sm"></span>
                    </button>
                </div>
            </header>

            {/* ==================== MOBILE MENU OVERLAY (unchanged) ==================== */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[200] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={closeMobileMenu}
                    />
                    <div className="absolute right-0 top-0 h-full w-64 bg-[#0D0D0B] text-white flex flex-col p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            {/* Use the same custom logo in the overlay for consistency */}
                            <Link href="/" onClick={closeMobileMenu} className="flex items-center">
                                <div className="flex flex-col items-start leading-none">
                                    <div className="flex items-end font-bold tracking-[-0.01em] text-[22px]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                                        <span>HY</span>
                                        <span className="relative inline-flex flex-col items-center mx-[1px]">
                      <span className="w-[6px] h-[6px] bg-[#F5B800] rounded-full mb-[1px]"></span>
                      <span className="w-[4.5px] h-[16px] bg-current rounded-sm"></span>
                    </span>
                                        <span>PE</span>
                                    </div>
                                    <span className="text-[8px] uppercase tracking-[0.08em] mt-[4px] text-white/45" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Influencer Marketplace
                  </span>
                                </div>
                            </Link>
                            <button onClick={closeMobileMenu} className="text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-4 text-sm font-medium">
                            <Link href="/marketplace" onClick={closeMobileMenu} className="hover:text-white/80">Marketplace</Link>
                            <Link href="/how-it-works" onClick={closeMobileMenu} className="hover:text-white/80">How it Works</Link>
                            <Link href="/for-brands" onClick={closeMobileMenu} className="hover:text-white/80">For Brands</Link>
                            <Link href="/for-creators" onClick={closeMobileMenu} className="hover:text-white/80">For Creators</Link>

                            {user ? (
                                <>
                                    <div className="border-t border-white/10 pt-4 mt-2">
                                        <div className="flex items-center gap-3 mb-3">
                                            {profile?.avatar_url || profile?.logo_url ? (
                                                <img
                                                    src={profile?.avatar_url || profile?.logo_url}
                                                    alt={profile?.full_name || 'User'}
                                                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold">
                                                    {(profile?.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <span className="text-sm">{profile?.full_name || user.email}</span>
                                        </div>
                                        <Link
                                            href={`/dashboard/${profile?.role}`}
                                            onClick={closeMobileMenu}
                                            className="block hover:text-white/80"
                                        >
                                            Dashboard
                                        </Link>
                                        {inboxPath && (
                                            <Link
                                                href={inboxPath}
                                                onClick={closeMobileMenu}
                                                className="block hover:text-white/80 mt-1"
                                            >
                                                Inbox {unreadCount > 0 && `(${unreadCount})`}
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                closeMobileMenu();
                                                signOut();
                                            }}
                                            className="text-red-400 hover:text-red-300 mt-4 text-left"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                                    <Link href="/auth" onClick={closeMobileMenu} className="hover:text-white/80">
                                        Log in
                                    </Link>
                                    <Link
                                        href="/auth?signup=true"
                                        onClick={closeMobileMenu}
                                        className="bg-white text-[#0D0D0B] px-4 py-1.5 text-xs uppercase tracking-[0.06em] hover:bg-gray-200 transition-colors text-center"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}