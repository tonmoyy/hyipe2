// src/app/dashboard/brand/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';
import { createClient } from '@/lib/supabaseClient';

// ---------- Types ----------
type SubView = 'profile' | 'campaigns' | 'inbox' | 'applications';

type CampaignInsert = {
    title: string;
    niche: string;
    platform: string;
    budget: number;
    deliverable: string;
    brief: string;
    min_followers: number;
    deadline: string | null;
    requirements: string;
    brand_id: string;
    status: string;
};

type Campaign = {
    id: string;
    title: string;
    niche: string;
    budget: number;
    status: string;
    deadline: string;
    applications_count: number;
};

type BrandFormType = {
    company_name: string;
    industry: string;
    website: string;
    contact_person: string;
    description: string;
    ntn: string;
    payment_number: string;
};

type CampaignFormType = {
    title: string;
    niche: string;
    platform: string;
    budget: string;
    deliverable: string;
    brief: string;
    min_followers: string;
    deadline: string;
    requirements: string;
};

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read: boolean;
};

type Application = {
    id: string;
    campaign_id: string;
    influencer_id: string;
    pitch: string;
    status: string;
    influencer: { full_name: string; email: string };
    campaign: { title: string };
};

// ---------- Defaults ----------
const defaultBrandForm: BrandFormType = {
    company_name: '', industry: '', website: '',
    contact_person: '', description: '', ntn: '', payment_number: '',
};

const defaultCampaignForm: CampaignFormType = {
    title: '', niche: '', platform: '', budget: '',
    deliverable: '', brief: '', min_followers: '', deadline: '', requirements: '',
};

// ---------- Main Component ----------
function BrandDashboardInner() {
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();
    const [activeSub, setActiveSub] = useState<SubView>('profile');

    const [brandForm, setBrandForm] = useState<BrandFormType>(defaultBrandForm);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [showCampModal, setShowCampModal] = useState(false);
    const [showCampSuccess, setShowCampSuccess] = useState(false);
    const [campaignForm, setCampaignForm] = useState<CampaignFormType>(defaultCampaignForm);
    const [submittingCampaign, setSubmittingCampaign] = useState(false);

    // Populate brand name from profile
    useEffect(() => {
        if (!profile) return;
        setBrandForm(prev => ({ ...prev, company_name: profile.full_name ?? '' }));
    }, [profile]);

    // ---------- Data Fetching ----------
    const fetchCampaigns = useCallback(async () => {
        if (!user) return;
        setLoadingCampaigns(true);
        const { data } = await supabase
            .from('campaigns')
            .select('*, applications(count)')
            .eq('brand_id', user.id)
            .order('created_at', { ascending: false });

        const normalised: Campaign[] = (data ?? []).map((row: any) => ({
            id: row.id,
            title: row.title,
            niche: row.niche,
            budget: row.budget,
            status: row.status,
            deadline: row.deadline,
            applications_count: Array.isArray(row.applications)
                ? row.applications[0]?.count ?? 0
                : 0,
        }));
        setCampaigns(normalised);
        setLoadingCampaigns(false);
    }, [user, supabase]);

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoadingMessages(true);
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', user.id)
            .order('created_at', { ascending: false });
        setMessages((data as Message[]) ?? []);
        setLoadingMessages(false);
    }, [user, supabase]);

    const fetchApplications = useCallback(async () => {
        if (!user) return;
        setLoadingApplications(true);
        const campaignIds = campaigns.map(c => c.id);
        if (campaignIds.length === 0) {
            setApplications([]);
            setLoadingApplications(false);
            return;
        }
        const { data } = await supabase
            .from('applications')
            .select(
                'id, campaign_id, influencer_id, pitch, status, influencer:profiles!applications_influencer_id_fkey(full_name, email), campaign:campaigns(title)'
            )
            .in('campaign_id', campaignIds)
            .order('created_at', { ascending: false });
        setApplications((data as Application[]) ?? []);
        setLoadingApplications(false);
    }, [user, supabase, campaigns]);

    useEffect(() => {
        if (activeSub === 'campaigns') fetchCampaigns();
    }, [activeSub, fetchCampaigns]);

    useEffect(() => {
        if (activeSub === 'inbox') fetchMessages();
    }, [activeSub, fetchMessages]);

    useEffect(() => {
        if (activeSub === 'applications') {
            fetchCampaigns().then(() => {});
            fetchApplications();
        }
    }, [activeSub, fetchCampaigns, fetchApplications]);

    // ---------- Handlers ----------
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
            title: campaignForm.title,
            niche: campaignForm.niche,
            platform: campaignForm.platform,
            budget: Number(campaignForm.budget) || 0,
            deliverable: campaignForm.deliverable,
            brief: campaignForm.brief,
            min_followers: Number(campaignForm.min_followers) || 0,
            deadline: campaignForm.deadline || null,
            requirements: campaignForm.requirements,
            brand_id: user.id,
            status: 'under_review',
        };

        const { error } = await supabase.from('campaigns').insert(payload);
        if (error) {
            console.error('Campaign insert error:', error);
            alert(error.message);
            setSubmittingCampaign(false);
            return;
        }

        await fetchCampaigns();
        setSubmittingCampaign(false);
        setCampaignForm(defaultCampaignForm);
        setShowCampModal(false);
        setShowCampSuccess(true);
    };

    const handleAcceptApplication = async (appId: string) => {
        const { error } = await supabase
            .from('applications')
            .update({ status: 'accepted' })
            .eq('id', appId);
        if (!error) fetchApplications();
    };

    const handleRejectApplication = async (appId: string) => {
        const { error } = await supabase
            .from('applications')
            .update({ status: 'rejected' })
            .eq('id', appId);
        if (!error) fetchApplications();
    };

    const inboxUnreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">
            {/* ---------- Sidebar ---------- */}
            <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0">
                <div className="sidebar-brand px-6 mb-8">
                    <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">
                        HYIPE
                    </Link>
                    <span className="text-[9px] uppercase text-white bg-[#5E7A0A] px-1.5 py-0.5 rounded-full inline-block mt-1">
            Brand
          </span>
                </div>

                <nav className="sidebar-nav flex-1 px-3">
                    {([
                        { key: 'profile', icon: '◎', label: 'Brand Profile' },
                        { key: 'campaigns', icon: '◈', label: 'My Campaigns' },
                        { key: 'applications', icon: '📋', label: 'Applications' },   // NEW
                        { key: 'inbox', icon: '◻', label: 'Inbox' },
                    ] as { key: SubView; icon: string; label: string }[]).map(({ key, icon, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveSub(key)}
                            className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                                activeSub === key
                                    ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]'
                                    : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                            }`}
                        >
                            <span className="text-[13px] opacity-50">{icon}</span>
                            {label}
                            {key === 'inbox' && inboxUnreadCount > 0 && (
                                <span className="ml-auto bg-[#0D0D0B] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {inboxUnreadCount}
                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="text-sm font-medium">
                        {profile?.full_name || 'Khaadi Pakistan'}
                    </div>
                    <div className="text-[11px] text-[#888880]">
                        {user?.email || 'marketing@khaadi.com'}
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="text-[11px] text-[#888880] underline mt-1.5 inline-block"
                    >
                        ← Back to site
                    </button>
                </div>
            </aside>

            {/* ---------- Main Content ---------- */}
            <main className="dash-content bg-[#F6F6F2] flex-1 p-10 overflow-y-auto">
                {activeSub === 'profile' && (
                    <BrandProfileSection
                        form={brandForm}
                        setForm={setBrandForm}
                        onSave={handleSaveProfile}
                        saving={savingProfile}
                    />
                )}
                {activeSub === 'campaigns' && (
                    <CampaignsSection
                        campaigns={campaigns}
                        loading={loadingCampaigns}
                        openCampModal={() => setShowCampModal(true)}
                    />
                )}
                {activeSub === 'applications' && (
                    <ApplicationsSection
                        applications={applications}
                        loading={loadingApplications}
                        onAccept={handleAcceptApplication}
                        onReject={handleRejectApplication}
                    />
                )}
                {activeSub === 'inbox' && (
                    <BrandInboxSection
                        messages={messages}
                        loading={loadingMessages}
                        selectedMessage={selectedMessage}
                        setSelectedMessage={setSelectedMessage}
                        onMessageRead={(id) =>
                            setMessages(prev =>
                                prev.map(m => (m.id === id ? { ...m, read: true } : m))
                            )
                        }
                    />
                )}
            </main>

            {/* ---------- Campaign Modal ---------- */}
            {showCampModal && (
                <div className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center">
                    <div className="bg-white rounded p-9 max-w-[560px] w-[90%] max-h-[85vh] overflow-y-auto">
                        <h2 className="font-['Playfair_Display'] text-2xl mb-1">Post a New Campaign</h2>
                        <p className="text-xs text-[#888880] mb-6">
                            Fill in your campaign brief. It will be reviewed by HYIPE before going live.
                        </p>

                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Campaign Title</label>
                            <input
                                value={campaignForm.title}
                                onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Summer Eid Collection Launch"
                                className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Niche / Category</label>
                                <select
                                    value={campaignForm.niche}
                                    onChange={e => setCampaignForm(p => ({ ...p, niche: e.target.value }))}
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white"
                                >
                                    {['Fashion & Lifestyle', 'Tech & Gaming', 'Food & Travel', 'Fitness', 'Beauty'].map(n => (
                                        <option key={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Primary Platform</label>
                                <select
                                    value={campaignForm.platform}
                                    onChange={e => setCampaignForm(p => ({ ...p, platform: e.target.value }))}
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white"
                                >
                                    {['Instagram', 'TikTok', 'YouTube', 'Multiple'].map(n => (
                                        <option key={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Budget (PKR)</label>
                                <input
                                    value={campaignForm.budget}
                                    onChange={e => setCampaignForm(p => ({ ...p, budget: e.target.value }))}
                                    placeholder="e.g. 50000"
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Deliverable</label>
                                <input
                                    value={campaignForm.deliverable}
                                    onChange={e => setCampaignForm(p => ({ ...p, deliverable: e.target.value }))}
                                    placeholder="e.g. 1 Reel, 3 TikToks"
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Campaign Brief</label>
                            <textarea
                                value={campaignForm.brief}
                                onChange={e => setCampaignForm(p => ({ ...p, brief: e.target.value }))}
                                placeholder="Describe what you need, tone, references..."
                                className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Minimum Followers</label>
                                <input
                                    value={campaignForm.min_followers}
                                    onChange={e => setCampaignForm(p => ({ ...p, min_followers: e.target.value }))}
                                    placeholder="e.g. 50000"
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Application Deadline</label>
                                <input
                                    type="date"
                                    value={campaignForm.deadline}
                                    onChange={e => setCampaignForm(p => ({ ...p, deadline: e.target.value }))}
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Creator Requirements</label>
                            <textarea
                                value={campaignForm.requirements}
                                onChange={e => setCampaignForm(p => ({ ...p, requirements: e.target.value }))}
                                placeholder="e.g. Must be based in Pakistan..."
                                className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]"
                            />
                        </div>
                        <hr className="border-t border-[#E5E5DF] my-5" />
                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={() => setShowCampModal(false)}
                                className="border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCampaignSubmit}
                                disabled={submittingCampaign}
                                className="bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50"
                            >
                                {submittingCampaign ? 'Submitting...' : 'Submit for Review →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ---------- Success Overlay ---------- */}
            {showCampSuccess && (
                <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center">
                    <div className="bg-white rounded p-12 text-center max-w-[400px]">
                        <div className="w-14 h-14 border-2 border-[#0D0D0B] rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">✓</div>
                        <h2 className="font-['Playfair_Display'] text-2xl mb-2.5">Campaign Submitted!</h2>
                        <p className="text-sm text-[#3A3A36] mb-6">
                            Your campaign has been submitted for review and will be posted in the marketplace once approved. This usually takes 1–2 business days.
                        </p>
                        <p className="text-xs text-[#888880] mb-5">
                            You'll receive a notification via email and inbox when it goes live.
                        </p>
                        <button
                            onClick={() => {
                                setShowCampSuccess(false);
                                setActiveSub('campaigns');
                            }}
                            className="bg-[#0D0D0B] text-white w-full py-2.5 text-xs uppercase tracking-[0.06em]"
                        >
                            Back to My Campaigns
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BrandDashboard() {
    return (
        <DashboardRoleGuard roleParam="brand">
            <BrandDashboardInner />
        </DashboardRoleGuard>
    );
}

// ─── Sub‑view components ───

/* ─── Brand Profile Section ─── */
function BrandProfileSection({
                                 form,
                                 setForm,
                                 onSave,
                                 saving,
                             }: {
    form: BrandFormType;
    setForm: React.Dispatch<React.SetStateAction<BrandFormType>>;
    onSave: () => void;
    saving: boolean;
}) {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Brand Profile</h1>
                <p className="text-sm text-[#888880] mt-1">
                    This information will be visible to creators when viewing your campaigns.
                </p>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">
                    Brand Identity
                </h3>
                <div className="profile-avatar-row flex items-center gap-5 mb-6">
                    <div
                        className="profile-avatar-box w-18 h-18 bg-[#E8E8E2] rounded flex items-center justify-center font-['Playfair_Display'] text-base font-bold text-[#3A3A36] border border-dashed border-[#C0C0B8]"
                        style={{ borderRadius: '4px' }}
                    >
                        {form.company_name?.charAt(0)?.toUpperCase() || 'K'}
                    </div>
                    <div>
                        <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]">
                            Upload Logo
                        </button>
                        <p className="text-xs text-[#888880] mt-1.5">PNG with transparent background preferred</p>
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Brand / Company Name</label>
                        <input
                            name="company_name"
                            value={form.company_name}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Industry</label>
                        <select
                            name="industry"
                            value={form.industry}
                            onChange={handleChange}
                            className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white"
                        >
                            <option value="">— Select —</option>
                            <option>Fashion & Apparel</option>
                            <option>Tech & Electronics</option>
                            <option>Food & Beverage</option>
                            <option>Health & Beauty</option>
                        </select>
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Official Website</label>
                        <input
                            name="website"
                            value={form.website}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Contact Person</label>
                        <input
                            name="contact_person"
                            value={form.contact_person}
                            onChange={handleChange}
                            placeholder="Name of marketing contact"
                            className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Brand Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Tell creators about your brand, values and audience..."
                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm resize-none min-h-[80px]"
                    />
                </div>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">
                    Verification & Trust
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">National Tax Number (NTN)</label>
                        <input
                            name="ntn"
                            value={form.ntn}
                            onChange={handleChange}
                            placeholder="For verified badge"
                            className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                        />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">EasyPaisa / JazzCash Number</label>
                        <input
                            name="payment_number"
                            value={form.payment_number}
                            onChange={handleChange}
                            placeholder="For escrow payments"
                            className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                        />
                    </div>
                </div>
                <div className="bg-[#F0F0EA] rounded p-3.5 text-xs text-[#3A3A36]">
                    ℹ Verified brands get a blue checkmark on campaigns and are trusted more by creators. Verification takes 1-2 business days.
                </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-4">
                <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">
                    Save Draft
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="btn-primary bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </>
    );
}

/* ─── Campaigns Section ─── */
function CampaignsSection({
                              campaigns,
                              loading,
                              openCampModal,
                          }: {
    campaigns: Campaign[];
    loading: boolean;
    openCampModal: () => void;
}) {
    const [activeTab, setActiveTab] = useState<'all' | 'under_review' | 'live' | 'completed'>('all');

    const filtered =
        activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab);
    const count = (tab: string) =>
        tab === 'all' ? campaigns.length : campaigns.filter(c => c.status === tab).length;

    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            live: { bg: '#E1F7EE', text: '#0A5A38', label: 'Live ✓' },
            under_review: { bg: '#FFF8E6', text: '#7A5200', label: 'In Review' },
            completed: { bg: '#E8F5E0', text: '#2A6000', label: 'Completed ✓' },
        };
        const s = map[status] ?? { bg: '#F0F0EA', text: '#3A3A36', label: status };
        return (
            <span
                style={{ background: s.bg, color: s.text }}
                className="px-2.5 py-1 rounded text-[10px] uppercase font-medium"
            >
        {s.label}
      </span>
        );
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Campaigns</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Create, manage, and track your influencer campaigns.
                </p>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={openCampModal}
                    className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]"
                >
                    + Post a New Campaign
                </button>
            </div>

            <div className="tab-row flex border-b border-[#E5E5DF] mb-6">
                {(['all', 'under_review', 'live', 'completed'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-xs uppercase tracking-[0.06em] border-b-2 ${
                            activeTab === tab
                                ? 'border-[#0D0D0B] text-[#0D0D0B] font-medium'
                                : 'border-transparent text-[#888880] hover:text-[#0D0D0B] hover:border-[#0D0D0B]'
                        }`}
                    >
                        {tab.replace('_', ' ')} ({count(tab)})
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-sm text-[#888880] py-10 text-center">Loading campaigns...</p>
            ) : filtered.length === 0 ? (
                <div className="empty-state bg-white border border-dashed border-[#E5E5DF] rounded p-10 text-center">
                    <p className="text-sm text-[#888880]">No campaigns found.</p>
                </div>
            ) : (
                <div className="project-list flex flex-col gap-3">
                    {filtered.map(c => (
                        <div
                            key={c.id}
                            className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center"
                        >
                            <div>
                                <h4 className="text-sm font-medium">{c.title}</h4>
                                <div className="brand-name text-xs text-[#888880]">
                                    {c.applications_count} Applications · {c.niche}
                                </div>
                                <div className="tags flex gap-1.5 mt-2">
                  <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">
                    {c.niche}
                  </span>
                                </div>
                            </div>
                            <div className="text-right">
                                {statusBadge(c.status)}
                                {c.deadline && (
                                    <div className="text-xs text-[#888880] mt-1.5">
                                        Deadline: {new Date(c.deadline).toLocaleDateString()}
                                    </div>
                                )}
                                <div className="font-['Playfair_Display'] text-[15px] mt-1">
                                    Budget: Rs. {Number(c.budget).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/* ─── NEW: Applications Section ─── */
function ApplicationsSection({
                                 applications,
                                 loading,
                                 onAccept,
                                 onReject,
                             }: {
    applications: Application[];
    loading: boolean;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}) {
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
        return (
            <span style={{ background: s.bg, color: s.text }} className="px-2.5 py-1 rounded text-[10px] uppercase font-medium">
        {s.label}
      </span>
        );
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Applications</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Review and manage influencer applications for your campaigns.
                </p>
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
                                <div
                                    key={app.id}
                                    className="bg-white border border-[#E5E5DF] rounded p-4 flex justify-between items-center"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {app.influencer?.full_name || 'Influencer'}
                                        </div>
                                        <div className="text-xs text-[#888880]">{app.influencer?.email}</div>
                                        <div className="text-xs mt-1">
                                            <strong>Campaign:</strong> {app.campaign?.title}
                                        </div>
                                        <div className="text-xs mt-1 italic text-[#888880]">{app.pitch}</div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {statusBadge(app.status)}
                                        <button
                                            onClick={() => onAccept(app.id)}
                                            className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => onReject(app.id)}
                                            className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {acceptedApps.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-medium text-sm mb-3">Accepted ({acceptedApps.length})</h3>
                            {acceptedApps.map(app => (
                                <div
                                    key={app.id}
                                    className="bg-white border border-[#E5E5DF] rounded p-4 flex justify-between items-center mb-2"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {app.influencer?.full_name || 'Influencer'}
                                        </div>
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
                                <div
                                    key={app.id}
                                    className="bg-white border border-[#E5E5DF] rounded p-4 flex justify-between items-center mb-2"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {app.influencer?.full_name || 'Influencer'}
                                        </div>
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

/* ─── Brand Inbox Section ─── */
function BrandInboxSection({
                               messages,
                               loading,
                               selectedMessage,
                               setSelectedMessage,
                               onMessageRead,
                           }: {
    messages: Message[];
    loading: boolean;
    selectedMessage: Message | null;
    setSelectedMessage: (m: Message | null) => void;
    onMessageRead: (id: string) => void;
}) {
    const [replyText, setReplyText] = useState('');
    const supabase = createClient();
    const { user } = useAuth();

    const handleSelect = async (msg: Message) => {
        setSelectedMessage(msg);
        if (!msg.read) {
            await supabase.from('messages').update({ read: true }).eq('id', msg.id);
            onMessageRead(msg.id);
        }
    };

    const handleSend = async () => {
        if (!replyText.trim() || !selectedMessage) return;
        await supabase.from('messages').insert({
            sender_id: user!.id,
            receiver_id: selectedMessage.sender_id,
            content: replyText.trim(),
            read: false,
        });
        setReplyText('');
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Messages from creators and HYIPE support.
                </p>
            </div>

            <div className="inbox-layout grid grid-cols-[280px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto">
                    <div className="inbox-list-header px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">
                        Conversations
                    </div>
                    {loading ? (
                        <p className="px-4 py-4 text-xs text-[#888880]">Loading...</p>
                    ) : messages.length === 0 ? (
                        <p className="px-4 py-4 text-xs text-[#888880]">No messages yet.</p>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => handleSelect(msg)}
                                className={`px-4 py-3 border-b border-[#E5E5DF] cursor-pointer ${
                                    selectedMessage?.id === msg.id ? 'bg-[#F6F6F2]' : 'hover:bg-[#F6F6F2]'
                                }`}
                            >
                                <div className="flex justify-between text-sm font-medium">
                  <span>
                    {!msg.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1" />
                    )}
                      {msg.sender_id.slice(0, 8)}
                  </span>
                                    <span className="text-[10px] text-[#888880] font-normal">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                                </div>
                                <div className="text-xs text-[#888880] truncate mt-1">{msg.content}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="chat-pane flex flex-col">
                    {selectedMessage ? (
                        <>
                            <div className="chat-header px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3">
                                <div className="avatar w-9 h-9 rounded-full bg-[#E8E8E2] flex items-center justify-center text-sm font-medium">
                                    {selectedMessage.sender_id.slice(0, 2).toUpperCase()}
                                </div>
                                <strong className="text-sm">From: {selectedMessage.sender_id.slice(0, 8)}</strong>
                            </div>
                            <div className="chat-messages flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                                <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                                    {selectedMessage.content}
                                    <div className="msg-meta text-[10px] text-[#888880] mt-1">
                                        {new Date(selectedMessage.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="chat-input border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5">
                                <input
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim()}
                                    className="chat-send bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em] disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-[#888880]">
                            Select a conversation
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}