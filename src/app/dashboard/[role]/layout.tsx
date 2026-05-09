// src/app/dashboard/[role]/layout.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

const allAllowedSegments = ['influencer', 'brand', 'admin'];

const roleDashboardMap: Record<string, string[]> = {
    influencer: ['influencer'],
    brand: ['brand'],
    admin: ['admin'],
    superadmin: ['admin'],
};

export default async function DashboardRoleLayout({
                                                      children,
                                                      params,
                                                  }: {
    children: ReactNode;
    params: Promise<{ role: string }>;
}) {
    const { role } = await params;

    if (!allAllowedSegments.includes(role)) {
        redirect('/auth');
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth');
    }

    // Fetch role and status from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

    const actualRole = profile?.role ?? 'influencer';
    const actualStatus = profile?.status ?? 'pending';

    // Admins and superadmins always pass through
    const isAdmin = actualRole === 'admin' || actualRole === 'superadmin';

    // Non‑admins with pending status → redirected to pending page
    if (!isAdmin && actualStatus !== 'active') {
        redirect('/dashboard/pending');
    }

    // Role‑based access (existing logic)
    const allowed = roleDashboardMap[actualRole] ?? ['influencer'];
    if (!allowed.includes(role)) {
        redirect(`/dashboard/${allowed[0]}`);
    }

    return <>{children}</>;
}