// src/app/dashboard/[role]/layout.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

// ✅ Force server‑side execution on every request (no caching)
export const dynamic = 'force-dynamic';

// Allowed URL segments
const allAllowedSegments = ['influencer', 'brand', 'admin', 'superadmin'];

// Which dashboard pages each real role can access
const roleDashboardMap: Record<string, string[]> = {
    influencer: ['influencer'],
    brand: ['brand'],
    admin: ['admin', 'superadmin'],
    superadmin: ['admin', 'superadmin'],
};

export default async function DashboardRoleLayout({
                                                      children,
                                                      params,
                                                  }: {
    children: ReactNode;
    params: Promise<{ role: string }>;
}) {
    const { role } = await params;

    // 1. Unknown segment → login
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

    // 2. Logged in?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth');
    }

    // 3. Fetch real role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const actualRole = profile?.role ?? 'influencer';

    // 4. Allowed pages for this real role
    const allowed = roleDashboardMap[actualRole] ?? ['influencer'];

    // 5. If current URL segment is not allowed, redirect to the default page for the real role
    if (!allowed.includes(role)) {
        redirect(`/dashboard/${allowed[0]}`);
    }

    // 6. Render the page
    return <>{children}</>;
}