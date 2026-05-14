/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';
import { createClient } from '@/lib/supabaseClient';

/* ─── Types ─── */
type SubView = 'profile' | 'campaigns' | 'inbox' | 'applications' | 'contracts';

type CampaignInsert = {
    title: string; niche: string; platform: string; budget: number;
    deliverable: string; brief: string; min_followers: number;
    deadline: string | null; requirements: string; brand_id: string; status: string;
};

type Campaign = {
    id: string; title: string; niche: string; budget: number;
    status: string; deadline: string; applications_count: number;
};

type BrandFormType = {
    company_name: string; industry: string; website: string;
    contact_person: string; description: string; ntn: string; payment_number: string;
    logo_url?: string;
};

type CampaignFormType = {
    title: string; niche: string; platform: string; budget: string;
    deliverable: string; brief: string; min_followers: string; deadline: string; requirements: string;
};

type Message = {
    id: string; sender_id: string; receiver_id: string;
    content: string; created_at: string; read: boolean;
    sender_full_name: string | null; campaign_id: string | null;
};

type Thread = {
    id?: string;
    partner_id: string;
    partner_name: string;
    campaign_id: string;
    campaign_title: string;
    last_message: string;
    last_at: string;
    unread: boolean;
};

type Application = {
    id: string; campaign_id: string; influencer_id: string; pitch: string; status: string;
    influencer: { full_name: string; email: string }; campaign: { title: string };
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
    influencer_name: string; campaign_title: string;
    milestones: Milestone[];
};

interface RawCampaignRow {
    id: string; title: string; niche: string; budget: number; status: string; deadline: string;
    applications?: { count: number }[] | { count: number };
}

interface RawApplicationRow {
    id: string; campaign_id: string; influencer_id: string; pitch: string; status: string;
    influencer: { full_name: string; email: string }[] | { full_name: string; email: string };
    campaign: { title: string }[] | { title: string };
}

interface RawInboxMessageRow {
    id: string; sender_id: string; receiver_id: string; content: string;
    created_at: string; read: boolean; campaign_id: string | null;
    sender: { full_name: string } | { full_name: string }[] | null;
}

interface RawContractRow {
    id: string;
    campaign_id: string;
    brand_id: string;
    influencer_id: string;
    application_id: string;
    status: string;
    created_at: string;
    title: string;
    budget: number;
    influencer: { full_name: string };
    campaign: { title: string };
    milestones: Milestone[];
}

/* ─── Defaults ─── */
const defaultBrandForm: BrandFormType = {
    company_name: '', industry: '', website: '', contact_person: '', description: '', ntn: '', payment_number: '',
    logo_url: '',
};

const defaultCampaignForm: CampaignFormType = {
    title: '', niche: '', platform: '', budget: '', deliverable: '', brief: '',
    min_followers: '', deadline: '', requirements: '',
};

/* ─── Main Component ─── */
function BrandDashboardInner() {
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();

    const tabParam = searchParams?.get('tab') as SubView | null;
    const initialTab: SubView = tabParam && ['profile','campaigns','inbox','applications','contracts'].includes(tabParam) ? tabParam : 'profile';
    const partnerParam = searchParams?.get('partner') || null;
    const campaignParam = searchParams?.get('campaign') || null;

    const [activeSub, setActiveSub] = useState<SubView>(initialTab);
    const [brandForm, setBrandForm] = useState<BrandFormType>(() => ({
        ...defaultBrandForm,
        company_name: profile?.full_name ?? '',
        logo_url: profile?.logo_url ?? '',
    }));
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);

    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [showCampModal, setShowCampModal] = useState(false);
    const [showCampSuccess, setShowCampSuccess] = useState(false);
    const [campaignForm, setCampaignForm] = useState<CampaignFormType>(defaultCampaignForm);
    const [submittingCampaign, setSubmittingCampaign] = useState(false);

    // Mobile sidebar toggle
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    /* ─── Data Fetching ─── */
    const fetchCampaigns = useCallback(async () => {
        if (!user) return;
        setLoadingCampaigns(true);
        const { data } = await supabase
            .from('campaigns').select('*, applications(count)')
            .eq('brand_id', user.id).order('created_at', { ascending: false });

        const rows = (data ?? []) as unknown as RawCampaignRow[];
        setCampaigns(rows.map(row => ({
            id: row.id, title: row.title, niche: row.niche, budget: row.budget,
            status: row.status, deadline: row.deadline,
            applications_count: Array.isArray(row.applications) ? (row.applications[0]?.count ?? 0) : 0,
        })));
        setLoadingCampaigns(false);
    }, [user, supabase]);

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoadingMessages(true);

        const { data } = await supabase
            .from('conversation_threads')
            .select(`
                *,
                campaign:campaigns(title),
                influencer:profiles!conversation_threads_influencer_id_fkey(full_name)
            `)
            .eq('brand_id', user.id)
            .order('last_message_at', { ascending: false });

        const mappedThreads: Thread[] = (data || []).map(thread => ({
            id: thread.id,
            partner_id: thread.influencer_id,
            partner_name: thread.influencer?.full_name || 'Influencer',
            campaign_id: thread.campaign_id,
            campaign_title: thread.campaign?.title || 'Campaign',
            last_message: thread.last_message || '',
            last_at: thread.last_message_at || thread.created_at,
            unread: false,
        }));

        setThreads(mappedThreads);
        setLoadingMessages(false);
    }, [user, supabase]);

    const fetchApplications = useCallback(async () => {
        if (!user) return;
        setLoadingApplications(true);
        const campaignIds = campaigns.map(c => c.id);
        if (campaignIds.length === 0) { setApplications([]); setLoadingApplications(false); return; }
        const { data } = await supabase
            .from('applications')
            .select('id, campaign_id, influencer_id, pitch, status, influencer:profiles!applications_influencer_id_fkey(full_name, email), campaign:campaigns(title)')
            .in('campaign_id', campaignIds)
            .order('created_at', { ascending: false });

        const rows = (data ?? []) as unknown as RawApplicationRow[];
        setApplications(rows.map(item => ({
            id: item.id, campaign_id: item.campaign_id, influencer_id: item.influencer_id,
            pitch: item.pitch, status: item.status,
            influencer: {
                full_name: Array.isArray(item.influencer) ? item.influencer[0]?.full_name ?? 'Unknown' : item.influencer?.full_name ?? 'Unknown',
                email: Array.isArray(item.influencer) ? item.influencer[0]?.email ?? '' : item.influencer?.email ?? '',
            },
            campaign: {
                title: Array.isArray(item.campaign) ? item.campaign[0]?.title ?? 'Untitled' : item.campaign?.title ?? 'Untitled',
            },
        })));
        setLoadingApplications(false);
    }, [user, supabase, campaigns]);

    const fetchContracts = useCallback(async () => {
        if (!user) return;
        setLoadingContracts(true);

        const { data: contractsData, error } = await supabase
            .from('contracts')
            .select(`
                id,
                campaign_id,
                brand_id,
                influencer_id,
                application_id,
                status,
                created_at,
                title,
                budget,
                milestones ( id, contract_id, title, description, amount, due_date, status, order_index )
            `)
            .eq('brand_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setLoadingContracts(false);
            return;
        }

        const influencerIds = [...new Set((contractsData ?? []).map(c => c.influencer_id))];
        const campaignIds   = [...new Set((contractsData ?? []).map(c => c.campaign_id))];

        const [influencerRes, campaignRes] = await Promise.all([
            influencerIds.length > 0 ? supabase.from('profiles').select('id, full_name').in('id', influencerIds) : { data: [] },
            campaignIds.length > 0   ? supabase.from('campaigns').select('id, title').in('id', campaignIds) : { data: [] },
        ]);

        const influencerMap = new Map((influencerRes.data ?? []).map(p => [p.id, p.full_name]));
        const campaignMap   = new Map((campaignRes.data ?? []).map(c => [c.id, c.title]));

        const contracts: Contract[] = (contractsData ?? []).map(row => ({
            id: row.id,
            campaign_id: row.campaign_id,
            brand_id: row.brand_id,
            influencer_id: row.influencer_id,
            application_id: row.application_id,
            status: row.status as Contract['status'],
            created_at: row.created_at,
            influencer_name: influencerMap.get(row.influencer_id) ?? 'Unknown',
            campaign_title: campaignMap.get(row.campaign_id) ?? 'Untitled',
            milestones: (row.milestones ?? []).sort((a, b) => a.order_index - b.order_index),
        }));

        setContracts(contracts);
        setLoadingContracts(false);
    }, [user, supabase]);

    // Initial load
    useEffect(() => {
        if (initialTab === 'campaigns') fetchCampaigns();
        if (initialTab === 'inbox') fetchMessages();
        if (initialTab === 'applications') { fetchCampaigns(); }
        if (initialTab === 'contracts') fetchContracts();
    }, []);

    // Fetch applications once campaigns are loaded
    useEffect(() => {
        if (campaigns.length > 0 && activeSub === 'applications') fetchApplications();
    }, [campaigns, activeSub, fetchApplications]);

    /* ─── Tab Switching ─── */
    const switchTab = useCallback(async (tab: SubView) => {
        setActiveSub(tab);
        setMobileSidebarOpen(false); // close mobile sidebar on tab switch
        if (tab === 'campaigns') await fetchCampaigns();
        if (tab === 'inbox') await fetchMessages();
        if (tab === 'applications') { await fetchCampaigns(); }
        if (tab === 'contracts') await fetchContracts();
    }, [fetchCampaigns, fetchMessages, fetchContracts]);

    // React to URL query param changes (e.g. from header notification)
    useEffect(() => {
        if (tabParam && tabParam !== activeSub) {
            switchTab(tabParam);
        }
    }, [tabParam]);

    /* ─── Handlers ─── */
    const handleSaveProfile = async () => {
        setSavingProfile(true);
        await supabase.from('profiles').upsert({ id: user!.id, ...brandForm });
        setSavingProfile(false);
        alert('Profile saved');
    };

    const handleCampaignSubmit = async () => {
        if (!user) return;
        setSubmittingCampaign(true);
        const payload: CampaignInsert = {
            title: campaignForm.title, niche: campaignForm.niche, platform: campaignForm.platform,
            budget: Number(campaignForm.budget) || 0, deliverable: campaignForm.deliverable,
            brief: campaignForm.brief, min_followers: Number(campaignForm.min_followers) || 0,
            deadline: campaignForm.deadline || null, requirements: campaignForm.requirements,
            brand_id: user.id, status: 'under_review',
        };
        const { error } = await supabase.from('campaigns').insert(payload);
        if (error) { alert(error.message); setSubmittingCampaign(false); return; }
        await fetchCampaigns();
        setSubmittingCampaign(false);
        setCampaignForm(defaultCampaignForm);
        setShowCampModal(false);
        setShowCampSuccess(true);
    };

    const handleAcceptApplication = async (appId: string) => {
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const { error: appErr } = await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId);
        if (appErr) { alert('Status update failed: ' + appErr.message); console.error(appErr); return; }

        const { data: campaign, error: campErr } = await supabase.from('campaigns').select('title, budget').eq('id', app.campaign_id).single();
        if (campErr || !campaign) { alert('Could not fetch campaign: ' + (campErr?.message || 'not found')); console.error(campErr); return; }

        const insertPayload = {
            campaign_id: app.campaign_id,
            brand_id: user!.id,
            influencer_id: app.influencer_id,
            application_id: appId,
            status: 'active',
            title: campaign.title || 'Untitled',
            budget: campaign.budget || 0,
        };

        const { data: contractData, error: contractErr } = await supabase.from('contracts').insert(insertPayload).select('id').single();
        if (contractErr) { alert('Contract creation failed: ' + contractErr.message); console.error('Contract insert error:', contractErr); return; }

        await fetchContracts();
        await fetchApplications();
        if (contractData?.id) switchTab('contracts');
    };

    const handleRejectApplication = async (appId: string) => {
        await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId);
        fetchApplications();
    };

    const handleStartConversation = async (applicationId: string, influencerId: string, campaignId: string) => {
        const { data: existing } = await supabase
            .from('conversation_threads')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('brand_id', user!.id)
            .eq('influencer_id', influencerId)
            .maybeSingle();

        let threadId = existing?.id;

        if (!existing) {
            const { data: created, error } = await supabase
                .from('conversation_threads')
                .insert({
                    campaign_id: campaignId,
                    brand_id: user!.id,
                    influencer_id: influencerId,
                    started_by_brand: true,
                    last_message: 'Conversation started',
                    last_message_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) { alert(error.message); return; }
            threadId = created.id;
        }

        router.push(`/dashboard/brand?tab=inbox&partner=${influencerId}&campaign=${campaignId}&thread=${threadId}`);
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
    const contractsCount = contracts.filter(c => c.status === 'active').length;

    // ── BANNED CHECK ──
    if (profile?.status === 'banned') {
        return (
            <div className="p-10 text-center">
                <h1 className="text-2xl font-bold text-red-600">Account Suspended</h1>
                <p>Your account has been banned. You cannot post new campaigns.</p>
            </div>
        );
    }

    // Sidebar content (used both on desktop and mobile overlay)
    const sidebarContent = (
        <>
            <div className="sidebar-brand px-6 mb-8 flex items-center justify-between">
                <div>
                    <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">HYIPE</Link>
                    <span className="text-[9px] uppercase text-white bg-[#5E7A0A] px-1.5 py-0.5 rounded-full inline-block mt-1">Brand</span>
                </div>
                {/* close button for mobile overlay */}
                <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="lg:hidden text-gray-500 hover:text-black text-lg leading-none"
                >
                    ✕
                </button>
            </div>
            <nav className="sidebar-nav flex-1 px-3">
                {([
                    { key: 'profile',      icon: '◎',  label: 'Brand Profile' },
                    { key: 'campaigns',    icon: '◈',  label: 'My Campaigns' },
                    { key: 'applications', icon: '📋', label: 'Applications' },
                    { key: 'contracts',    icon: '📄', label: 'Contracts', badge: contractsCount },
                    { key: 'inbox',        icon: '◻',  label: 'Inbox',     badge: inboxUnreadCount },
                ] as { key: SubView; icon: string; label: string; badge?: number }[]).map(({ key, icon, label, badge }) => (
                    <button key={key} onClick={() => {
                        router.push(`/dashboard/brand?tab=${key}`, { scroll: false });
                        setMobileSidebarOpen(false);
                    }}
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
            <div className="mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                <div className="text-sm font-medium">{profile?.full_name || 'Brand'}</div>
                <div className="text-[11px] text-[#888880]">{user?.email}</div>
                <button onClick={() => signOut()} className="text-[11px] text-[#888880] underline mt-1.5 inline-block">← Back to site</button>
            </div>
        </>
    );

    return (
        <div className="dashboard-shell flex" style={{ height: 'calc(100vh - 48px)' }}>
            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-[220px] bg-white border-r border-[#E5E5DF] flex flex-col py-7 px-0 z-50 shadow-xl">
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Desktop sidebar – always visible on lg+ screens */}
            <aside className="sidebar !hidden lg:!flex bg-white border-r border-[#E5E5DF] w-[220px] flex-col py-7 px-0 flex-shrink-0">
                {sidebarContent}
            </aside>

            {/* Main Content */}
            <main className="dash-content bg-[#F6F6F2] flex-1 overflow-hidden flex flex-col">
                {/* Mobile header with hamburger */}
                <div className="lg:hidden flex items-center p-4 bg-white border-b border-[#E5E5DF]">
                    <button onClick={() => setMobileSidebarOpen(true)} className="text-xl font-bold mr-3">☰</button>
                    <span className="font-['Playfair_Display'] text-lg font-bold">HYIPE</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10">
                    {activeSub === 'profile' && (
                        <BrandProfileSection form={brandForm} setForm={setBrandForm} onSave={handleSaveProfile} saving={savingProfile} />
                    )}

                    {activeSub === 'campaigns' && (
                        <CampaignsSection campaigns={campaigns} loading={loadingCampaigns} openCampModal={() => setShowCampModal(true)} />
                    )}
                    {activeSub === 'applications' && (
                        <ApplicationsSection
                            applications={applications} loading={loadingApplications}
                            onAccept={handleAcceptApplication} onReject={handleRejectApplication}
                            onMessage={handleStartConversation}
                        />
                    )}
                    {activeSub === 'contracts' && (
                        <ContractsSection
                            contracts={contracts} loading={loadingContracts}
                            currentUserId={user!.id} supabase={supabase}
                            onRefresh={fetchContracts}
                        />
                    )}
                    {activeSub === 'inbox' && (
                        <BrandInboxSection
                            key={`${partnerParam}-${campaignParam}`}
                            threads={threads} loading={loadingMessages}
                            currentUserId={user!.id}
                            onThreadRead={handleThreadRead}
                            onRefreshThreads={fetchMessages}
                            initialPartnerId={partnerParam}
                            initialCampaignId={campaignParam}
                        />
                    )}
                </div>
            </main>

            {/* Campaign Modal */}
            {showCampModal && (
                <div className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded p-6 md:p-9 max-w-[560px] w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="font-['Playfair_Display'] text-2xl mb-1">Post a New Campaign</h2>
                        <p className="text-xs text-[#888880] mb-6">Fill in your campaign brief. It will be reviewed by HYIPE before going live.</p>
                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Campaign Title</label>
                            <input value={campaignForm.title} onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))}
                                   placeholder="e.g. Summer Eid Collection Launch" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Niche / Category</label>
                                <select value={campaignForm.niche} onChange={e => setCampaignForm(p => ({ ...p, niche: e.target.value }))} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                                    <option value="">— Select —</option>
                                    {['Fashion & Lifestyle','Tech & Gaming','Food & Travel','Fitness','Beauty'].map(n => <option key={n}>{n}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Primary Platform</label>
                                <select value={campaignForm.platform} onChange={e => setCampaignForm(p => ({ ...p, platform: e.target.value }))} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                                    {['Instagram','TikTok','YouTube','Multiple'].map(n => <option key={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Budget (PKR)</label>
                                <input value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: e.target.value }))}
                                       placeholder="e.g. 50000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Deliverable</label>
                                <input value={campaignForm.deliverable} onChange={e => setCampaignForm(p => ({ ...p, deliverable: e.target.value }))}
                                       placeholder="e.g. 1 Reel, 3 TikToks" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Campaign Brief</label>
                            <textarea value={campaignForm.brief} onChange={e => setCampaignForm(p => ({ ...p, brief: e.target.value }))}
                                      placeholder="Describe what you need, tone, references..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Minimum Followers</label>
                                <input value={campaignForm.min_followers} onChange={e => setCampaignForm(p => ({ ...p, min_followers: e.target.value }))}
                                       placeholder="e.g. 50000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Application Deadline</label>
                                <input type="date" value={campaignForm.deadline} onChange={e => setCampaignForm(p => ({ ...p, deadline: e.target.value }))}
                                       className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Creator Requirements</label>
                            <textarea value={campaignForm.requirements} onChange={e => setCampaignForm(p => ({ ...p, requirements: e.target.value }))}
                                      placeholder="e.g. Must be based in Pakistan..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]" />
                        </div>
                        <hr className="border-t border-[#E5E5DF] my-5" />
                        <div className="flex justify-end gap-2.5">
                            <button onClick={() => setShowCampModal(false)} className="border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Cancel</button>
                            <button onClick={handleCampaignSubmit} disabled={submittingCampaign} className="bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50">
                                {submittingCampaign ? 'Submitting...' : 'Submit for Review →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Success Overlay */}
            {showCampSuccess && (
                <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                    <div className="bg-white rounded p-8 md:p-12 text-center max-w-[400px] w-full">
                        <div className="w-14 h-14 border-2 border-[#0D0D0B] rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">✓</div>
                        <h2 className="font-['Playfair_Display'] text-2xl mb-2.5">Campaign Submitted!</h2>
                        <p className="text-sm text-[#3A3A36] mb-6">Your campaign has been submitted for review and will be posted once approved. This usually takes 1–2 business days.</p>
                        <button onClick={() => { setShowCampSuccess(false); setActiveSub('campaigns'); }} className="bg-[#0D0D0B] text-white w-full py-2.5 text-xs uppercase tracking-[0.06em]">
                            Back to My Campaigns
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BrandDashboard() {
    return <DashboardRoleGuard roleParam="brand"><BrandDashboardInner /></DashboardRoleGuard>;
}

/* ─── Brand Profile Section ─── */
function BrandProfileSection({ form, setForm, onSave, saving }: {
    form: BrandFormType;
    setForm: React.Dispatch<React.SetStateAction<BrandFormType>>;
    onSave: () => void; saving: boolean;
}) {
    const { user } = useAuth();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingLogo(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            alert('Upload failed: ' + uploadError.message);
            setUploadingLogo(false);
            return;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        setForm(prev => ({ ...prev, logo_url: publicUrl }));
        await supabase.from('profiles').upsert({ id: user.id, logo_url: publicUrl });

        setUploadingLogo(false);
    };

    return (
        <>
            <div className="dash-header mb-5 md:mb-7">
                <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-normal">Brand Profile</h1>
                <p className="text-sm text-[#888880] mt-1">This information will be visible to creators when viewing your campaigns.</p>
            </div>

            {/* Brand Identity Card */}
            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-4 md:p-7 mb-4 md:mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Brand Identity</h3>
                <div className="profile-avatar-row flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                    {/* Avatar / Logo preview */}
                    <div
                        className="w-16 h-16 bg-[#E8E8E2] rounded flex items-center justify-center font-['Playfair_Display'] text-2xl font-bold text-[#3A3A36] border border-dashed border-[#C0C0B8] overflow-hidden"
                        style={{ borderRadius: '4px' }}
                    >
                        {form.logo_url ? (
                            <img src={form.logo_url} alt="Brand logo" className="w-full h-full object-cover" />
                        ) : (
                            (form.company_name?.charAt(0)?.toUpperCase() || 'B')
                        )}
                    </div>

                    <div>
                        <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleLogoUpload} style={{ display: 'none' }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}
                                className="border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] disabled:opacity-50">
                            {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </button>
                        <p className="text-xs text-[#888880] mt-1.5">PNG with transparent background preferred</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Brand / Company Name</label>
                        <input name="company_name" value={form.company_name} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Industry</label>
                        <select name="industry" value={form.industry} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option value="">— Select —</option>
                            {['Fashion & Apparel','Tech & Electronics','Food & Beverage','Health & Beauty'].map(n => <option key={n}>{n}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Official Website</label>
                        <input name="website" value={form.website} onChange={handleChange} placeholder="https://..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Contact Person</label>
                        <input name="contact_person" value={form.contact_person} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Brand Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="Tell creators about your brand..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm resize-none min-h-[80px]" />
                </div>
            </div>

            {/* Verification & Trust Card */}
            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-4 md:p-7 mb-4 md:mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Verification & Trust</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">National Tax Number (NTN)</label>
                        <input name="ntn" value={form.ntn} onChange={handleChange} placeholder="For verified badge" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">EasyPaisa / JazzCash Number</label>
                        <input name="payment_number" value={form.payment_number} onChange={handleChange} placeholder="For escrow payments" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="bg-[#F0F0EA] rounded p-3.5 text-xs text-[#3A3A36]">ℹ Verified brands get a blue checkmark and are trusted more by creators. Verification takes 1–2 business days.</div>
            </div>

            <div className="flex justify-end gap-2.5 mt-4">
                <button className="border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Save Draft</button>
                <button onClick={onSave} disabled={saving} className="bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50">{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
        </>
    );
}

/* ─── Campaigns Section ─── */
function CampaignsSection({ campaigns, loading, openCampModal }: {
    campaigns: Campaign[]; loading: boolean; openCampModal: () => void;
}) {
    // ... (unchanged)
    const [activeTab, setActiveTab] = useState<'all' | 'under_review' | 'live' | 'completed'>('all');
    const filtered = activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab);
    const count = (tab: string) => tab === 'all' ? campaigns.length : campaigns.filter(c => c.status === tab).length;
    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            live: { bg: '#E1F7EE', text: '#0A5A38', label: 'Live ✓' },
            under_review: { bg: '#FFF8E6', text: '#7A5200', label: 'In Review' },
            completed: { bg: '#E8F5E0', text: '#2A6000', label: 'Completed ✓' },
        };
        const s = map[status] ?? { bg: '#F0F0EA', text: '#3A3A36', label: status };
        return <span style={{ background: s.bg, color: s.text }} className="px-2.5 py-1 rounded text-[10px] uppercase font-medium">{s.label}</span>;
    };
    return (
        <>
            <div className="dash-header mb-5 md:mb-7">
                <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-normal">My Campaigns</h1>
                <p className="text-sm text-[#888880] mt-1">Create, manage, and track your influencer campaigns.</p>
            </div>
            <div className="flex justify-end mb-4">
                <button onClick={openCampModal} className="bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">+ Post a New Campaign</button>
            </div>
            <div className="flex border-b border-[#E5E5DF] mb-6 overflow-x-auto">
                {(['all','under_review','live','completed'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 text-xs uppercase tracking-[0.06em] border-b-2 ${activeTab === tab ? 'border-[#0D0D0B] text-[#0D0D0B] font-medium' : 'border-transparent text-[#888880] hover:text-[#0D0D0B]'} whitespace-nowrap`}>
                        {tab.replace('_', ' ')} ({count(tab)})
                    </button>
                ))}
            </div>
            {loading ? (
                <p className="text-sm text-[#888880] py-10 text-center">Loading campaigns...</p>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E5E5DF] rounded p-10 text-center"><p className="text-sm text-[#888880]">No campaigns found.</p></div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(c => (
                        <div key={c.id} className="bg-white border border-[#E5E5DF] rounded p-4 flex flex-col sm:flex-row justify-between gap-3">
                            <div>
                                <h4 className="text-sm font-medium">{c.title}</h4>
                                <div className="text-xs text-[#888880]">{c.applications_count} Applications · {c.niche}</div>
                                <div className="flex gap-1.5 mt-2"><span className="bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">{c.niche}</span></div>
                            </div>
                            <div className="text-right">
                                {statusBadge(c.status)}
                                {c.deadline && <div className="text-xs text-[#888880] mt-1.5">Deadline: {new Date(c.deadline).toLocaleDateString()}</div>}
                                <div className="font-['Playfair_Display'] text-[15px] mt-1">Rs. {Number(c.budget).toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/* ─── Applications Section ─── */
function ApplicationsSection({ applications, loading, onAccept, onReject, onMessage }: {
    applications: Application[]; loading: boolean;
    onAccept: (id: string) => void; onReject: (id: string) => void;
    onMessage: (appId: string, influencerId: string, campaignId: string) => void;
}) {
    // ... (unchanged)
    const pendingApps = applications.filter(a => a.status === 'applied');
    const acceptedApps = applications.filter(a => a.status === 'accepted');
    const rejectedApps = applications.filter(a => a.status === 'rejected');

    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            applied: { bg: '#FFF8E6', text: '#7A5200', label: 'Applied' },
            accepted: { bg: '#E8F5E0', text: '#2A6000', label: 'Accepted' },
            rejected: { bg: '#FCE4E4', text: '#A32020', label: 'Rejected' },
        };
        const s = map[status] ?? { bg: '#F0F0EA', text: '#3A3A36', label: status };
        return <span style={{ background: s.bg, color: s.text }} className="px-2.5 py-1 rounded text-[10px] uppercase font-medium">{s.label}</span>;
    };

    return (
        <>
            <div className="dash-header mb-5 md:mb-7">
                <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-normal">Applications</h1>
                <p className="text-sm text-[#888880] mt-1">Review influencer applications. Accepting one creates a contract and opens a campaign conversation.</p>
            </div>
            {loading ? (
                <p className="text-sm text-[#888880]">Loading applications...</p>
            ) : (
                <>
                    {pendingApps.length === 0 && acceptedApps.length === 0 && rejectedApps.length === 0 && (
                        <p className="text-sm text-[#888880]">No applications received yet.</p>
                    )}
                    {pendingApps.length > 0 && (
                        <div className="flex flex-col gap-3 mb-6">
                            <h3 className="font-medium text-sm">Pending ({pendingApps.length})</h3>
                            {pendingApps.map(app => (
                                <div key={app.id} className="bg-white border border-[#E5E5DF] rounded p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{app.influencer?.full_name || 'Influencer'}</div>
                                        <div className="text-xs text-[#888880]">{app.influencer?.email}</div>
                                        <div className="text-xs mt-1"><strong>Campaign:</strong> {app.campaign?.title}</div>
                                        <div className="text-xs mt-1 italic text-[#888880]">{app.pitch}</div>
                                    </div>
                                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                                        {statusBadge(app.status)}
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => onAccept(app.id)} className="border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Accept → Start Contract</button>
                                            <button onClick={() => onReject(app.id)} className="border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Reject</button>
                                            <button onClick={() => onMessage(app.id, app.influencer_id, app.campaign_id)} className="border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1 text-[10px] uppercase">Message</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {acceptedApps.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-medium text-sm mb-3">Accepted ({acceptedApps.length})</h3>
                            {acceptedApps.map(app => (
                                <div key={app.id} className="bg-white border border-[#E5E5DF] rounded p-4 flex justify-between items-center mb-2">
                                    <div>
                                        <div className="text-sm font-medium">{app.influencer?.full_name || 'Influencer'}</div>
                                        <div className="text-xs text-[#888880]">{app.campaign?.title}</div>
                                    </div>
                                    {statusBadge(app.status)}
                                </div>
                            ))}
                        </div>
                    )}
                    {rejectedApps.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-medium text-sm mb-3">Rejected ({rejectedApps.length})</h3>
                            {rejectedApps.map(app => (
                                <div key={app.id} className="bg-white border border-[#E5E5DF] rounded p-4 flex justify-between items-center mb-2">
                                    <div>
                                        <div className="text-sm font-medium">{app.influencer?.full_name || 'Influencer'}</div>
                                        <div className="text-xs text-[#888880]">{app.campaign?.title}</div>
                                    </div>
                                    {statusBadge(app.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
}

/* ─── Contracts Section (Brand) ─── */
function ContractsSection({ contracts, loading, currentUserId, supabase, onRefresh }: {
    contracts: Contract[]; loading: boolean; currentUserId: string;
    supabase: ReturnType<typeof createClient>; onRefresh: () => void;
}) {
    // ... (unchanged)
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', amount: '', due_date: '' });
    const [savingMilestone, setSavingMilestone] = useState(false);

    const handleAddMilestone = async (contractId: string) => {
        if (!newMilestone.title.trim()) return;
        setSavingMilestone(true);
        const contract = contracts.find(c => c.id === contractId);
        const nextOrder = (contract?.milestones.length ?? 0) + 1;
        const { error } = await supabase.from('milestones').insert({
            contract_id: contractId,
            title: newMilestone.title,
            description: newMilestone.description,
            amount: Number(newMilestone.amount) || 0,
            due_date: newMilestone.due_date || null,
            status: 'pending',
            order_index: nextOrder,
        });
        if (error) { alert(error.message); setSavingMilestone(false); return; }
        setNewMilestone({ title: '', description: '', amount: '', due_date: '' });
        setAddingTo(null);
        setSavingMilestone(false);
        onRefresh();
    };

    const handleApproveMilestone = async (milestoneId: string) => {
        const { error } = await supabase.from('milestones').update({ status: 'approved' }).eq('id', milestoneId);
        if (!error) onRefresh();
    };

    const handleMarkPaid = async (milestoneId: string) => {
        const { error } = await supabase.from('milestones').update({ status: 'paid' }).eq('id', milestoneId);
        if (!error) onRefresh();
    };

    const handleCompleteContract = async (contractId: string) => {
        await supabase.from('contracts').update({ status: 'completed' }).eq('id', contractId);
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
            <div className="dash-header mb-5 md:mb-7">
                <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-normal">Contracts</h1>
                <p className="text-sm text-[#888880] mt-1">Manage milestones and payments for accepted campaigns.</p>
            </div>

            {loading ? (
                <p className="text-sm text-[#888880]">Loading contracts...</p>
            ) : contracts.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E5E5DF] rounded p-10 text-center">
                    <p className="text-sm text-[#888880]">No contracts yet. Accept an application to start a contract.</p>
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
                                    const allApproved = contract.milestones.length > 0 && contract.milestones.every(m => m.status === 'paid' || m.status === 'approved');
                                    return (
                                        <div key={contract.id} className="bg-white border border-[#E5E5DF] rounded">
                                            {/* Contract Header */}
                                            <div className="p-4 flex flex-col sm:flex-row justify-between items-start cursor-pointer" onClick={() => setExpandedId(isOpen ? null : contract.id)}>
                                                <div>
                                                    <h4 className="text-sm font-medium">{contract.campaign_title}</h4>
                                                    <div className="text-xs text-[#888880] mt-0.5">Creator: {contract.influencer_name}</div>
                                                    <div className="text-xs text-[#888880] mt-0.5">
                                                        {contract.milestones.length} milestone{contract.milestones.length !== 1 ? 's' : ''} · Rs. {paidAmount.toLocaleString()} / {totalBudget.toLocaleString()} paid
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                                    <span className="bg-[#E1F7EE] text-[#0A5A38] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Active</span>
                                                    <span className="text-xs text-[#888880]">{isOpen ? '▲' : '▼'}</span>
                                                </div>
                                            </div>

                                            {/* Expanded: Milestones */}
                                            {isOpen && (
                                                <div className="border-t border-[#E5E5DF] p-4">
                                                    {/* Progress bar */}
                                                    {totalBudget > 0 && (
                                                        <div className="mb-4">
                                                            <div className="flex justify-between text-xs text-[#888880] mb-1">
                                                                <span>Payment progress</span>
                                                                <span>Rs. {paidAmount.toLocaleString()} / {totalBudget.toLocaleString()}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-[#F0F0EA] rounded overflow-hidden">
                                                                <div className="h-full bg-[#0D0D0B] rounded transition-all" style={{ width: `${Math.round((paidAmount / totalBudget) * 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {contract.milestones.length === 0 ? (
                                                        <p className="text-xs text-[#888880] mb-4">No milestones yet. Add one below.</p>
                                                    ) : (
                                                        <div className="flex flex-col gap-2 mb-4">
                                                            {contract.milestones.map((m, idx) => (
                                                                <div key={m.id} className="border border-[#E5E5DF] rounded p-3 flex flex-col sm:flex-row justify-between items-start gap-3">
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
                                                                        {m.status === 'submitted' && (
                                                                            <button onClick={() => handleApproveMilestone(m.id)} className="border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-2 py-0.5 text-[10px] uppercase">Approve</button>
                                                                        )}
                                                                        {m.status === 'approved' && (
                                                                            <button onClick={() => handleMarkPaid(m.id)} className="bg-[#0D0D0B] text-white px-2 py-0.5 text-[10px] uppercase">Mark Paid</button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Add Milestone */}
                                                    {addingTo === contract.id ? (
                                                        <div className="border border-[#E5E5DF] rounded p-3 bg-[#F6F6F2]">
                                                            <div className="text-xs uppercase tracking-[0.06em] text-[#888880] mb-2">New Milestone</div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                                                <input placeholder="Title" value={newMilestone.title} onChange={e => setNewMilestone(p => ({ ...p, title: e.target.value }))} className="p-2 border border-[#E5E5DF] rounded text-xs col-span-2 sm:col-span-2" />
                                                                <input placeholder="Description (optional)" value={newMilestone.description} onChange={e => setNewMilestone(p => ({ ...p, description: e.target.value }))} className="p-2 border border-[#E5E5DF] rounded text-xs col-span-2 sm:col-span-2" />
                                                                <input placeholder="Amount (PKR)" value={newMilestone.amount} onChange={e => setNewMilestone(p => ({ ...p, amount: e.target.value }))} className="p-2 border border-[#E5E5DF] rounded text-xs" />
                                                                <input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone(p => ({ ...p, due_date: e.target.value }))} className="p-2 border border-[#E5E5DF] rounded text-xs" />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => { setAddingTo(null); setNewMilestone({ title: '', description: '', amount: '', due_date: '' }); }} className="border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">Cancel</button>
                                                                <button onClick={() => handleAddMilestone(contract.id)} disabled={savingMilestone || !newMilestone.title.trim()} className="bg-[#0D0D0B] text-white px-3 py-1 text-[10px] uppercase disabled:opacity-50">{savingMilestone ? 'Saving...' : 'Add Milestone'}</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setAddingTo(contract.id)} className="border border-[#E5E5DF] text-[#3A3A36] px-3 py-1.5 text-[10px] uppercase">+ Add Milestone</button>
                                                            {allApproved && (
                                                                <button onClick={() => handleCompleteContract(contract.id)} className="border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1.5 text-[10px] uppercase">Mark Contract Complete</button>
                                                            )}
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
                                            <div className="text-xs text-[#888880]">Creator: {contract.influencer_name}</div>
                                        </div>
                                        <span className="bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Completed ✓</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            <span style={{ display: 'none' }}>{currentUserId}</span>
        </>
    );
}

/* ─── Brand Inbox Section ─── */
function BrandInboxSection({
                               threads,
                               loading,
                               currentUserId,
                               onThreadRead,
                               onRefreshThreads,
                               initialPartnerId,
                               initialCampaignId,
                           }: {
    threads: Thread[];
    loading: boolean;
    currentUserId: string;
    onThreadRead: (partnerId: string, campaignId: string) => Promise<void>;
    onRefreshThreads: () => Promise<void>;
    initialPartnerId: string | null;
    initialCampaignId: string | null;
}) {
    // ... (unchanged)
    const supabase = createClient();
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [conversation, setConversation] = useState<Message[]>([]);
    const [conversationLoading, setConversationLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const convoEndRef = useRef<HTMLDivElement>(null);
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
        const msgs: Message[] = rows.map(row => ({
            id: row.id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            content: row.content,
            created_at: row.created_at,
            read: row.read,
            campaign_id: row.campaign_id,
            sender_full_name:
                (Array.isArray(row.sender) ? row.sender[0]?.full_name : row.sender?.full_name) ||
                (row.sender_id === thread.partner_id ? thread.partner_name : 'You'),
        }));
        setConversation(msgs);
        setConversationLoading(false);
        await onThreadRead(thread.partner_id, thread.campaign_id);
        setTimeout(scrollToBottom, 50);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [supabase, currentUserId, onThreadRead, scrollToBottom]);

    // Auto‑open thread from URL params
    useEffect(() => {
        if (!initialPartnerId || threads.length === 0) return;

        const thread = threads.find(t =>
            t.partner_id === initialPartnerId &&
            (!initialCampaignId || t.campaign_id === initialCampaignId)
        ) ?? threads.find(t => t.partner_id === initialPartnerId);

        if (thread && (!selectedThread || selectedThread.partner_id !== thread.partner_id || selectedThread.campaign_id !== thread.campaign_id)) {
            loadConversation(thread);
        }
    }, [initialPartnerId, initialCampaignId, threads, loadConversation, selectedThread]);

    // Mark all messages as read on mount
    useEffect(() => {
        const markAllReadAndRefresh = async () => {
            await supabase.from('messages').update({ read: true }).eq('receiver_id', currentUserId).eq('read', false);
            window.dispatchEvent(new Event('inbox:read'));
            await onRefreshThreads();
        };
        markAllReadAndRefresh();
    }, [currentUserId, supabase, onRefreshThreads]);

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
        <div className="flex flex-col flex-1 overflow-hidden h-full">
            <div className="dash-header mb-4 flex-shrink-0">
                <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">Campaign-scoped conversations with creators.</p>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[300px_1fr] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                {/* Thread List */}
                <div className="border-r md:border-r border-b md:border-b-0 border-[#E5E5DF] flex flex-col min-h-0">
                    <div className="px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium flex-shrink-0">
                        Conversations
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-4 text-xs text-[#888880]">Loading...</div>
                        ) : threads.length === 0 ? (
                            <div className="px-4 py-4 text-xs text-[#888880]">No conversations yet. Accept an application to start chatting.</div>
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
                                                    <div className="text-[10px] text-[#5E7A0A] font-medium truncate mt-0.5 uppercase tracking-[0.04em]">{thread.campaign_title}</div>
                                                )}
                                                <div className="text-xs text-[#888880] truncate mt-0.5">{thread.last_message}</div>
                                            </div>
                                            <span className="text-[10px] text-[#888880] ml-2 flex-shrink-0">{new Date(thread.last_at).toLocaleDateString()}</span>
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
                            <div className="px-4 py-3 border-b border-[#E5E5DF] flex items-center gap-3 flex-shrink-0 bg-white">
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
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {conversationLoading ? (
                                    <div className="text-sm text-[#888880]">Loading...</div>
                                ) : conversation.length === 0 ? (
                                    <div className="text-sm text-[#888880]">No messages yet.</div>
                                ) : (
                                    conversation.map(msg => (
                                        <div key={msg.id} className={`max-w-[85%] sm:max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed ${
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
                            <div className="border-t border-[#E5E5DF] p-3 flex gap-2.5 flex-shrink-0 bg-white">
                                <input ref={inputRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                                       onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                       placeholder="Type a message..."
                                       className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none focus:border-[#0D0D0B] transition-colors" />
                                <button onClick={handleSendReply} disabled={!replyText.trim()}
                                        className="bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.04em] disabled:opacity-50 flex-shrink-0">
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-[#888880]">Select a conversation to read</div>
                    )}
                </div>
            </div>
            <span style={{ display: 'none' }}>{onRefreshThreads.toString()}</span>
        </div>
    );
}