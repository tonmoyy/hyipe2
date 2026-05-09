// src/app/dashboard/influencer/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';
import { createClient } from '@/lib/supabaseClient';

type SubView = 'profile' | 'projects' | 'inbox';

type Application = {
    id: string;
    campaign_id: string;
    status: string;
    campaign: { title: string; brand: { full_name: string } };
};

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read: boolean;
};

type ProfileFormType = {
    full_name: string; display_name: string; city: string; phone: string;
    bio: string; ig_handle: string; ig_followers: string; tiktok_handle: string;
    tiktok_followers: string; yt_url: string; yt_subscribers: string;
    primary_niche: string; secondary_niche: string; rate_ig_post: string; rate_video: string;
};

const defaultForm: ProfileFormType = {
    full_name: '', display_name: '', city: '', phone: '', bio: '',
    ig_handle: '', ig_followers: '', tiktok_handle: '', tiktok_followers: '',
    yt_url: '', yt_subscribers: '', primary_niche: '', secondary_niche: '',
    rate_ig_post: '', rate_video: '',
};

function InfluencerDashboardInner() {
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();
    const [activeSub, setActiveSub] = useState<SubView>('profile');
    const [profileForm, setProfileForm] = useState<ProfileFormType>(defaultForm);
    const [applications, setApplications] = useState<Application[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    // ✅ Fix 1: only run when profile changes, use functional update to avoid stale closure
    useEffect(() => {
        if (!profile) return;
        setProfileForm(prev => ({ ...prev, full_name: profile.full_name ?? '' }));
    }, [profile]);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        await supabase.from('profiles').upsert({ id: user!.id, ...profileForm });
        setSavingProfile(false);
        alert('Profile saved');
    };

    // ✅ Fix 2: wrap fetch in useCallback, call it inside effect — avoids setState-in-effect lint error
    const fetchProjects = useCallback(async () => {
        if (!user) return;
        setLoadingProjects(true);
        const { data } = await supabase
            .from('applications')
            .select('id, campaign_id, status, campaign:campaigns(title, brand:profiles!campaigns_brand_id_fkey(full_name))')
            .eq('influencer_id', user.id);

        // ✅ Fix 3: normalise the Supabase nested shape to match Application type
        const normalised: Application[] = (data ?? []).map((row: any) => ({
            id: row.id,
            campaign_id: row.campaign_id,
            status: row.status,
            campaign: {
                title: Array.isArray(row.campaign) ? row.campaign[0]?.title : row.campaign?.title,
                brand: {
                    full_name: Array.isArray(row.campaign)
                        ? (Array.isArray(row.campaign[0]?.brand) ? row.campaign[0].brand[0]?.full_name : row.campaign[0]?.brand?.full_name)
                        : (Array.isArray(row.campaign?.brand) ? row.campaign.brand[0]?.full_name : row.campaign?.brand?.full_name),
                },
            },
        }));

        setApplications(normalised);
        setLoadingProjects(false);
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

    useEffect(() => {
        if (activeSub === 'projects') fetchProjects();
    }, [activeSub, fetchProjects]);

    useEffect(() => {
        if (activeSub === 'inbox') fetchMessages();
    }, [activeSub, fetchMessages]);

    const inboxUnreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">

            {/* ── Sidebar ── */}
            <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0">
                <div className="sidebar-brand px-6 mb-8">
                    <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">
                        HYIPE
                    </Link>
                    <span className="role-pill text-[9px] uppercase text-white bg-[#0D0D0B] px-1.5 py-0.5 rounded-full inline-block mt-1">
                        Creator
                    </span>
                </div>

                <nav className="sidebar-nav flex-1 px-3">
                    {([
                        { key: 'profile',  icon: '◎', label: 'My Profile'   },
                        { key: 'projects', icon: '◈', label: 'My Projects'  },
                        { key: 'inbox',    icon: '◻', label: 'Inbox'        },
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

                <div className="sidebar-user mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="text-sm font-medium">{profile?.full_name || 'Ayesha Noor'}</div>
                    <div className="text-[11px] text-[#888880]">{user?.email || 'ayesha@email.com'}</div>
                    <button onClick={() => signOut()} className="text-[11px] text-[#888880] underline mt-1.5 inline-block">
                        ← Back to site
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="dash-content bg-[#F6F6F2] flex-1 p-10 overflow-y-auto">
                {activeSub === 'profile' && (
                    <ProfileSection form={profileForm} setForm={setProfileForm} onSave={handleSaveProfile} saving={savingProfile} />
                )}
                {activeSub === 'projects' && (
                    <ProjectsSection applications={applications} loading={loadingProjects} />
                )}
                {activeSub === 'inbox' && (
                    <InboxSection
                        messages={messages}
                        loading={loadingMessages}
                        selectedMessage={selectedMessage}
                        setSelectedMessage={setSelectedMessage}
                        onMessageRead={(id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))}
                    />
                )}
            </main>
        </div>
    );
}

export default function InfluencerDashboard() {
    return (
        <DashboardRoleGuard roleParam="influencer">
            <InfluencerDashboardInner />
        </DashboardRoleGuard>
    );
}

/* ─── Profile Section ─── */
function ProfileSection({
                            form, setForm, onSave, saving,
                        }: {
    form: ProfileFormType;
    setForm: React.Dispatch<React.SetStateAction<ProfileFormType>>;
    onSave: () => void;
    saving: boolean;
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
                <p className="text-sm text-[#888880] mt-1">Complete your profile to start applying for campaigns. Brands will see this.</p>
            </div>

            <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3.5 mb-6 text-sm flex justify-between items-center">
                <span>⚠ Your profile is {completion}% complete. Complete it to unlock more campaigns.</span>
                <div className="w-40 h-1 bg-[#F0F0EA] rounded">
                    <div className="bg-[#0D0D0B] h-1 rounded" style={{ width: `${completion}%` }} />
                </div>
            </div>

            {/* Personal Information */}
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

            {/* Social Media */}
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

            {/* Niche & Rates */}
            <div className="bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Niche & Rates</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Primary Niche</label>
                        <select name="primary_niche" value={form.primary_niche} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option value="">— Select —</option>
                            {['Fashion & Lifestyle','Tech & Gaming','Food & Travel','Fitness & Health','Beauty','Business & Finance'].map(n => (
                                <option key={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Secondary Niche (optional)</label>
                        <select name="secondary_niche" value={form.secondary_niche} onChange={handleChange} className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option value="">— Select —</option>
                            {['Fashion & Lifestyle','Food & Travel'].map(n => (
                                <option key={n}>{n}</option>
                            ))}
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
    const [activeTab, setActiveTab] = useState<'all' | 'applied' | 'active' | 'completed'>('all');

    const statusMap: Record<string, string> = {
        applied: 'applied', under_review: 'applied',
        active: 'active', completed: 'completed',
    };

    const filtered = activeTab === 'all' ? applications : applications.filter(a => statusMap[a.status] === activeTab);
    const count = (tab: string) => tab === 'all' ? applications.length : applications.filter(a => statusMap[a.status] === tab).length;

    const statusBadge = (status: string) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            under_review: { bg: '#EEF2FF', text: '#3040A0', label: 'Under Review' },
            active:       { bg: '#E1F7EE', text: '#0A5A38', label: 'Active'       },
            completed:    { bg: '#E8F5E0', text: '#2A6000', label: 'Completed ✓'  },
        };
        const s = map[status] ?? { bg: '#F0F0EA', text: '#3A3A36', label: status };
        return <span style={{ background: s.bg, color: s.text }} className="px-2.5 py-1 rounded text-[10px] uppercase font-medium">{s.label}</span>;
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Projects</h1>
                <p className="text-sm text-[#888880] mt-1">Campaigns you've applied to or are actively working on.</p>
            </div>

            <div className="flex justify-end mb-4">
                <Link href="/marketplace" className="bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">
                    Search for New Projects →
                </Link>
            </div>

            <div className="flex border-b border-[#E5E5DF] mb-6">
                {(['all','applied','active','completed'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 text-xs uppercase tracking-[0.06em] border-b-2 ${
                                activeTab === tab
                                    ? 'border-[#0D0D0B] text-[#0D0D0B] font-medium'
                                    : 'border-transparent text-[#888880] hover:text-[#0D0D0B] hover:border-[#0D0D0B]'
                            }`}
                    >
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
                            <div className="text-right">{statusBadge(app.status)}</div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

/* ─── Inbox Section ─── */
function InboxSection({
                          messages, loading, selectedMessage, setSelectedMessage, onMessageRead,
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
            content: replyText,
            read: false,
        });
        setReplyText('');
    };

    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">Your direct messages with brands and HYIPE team.</p>
            </div>

            <div className="grid grid-cols-[280px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">

                {/* Message list */}
                <div className="border-r border-[#E5E5DF] overflow-y-auto">
                    <div className="px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">
                        Conversations
                    </div>
                    {loading ? (
                        <div className="px-4 py-4 text-xs text-[#888880]">Loading...</div>
                    ) : messages.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-[#888880]">No messages yet.</div>
                    ) : messages.map(msg => (
                        <div
                            key={msg.id}
                            onClick={() => handleSelect(msg)}
                            className={`px-4 py-3 border-b border-[#E5E5DF] cursor-pointer ${
                                selectedMessage?.id === msg.id ? 'bg-[#F6F6F2]' : 'hover:bg-[#F6F6F2]'
                            }`}
                        >
                            <div className="flex justify-between text-sm font-medium">
                                <span>
                                    {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1" />}
                                    {msg.sender_id}
                                </span>
                                <span className="text-[10px] text-[#888880] font-normal">
                                    {new Date(msg.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="text-xs text-[#888880] truncate mt-1">{msg.content}</div>
                        </div>
                    ))}
                </div>

                {/* Chat pane */}
                <div className="flex flex-col">
                    {selectedMessage ? (
                        <>
                            <div className="px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#E8E8E2] flex items-center justify-center text-sm font-medium">
                                    {selectedMessage.sender_id.slice(0, 2).toUpperCase()}
                                </div>
                                <strong className="text-sm">{selectedMessage.sender_id}</strong>
                            </div>
                            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                                <div className="bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                                    {selectedMessage.content}
                                    <div className="text-[10px] text-[#888880] mt-1">
                                        {new Date(selectedMessage.created_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5">
                                <input
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none"
                                />
                                <button onClick={handleSend} className="bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em]">
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
        </>
    );
}