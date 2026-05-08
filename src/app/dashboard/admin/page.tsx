// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import DashboardRoleGuard from '@/components/DashboardRoleGuard';

type SubView = 'users' | 'monitor' | 'inbox';

/* ─── Inner component ─── */
function AdminDashboardInner() {
    const { user, profile, signOut, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeSub, setActiveSub] = useState<SubView>(() => {
        const tabParam = searchParams?.get('tab') as SubView | null;
        return tabParam && ['users', 'monitor', 'inbox'].includes(tabParam)
            ? tabParam
            : 'users';
    });

    // Client‑side redirect (safety net – the layout already handles it)
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

    const switchTab = useCallback(
        (tab: SubView) => {
            setActiveSub(tab);
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            params.set('tab', tab);
            router.replace(`/dashboard/admin?${params.toString()}`, { scroll: false });
        },
        [searchParams, router]
    );

    // Access denied UI (still here for safety, but the role guard will catch it)
    if (authLoading || !user || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
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

    const pendingCampaigns = 3;

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">
            {/* Sidebar */}
            <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0">
                <div className="sidebar-brand px-6 mb-8">
                    <Link href="/public" className="logo font-['Playfair_Display'] text-lg font-bold">
                        HYIPE
                    </Link>
                    <span className="role-pill text-[9px] uppercase text-white bg-[#A32D2D] px-1.5 py-0.5 rounded-full inline-block mt-1">
            {profile?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
          </span>
                </div>

                <nav className="sidebar-nav flex-1 px-3">
                    <button
                        onClick={() => switchTab('users')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'users' ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◎</span>
                        User Management
                    </button>

                    <button
                        onClick={() => switchTab('monitor')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'monitor' ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◈</span>
                        Campaign Monitor
                        {pendingCampaigns > 0 && (
                            <span className="badge-count ml-auto bg-[#A32D2D] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {pendingCampaigns}
              </span>
                        )}
                    </button>

                    <button
                        onClick={() => switchTab('inbox')}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                            activeSub === 'inbox' ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                        }`}
                    >
                        <span className="nav-icon text-[13px] opacity-50">◻</span>
                        Inbox Viewer
                    </button>
                </nav>

                <div className="sidebar-user mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                    <div className="name text-sm font-medium">{profile?.full_name || 'Platform Admin'}</div>
                    <div className="email text-[11px] text-[#888880]">{profile?.email || 'admin@thehyipe.com'}</div>
                    <button onClick={() => signOut()} className="logout text-[11px] text-[#888880] underline mt-1.5 inline-block">
                        ← Back to site
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="dash-content bg-[#F6F6F2] flex-1 p-10 overflow-y-auto">
                {activeSub === 'users' && <UserManagementSection />}
                {activeSub === 'monitor' && <CampaignMonitorSection />}
                {activeSub === 'inbox' && <AdminInboxSection />}
            </main>
        </div>
    );
}

// Wrap with role guard for extra safety
export default function AdminDashboard() {
    return (
        <DashboardRoleGuard roleParam="admin">
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
                <AdminDashboardInner />
            </Suspense>
        </DashboardRoleGuard>
    );
}

/* ─── User Management Sub‑View ─── */
function UserManagementSection() {
    return (
        <>
            <div className="admin-top flex justify-between items-center mb-5">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">
                    User Management <span className="badge-count bg-[#0D0D0B] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1.5">24</span>
                </h2>
                <div className="flex gap-2">
                    <input placeholder="Search users..." className="border border-[#E5E5DF] px-3 py-2 rounded text-xs font-sans outline-none" />
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white outline-none">
                        <option>All Users</option>
                        <option>Brands</option>
                        <option>Creators</option>
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
                {/* Row 1 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm"><strong>Ayesha Noor</strong></td>
                    <td className="px-4 py-3 text-sm">ayesha@email.com</td>
                    <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">Creator</span></td>
                    <td className="px-4 py-3 text-sm">Jun 10, 2025</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-approved bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Active</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                    </td>
                </tr>
                {/* Row 2 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm"><strong>Khaadi Pakistan</strong></td>
                    <td className="px-4 py-3 text-sm">marketing@khaadi.com</td>
                    <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">Brand</span></td>
                    <td className="px-4 py-3 text-sm">Jun 8, 2025</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-approved bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Active</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                    </td>
                </tr>
                {/* Row 3 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm"><strong>Bilal Chaudhry</strong></td>
                    <td className="px-4 py-3 text-sm">bilalc@email.com</td>
                    <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">Creator</span></td>
                    <td className="px-4 py-3 text-sm">Jun 11, 2025</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-pending bg-[#FFF8E6] text-[#7A5200] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Pending</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Verify</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                    </td>
                </tr>
                {/* Row 4 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm"><strong>Tecno Mobile PK</strong></td>
                    <td className="px-4 py-3 text-sm">mktg@tecno.pk</td>
                    <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">Brand</span></td>
                    <td className="px-4 py-3 text-sm">Jun 9, 2025</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-approved bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Active</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                    </td>
                </tr>
                {/* Row 5 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm"><strong>Sara Baig</strong></td>
                    <td className="px-4 py-3 text-sm">sara@baigcreates.com</td>
                    <td className="px-4 py-3 text-sm"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">Creator</span></td>
                    <td className="px-4 py-3 text-sm">Jun 12, 2025</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-approved bg-[#E8F5E0] text-[#2A6000] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Active</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Remove</button>
                    </td>
                </tr>
                </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-[#888880]">Showing 5 of 24 users</span>
                <div className="flex gap-1">
                    <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">← Prev</button>
                    <button className="btn-sm bg-[#0D0D0B] text-white border-[#0D0D0B] px-3 py-1 text-[10px] uppercase">1</button>
                    <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">2</button>
                    <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">3</button>
                    <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">Next →</button>
                </div>
            </div>
        </>
    );
}

/* ─── Campaign Monitor Sub‑View ─── */
function CampaignMonitorSection() {
    return (
        <>
            <div className="admin-top flex justify-between items-center mb-5">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">Campaign Monitor</h2>
                <span className="wf-note bg-[#FFFBEA] border border-[#F0D88A] rounded px-2 py-1 text-[10px] text-[#7A6200] font-mono uppercase">
          3 awaiting approval
        </span>
            </div>
            <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3.5 mb-5 text-sm">
                ⚠ <strong>3 campaigns</strong> are pending your review before they go live on the marketplace.
            </div>

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
                {/* Row 1 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm">
                        <strong>Back to School Accessories</strong><br />
                        <span className="text-[11px] text-[#888880]">TikTok · Lifestyle</span>
                    </td>
                    <td className="px-4 py-3 text-sm">Khaadi Pakistan</td>
                    <td className="px-4 py-3 text-sm">Rs. 50,000</td>
                    <td className="px-4 py-3 text-sm">Jun 12</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-pending bg-[#FFF8E6] text-[#7A5200] px-2.5 py-1 rounded text-[10px] uppercase font-medium">In Review</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">Preview</button>
                        <button className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Approve →</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Reject</button>
                    </td>
                </tr>
                {/* Row 2 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm">
                        <strong>Ramzan Cooking Series Vol.2</strong><br />
                        <span className="text-[11px] text-[#888880]">YouTube · Food</span>
                    </td>
                    <td className="px-4 py-3 text-sm">Nestlé Pakistan</td>
                    <td className="px-4 py-3 text-sm">Rs. 200,000</td>
                    <td className="px-4 py-3 text-sm">Jun 11</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-pending bg-[#FFF8E6] text-[#7A5200] px-2.5 py-1 rounded text-[10px] uppercase font-medium">In Review</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">Preview</button>
                        <button className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Approve →</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Reject</button>
                    </td>
                </tr>
                {/* Row 3 */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm">
                        <strong>Fitness Challenge Campaign</strong><br />
                        <span className="text-[11px] text-[#888880]">Instagram · Fitness</span>
                    </td>
                    <td className="px-4 py-3 text-sm">ProFit Pakistan</td>
                    <td className="px-4 py-3 text-sm">Rs. 80,000</td>
                    <td className="px-4 py-3 text-sm">Jun 11</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-pending bg-[#FFF8E6] text-[#7A5200] px-2.5 py-1 rounded text-[10px] uppercase font-medium">In Review</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">Preview</button>
                        <button className="btn-sm success border border-[#3B6D11] text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 text-[10px] uppercase">Approve →</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Reject</button>
                    </td>
                </tr>
                {/* Row 4 – live */}
                <tr className="border-b border-[#E5E5DF] hover:bg-[#FAFAF7]">
                    <td className="px-4 py-3 text-sm">
                        <strong>Summer Eid Collection</strong><br />
                        <span className="text-[11px] text-[#888880]">Instagram · Fashion</span>
                    </td>
                    <td className="px-4 py-3 text-sm">Khaadi Pakistan</td>
                    <td className="px-4 py-3 text-sm">Rs. 100,000</td>
                    <td className="px-4 py-3 text-sm">Jun 8</td>
                    <td className="px-4 py-3 text-sm"><span className="status-badge status-live bg-[#E1F7EE] text-[#0A5A38] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Live</span></td>
                    <td className="admin-actions flex gap-1.5">
                        <button className="btn-sm border border-[#E5E5DF] text-[#3A3A36] px-3 py-1 text-[10px] uppercase">View Live</button>
                        <button className="btn-sm danger border border-[#E24B4A] text-[#E24B4A] px-3 py-1 text-[10px] uppercase">Pause</button>
                    </td>
                </tr>
                </tbody>
            </table>
        </>
    );
}

/* ─── Admin Inbox Viewer Sub‑View ─── */
function AdminInboxSection() {
    return (
        <>
            <div className="admin-top flex flex-col gap-2 mb-5">
                <h2 className="font-['Playfair_Display'] text-2xl font-normal">Inbox Viewer</h2>
                <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded px-4 py-2 text-xs text-[#7A5200]">
                    🔒 Admin read-only view. You cannot send messages from here.
                </div>
            </div>

            <div className="inbox-layout grid grid-cols-[280px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                {/* Conversation list */}
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto">
                    <div className="inbox-list-header px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">
                        All Conversations
                    </div>

                    <div className="inbox-item active px-4 py-3 bg-[#F6F6F2] border-b border-[#E5E5DF] cursor-pointer">
                        <div className="sender flex justify-between text-sm font-medium">
                            <span>Ayesha ↔ Tecno Mobile</span>
                            <span className="text-[10px] text-[#888880] font-normal">2h</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">Smartphone Launch TikTok</div>
                        <div className="preview text-xs text-[#888880] truncate">Can you send us the first draft by...</div>
                    </div>

                    <div className="inbox-item px-4 py-3 border-b border-[#E5E5DF] cursor-pointer hover:bg-[#F6F6F2]">
                        <div className="sender flex justify-between text-sm font-medium">
                            <span>Khaadi ↔ Ayesha Noor</span>
                            <span className="text-[10px] text-[#888880] font-normal">3h</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">Summer Eid Collection</div>
                        <div className="preview text-xs text-[#888880] truncate">We&apos;re going for muted earth tones — beige...</div>
                    </div>

                    <div className="inbox-item px-4 py-3 border-b border-[#E5E5DF] cursor-pointer hover:bg-[#F6F6F2]">
                        <div className="sender flex justify-between text-sm font-medium">
                            <span>Sara ↔ Foodpanda</span>
                            <span className="text-[10px] text-[#888880] font-normal">1d</span>
                        </div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">Monthly Deals Campaign</div>
                        <div className="preview text-xs text-[#888880] truncate">Script approved! You&apos;re good to go film...</div>
                    </div>
                </div>

                {/* Chat pane – read‑only */}
                <div className="chat-pane flex flex-col">
                    <div className="chat-header px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3">
                        <div className="avatar w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[10px] font-medium text-[#3040A0]">👁</div>
                        <div>
                            <strong className="text-sm block">Ayesha Noor ↔ Tecno Mobile</strong>
                            <span className="text-[11px] text-[#888880]">Smartphone Launch TikTok · Read-only admin view</span>
                        </div>
                    </div>

                    <div className="chat-messages flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Hi Ayesha! Excited to be working with you on this campaign. The brief has been unlocked.
                            <div className="msg-meta text-[10px] text-[#888880] mt-1">Tecno Mobile · 10:22 AM</div>
                        </div>

                        <div className="msg me bg-[#EEF2FF] text-[#1A1A4A] self-end max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Thank you! I&apos;ve gone through the brief. I&apos;ll have the first concept ready by Wednesday.
                            <div className="msg-meta text-[10px] text-[#5060A0] mt-1 text-right">Ayesha Noor · 11:05 AM</div>
                        </div>

                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">
                            Perfect. Can you send the first draft by Thursday?
                            <div className="msg-meta text-[10px] text-[#888880] mt-1">Tecno Mobile · 11:30 AM</div>
                        </div>
                    </div>

                    <div className="chat-input bg-[#F6F6F2] border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5">
                        <input
                            placeholder="Admin read-only — cannot send messages"
                            disabled
                            className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none bg-[#F0F0EA] text-[#888880]"
                        />
                        <button disabled className="chat-send bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em] opacity-40 cursor-default">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}