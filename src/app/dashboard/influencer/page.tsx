// src/app/dashboard/influencer/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';

type SubView = 'profile' | 'projects' | 'inbox';

function InfluencerDashboardInner() {
    const { user, profile, signOut } = useAuth();
    const [activeSub, setActiveSub] = useState<SubView>('profile');
    const inboxUnreadCount = 2; // static for now

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">
            {/* Sidebar */}
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
                    <button
                        onClick={() => setActiveSub('profile')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'profile'
                                ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]'
                                : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◎</span>
                        My Profile
                    </button>

                    <button
                        onClick={() => setActiveSub('projects')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'projects'
                                ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]'
                                : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◈</span>
                        My Projects
                    </button>

                    <button
                        onClick={() => setActiveSub('inbox')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'inbox'
                                ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]'
                                : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◻</span>
                        Inbox
                        {inboxUnreadCount > 0 && (
                            <span className="badge-count ml-auto bg-[#0D0D0B] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {inboxUnreadCount}
              </span>
                        )}
                    </button>
                </nav>

                <div className="sidebar-user mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="name text-sm font-medium">
                        {profile?.full_name || 'Ayesha Noor'}
                    </div>
                    <div className="email text-[11px] text-[#888880]">
                        {profile?.email || 'ayesha@email.com'}
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="logout text-[11px] text-[#888880] underline mt-1.5 inline-block"
                    >
                        ← Back to site
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="dash-content bg-[#F6F6F2] flex-1 p-10 overflow-y-auto">
                {activeSub === 'profile' && <ProfileSection />}
                {activeSub === 'projects' && <ProjectsSection />}
                {activeSub === 'inbox' && <InboxSection />}
            </main>
        </div>
    );
}

// Wrap with role guard
export default function InfluencerDashboard() {
    return (
        <DashboardRoleGuard roleParam="influencer">
            <InfluencerDashboardInner />
        </DashboardRoleGuard>
    );
}

/* ─── Profile Sub‑View (unchanged) ─── */
function ProfileSection() {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Profile</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Complete your profile to start applying for campaigns. Brands will see this.
                </p>
            </div>

            <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3.5 mb-6 text-sm flex justify-between items-center">
                <span>⚠ Your profile is 45% complete. Complete it to unlock more campaigns.</span>
                <div className="progress-bar w-40 h-1 bg-[#F0F0EA] rounded">
                    <div className="progress-fill bg-[#0D0D0B] h-1 rounded w-[45%]"></div>
                </div>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">
                    Personal Information
                </h3>
                <div className="profile-avatar-row flex items-center gap-5 mb-6">
                    <div className="profile-avatar-box w-18 h-18 bg-[#E8E8E2] rounded-full flex items-center justify-center font-['Playfair_Display'] text-2xl font-bold text-[#3A3A36] border border-dashed border-[#C0C0B8]">
                        AN
                    </div>
                    <div>
                        <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]">
                            Upload Photo
                        </button>
                        <p className="text-xs text-[#888880] mt-1.5">JPG or PNG · Max 2MB</p>
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Full Name</label>
                        <input defaultValue="Ayesha Noor" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Display Name / Handle</label>
                        <input defaultValue="@ayeshanoor" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">City</label>
                        <input defaultValue="Karachi" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Phone (WhatsApp)</label>
                        <input placeholder="+92 300 000 0000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Bio (200 chars max)</label>
                    <textarea
                        placeholder="Tell brands about yourself and what you create..."
                        className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm resize-none min-h-[80px]"
                    ></textarea>
                </div>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">
                    Social Media & Reach
                </h3>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Instagram Handle</label>
                        <input placeholder="@handle" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Instagram Followers</label>
                        <input placeholder="e.g. 120000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">TikTok Handle</label>
                        <input placeholder="@handle" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">TikTok Followers</label>
                        <input placeholder="e.g. 80000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">YouTube Channel URL</label>
                        <input placeholder="https://youtube.com/..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">YouTube Subscribers</label>
                        <input placeholder="e.g. 45000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">
                    Niche & Rates
                </h3>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Primary Niche</label>
                        <select className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option>Fashion & Lifestyle</option>
                            <option>Tech & Gaming</option>
                            <option>Food & Travel</option>
                            <option>Fitness & Health</option>
                            <option>Beauty</option>
                            <option>Business & Finance</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Secondary Niche (optional)</label>
                        <select className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                            <option value="">— Select —</option>
                            <option>Fashion & Lifestyle</option>
                            <option>Food & Travel</option>
                        </select>
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Rate per Instagram Post (PKR)</label>
                        <input placeholder="e.g. 25000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Rate per Video (PKR)</label>
                        <input placeholder="e.g. 45000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-4">
                <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">
                    Save Draft
                </button>
                <button className="btn-primary bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em]">
                    Save Profile
                </button>
            </div>
        </>
    );
}

function ProjectsSection() {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Projects</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Campaigns you've applied to or are actively working on.
                </p>
            </div>
            <div className="flex justify-end mb-4">
                <Link
                    href="/marketplace"
                    className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]"
                >
                    Search for New Projects →
                </Link>
            </div>
            <div className="tab-row flex border-b border-[#E5E5DF] mb-6">
                <button className="tab-btn active px-5 py-2.5 border-b-2 border-[#0D0D0B] text-[#0D0D0B] font-medium text-xs uppercase tracking-[0.06em]">All (3)</button>
                <button className="tab-btn px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#888880] hover:text-[#0D0D0B] border-b-2 border-transparent hover:border-[#0D0D0B]">Applied (1)</button>
                <button className="tab-btn px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#888880] hover:text-[#0D0D0B] border-b-2 border-transparent hover:border-[#0D0D0B]">Active (1)</button>
                <button className="tab-btn px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#888880] hover:text-[#0D0D0B] border-b-2 border-transparent hover:border-[#0D0D0B]">Completed (1)</button>
            </div>

            <div className="project-list flex flex-col gap-3">
                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">Summer Eid Collection Launch</h4>
                        <div className="brand-name text-xs text-[#888880]">Khaadi · Fashion</div>
                        <div className="tags flex gap-1.5 mt-2">
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">Instagram</span>
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">1 Reel</span>
                        </div>
                    </div>
                    <div className="text-right">
            <span className="status-badge status-review bg-[#EEF2FF] text-[#3040A0] px-2.5 py-1 rounded text-[10px] uppercase font-medium">
              Under Review
            </span>
                        <div className="text-xs text-[#888880] mt-1.5">Applied 2 days ago</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Rs. 35,000</div>
                    </div>
                </div>

                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">New Smartphone Launch TikTok Campaign</h4>
                        <div className="brand-name text-xs text-[#888880]">Tecno Mobile · Tech</div>
                        <div className="tags flex gap-1.5 mt-2">
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">TikTok</span>
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">3 Videos</span>
                        </div>
                    </div>
                    <div className="text-right">
            <span className="status-badge status-live bg-[#E1F7EE] text-[#0A5A38] px-2.5 py-1 rounded text-[10px] uppercase font-medium">
              Active
            </span>
                        <div className="text-xs text-[#888880] mt-1.5">Deadline: Aug 15</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Rs. 60,000</div>
                    </div>
                </div>

                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">Ramzan Recipe Series</h4>
                        <div className="brand-name text-xs text-[#888880]">Nestlé Pakistan · Food</div>
                        <div className="tags flex gap-1.5 mt-2">
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">YouTube</span>
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">4 Videos</span>
                        </div>
                    </div>
                    <div className="text-right">
            <span className="status-badge status-approved bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">
              Completed ✓
            </span>
                        <div className="text-xs text-[#888880] mt-1.5">Paid Apr 2025</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Rs. 80,000</div>
                    </div>
                </div>
            </div>
        </>
    );
}

function InboxSection() {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">
                    Your direct messages with brands and HYIPE team.
                </p>
            </div>

            <div className="inbox-layout grid grid-cols-[280px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto">
                    <div className="inbox-list-header px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">
                        Conversations
                    </div>

                    <div className="inbox-item active px-4 py-3 bg-[#F6F6F2] border-b border-[#E5E5DF] cursor-pointer">
                        <div className="sender flex justify-between text-sm font-medium">
              <span>
                <span className="unread-dot w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1"></span>
                Tecno Mobile
              </span>
                            <span className="text-[10px] text-[#888880] font-normal">2h ago</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">
                            Re: Smartphone Launch TikTok
                        </div>
                        <div className="preview text-xs text-[#888880] truncate">
                            Hey, can you send us the first draft by...
                        </div>
                    </div>

                    <div className="inbox-item px-4 py-3 border-b border-[#E5E5DF] cursor-pointer hover:bg-[#F6F6F2]">
                        <div className="sender flex justify-between text-sm font-medium">
                            <span>HYIPE Admin</span>
                            <span className="text-[10px] text-[#888880] font-normal">1d ago</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">System</div>
                        <div className="preview text-xs text-[#888880] truncate">
                            Your application to Khaadi has been receiv...
                        </div>
                    </div>

                    <div className="inbox-item px-4 py-3 border-b border-[#E5E5DF] cursor-pointer hover:bg-[#F6F6F2]">
                        <div className="sender flex justify-between text-sm font-medium">
              <span>
                <span className="unread-dot w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1"></span>
                Nestlé Pakistan
              </span>
                            <span className="text-[10px] text-[#888880] font-normal">3d ago</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">
                            Re: Ramzan Recipe Series
                        </div>
                        <div className="preview text-xs text-[#888880] truncate">
                            Payment has been released. Thank you for...
                        </div>
                    </div>
                </div>

                <div className="chat-pane flex flex-col">
                    <div className="chat-header px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3">
                        <div className="avatar w-9 h-9 rounded-full bg-[#E8E8E2] flex items-center justify-center text-sm font-medium">
                            TM
                        </div>
                        <div>
                            <strong className="text-sm block">Tecno Mobile</strong>
                            <span className="text-[11px] text-[#888880]">
                Smartphone Launch TikTok Campaign · Active
              </span>
                        </div>
                    </div>

                    <div className="chat-messages flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Hi Ayesha! Excited to be working with you on this campaign. The brief has been unlocked — please review and let us know if you have questions.
                            <div className="msg-meta text-[10px] text-[#888880] mt-1">Tecno Mobile · 10:22 AM</div>
                        </div>

                        <div className="msg me bg-[#0D0D0B] text-white self-end max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Thank you! I've gone through the brief. I'll have the first concept ready by Wednesday.
                            <div className="msg-meta text-[10px] text-white/40 mt-1 text-right">You · 11:05 AM</div>
                        </div>

                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Perfect. Can you send us the first draft video by Thursday so we have time for revisions?
                            <div className="msg-meta text-[10px] text-[#888880] mt-1">Tecno Mobile · 11:30 AM</div>
                        </div>
                    </div>

                    <div className="chat-input border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5">
                        <input
                            placeholder="Type a message..."
                            className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none"
                        />
                        <button className="chat-send bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em]">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}