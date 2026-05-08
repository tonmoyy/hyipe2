// src/app/dashboard/brand/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';

type SubView = 'profile' | 'campaigns' | 'inbox';

function BrandDashboardInner() {
    const { user, profile, signOut } = useAuth();
    const [activeSub, setActiveSub] = useState<SubView>('profile');
    const [showCampModal, setShowCampModal] = useState(false);
    const [showCampSuccess, setShowCampSuccess] = useState(false);

    const openCampModal = () => setShowCampModal(true);
    const closeCampModal = () => setShowCampModal(false);
    const handleCampaignSubmit = () => {
        setShowCampModal(false);
        setShowCampSuccess(true);
    };
    const closeCampSuccess = () => {
        setShowCampSuccess(false);
        setActiveSub('campaigns');
    };

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">
            {/* Sidebar */}
            <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0">
                <div className="sidebar-brand px-6 mb-8">
                    <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">
                        HYIPE
                    </Link>
                    <span className="role-pill text-[9px] uppercase text-white bg-[#5E7A0A] px-1.5 py-0.5 rounded-full inline-block mt-1">
            Brand
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
                        Brand Profile
                    </button>

                    <button
                        onClick={() => setActiveSub('campaigns')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'campaigns'
                                ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]'
                                : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◈</span>
                        My Campaigns
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
                    </button>
                </nav>

                <div className="sidebar-user mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="name text-sm font-medium">
                        {profile?.full_name || 'Khaadi Pakistan'}
                    </div>
                    <div className="email text-[11px] text-[#888880]">
                        {profile?.email || 'marketing@khaadi.com'}
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
                {activeSub === 'profile' && <BrandProfileSection />}
                {activeSub === 'campaigns' && (
                    <CampaignsSection openCampModal={openCampModal} />
                )}
                {activeSub === 'inbox' && <BrandInboxSection />}
            </main>

            {/* Campaign modal */}
            {showCampModal && (
                <div className="modal-overlay open fixed inset-0 bg-black/45 z-[200] flex items-center justify-center">
                    <div className="modal-box bg-white rounded p-9 max-w-[560px] w-[90%] max-h-[85vh] overflow-y-auto">
                        <h2 className="font-['Playfair_Display'] text-2xl mb-1">Post a New Campaign</h2>
                        <p className="text-xs text-[#888880] mb-6">Fill in your campaign brief. It will be reviewed by HYIPE before going live.</p>
                        <div className="form-group mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Campaign Title</label>
                            <input placeholder="e.g. Summer Eid Collection Launch" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                        </div>
                        <div className="form-row grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Niche / Category</label>
                                <select className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                                    <option>Fashion & Lifestyle</option>
                                    <option>Tech & Gaming</option>
                                    <option>Food & Travel</option>
                                    <option>Fitness</option>
                                    <option>Beauty</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Primary Platform</label>
                                <select className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
                                    <option>Instagram</option>
                                    <option>TikTok</option>
                                    <option>YouTube</option>
                                    <option>Multiple</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Budget (PKR)</label>
                                <input placeholder="e.g. 50000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                            <div className="form-group">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Deliverable</label>
                                <input placeholder="e.g. 1 Reel, 3 TikToks" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                        </div>
                        <div className="form-group mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Campaign Brief</label>
                            <textarea className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]" placeholder="Describe what you need, the tone, references, product details..."></textarea>
                        </div>
                        <div className="form-row grid grid-cols-2 gap-4 mb-4">
                            <div className="form-group">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Minimum Followers</label>
                                <input placeholder="e.g. 50000" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                            <div className="form-group">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Application Deadline</label>
                                <input type="date" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                            </div>
                        </div>
                        <div className="form-group mb-4">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Creator Requirements</label>
                            <textarea placeholder="e.g. Must be based in Pakistan..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[100px]"></textarea>
                        </div>
                        <hr className="border-t border-[#E5E5DF] my-5" />
                        <div className="flex justify-end gap-2.5">
                            <button onClick={closeCampModal} className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Cancel</button>
                            <button onClick={handleCampaignSubmit} className="btn-primary bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em]">Submit for Review →</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign success overlay */}
            {showCampSuccess && (
                <div className="success-overlay open fixed inset-0 bg-black/50 z-[300] flex items-center justify-center">
                    <div className="success-box bg-white rounded p-12 text-center max-w-[400px]">
                        <div className="check w-14 h-14 border-2 border-[#0D0D0B] rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">✓</div>
                        <h2 className="font-['Playfair_Display'] text-2xl mb-2.5">Campaign Submitted!</h2>
                        <p className="text-sm text-[#3A3A36] mb-6">Your campaign has been submitted for review and will be posted in the marketplace once approved by the HYIPE team. This usually takes 1–2 business days.</p>
                        <p className="text-xs text-[#888880] mb-5">You'll receive a notification via email and inbox when it goes live.</p>
                        <button onClick={closeCampSuccess} className="btn-primary bg-[#0D0D0B] text-white w-full py-2.5 text-xs uppercase tracking-[0.06em]">Back to My Campaigns</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// The actual page export, wrapped in the role guard
export default function BrandDashboard() {
    return (
        <DashboardRoleGuard roleParam="brand">
            <BrandDashboardInner />
        </DashboardRoleGuard>
    );
}

/* ─── Sub‑view components (unchanged) ─── */
function BrandProfileSection() {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Brand Profile</h1>
                <p className="text-sm text-[#888880] mt-1">
                    This information will be visible to creators when viewing your campaigns.
                </p>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Brand Identity</h3>
                <div className="profile-avatar-row flex items-center gap-5 mb-6">
                    <div className="profile-avatar-box w-18 h-18 bg-[#E8E8E2] rounded flex items-center justify-center font-['Playfair_Display'] text-base font-bold text-[#3A3A36] border border-dashed border-[#C0C0B8]" style={{ borderRadius: '4px' }}>K</div>
                    <div>
                        <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]">Upload Logo</button>
                        <p className="text-xs text-[#888880] mt-1.5">PNG with transparent background preferred</p>
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Brand / Company Name</label>
                        <input defaultValue="Khaadi Pakistan" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Industry</label>
                        <select className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm bg-white">
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
                        <input defaultValue="https://khaadi.com" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Contact Person</label>
                        <input placeholder="Name of marketing contact" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Brand Description</label>
                    <textarea placeholder="Tell creators about your brand, values and audience..." className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm resize-none min-h-[80px]"></textarea>
                </div>
            </div>

            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Verification & Trust</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">National Tax Number (NTN)</label>
                        <input placeholder="For verified badge" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">EasyPaisa / JazzCash Number</label>
                        <input placeholder="For escrow payments" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                <div className="bg-[#F0F0EA] rounded p-3.5 text-xs text-[#3A3A36]">
                    ℹ Verified brands get a blue checkmark on campaigns and are trusted more by creators. Verification takes 1-2 business days.
                </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-4">
                <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Save Draft</button>
                <button className="btn-primary bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em]">Save Profile</button>
            </div>
        </>
    );
}

function CampaignsSection({ openCampModal }: { openCampModal: () => void }) {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">My Campaigns</h1>
                <p className="text-sm text-[#888880] mt-1">Create, manage, and track your influencer campaigns.</p>
            </div>
            <div className="flex justify-end mb-4">
                <button onClick={openCampModal} className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">+ Post a New Campaign</button>
            </div>
            <div className="tab-row flex border-b border-[#E5E5DF] mb-6">
                <button className="tab-btn active px-5 py-2.5 border-b-2 border-[#0D0D0B] text-[#0D0D0B] font-medium text-xs uppercase tracking-[0.06em]">All (3)</button>
                <button className="tab-btn px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#888880] hover:text-[#0D0D0B] border-b-2 border-transparent hover:border-[#0D0D0B]">In Review (1)</button>
                <button className="tab-btn px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#888880] hover:text-[#0D0D0B] border-b-2 border-transparent hover:border-[#0D0D0B]">Live (1)</button>
                <button className="tab-btn px-5 py-2.5 text-xs uppercase tracking-[0.06em] text-[#888880] hover:text-[#0D0D0B] border-b-2 border-transparent hover:border-[#0D0D0B]">Completed (1)</button>
            </div>

            <div className="project-list flex flex-col gap-3">
                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">Summer Eid Collection Launch</h4>
                        <div className="brand-name text-xs text-[#888880]">Posted Jun 10 · 14 Applications</div>
                        <div className="tags flex gap-1.5 mt-2">
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">Instagram</span>
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">Fashion</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="status-badge status-live bg-[#E1F7EE] text-[#0A5A38] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Live ✓</span>
                        <div className="text-xs text-[#888880] mt-1.5">Deadline: Jul 30</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Budget: Rs. 100,000</div>
                    </div>
                </div>

                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">Back to School Accessories Campaign</h4>
                        <div className="brand-name text-xs text-[#888880]">Submitted Jun 12 · Awaiting approval</div>
                        <div className="tags flex gap-1.5 mt-2">
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">TikTok</span>
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">Lifestyle</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="status-badge status-pending bg-[#FFF8E6] text-[#7A5200] px-2.5 py-1 rounded text-[10px] uppercase font-medium">In Review</span>
                        <div className="text-xs text-[#888880] mt-1.5">Est. 1-2 days</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Budget: Rs. 50,000</div>
                    </div>
                </div>

                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">Winter Pret Launch 2024</h4>
                        <div className="brand-name text-xs text-[#888880]">Completed Dec 2024 · 3 Creators hired</div>
                        <div className="tags flex gap-1.5 mt-2">
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">Instagram</span>
                            <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">YouTube</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="status-badge status-approved bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Completed ✓</span>
                        <div className="text-xs text-[#888880] mt-1.5">Dec 2024</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Rs. 240,000 paid</div>
                    </div>
                </div>
            </div>
        </>
    );
}

function BrandInboxSection() {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">Messages from creators and HYIPE support.</p>
            </div>

            <div className="inbox-layout grid grid-cols-[280px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto">
                    <div className="inbox-list-header px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">Conversations</div>

                    <div className="inbox-item active px-4 py-3 bg-[#F6F6F2] border-b border-[#E5E5DF] cursor-pointer">
                        <div className="sender flex justify-between text-sm font-medium">
                            <span>Ayesha Noor</span>
                            <span className="text-[10px] text-[#888880] font-normal">2h ago</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">Re: Smartphone Launch TikTok</div>
                        <div className="preview text-xs text-[#888880] truncate">Thank you! I'll have the first concept...</div>
                    </div>

                    <div className="inbox-item px-4 py-3 border-b border-[#E5E5DF] cursor-pointer hover:bg-[#F6F6F2]">
                        <div className="sender flex justify-between text-sm font-medium">
              <span>
                <span className="unread-dot w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1"></span>
                HYIPE Admin
              </span>
                            <span className="text-[10px] text-[#888880] font-normal">1d ago</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">Campaign Approved</div>
                        <div className="preview text-xs text-[#888880] truncate">Your Summer Eid campaign is now live on...</div>
                    </div>
                </div>

                <div className="chat-pane flex flex-col">
                    <div className="chat-header px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3">
                        <div className="avatar w-9 h-9 rounded-full bg-[#E8E8E2] flex items-center justify-center text-sm font-medium">AN</div>
                        <div>
                            <strong className="text-sm block">Ayesha Noor</strong>
                            <span className="text-[11px] text-[#888880]">Summer Eid Collection Launch · Active</span>
                        </div>
                    </div>

                    <div className="chat-messages flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Hi! I've reviewed the brief. Really love the direction. Can you clarify the color palette preference for the shoot?
                            <div className="msg-meta text-[10px] text-[#888880] mt-1">Ayesha Noor · 9:15 AM</div>
                        </div>

                        <div className="msg me bg-[#0D0D0B] text-white self-end max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Hi Ayesha! We're going for muted earth tones — beige, dusty rose, olive green. Our lookbook is attached in the brief.
                            <div className="msg-meta text-[10px] text-white/40 mt-1 text-right">You · 9:45 AM</div>
                        </div>

                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Perfect, that's very helpful. I'll send the first look for approval before shooting.
                            <div className="msg-meta text-[10px] text-[#888880] mt-1">Ayesha Noor · 10:02 AM</div>
                        </div>
                    </div>

                    <div className="chat-input border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5">
                        <input placeholder="Type a message..." className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none" />
                        <button className="chat-send bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em]">Send</button>
                    </div>
                </div>
            </div>
        </>
    );
}