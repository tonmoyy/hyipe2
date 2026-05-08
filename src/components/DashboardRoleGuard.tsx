'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

const allowedMap: Record<string, string[]> = {
    influencer: ['influencer'],
    brand: ['brand'],
    admin: ['admin', 'superadmin'],
    superadmin: ['admin', 'superadmin'],
};

export default function DashboardRoleGuard({
                                               children,
                                               roleParam,
                                           }: {
    children: React.ReactNode;
    roleParam: string;
}) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        const actualRole = profile?.role;
        if (!actualRole) return;
        const allowed = allowedMap[actualRole] ?? ['influencer'];
        if (!allowed.includes(roleParam)) {
            router.replace(`/dashboard/${allowed[0]}`);
        }
    }, [loading, profile, roleParam, router]);

    if (loading || !profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F6F6F2]">
                <p>Loading…</p>
            </div>
        );
    }

    return <>{children}</>;
}