'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import ProfileView from '@/components/ProfileView';
import ProjectsView from '@/components/ProjectsView';
import InboxView from '@/components/InboxView';

export default function DashboardPage() {
    const { role } = useParams<{ role: string }>();
    const [sub, setSub] = useState('profile');

    return (
        <div className="dashboard-shell flex min-h-[calc(100vh-48px)]">
            <DashboardSidebar role={role} active={sub} onNavigate={setSub} />
            <main className="dash-content bg-[#F6F6F2] flex-1 p-10 overflow-y-auto">
                {sub === 'profile' && <ProfileView role={role} />}
                {sub === 'projects' && <ProjectsView role={role} />}
                {sub === 'inbox' && <InboxView role={role} />}
            </main>
        </div>
    );
}