/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';
import { createClient } from '@/lib/supabaseClient';

/* ─── Types ─── */
type SubView = 'profile' | 'projects' | 'inbox' | 'contracts';

type Application = {
    id: string; campaign_id: string; status: string;
    campaign: { title: string; brand: { full_name: string } };
};

type Message = {
    id: string; sender_id: string; receiver_id: string;
    content: string; created_at: string; read: boolean;
    sender_full_name: string | null; campaign_id: string | null;
};

type Thread = {
    partner_id: string; partner_name: string;
    campaign_id: string; campaign_title: string;
    last_message: string; last_at: string; unread: boolean;
};

type Milestone = {
    id: string; contract_id: string; title: string; description: string;
    amount: number; due_date: string | null; status: 'pending' | 'submitted' | 'approved' | 'paid';
    order_index: number;
};

type Contract = {
    id: string; campaign_id: string; brand_id: string; influencer_id: string;
    application_id: string; status: 'active' | 'completed' | 'cancelled';
    created_at: string;
    brand_name: string; campaign_title: string;
    milestones: Milestone[];
};

type ProfileFormType = {
    full_name: string; display_name: string; city: string; phone: string;
    bio: string; ig_handle: string; ig_followers: string; tiktok_handle: string;
    tiktok_followers: string; yt_url: string; yt_subscribers: string;
    primary_niche: string; secondary_niche: string; rate_ig_post: string; rate_video: string;
};

interface RawApplicationRow {
    id: string; campaign_id: string; status: string;
    campaign: { title: string; brand: { full_name: string }[] | { full_name: string } }[] | { title: string; brand: { full_name: string }[] | { full_name: string } };
}

interface RawMessageRow {
    id: string; sender_id: string; receiver_id: string; content: string;
    created_at: string; read: boolean; campaign_id: string | null;
    sender: { full_name: string } | { full_name: string }[] | null;
}

interface RawContractRow {
    id: string; campaign_id: string; brand_id: string; influencer_id: string;
    application_id: string; status: string; created_at: string;
    brand: { full_name: string }[] | { full_name: string };
    campaign: { title: string }[] | { title: string };
    milestones: Milestone[];
}

const defaultForm: ProfileFormType = {
    full_name: '', display_name: '', city: '', phone: '', bio: '',
    ig_handle: '', ig_followers: '', tiktok_handle: '', tiktok_followers: '',
    yt_url: '', yt_subscribers: '', primary_niche: '', secondary_niche: '',
    rate_ig_post: '', rate_video: '',
};

/* ─── Main Component ─── */
function InfluencerDashboardInner() {
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();
    const searchParams = useSearchParams();

    const tabParam = searchParams?.get('tab') as SubView | null;
    const initialTab: SubView = tabParam && ['profile','projects','inbox','contracts'].includes(tabParam) ? tabParam : 'profile';
    const partnerParam = searchParams?.get('partner') || null;
    const campaignParam = searchParams?.get('campaign') || null;

    const [activeSub, setActiveSub] = useState<SubView>(initialTab);
    const [profileForm, setProfileForm] = useState<ProfileFormType>(() => ({ ...defaultForm, full_name: profile?.full_name ?? '' }));
    const [applications, setApplications] = useState<Application[]>([]);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    /* ─── Data Fetching ─── */
    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setLoadingProjects(true);
        const { data } = await supabase
            .from('applications')
            .select('id, campaign_id, status, campaign:campaigns(title, brand:profiles!campaigns_brand_id_fkey(full_name))')
            .eq('influencer_id', user.id)
            .order('created_at', { ascending: false });

        const rows = (data ?? []) as unknown as RawApplicationRow[];
        setApplications(rows.map(row => {
            const campaign = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign;
            const brand = campaign?.brand
                ? (Array.isArray(campaign.brand) ? campaign.brand[0] : campaign.brand)
                : { full_name: 'Unknown Brand' };
            return {
                id: row.id, campaign_id: row.campaign_id, status: row.status,
                campaign: { title: campaign?.title ?? 'Untitled', brand: { full_name: brand?.full_name ?? 'Unknown Brand' } },
            };
        }));
        setLoadingProjects(false);
    }, [user, supabase]);

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoadingMessages(true);

        const { data: allData } = await supabase
            .from('messages')
            .select('id, sender_id, receiver_id, content, created_at, read, campaign_id, sender:profiles!messages_sender_id_fkey(full_name)')
            .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

        const rows = (allData ?? []) as unknown as RawMessageRow[];
        const threadMap = new Map<string, Thread>();

        rows.forEach(row => {
            const isIncoming = row.receiver_id === user.id;
            const partnerId = isIncoming ? row.sender_id : row.receiver_id;
            const campaignId = row.campaign_id ?? 'none';
            const key = `${partnerId}::${campaignId}`;

            if (!threadMap.has(key)) {
                const senderName = Array.isArray(row.sender) ? row.sender[0]?.full_name : (row.sender as { full_name: string } | null)?.full_name;
                threadMap.set(key, {
                    partner_id: partnerId,
                    partner_name: isIncoming ? (senderName || 'Unknown') : '…',
                    campaign_id: row.campaign_id ?? '',
                    campaign_title: '',
                    last_message: row.content,
                    last_at: row.created_at,
                    unread: isIncoming && !row.read,
                });
            } else {
                const t = threadMap.get(key)!;
                if (isIncoming && !row.read) t.unread = true;
                if ((!t.partner_name || t.partner_name === '…') && isIncoming) {
                    const sn = Array.isArray(row.sender) ? row.sender[0]?.full_name : (row.sender as { full_name: string } | null)?.full_name;
                    if (sn) t.partner_name = sn;
                }
            }
        });

        // Resolve partner names where unknown (outgoing first messages)
        const unknownIds = Array.from(threadMap.values())
            .filter(t => !t.partner_name || t.partner_name === '…')
            .map(t => t.partner_id);
        if (unknownIds.length > 0) {
            const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', unknownIds);
            (profiles ?? []).forEach((p: { id: string; full_name: string }) => {
                threadMap.forEach(t => { if (t.partner_id === p.id && (!t.partner_name || t.partner_name === '…')) t.partner_name = p.full_name; });
            });
        }

        // Resolve campaign titles
        const campaignIds = Array.from(new Set(Array.from(threadMap.values()).map(t => t.campaign_id).filter(Boolean)));
        if (campaignIds.length > 0) {
            const { data: camps } = await supabase.from('campaigns').select('id, title').in('id', campaignIds);
            (camps ?? []).forEach((c: { id: string; title: string }) => {
                threadMap.forEach(t => { if (t.campaign_id === c.id) t.campaign_title = c.title; });
            });
        }

        setThreads(Array.from(threadMap.values()).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()));
        setLoadingMessages(false);
    }, [user, supabase]);

    const fetchContracts = useCallback(async () => {
        if (!user) return;
        setLoadingContracts(true);
        const { data } = await supabase
            .from('contracts')
            .select('id, campaign_id, brand_id, influencer_id, application_id, status, created_at, brand:profiles!contracts_brand_id_fkey(full_name), campaign:campaigns(title), milestones(id, contract_id, title, description, amount, due_date, status, order_index)')
            .eq('influencer_id', user.id)
            .order('created_at', { ascending: false });

        const rows = (data ?? []) as unknown as RawContractRow[];
        setContracts(rows.map(row => ({
            id: row.id, campaign_id: row.campaign_id, brand_id: row.brand_id,
            influencer_id: row.influencer_id, application_id: row.application_id,
            status: row.status as Contract['status'], created_at: row.created_at,
            brand_name: Array.isArray(row.brand) ? row.brand[0]?.full_name ?? 'Unknown' : (row.brand as { full_name: string })?.full_name ?? 'Unknown',
            campaign_title: Array.isArray(row.campaign) ? row.campaign[0]?.title ?? 'Untitled' : (row.campaign as { title: string })?.title ?? 'Untitled',
            milestones: (row.milestones ?? []).sort((a, b) => a.order_index - b.order_index),
        })));
        setLoadingContracts(false);
    }, [user, supabase]);

    // Initial load
    useEffect(() => {
        if (initialTab === 'projects') fetchProjects();
        if (initialTab === 'inbox') fetchMessages();
        if (initialTab === 'contracts') fetchContracts();
        // eslint-disable-next-line react-hooks/set-state-in-effect
    }, []);

    /* ─── Tab Switching ─── */
    const switchTab = useCallback(async (tab: SubView) => {
        setActiveSub(tab);
        if (tab === 'projects') await fetchProjects();
        if (tab === 'inbox') await fetchMessages();
        if (tab === 'contracts') await fetchContracts();
    }, [fetchProjects, fetchMessages, fetchContracts]);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        await supabase.from('profiles').upsert({ id: user!.id, ...profileForm });
        setSavingProfile(false);
        alert('Profile saved');
    };

    const handleThreadRead = useCallback(async (partnerId: string, campaignId: string) => {
        if (!user) return;
        const query = supabase
            .from('messages')
            .update({ read: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', partnerId)
            .eq('read', false);
        if (campaignId) await query.eq('campaign_id', campaignId);
        else await query;
        setThreads(prev => prev.map(t =>
            t.partner_id === partnerId && t.campaign_id === campaignId ? { ...t, unread: false } : t
        ));
        setTimeout(() => window.dispatchEvent(new Event('inbox:read')), 100);
    }, [supabase, user]);

    const inboxUnreadCount = threads.filter(t => t.unread).length;
    const activeContractsCount = contracts.filter(c => c.status === 'active').length;

    return (
        <div className="dashboard-shell flex" style={{ height: 'calc(100vh - 48px)' }}>
            {/* Sidebar */}
            <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0 flex-shrink-0">
                <div className="sidebar-brand px-6 mb-8">
                    <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">HYIPE</Link>
                    <span className="role-pill text-[9px] uppercase text-white bg-[#0D0D0B] px-1.5 py-0.5 rounded-full inline-block mt-1">Creator</span>
                </div>
                <nav className="sidebar-nav flex-1 px-3">
                    {([
                        { key: 'profile',   icon: '◎',  label: 'My Profile' },
                        { key: 'projects',  icon: '◈',  label: 'My Projects' },
                        { key: 'contracts', icon: '📄', label: 'Contracts', badge: activeContractsCount },
                        { key: 'inbox',     icon: '◻',  label: 'Inbox',     badge: inboxUnreadCount },
                    ] as { key: SubView; icon: string; label: string; badge?: number }[]).map(({ key, icon, label, badge }) => (
                        <button key={key} onClick={() => switchTab(key)}
                                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                                    activeSub === key ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                                }`}>
                            <span className="text-[13px] opacity-50">{icon}</span>
                            {label}
                            {badge != null && badge > 0 && (
                                <span className="ml-auto bg-[#0D0D0B] text-white text-[9px] px-1.5 py-0.5 rounded-full">{badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-user mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="text-sm font-medium">{profile?.full_name || 'Creator'}</div>
                    <div className="text-[11px] text-[#888880]">{user?.email}</div>
                    <button onClick={() => signOut()} className="text-[11px] text-[#888880] underline mt-1.5 inline-block">← Back to site</button>
                </div>
            </aside>

            {/* Main content */}
            <main className="dash-content bg-[#F6F6F2] flex-1 overflow-hidden flex flex-col">
                {activeSub === 'profile' && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <ProfileSection form={profileForm} setForm={setProfileForm} onSave={handleSaveProfile} saving={savingProfile} />
                    </div>
                )}
                {activeSub === 'projects' && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <ProjectsSection applications={applications} loading={loadingProjects} />
                    </div>
                )}
                {activeSub === 'contracts' && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <ContractsSection
                            contracts={contracts} loading={loadingContracts}
                            supabase={supabase} onRefresh={fetchContracts}
                        />
                    </div>
                )}
                {activeSub === 'inbox' && (
                    <div className="flex-1 overflow-hidden flex flex-col p-10 pb-0">
                        <InboxSection
                            threads={threads} loading={loadingMessages}
                            currentUserId={user!.id}
                            onThreadRead={handleThreadRead}
                            onRefreshThreads={fetchMessages}
                            initialPartnerId={partnerParam}
                            initialCampaignId={campaignParam}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

export default function InfluencerDashboard() {
    return <DashboardRoleGuard roleParam="influencer"><InfluencerDashboardInner /></DashboardRoleGuard>;
}

/* ─── Profile Section ─── */
function ProfileSection({ form, setForm, onSave, saving }: {
    form: ProfileFormType;
    setForm: React.Dispatch<React.SetStateAction<ProfileFormType>>;
    onSave: () => void; saving: boolean;
}) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const filled = Object.values(form).filter(v => v.trim() !== '').length;
    const completion = Math.round((filled / Object.keys(form).length) * 100);

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Profile</h1>
                <p className="text-sm text-[#888880] mt-1">Complete your profile to start applying for campaigns.</p>
            </div>
            <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3.5 mb-6 text-sm flex justify-between items-center">
                <span>⚠ Your profile is {completion}% complete.</span>
                <div className="w-40 h-1 bg-[#F0F0EA] rounded">
                    <div className="bg-[#0D0D0B] h-1 rounded" style={{ width: `${completion}%` }} />
                </div>
            </div>
            <div className="bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Personal Information</h3>
                <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 bg-[#E8E8E2] rounded-full flex items-center justify-center font-['Playfair_Display'] text-2xl font-bold text-[#3A3A36] border border-dashed border-[#C0C0B8]">
                        {form.full_name ? form.full_name.slice(0, 2).toUpperCase() : 'AN'}
                    </div>
                    <div>
                        <button className="border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]">Upload Photo</button>
                        <p className="text-xs text-[#888880] mt-1.5">JPG or PNG · Max 2MB</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Full Name</label>
                        <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Display Name / Handle</label>
                        <input name="display_name" value={form.display_name} onChange={handleChange} placeholder="@handle" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">City</label>
                        <input name="city" value={form.city} onChange={handleChange} placeholder="Karachi" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Phone (WhatsApp)</label>
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="+92 300 000 0000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Bio (200 chars max)</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} maxLength={200} placeholder="Tell brands about yourself..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm resize-none min-h-[80px]" />
                </div>
            </div>
            <div className="bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Social Media & Reach</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Instagram Handle</label>
                        <input name="ig_handle" value={form.ig_handle} onChange={handleChange} placeholder="@handle" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Instagram Followers</label>
                        <input name="ig_followers" value={form.ig_followers} onChange={handleChange} placeholder="e.g. 120000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">TikTok Handle</label>
                        <input name="tiktok_handle" value={form.tiktok_handle} onChange={handleChange} placeholder="@handle" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">TikTok Followers</label>
                        <input name="tiktok_followers" value={form.tiktok_followers} onChange={handleChange} placeholder="e.g. 80000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">YouTube Channel URL</label>
                        <input name="yt_url" value={form.yt_url} onChange={handleChange} placeholder="https://youtube.com/..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">YouTube Subscribers</label>
                        <input name="yt_subscribers" value={form.yt_subscribers} onChange={handleChange} placeholder="e.g. 45000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
            </div>
            <div className="bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Niche & Rates</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Primary Niche</label>
                        <select name="primary_niche" value={form.primary_niche} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option value="">— Select —</option>
                            {['Fashion & Lifestyle','Tech & Gaming','Food & Travel','Fitness & Health','Beauty','Business & Finance'].map(n => <option key={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Secondary Niche</label>
                        <select name="secondary_niche" value={form.secondary_niche} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option value="">— Select —</option>
                            {['Fashion & Lifestyle','Food & Travel'].map(n => <option key={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Rate per Instagram Post (PKR)</label>
                        <input name="rate_ig_post" value={form.rate_ig_post} onChange={handleChange} placeholder="e.g. 25000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Rate per Video (PKR)</label>
                        <input name="rate_video" value={form.rate_video} onChange={handleChange} placeholder="e.g. 45000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-4">
                <button className="border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Save Draft</button>
                <button onClick={onSave} disabled={saving} className="bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </>
    );
}

/* ─── Projects Section ─── */
function ProjectsSection({ applications, loading }: { applications: Application[]; loading: boolean }) {
    const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'accepted' | 'completed'>('all');
    const statusMap: Record<string, string> = {
        applied: 'applied', under_review: 'applied', accepted: 'accepted', completed: 'completed',
    };
    const filtered = activeTab === 'all' ? applications : applications.filter(a => statusMap[a.status] === activeTab);
    const count = (tab: string) => tab === 'all' ? applications.length : applications.filter(a => statusMap[a.status] === tab).length;
    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            under_review: { bg: '#EEF2FF', text: '#3040A0', label: 'Under Review' },
            applied:      { bg: '#FFF8E6', text: '#7A5200', label: 'Applied' },
            accepted:     { bg: '#E8F5E0', text: '#2A6000', label: 'Accepted ✓' },
            completed:    { bg: '#E1F7EE', text: '#0A5A38', label: 'Completed' },
        };
        const s = map[status] ?? { bg: '#F0F0EA', text: '#3A3A36', label: status };
        return <span style={{ background: s.bg, color: s.text }} className="px-2.5 py-1 rounded text-[10px] uppercase font-medium">{s.label}</span>;
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Projects</h1>
                <p className="text-sm text-[#888880] mt-1">Campaigns you&apos;ve applied to or are working on.</p>
            </div>
            <div className="flex justify-end mb-4">
                <Link href="/marketplace" className="bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">
                    Search for New Projects →
                </Link>
            </div>
            <div className="flex border-b border-[#E5E5DF] mb-6">
                {(['all','applied','accepted','completed'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 text-xs uppercase tracking-[0.06em] border-b-2 ${activeTab === tab ? 'border-[#0D0D0B] text-[#0D0D0B] font-medium' : 'border-transparent text-[#888880] hover:text-[#0D0D0B]'}`}>
                        {tab} ({count(tab)})
                    </button>
                ))}
            </div>
            {loading ? (
                <div className="text-sm text-[#888880]">Loading projects...</div>
            ) : filtered.length === 0 ? (
                <div className="text-sm text-[#888880]">No projects found.</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(app => (
                        <div key={app.id} className="bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                            <div>
                                <h4 className="text-sm font-medium">{app.campaign.title}</h4>
                                <div className="text-xs text-[#888880]">{app.campaign.brand.full_name}</div>
                            </div>
                            <div>{statusBadge(app.status)}</div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/* ─── Contracts Section (Influencer) ─── */
function ContractsSection({ contracts, loading, supabase, onRefresh }: {
    contracts: Contract[]; loading: boolean;
    supabase: ReturnType<typeof createClient>; onRefresh: () => void;
}) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<string | null>(null);

    const handleSubmitMilestone = async (milestoneId: string) => {
        setSubmitting(milestoneId);
        const { error } = await supabase.from('milestones').update({ status: 'submitted' }).eq('id', milestoneId);
        if (error) alert(error.message);
        setSubmitting(null);
        onRefresh();
    };

    const milestoneStatusBadge = (status: Milestone['status']) => {
        const map: Record<Milestone['status'], { bg: string; text: string; label: string }> = {
            pending:   { bg: '#F0F0EA', text: '#3A3A36', label: 'Pending' },
            submitted: { bg: '#EEF2FF', text: '#3040A0', label: 'Submitted ↑' },
            approved:  { bg: '#E8F5E0', text: '#2A6000', label: 'Approved ✓' },
            paid:      { bg: '#E1F7EE', text: '#0A5A38', label: 'Paid ✓' },
        };
        const s = map[status];
        return <span style={{ background: s.bg, color: s.text }} className="px-2 py-0.5 rounded text-[10px] uppercase font-medium">{s.label}</span>;
    };

    const activeContracts = contracts.filter(c => c.status === 'active');
    const completedContracts = contracts.filter(c => c.status === 'completed');

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Contracts</h1>
                <p className="text-sm text-[#888880] mt-1">Track your milestones and payments from brands.</p>
            </div>

            {loading ? (
                <p className="text-sm text-[#888880]">Loading contracts...</p>
            ) : contracts.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E5E5DF] rounded p-10 text-center">
                    <p className="text-sm text-[#888880]">No contracts yet. Contracts appear when a brand accepts your application.</p>
                </div>
            ) : (
                <>
                    {activeContracts.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-medium text-sm mb-3">Active ({activeContracts.length})</h3>
                            <div className="flex flex-col gap-4">
                                {activeContracts.map(contract => {
                                    const isOpen = expandedId === contract.id;
                                    const totalBudget = contract.milestones.reduce((s, m) => s + m.amount, 0);
                                    const paidAmount = contract.milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0);
                                    return (
                                        <div key={contract.id} className="bg-white border border-[#E5E5DF] rounded">
                                            <div className="p-4 flex justify-between items-start cursor-pointer" onClick={() => setExpandedId(isOpen ? null : contract.id)}>
                                                <div>
                                                    <h4 className="text-sm font-medium">{contract.campaign_title}</h4>
                                                    <div className="text-xs text-[#888880] mt-0.5">Brand: {contract.brand_name}</div>
                                                    <div className="text-xs text-[#888880] mt-0.5">
                                                        {contract.milestones.length} milestone{contract.milestones.length !== 1 ? 's' : ''} · Rs. {paidAmount.toLocaleString()} / {totalBudget.toLocaleString()} received
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-[#E1F7EE] text-[#0A5A38] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Active</span>
                                                    <span className="text-xs text-[#888880]">{isOpen ? '▲' : '▼'}</span>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="border-t border-[#E5E5DF] p-4">
                                                    {totalBudget > 0 && (
                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-xs text-[#888880] mb-1">
                                                                <span>Payment received</span>
                                                                <span>Rs. {paidAmount.toLocaleString()} / {totalBudget.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-[#F0F0EA] rounded overflow-hidden">
                                                                <div className="h-full bg-[#0D0D0B] rounded transition-all" style={{ width: `${totalBudget > 0 ? Math.round((paidAmount / totalBudget) * 100) : 0}%` }} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {contract.milestones.length === 0 ? (
                                                        <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3 text-xs text-[#7A5200]">
                                                            ⏳ The brand hasn&apos;t set any milestones yet. Check back soon.
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            {contract.milestones.map((m, idx) => (
                                                                <div key={m.id} className="border border-[#E5E5DF] rounded p-3 flex justify-between items-start gap-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-[#888880] font-medium">#{idx + 1}</span>
                                                                            <span className="text-sm font-medium">{m.title}</span>
                                                                        </div>
                                                                        {m.description && <div className="text-xs text-[#888880] mt-0.5">{m.description}</div>}
                                                                        <div className="flex gap-3 mt-1 text-xs text-[#888880]">
                                                                            <span>Rs. {m.amount.toLocaleString()}</span>
                                                                            {m.due_date && <span>Due: {new Date(m.due_date).toLocaleDateString()}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                                        {milestoneStatusBadge(m.status)}
                                                                        {m.status === 'pending' && (
                                                                            <button
                                                                                onClick={() => handleSubmitMilestone(m.id)}
                                                                                disabled={submitting === m.id}
                                                                                className="border border-[#3040A0] text-[#3040A0] bg-[#EEF2FF] px-2 py-0.5 text-[10px] uppercase disabled:opacity-50"
                                                                            >
                                                                                {submitting === m.id ? '...' : 'Mark Complete'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {completedContracts.length > 0 && (
                        <div>
                            <h3 className="font-medium text-sm mb-3 text-[#888880]">Completed ({completedContracts.length})</h3>
                            <div className="flex flex-col gap-3">
                                {completedContracts.map(contract => (
                                    <div key={contract.id} className="bg-white border border-[#E5E5DF] rounded p-4 flex justify-between items-center opacity-70">
                                        <div>
                                            <h4 className="text-sm font-medium">{contract.campaign_title}</h4>
                                            <div className="text-xs text-[#888880]">Brand: {contract.brand_name}</div>
                                        </div>
                                        <span className="bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Completed ✓</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

/* ─── Inbox Section ─── */
function InboxSection({ threads, loading, currentUserId, onThreadRead, onRefreshThreads, initialPartnerId, initialCampaignId }: {
    threads: Thread[]; loading: boolean; currentUserId: string;
    onThreadRead: (partnerId: string, campaignId: string) => Promise<void>;
    onRefreshThreads: () => Promise<void>;
    initialPartnerId: string | null; initialCampaignId: string | null;
}) {
    const supabase = createClient();
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const convoEndRef = useRef<HTMLDivElement>(null);
    const initialLoadDone = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        convoEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    const loadConversation = useCallback(async (thread: Thread) => {
        setSelectedThread(thread);
        setConversationLoading(true);

        let query = supabase
            .from('messages')
            .select('id, sender_id, receiver_id, content, created_at, read, campaign_id, sender:profiles!messages_sender_id_fkey(full_name)')
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${thread.partner_id}),and(sender_id.eq.${thread.partner_id},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: true });

        if (thread.campaign_id) {
            query = query.eq('campaign_id', thread.campaign_id);
        }

        const { data, error } = await query;
        if (error) { setConversationLoading(false); return; }

        const rows = (data ?? []) as unknown as (Message & { sender: { full_name: string } | { full_name: string }[] | null })[];
        setConversation(rows.map(row => ({
            id: row.id, sender_id: row.sender_id, receiver_id: row.receiver_id,
            content: row.content, created_at: row.created_at, read: row.read,
            campaign_id: row.campaign_id,
            sender_full_name: (Array.isArray(row.sender) ? row.sender[0]?.full_name : (row.sender as { full_name: string } | null)?.full_name)
                || (row.sender_id === thread.partner_id ? thread.partner_name : 'You'),
        })));
        setConversationLoading(false);
        await onThreadRead(thread.partner_id, thread.campaign_id);
        setTimeout(scrollToBottom, 50);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [supabase, currentUserId, onThreadRead, scrollToBottom]);

    useEffect(() => {
        if (initialPartnerId && threads.length > 0 && !initialLoadDone.current) {
            const thread = threads.find(t =>
                t.partner_id === initialPartnerId &&
                (!initialCampaignId || t.campaign_id === initialCampaignId)
            ) ?? threads.find(t => t.partner_id === initialPartnerId);
            if (thread) {
                loadConversation(thread);
                initialLoadDone.current = true;
            }
        }
    }, [initialPartnerId, initialCampaignId, threads, loadConversation]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedThread) return;
        const newMsg = {
            sender_id: currentUserId,
            receiver_id: selectedThread.partner_id,
            content: replyText.trim(),
            campaign_id: selectedThread.campaign_id || null,
            read: false,
        };
        const { data, error } = await supabase.from('messages').insert(newMsg).select('id, created_at').single();
        if (error) return;
        setConversation(prev => [...prev, {
            id: data.id, sender_id: currentUserId, receiver_id: selectedThread.partner_id,
            content: newMsg.content, created_at: data.created_at, read: false,
            campaign_id: selectedThread.campaign_id, sender_full_name: 'You',
        }]);
        setReplyText('');
        setTimeout(scrollToBottom, 30);
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="dash-header mb-4 flex-shrink-0">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">Campaign-scoped messages from brands.</p>
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-[300px_1fr] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                {/* Thread List */}
                <div className="border-r border-[#E5E5DF] flex flex-col min-h-0">
                    <div className="px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium flex-shrink-0">
                        Conversations
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-4 text-xs text-[#888880]">Loading...</div>
                        ) : threads.length === 0 ? (
                            <div className="px-4 py-4 text-xs text-[#888880]">No messages yet.</div>
                        ) : (
                            threads.map(thread => {
                                const key = `${thread.partner_id}::${thread.campaign_id}`;
                                const isSel = selectedThread?.partner_id === thread.partner_id && selectedThread?.campaign_id === thread.campaign_id;
                                return (
                                    <div key={key} onClick={() => loadConversation(thread)}
                                         className={`px-4 py-3 border-b border-[#E5E5DF] cursor-pointer transition-colors ${isSel ? 'bg-[#F0F0EA]' : 'hover:bg-[#F6F6F2]'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm truncate ${thread.unread ? 'font-semibold' : 'font-medium'}`}>
                                                    {thread.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1.5 mb-0.5" />}
                                                    {thread.partner_name}
                                                </div>
                                                {thread.campaign_title && (
                                                    <div className="text-[10px] text-[#5E7A0A] font-medium truncate mt-0.5 uppercase tracking-[0.04em]">
                                                        {thread.campaign_title}
                                                    </div>
                                                )}
                                                <div className="text-xs text-[#888880] truncate mt-0.5">{thread.last_message}</div>
                                            </div>
                                            <span className="text-[10px] text-[#888880] ml-2 flex-shrink-0">
                                                {new Date(thread.last_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Pane */}
                <div className="flex flex-col min-h-0">
                    {selectedThread ? (
                        <>
                            <div className="px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3 flex-shrink-0 bg-white">
                                <div className="w-9 h-9 rounded-full bg-[#E8E8E2] flex items-center justify-center text-sm font-medium flex-shrink-0">
                                    {selectedThread.partner_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">{selectedThread.partner_name}</div>
                                    {selectedThread.campaign_title && (
                                        <div className="text-[10px] text-[#5E7A0A] uppercase tracking-[0.04em] font-medium">{selectedThread.campaign_title}</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                                {conversationLoading ? (
                                    <div className="text-sm text-[#888880]">Loading...</div>
                                ) : conversation.length === 0 ? (
                                    <div className="text-sm text-[#888880]">No messages yet.</div>
                                ) : (
                                    conversation.map(msg => (
                                        <div key={msg.id} className={`max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed ${
                                            msg.sender_id === currentUserId ? 'bg-[#0D0D0B] text-white self-end' : 'bg-[#F0F0EA] self-start'
                                        }`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 ${msg.sender_id === currentUserId ? 'text-white/40' : 'text-[#888880]'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={convoEndRef} />
                            </div>
                            <div className="border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5 flex-shrink-0 bg-white">
                                <input ref={inputRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                                       onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                       placeholder="Type a message..."
                                       className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none focus:border-[#0D0D0B] transition-colors" />
                                <button onClick={handleSendReply} disabled={!replyText.trim()}
                                        className="bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em] disabled:opacity-50 flex-shrink-0">
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-[#888880]">
                            Select a conversation to read
                        </div>
                    )}
                </div>
            </div>
            {/* suppress unused warning */}
            <span style={{ display: 'none' }}>{onRefreshThreads.toString()}</span>
        </div>
    );
}
