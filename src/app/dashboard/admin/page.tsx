'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';
import { createClient } from '@/lib/supabaseClient';

/* ─── Types ─── */
type SubView = 'users' | 'monitor' | 'inbox' | 'make-admin';

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
    brand:
        | { full_name: string; email?: string }
        | { full_name: string; email?: string }[]
        | null;
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

        const brandIds = [...new Set((threadData ?? []).map((t: any) => t.brand_id))];
        const influencerIds = [...new Set((threadData ?? []).map((t: any) => t.influencer_id))];

        const [brandRes, influencerRes] = await Promise.all([
            brandIds.length > 0
                ? supabase.from('profiles').select('id, full_name').in('id', brandIds)
                : { data: [] },
            influencerIds.length > 0
                ? supabase.from('profiles').select('id, full_name').in('id', influencerIds)
                : { data: [] },
        ]);

        const brandMap = new Map((brandRes.data ?? []).map((p: any) => [p.id, p.full_name]));
        const influencerMap = new Map((influencerRes.data ?? []).map((p: any) => [p.id, p.full_name]));

        const threads: AdminThread[] = (threadData ?? []).map((t: any) => ({
            id: t.id,
            brand_id: t.brand_id,
            brand_name: brandMap.get(t.brand_id) ?? 'Unknown Brand',
            influencer_id: t.influencer_id,
            influencer_name: influencerMap.get(t.influencer_id) ?? 'Unknown Influencer',
            campaign_id: t.campaign_id,
            campaign_title: t.campaign?.title ?? 'Untitled',
            last_message: t.last_message ?? '',
            last_at: t.last_message_at ?? t.created_at,
        }));

        setThreads(threads);
        setLoadingThreads(false);
    }, [supabase]);

    const loadConversation = useCallback(async (thread: AdminThread) => {
        setConversationLoading(true);
        setSelectedThread(thread);

        const { data, error } = await supabase
            .from('messages')
            .select('id, sender_id, receiver_id, content, created_at, read, campaign_id')
            .eq('campaign_id', thread.campaign_id)
            .order('created_at', { ascending: true });

        if (!error && data) {
            const senderIds = [...new Set((data as Message[]).map(m => m.sender_id))];
            const { data: senderProfiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', senderIds);
            const nameMap = new Map((senderProfiles ?? []).map((p: any) => [p.id, p.full_name]));

            const msgs: Message[] = (data as Message[]).map(m => ({
                ...m,
                sender_name: nameMap.get(m.sender_id) ?? 'Unknown',
            }));
            setConversation(msgs);
        } else {
            console.error(error);
            setConversation([]);
        }
        setConversationLoading(false);
    }, [supabase]);

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

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">
            <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0">
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

            <main className="dash-content bg-[#F6F6F2] flex-1 p-10 overflow-y-auto">
                {activeSub === 'users' && (
                    <UserManagementSection
                        allProfiles={allProfiles} loading={loadingUsers}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                        page={page} setPage={setPage} pageSize={PAGE_SIZE}
                        onRemoveUser={handleRemoveUser} onVerifyUser={handleVerifyUser}
                        onViewUser={(p) => setViewProfile(p)}
                        currentAdminRole={profile?.role ?? 'admin'}
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

/* ─── User Management Section (unchanged) ─── */
function UserManagementSection({
                                   allProfiles, loading, searchQuery, setSearchQuery, roleFilter, setRoleFilter,
                                   page, setPage, pageSize, onRemoveUser, onVerifyUser, onViewUser, currentAdminRole,
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
            <div className="admin-top flex justify-between items-center mb-5">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">
                    User Management <span className="badge-count bg-[#0D0D0B] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1.5">{allProfiles.length}</span>
                </h2>
                <div className="flex gap-2">
                    <input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border border-[#E5E5DF] px-3 py-2 rounded text-xs font-sans outline-none" />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white outline-none">
                        <option value="all">All Users</option>
                        <option value="brand">Brands</option>
                        <option value="influencer">Creators</option>
                    </select>
                </div>
            </div>

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
                    paginated.map((p) => (
                        <tr key={p.id} className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                            <td className="px-4 py-3 text-sm"><strong>{p.full_name}</strong></td>
                            <td className="px-4 py-3 text-sm">{p.email}</td>
                            <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">{p.role}</span></td>
                            <td className="px-4 py-3 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-sm"><span className={`status-badge px-2.5 py-1 rounded text-[10px] uppercase font-medium ${p.status === 'active' ? 'bg-[#E8F5E0] text-[#2A6000]' : 'bg-[#FFF8E6] text-[#7A5200]'}`}>{p.status || 'Pending'}</span></td>
                            <td className="admin-actions flex gap-1.5">
                                <button onClick={() => onViewUser(p)} className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                                {p.status !== 'active' && (
                                    <button onClick={() => onVerifyUser(p.id)} className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Verify</button>
                                )}
                                {canDelete(p.role) && (
                                    <button onClick={() => onRemoveUser(p.id)} className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                                )}
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>

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

/* ─── Make Admin Section (unchanged) ─── */
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

/* ─── Campaign Monitor Section (unchanged) ─── */
function CampaignMonitorSection({ campaigns, loading, onApprove, onReject }: CampaignMonitorProps) {
    const awaitingReview = campaigns.filter((c) => c.status === 'under_review');
    const liveCampaigns = campaigns.filter((c) => c.status === 'live');

    return (
        <>
            <div className="admin-top flex justify-between items-center mb-5">
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

            <table className="admin-table w-full border-collapse bg-white border border-[#E5E5DF] rounded overflow-hidden">
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

            {liveCampaigns.length > 0 && (
                <>
                    <h3 className="mt-8 mb-3 text-lg font-['Playfair_Display'] font-medium">Live Campaigns</h3>
                    <table className="admin-table w-full border-collapse bg-white border border-[#E5E5DF] rounded overflow-hidden">
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
                </>
            )}
        </>
    );
}

/* ─── Updated Admin Inbox Section (with UUIDs appended) ─── */
function AdminInboxSection({
                               threads,
                               loading,
                               selectedThread,
                               setSelectedThread,
                               conversation,
                               conversationLoading,
                               loadConversation,
                           }: AdminInboxProps) {
    return (
        <>
            <div className="admin-top flex flex-col gap-2 mb-5">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">Inbox Viewer</h2>
                <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded px-4 py-2 text-xs text-[#7A5200]">
                    🔒 Admin read-only view. All conversations between brands and creators.
                </div>
            </div>

            <div className="inbox-layout grid grid-cols-[300px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                {/* Thread List */}
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto">
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
                                    <div className="text-[10px] text-[#5E7A0A] uppercase">
                                        {selectedThread.campaign_title}
                                    </div>
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
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-[#888880]">
                            Select a thread to view conversation
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