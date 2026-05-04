'use client';

import Link from 'next/link';

type Props = {
    role: string;
    active: string;
    onNavigate: (sub: string) => void;
};

export default function DashboardSidebar({ role, active, onNavigate }: Props) {
    const rolePillColor = role === 'influencer' ? 'bg-[#0D0D0B]' : role === 'brand' ? 'bg-[#5E7A0A]' : 'bg-[#A32D2D]';
    const displayRole = role === 'influencer' ? 'Creator' : role === 'brand' ? 'Brand' : 'Admin';

    return (
        <aside className="sidebar bg-white border-r border-[#E5E5DF] w-[220px] flex flex-col py-7 px-0">
            <div className="sidebar-brand px-6 mb-8">
                <Link href="/" className="logo font-['Playfair_Display'] text-lg font-bold">HYIPE</Link>
                <span className={`role-pill text-[9px] uppercase text-white ${rolePillColor} px-1.5 py-0.5 rounded-full inline-block mt-1`}>{displayRole}</span>
            </div>
            <nav className="sidebar-nav flex-1 px-3">
                <button
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                        active === 'profile' ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                    }`}
                >
                    <span className="nav-icon text-[13px] opacity-50">◎</span> {role === 'brand' ? 'Brand Profile' : 'My Profile'}
                </button>
                <button
                    onClick={() => onNavigate('projects')}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                        active === 'projects' ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                    }`}
                >
                    <span className="nav-icon text-[13px] opacity-50">◈</span> {role === 'brand' ? 'My Campaigns' : 'My Projects'}
                </button>
                <button
                    onClick={() => onNavigate('inbox')}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded mb-0.5 w-full text-left ${
                        active === 'inbox' ? 'bg-[#F0F0EA] font-medium text-[#0D0D0B]' : 'text-[#3A3A36] hover:bg-[#F0F0EA]'
                    }`}
                >
                    <span className="nav-icon text-[13px] opacity-50">◻</span> Inbox
                    <span className="badge-count ml-auto bg-[#0D0D0B] text-white text-[9px] px-1.5 py-0.5 rounded-full">2</span>
                </button>
            </nav>
            <div className="sidebar-user mt-auto px-6 py-4 border-t border-[#E5E5DF]">
                <div className="name text-sm font-medium">Ayesha Noor</div>
                <div className="email text-[11px] text-[#888880]">ayesha@email.com</div>
                <Link href="/" className="logout text-[11px] text-[#888880] underline mt-1.5 inline-block">← Back to site</Link>
            </div>
        </aside>
    );
}