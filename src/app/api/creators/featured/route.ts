import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, niche, followers, engagement, platforms, avatar_url')
        .eq('role', 'influencer')
        .limit(4)

    if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json([], { status: 500 })
    }

    const creators = (data || []).map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || 'Unknown',
        niche: profile.niche || 'General',
        followers: profile.followers || '0 followers',
        engagement: profile.engagement || '0% eng.',
        platforms: Array.isArray(profile.platforms)
            ? profile.platforms
            : profile.platforms
                ? profile.platforms.split(',').map((p: string) => p.trim())
                : [],
        avatar: profile.avatar_url ?? undefined,
    }))

    return NextResponse.json(creators)
}