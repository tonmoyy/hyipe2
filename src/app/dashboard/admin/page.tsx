/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';
import { createClient } from '@/lib/supabaseClient';

/* ─── Types ─── */
type SubView = 'users' | 'monitor' | 'inbox' | 'make-admin' | 'new-chat';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    status?: string;
}

interface CampaignRow {
    id: string;
    title: string;
    niche: string;
    platform: string;
    budget: number;
    deliverable: string;
    brief: string;
    min_followers: string;
    deadline: string;
    requirements: string;
    brand_id: string;
    status: string;
    created_at: string;
    brand: { full_name: string; email?: string } | { full_name: string; email?: string }[] | null;
}

interface Campaign {
    id: string;
    title: string;
    niche: string;
    budget: number;
    status: string;
    created_at: string;
    brand: { full_name: string };
}

interface RawThreadRow {
    id: string;
    campaign_id: string;
    brand_id: string;
    influencer_id: string;
    last_message: string;
    last_message_at: string;
    campaign: { title: string }[] | null;
}

interface AdminThread {
    id: string;
    brand_id: string;
    brand_name: string;
    influencer_id: string;
    influencer_name: string;
    campaign_id: string;
    campaign_title: string;
    last_message: string;
    last_at: string;
    unread?: boolean;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
    thread_id?: string;
    sender_name?: string;
}

interface RawMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
    campaign_id: string;
}

/* ─── Props ─── */
interface UserManagementProps {
    allProfiles: Profile[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    roleFilter: string;
    setRoleFilter: (value: string) => void;
    page: number;
    setPage: (value: number) => void;
    pageSize: number;
    onRemoveUser: (id: string) => void;
    onVerifyUser: (id: string) => void;
    onViewUser: (profile: Profile) => void;
    currentAdminRole: string;
    onToggleBan: (userId: string, currentStatus: string) => void;
}

interface CampaignMonitorProps {
    campaigns: Campaign[];
    loading: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

interface AdminInboxProps {
    threads: AdminThread[];
    loading: boolean;
    selectedThread: AdminThread | null;
    setSelectedThread: (thread: AdminThread | null) => void;
    conversation: Message[];
    conversationLoading: boolean;
    loadConversation: (thread: AdminThread) => Promise<void>;
    onNewChat: () => void;
    currentUserId: string;
    onSendReply: (threadId: string, content: string) => Promise<void>;
}

interface MakeAdminProps {
    email: string;
    setEmail: (v: string) => void;
    onPromote: () => void;
    loading: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
}

/* ─── Main Component ─── */
function AdminDashboardInner() {
    const { user, profile, signOut, loading: authLoading } = useAuth();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialTab = (() => {
        const tabParam = searchParams?.get('tab') as SubView | null;
        return tabParam && ['users', 'monitor', 'inbox', 'make-admin'].includes(tabParam)
            ? tabParam
            : 'users';
    })();

    const threadParam = searchParams?.get('thread') || null;

    const [activeSub, setActiveSub] = useState<SubView>(initialTab);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);

    const [threads, setThreads] = useState<AdminThread[]>([]);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [selectedThread, setSelectedThread] = useState<AdminThread | null>(null);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [conversationLoading, setConversationLoading] = useState(false);

    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 5;

    const [viewProfile, setViewProfile] = useState<Profile | null>(null);

    const [makeAdminEmail, setMakeAdminEmail] = useState('');
    const [makeAdminLoading, setMakeAdminLoading] = useState(false);
    const [makeAdminMessage, setMakeAdminMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newChatRecipientId, setNewChatRecipientId] = useState('');
    const [newChatMessage, setNewChatMessage] = useState('');
    const [creatingChat, setCreatingChat] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace('/auth');
            return;
        }
        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            router.replace(`/dashboard/${profile?.role ?? 'influencer'}`);
        }
    }, [authLoading, user, profile, router]);

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch users:', error);
            setAllProfiles([]);
        } else {
            setAllProfiles((data as Profile[]) ?? []);
        }
        setLoadingUsers(false);
    }, [supabase]);

    const fetchCampaigns = useCallback(async () => {
        setLoadingCampaigns(true);
        const { data, error } = await supabase
            .from('campaigns')
            .select(
                `id, title, niche, platform, budget, deliverable, brief, min_followers,
         deadline, requirements, brand_id, status, created_at,
         brand:profiles!campaigns_brand_id_fkey (full_name, email)`
            )
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setPendingCampaigns([]);
            setLoadingCampaigns(false);
            return;
        }

        const normalised: Campaign[] = ((data as CampaignRow[]) ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            niche: row.niche,
            budget: row.budget,
            status: row.status,
            created_at: row.created_at,
            brand: {
                full_name: Array.isArray(row.brand)
                    ? row.brand[0]?.full_name ?? 'Unknown Brand'
                    : row.brand?.full_name ?? 'Unknown Brand',
            },
        }));
        setPendingCampaigns(normalised);
        setLoadingCampaigns(false);
    }, [supabase]);

    const fetchThreads = useCallback(async () => {
        setLoadingThreads(true);
        const { data: threadData, error: threadError } = await supabase
            .from('conversation_threads')
            .select(`
                id,
                campaign_id,
                brand_id,
                influencer_id,
                last_message,
                last_message_at,
                campaign:campaigns ( title )
            `)
            .order('last_message_at', { ascending: false });

        if (threadError) {
            console.error(threadError);
            setThreads([]);
            setLoadingThreads(false);
            return;
        }

        const rawThreads = (threadData ?? []) as unknown as RawThreadRow[];

        const brandIds = [...new Set(rawThreads.map((t) => t.brand_id))];
        const influencerIds = [...new Set(rawThreads.map((t) => t.influencer_id))];

        const [brandRes, influencerRes] = await Promise.all([
            brandIds.length > 0
                ? supabase.from('profiles').select('id, full_name').in('id', brandIds)
                : { data: [] },
            influencerIds.length > 0
                ? supabase.from('profiles').select('id, full_name').in('id', influencerIds)
                : { data: [] },
        ]);

        const brandMap = new Map(
            (brandRes.data ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name])
        );
        const influencerMap = new Map(
            (influencerRes.data ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name])
        );

        const threads: AdminThread[] = rawThreads.map((t) => {
            const campaignTitle =
                Array.isArray(t.campaign) && t.campaign.length > 0
                    ? t.campaign[0].title
                    : 'Direct Chat';

            return {
                id: t.id,
                brand_id: t.brand_id,
                brand_name: brandMap.get(t.brand_id) ?? 'Unknown Brand',
                influencer_id: t.influencer_id,
                influencer_name: influencerMap.get(t.influencer_id) ?? 'Unknown Influencer',
                campaign_id: t.campaign_id,
                campaign_title: campaignTitle,
                last_message: t.last_message ?? '',
                last_at: t.last_message_at ?? new Date().toISOString(),
            };
        });

        setThreads(threads);
        setLoadingThreads(false);
    }, [supabase]);

    const loadConversation = useCallback(async (thread: AdminThread) => {
        setConversationLoading(true);
        setSelectedThread(thread);

        let query = supabase
            .from('messages')
            .select('id, sender_id, receiver_id, content, created_at, read, campaign_id')
            .order('created_at', { ascending: true });

        if (thread.campaign_id) {
            query = query.eq('campaign_id', thread.campaign_id);
        } else {
            query = query.is('campaign_id', null);
        }

        const { data, error } = await query;
        if (!error && data) {
            const msgs = data as RawMessage[];
            const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
            const { data: senderProfiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', senderIds);
            const nameMap = new Map(
                (senderProfiles ?? []).map((p: { id: string; full_name: string }) => [p.id, p.full_name])
            );

            const conversation: Message[] = msgs.map((m) => ({
                ...m,
                sender_name: nameMap.get(m.sender_id) ?? 'Unknown',
            }));
            setConversation(conversation);
        } else {
            console.error(error);
            setConversation([]);
        }
        setConversationLoading(false);
    }, [supabase]);

    useEffect(() => {
        if (threadParam && threads.length > 0 && !selectedThread) {
            const thread = threads.find((t) => t.id === threadParam);
            if (thread) {
                loadConversation(thread);
            }
        }
    }, [threadParam, threads, selectedThread, loadConversation]);

    useEffect(() => {
        if (initialTab === 'users') fetchUsers();
        if (initialTab === 'monitor') fetchCampaigns();
        if (initialTab === 'inbox') fetchThreads();
    }, [initialTab, fetchUsers, fetchCampaigns, fetchThreads]);

    const switchTab = useCallback(
        async (tab: SubView) => {
            setActiveSub(tab);
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            params.set('tab', tab);
            router.replace(`/dashboard/admin?${params.toString()}`, { scroll: false });
            if (tab === 'users') await fetchUsers();
            if (tab === 'monitor') await fetchCampaigns();
            if (tab === 'inbox') await fetchThreads();
            setMakeAdminMessage(null);
        },
        [searchParams, router, fetchUsers, fetchCampaigns, fetchThreads]
    );

    const handleApprove = async (id: string) => {
        await supabase.from('campaigns').update({ status: 'live' }).eq('id', id);
        setPendingCampaigns((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: 'live' } : c))
        );
    };

    const handleReject = async (id: string) => {
        await supabase.from('campaigns').update({ status: 'rejected' }).eq('id', id);
        setPendingCampaigns((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c))
        );
    };

    const handleRemoveUser = async (id: string) => {
        const { error } = await supabase.rpc('delete_user', { user_id: id });
        if (error) {
            alert('Failed to remove user: ' + error.message);
        } else {
            setAllProfiles((prev) => prev.filter((p) => p.id !== id));
        }
    };

    const handleVerifyUser = async (id: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', id);
        if (error) {
            alert('Failed to verify user: ' + error.message);
        } else {
            setAllProfiles((prev) =>
                prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p))
            );
        }
    };

    const handleToggleBan = useCallback(async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
        const { error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', userId);
        if (error) {
            alert('Failed to update user status: ' + error.message);
        } else {
            setAllProfiles((prev) =>
                prev.map((p) => (p.id === userId ? { ...p, status: newStatus } : p))
            );
        }
    }, [supabase]);

    const handlePromoteToAdmin = async () => {
        if (!makeAdminEmail.trim()) return;
        setMakeAdminLoading(true);
        setMakeAdminMessage(null);

        const { error } = await supabase.rpc('promote_to_admin', {
            email: makeAdminEmail.trim(),
        });

        if (error) {
            setMakeAdminMessage({ type: 'error', text: error.message });
        } else {
            setMakeAdminMessage({
                type: 'success',
                text: `${makeAdminEmail} has been promoted to Admin.`,
            });
            setMakeAdminEmail('');
            await fetchUsers();
        }
        setMakeAdminLoading(false);
    };

    const handleCreateNewChat = async () => {
        if (!user || !newChatRecipientId) return;
        setCreatingChat(true);

        const { data: thread, error: threadErr } = await supabase
            .from('conversation_threads')
            .insert({
                brand_id: newChatRecipientId,
                influencer_id: user.id,
                campaign_id: null,
                started_by_brand: false,
                last_message: newChatMessage || 'Chat started',
                last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (threadErr) {
            alert('Failed to create thread: ' + threadErr.message);
            setCreatingChat(false);
            return;
        }

        if (newChatMessage.trim()) {
            await supabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: newChatRecipientId,
                content: newChatMessage.trim(),
                campaign_id: null,
                read: false,
            });
        }

        await fetchThreads();
        setShowNewChatModal(false);
        setNewChatRecipientId('');
        setNewChatMessage('');
        setCreatingChat(false);

        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('tab', 'inbox');
        params.set('thread', thread.id);
        router.replace(`/dashboard/admin?${params.toString()}`);
    };

    const handleSendReply = useCallback(async (threadId: string, content: string) => {
        if (!user || !content.trim()) return;
        const thread = threads.find(t => t.id === threadId);
        if (!thread) return;

        const receiverId =
            thread.brand_id === user.id ? thread.influencer_id : thread.brand_id;

        await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: receiverId,
            content: content.trim(),
            campaign_id: thread.campaign_id || null,
            read: false,
        });

        if (selectedThread?.id === threadId) {
            loadConversation(selectedThread);
        }
        fetchThreads();
    }, [user, supabase, threads, selectedThread, loadConversation, fetchThreads]);

    const pendingCount = pendingCampaigns.filter(
        (c) => c.status === 'under_review'
    ).length;

    if (
        authLoading ||
        !user ||
        !profile ||
        (profile.role !== 'admin' && profile.role !== 'superadmin')
    ) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-48px)] bg-[#F6F6F2]">
                <div className="text-center">
                    <div className="text-4xl mb-4">🔒</div>
                    <h1 className="font-['Playfair_Display'] text-2xl mb-2">Access Denied</h1>
                    <p className="text-[#888880] text-sm">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    const navItems: { key: SubView; icon: string; label: string }[] = [
        { key: 'users', icon: '◎', label: 'User Management' },
        { key: 'monitor', icon: '◈', label: 'Campaign Monitor' },
        { key: 'inbox', icon: '◻', label: 'Inbox Viewer' },
    ];
    if (profile?.role === 'superadmin') {
        navItems.push({ key: 'make-admin', icon: '⚡', label: 'Make Admin' });
    }

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('admin-inbox-new-msg')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => {
                    fetchThreads();
                    if (selectedThread) {
                        loadConversation(selectedThread);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase, fetchThreads, selectedThread, loadConversation]);

    return (
        <div className="dashboard-shell !flex flex-col md:!grid md:grid-cols-[220px_1fr] min-h-[calc(100vh-48px)]">
            {/* Sidebar – force hidden on mobile with !hidden, force flex on desktop with md:!flex */}
            <aside className="sidebar !hidden md:!flex flex-col w-[220px] bg-white border-r border-[#E5E5DF] py-7 px-0 flex-shrink-0">
                <div className="sidebar-brand px-6 mb-8">
                    <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">HYIPE</Link>
                    <span className="text-[9px] uppercase text-white bg-[#A32D2D] px-1.5 py-0.5 rounded-full inline-block mt-1">
                        {profile?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                </div>

                <nav className="sidebar-nav flex-1 px-3">
                    {navItems.map(({ key, icon, label }) => (
                        <button
                            key={key}
                            onClick={() => switchTab(key)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                                activeSub === key
                                    ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]'
                                    : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                            }`}
                        >
                            <span className="text-[13px] opacity-50">{icon}</span>
                            {label}
                            {key === 'monitor' && pendingCount > 0 && (
                                <span className="ml-auto bg-[#A32D2D] text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="text-sm font-medium">{profile?.full_name || 'Platform Admin'}</div>
                    <div className="text-[11px] text-[#888880]">{user?.email || 'admin@thehyipe.com'}</div>
                    <button onClick={() => signOut()} className="text-[11px] text-[#888880] underline mt-1.5 inline-block">← Back to site</button>
                </div>
            </aside>

            {/* Main content – extra bottom padding for mobile nav */}
            <main className="dash-content bg-[#F6F6F2] flex-1 p-4 md:p-10 overflow-y-auto pb-20 md:pb-10">
                {activeSub === 'users' && (
                    <UserManagementSection
                        allProfiles={allProfiles} loading={loadingUsers}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                        page={page} setPage={setPage} pageSize={PAGE_SIZE}
                        onRemoveUser={handleRemoveUser} onVerifyUser={handleVerifyUser}
                        onViewUser={(p) => setViewProfile(p)}
                        currentAdminRole={profile?.role ?? 'admin'}
                        onToggleBan={handleToggleBan}
                    />
                )}
                {activeSub === 'monitor' && (
                    <CampaignMonitorSection
                        campaigns={pendingCampaigns} loading={loadingCampaigns}
                        onApprove={handleApprove} onReject={handleReject}
                    />
                )}
                {activeSub === 'inbox' && (
                    <AdminInboxSection
                        threads={threads}
                        loading={loadingThreads}
                        selectedThread={selectedThread}
                        setSelectedThread={setSelectedThread}
                        conversation={conversation}
                        conversationLoading={conversationLoading}
                        loadConversation={loadConversation}
                        onNewChat={() => setShowNewChatModal(true)}
                        currentUserId={user.id}
                        onSendReply={handleSendReply}
                    />
                )}
                {activeSub === 'make-admin' && (
                    <MakeAdminSection
                        email={makeAdminEmail} setEmail={setMakeAdminEmail}
                        onPromote={handlePromoteToAdmin} loading={makeAdminLoading}
                        message={makeAdminMessage}
                    />
                )}
            </main>

            {/* Mobile Bottom Navigation – only visible on mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5DF] flex md:hidden justify-around items-center py-2 z-50">
                {navItems
                    .filter(item => item.key !== 'make-admin')
                    .map(({ key, icon, label }) => (
                        <button
                            key={key}
                            onClick={() => switchTab(key)}
                            className={`flex flex-col items-center gap-1 px-3 py-1 rounded text-[10px] ${
                                activeSub === key
                                    ? 'text-[#0D0D0B] font-medium'
                                    : 'text-[#888880]'
                            }`}
                        >
                            <span className="text-lg">{icon}</span>
                            {label === 'User Management' ? 'Users' : label === 'Campaign Monitor' ? 'Monitor' : 'Inbox'}
                        </button>
                    ))}
            </nav>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center">
                    <div className="bg-white rounded p-9 max-w-[560px] w-[90%] max-h-[85vh] overflow-y-auto">
                        <h2 className="font-['Playfair_Display'] text-2xl mb-4">New Conversation</h2>
                        <p className="text-xs text-[#888880] mb-6">Start a chat with any user on the platform.</p>

                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Select User</label>
                            <select
                                value={newChatRecipientId}
                                onChange={(e) => setNewChatRecipientId(e.target.value)}
                                className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white"
                            >
                                <option value="">— Choose a user —</option>
                                {allProfiles
                                    .filter((p) => p.id !== user!.id)
                                    .map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name} ({p.role}) – {p.email}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Message (optional)</label>
                            <textarea
                                value={newChatMessage}
                                onChange={(e) => setNewChatMessage(e.target.value)}
                                placeholder="Type your first message..."
                                className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateNewChat}
                                disabled={creatingChat || !newChatRecipientId}
                                className="bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50"
                            >
                                {creatingChat ? 'Creating...' : 'Start Chat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Profile Modal */}
            {viewProfile && (
                <div className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center">
                    <div className="bg-white rounded p-9 max-w-[560px] w-[90%] max-h-[85vh] overflow-y-auto">
                        <h2 className="font-['Playfair_Display'] text-2xl mb-4">User Details</h2>
                        <div className="space-y-2 text-sm">
                            <p><strong>Name:</strong> {viewProfile.full_name}</p>
                            <p><strong>Email:</strong> {viewProfile.email}</p>
                            <p><strong>Role:</strong> {viewProfile.role}</p>
                            <p><strong>Joined:</strong> {new Date(viewProfile.created_at).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> {viewProfile.status || 'Pending'}</p>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setViewProfile(null)} className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── User Management Section (with mobile cards & Ban/Verify actions) ─── */
function UserManagementSection({
                                   allProfiles, loading, searchQuery, setSearchQuery, roleFilter, setRoleFilter,
                                   page, setPage, pageSize, onRemoveUser, onVerifyUser, onViewUser, currentAdminRole,
                                   onToggleBan,
                               }: UserManagementProps) {
    const filtered = allProfiles
        .filter((p) => (roleFilter === 'all' ? true : p.role === roleFilter))
        .filter((p) => p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase()));

    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(filtered.length / pageSize);

    const canDelete = (targetRole: string) => {
        if (targetRole === 'superadmin') return false;
        if (targetRole === 'admin' && currentAdminRole !== 'superadmin') return false;
        return true;
    };

    return (
        <>
            {/* Header & Search/Filter */}
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-5 gap-3">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">
                    User Management <span className="badge-count bg-[#0D0D0B] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1.5">{allProfiles.length}</span>
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border border-[#E5E5DF] px-3 py-2 rounded text-xs font-sans outline-none flex-1 md:flex-initial"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white outline-none"
                    >
                        <option value="all">All</option>
                        <option value="brand">Brands</option>
                        <option value="influencer">Creators</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table – hidden on mobile */}
            <div className="hidden md:block">
                <table className="admin-table w-full border-collapse bg-white border border-[#E5E5DF] rounded overflow-hidden">
                    <thead>
                    <tr>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Name</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Email</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Role</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Joined</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Status</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4 text-sm text-[#888880]">Loading...</td></tr>
                    ) : paginated.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4 text-sm text-[#888880]">No users found.</td></tr>
                    ) : (
                        paginated.map((p) => {
                            const status = p.status || 'pending';
                            let statusStyle = 'bg-[#FFF8E6] text-[#7A5200]';
                            if (status === 'active') statusStyle = 'bg-[#E8F5E0] text-[#2A6000]';
                            if (status === 'banned') statusStyle = 'bg-[#FCE4E4] text-[#A32020]';

                            return (
                                <tr key={p.id} className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                                    <td className="px-4 py-3 text-sm"><strong>{p.full_name}</strong></td>
                                    <td className="px-4 py-3 text-sm">{p.email}</td>
                                    <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">{p.role}</span></td>
                                    <td className="px-4 py-3 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-sm">
                                            <span className={`status-badge px-2.5 py-1 rounded text-[10px] uppercase font-medium ${statusStyle}`}>
                                                {status}
                                            </span>
                                    </td>
                                    <td className="admin-actions flex gap-1.5">
                                        <button onClick={() => onViewUser(p)} className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                                        {status === 'pending' && (
                                            <button onClick={() => onVerifyUser(p.id)} className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Verify</button>
                                        )}
                                        {p.role !== 'admin' && p.role !== 'superadmin' && (
                                            <button
                                                onClick={() => onToggleBan(p.id, status)}
                                                className={`btn-sm px-3 py-1 text-[10px] uppercase ${
                                                    status === 'banned'
                                                        ? 'border border-green-600 text-green-600 bg-green-50'
                                                        : 'border border-red-500 text-red-500 bg-red-50'
                                                }`}
                                            >
                                                {status === 'banned' ? 'Unban' : 'Ban'}
                                            </button>
                                        )}
                                        {canDelete(p.role) && (
                                            <button onClick={() => onRemoveUser(p.id)} className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards – visible only on small screens */}
            <div className="block md:hidden space-y-4">
                {loading ? (
                    <div className="text-center text-sm text-[#888880] py-8">Loading...</div>
                ) : paginated.length === 0 ? (
                    <div className="text-center text-sm text-[#888880] py-8">No users found.</div>
                ) : (
                    paginated.map(p => {
                        const status = p.status || 'pending';
                        let statusClass = 'bg-[#FFF8E6] text-[#7A5200]';
                        if (status === 'active') statusClass = 'bg-[#E8F5E0] text-[#2A6000]';
                        if (status === 'banned') statusClass = 'bg-[#FCE4E4] text-[#A32020]';

                        return (
                            <div key={p.id} className="admin-mob-card bg-white border border-[#E5E5DF] rounded p-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm">{p.full_name}</h4>
                                    <span className={`status-badge px-2.5 py-0.5 rounded text-[10px] uppercase font-medium ${statusClass}`}>
                                        {status}
                                    </span>
                                </div>
                                <div className="meta text-xs text-[#888880] mt-1">
                                    {p.email} · <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">{p.role}</span> · Joined {new Date(p.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button onClick={() => onViewUser(p)} className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                                    {status === 'pending' && (
                                        <button onClick={() => onVerifyUser(p.id)} className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Verify</button>
                                    )}
                                    {p.role !== 'admin' && p.role !== 'superadmin' && (
                                        <button
                                            onClick={() => onToggleBan(p.id, status)}
                                            className={`btn-sm px-3 py-1 text-[10px] uppercase ${
                                                status === 'banned'
                                                    ? 'border border-green-600 text-green-600 bg-green-50'
                                                    : 'border border-red-500 text-red-500 bg-red-50'
                                            }`}
                                        >
                                            {status === 'banned' ? 'Unban' : 'Ban'}
                                        </button>
                                    )}
                                    {canDelete(p.role) && (
                                        <button onClick={() => onRemoveUser(p.id)} className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-[#888880]">Showing {paginated.length} of {filtered.length} users</span>
                <div className="flex gap-1">
                    <button onClick={() => setPage(page > 1 ? page - 1 : 1)} disabled={page === 1} className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase disabled:opacity-50">← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <button key={pg} onClick={() => setPage(pg)} className={`btn-sm px-3 py-1 text-[10px] uppercase ${pg === page ? 'bg-[#0D0D0B] text-white border-[#0D0D0B]' : 'border border-[#E5E5DF] text-[#3A3A36]'}`}>{pg}</button>
                    ))}
                    <button onClick={() => setPage(page < totalPages ? page + 1 : totalPages)} disabled={page === totalPages} className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase disabled:opacity-50">Next →</button>
                </div>
            </div>
        </>
    );
}

/* ─── Make Admin Section ─── */
function MakeAdminSection({ email, setEmail, onPromote, loading, message }: MakeAdminProps) {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Make Admin</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Promote an existing user to Admin by entering their email address.
                </p>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 max-w-[560px]">
                <div className="form-group mb-4">
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">User Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                    />
                </div>

                {message && (
                    <div
                        className={`p-3 rounded mb-4 text-xs ${
                            message.type === 'success'
                                ? 'bg-[#E8F5E0] text-[#2A6000] border border-[#B6D7A8]'
                                : 'bg-[#FFF8E6] text-[#7A5200] border border-[#F0D88A]'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <button
                    onClick={onPromote}
                    disabled={loading || !email.trim()}
                    className="btn-primary bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50"
                >
                    {loading ? 'Promoting...' : 'Promote to Admin'}
                </button>
            </div>
        </>
    );
}

/* ─── Campaign Monitor Section ─── */
function CampaignMonitorSection({ campaigns, loading, onApprove, onReject }: CampaignMonitorProps) {
    const awaitingReview = campaigns.filter((c) => c.status === 'under_review');
    const liveCampaigns = campaigns.filter((c) => c.status === 'live');

    return (
        <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-5 gap-3">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">Campaign Monitor</h2>
                {awaitingReview.length > 0 && (
                    <span className="wf-note bg-[#FFFBEA] border border-[#F0D88A] rounded px-2 py-1 text-[10px] text-[#7A6200] font-mono uppercase">
                        {awaitingReview.length} awaiting approval
                    </span>
                )}
            </div>

            {awaitingReview.length > 0 && (
                <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3.5 mb-5 text-sm">
                    ⚠ <strong>{awaitingReview.length} campaigns</strong> are pending your review before they go live on the marketplace.
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="admin-table w-full border-collapse bg-white border border-[#E5E5DF] rounded overflow-hidden min-w-[600px]">
                    <thead>
                    <tr>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Campaign</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Brand</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Budget</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Submitted</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Status</th>
                        <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="px-4 py-4 text-center text-sm text-[#888880]">Loading campaigns...</td></tr>
                    ) : awaitingReview.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-4 text-center text-sm text-[#888880]">No campaigns awaiting review.</td></tr>
                    ) : (
                        awaitingReview.map((c) => (
                            <tr key={c.id} className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                                <td className="px-4 py-3 text-sm">
                                    <strong>{c.title}</strong><br />
                                    <span className="text-[11px] text-[#888880]">{c.niche}</span>
                                </td>
                                <td className="px-4 py-3 text-sm">{c.brand.full_name}</td>
                                <td className="px-4 py-3 text-sm">Rs. {Number(c.budget).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm"><span className="status-badge status-pending bg-[#FFF8E6] text-[#7A5200] px-2.5 py-1 rounded text-[10px] uppercase font-medium">In Review</span></td>
                                <td className="admin-actions flex gap-1.5">
                                    <button onClick={() => onApprove(c.id)} className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Approve →</button>
                                    <button onClick={() => onReject(c.id)} className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Reject</button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {liveCampaigns.length > 0 && (
                <>
                    <h3 className="mt-8 mb-3 text-lg font-['Playfair_Display'] font-medium">Live Campaigns</h3>
                    <div className="overflow-x-auto">
                        <table className="admin-table w-full border-collapse bg-white border border-[#E5E5DF] rounded overflow-hidden min-w-[600px]">
                            <thead>
                            <tr>
                                <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Campaign</th>
                                <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Brand</th>
                                <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Budget</th>
                                <th className="bg-[#F0F0EA] px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.08em] text-[#888880] border-b border-[#E5E5DF]">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {liveCampaigns.map((c) => (
                                <tr key={c.id} className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                                    <td className="px-4 py-3 text-sm"><strong>{c.title}</strong></td>
                                    <td className="px-4 py-3 text-sm">{c.brand.full_name}</td>
                                    <td className="px-4 py-3 text-sm">Rs. {Number(c.budget).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm"><span className="status-badge status-live bg-[#E1F7EE] text-[#0A5A38] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Live ✓</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
    );
}

/* ─── Admin Inbox Section ─── */
function AdminInboxSection({
                               threads,
                               loading,
                               selectedThread,
                               setSelectedThread,
                               conversation,
                               conversationLoading,
                               loadConversation,
                               onNewChat,
                               currentUserId,
                               onSendReply,
                           }: AdminInboxProps) {
    const [replyText, setReplyText] = useState('');
    const canSend = selectedThread &&
        (selectedThread.brand_id === currentUserId || selectedThread.influencer_id === currentUserId);

    const handleReply = () => {
        if (!selectedThread || !replyText.trim()) return;
        onSendReply(selectedThread.id, replyText.trim());
        setReplyText('');
    };

    const headerTitle = selectedThread
        ? (selectedThread.campaign_title !== 'Direct Chat'
            ? selectedThread.campaign_title
            : null)
        : null;

    return (
        <>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-5 gap-3">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">Inbox Viewer</h2>
                <button
                    onClick={onNewChat}
                    className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]"
                >
                    + New Conversation
                </button>
            </div>
            <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded px-4 py-2 text-xs text-[#7A5200] mb-5">
                🔒 Admin view. All conversations are visible. You can reply to threads where you are a participant.
            </div>

            <div className="inbox-layout grid grid-cols-1 md:grid-cols-[300px_1fr] h-[calc(100vh-220px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                {/* Thread List – hidden on mobile, visible on md+ */}
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto hidden md:block">
                    <div className="inbox-list-header px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">
                        All Threads ({threads.length})
                    </div>
                    {loading ? (
                        <div className="px-4 py-4 text-xs text-[#888880]">Loading...</div>
                    ) : threads.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-[#888880]">No conversations yet.</div>
                    ) : (
                        threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => loadConversation(thread)}
                                className={`px-4 py-3 border-b border-[#E5E5DF] cursor-pointer hover:bg-[#F6F6F2] ${
                                    selectedThread?.id === thread.id ? 'bg-[#F0F0EA]' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {thread.brand_name} <span className="text-[#888880]">({thread.brand_id.slice(0,8)})</span>
                                            {' ↔ '}
                                            {thread.influencer_name} <span className="text-[#888880]">({thread.influencer_id.slice(0,8)})</span>
                                        </div>
                                        <div className="text-[10px] text-[#5E7A0A] font-medium truncate mt-0.5 uppercase">
                                            {thread.campaign_title}
                                        </div>
                                        <div className="text-xs text-[#888880] truncate mt-0.5">
                                            {thread.last_message}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[#888880] ml-2 flex-shrink-0">
                                        {new Date(thread.last_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Pane */}
                <div className="chat-pane flex flex-col min-h-0">
                    {selectedThread ? (
                        <>
                            <div className="px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3 flex-shrink-0 bg-white">
                                <div>
                                    <div className="text-sm font-semibold">
                                        {selectedThread.brand_name} <span className="text-[#888880]">({selectedThread.brand_id.slice(0,8)})</span>
                                        {' ↔ '}
                                        {selectedThread.influencer_name} <span className="text-[#888880]">({selectedThread.influencer_id.slice(0,8)})</span>
                                    </div>
                                    {headerTitle && (
                                        <div className="text-[10px] text-[#5E7A0A] uppercase">
                                            {headerTitle}
                                        </div>
                                    )}
                                    {!headerTitle && (
                                        <div className="text-[10px] text-[#5E7A0A] uppercase">Direct Chat</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                                {conversationLoading ? (
                                    <div className="text-sm text-[#888880]">Loading...</div>
                                ) : conversation.length === 0 ? (
                                    <div className="text-sm text-[#888880]">No messages in this thread.</div>
                                ) : (
                                    conversation.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed ${
                                                msg.sender_id === selectedThread.brand_id
                                                    ? 'bg-[#F0F0EA] self-start'
                                                    : msg.sender_id === selectedThread.influencer_id
                                                        ? 'bg-[#0D0D0B] text-white self-end'
                                                        : 'bg-[#EEEEEE] self-start'
                                            }`}
                                        >
                                            <div className="text-[10px] font-medium mb-1 text-[#888880]">
                                                {msg.sender_name || 'Unknown'} ({msg.sender_id.slice(0,8)})
                                            </div>
                                            {msg.content}
                                            <div className="text-[10px] mt-1 opacity-50">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {canSend && (
                                <div className="border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5 flex-shrink-0 bg-white">
                                    <input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReply();
                                            }
                                        }}
                                        placeholder="Type a reply..."
                                        className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none focus:border-[#0D0D0B] transition-colors"
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={!replyText.trim()}
                                        className="bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em] disabled:opacity-50 flex-shrink-0"
                                    >
                                        Send
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-[#888880]">
                            Select a thread to view conversation, or start a new one.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ─── Export ─── */
export default function AdminDashboard() {
    return (
        <DashboardRoleGuard roleParam="admin">
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
                <AdminDashboardInner />
            </Suspense>
        </DashboardRoleGuard>
    );
}