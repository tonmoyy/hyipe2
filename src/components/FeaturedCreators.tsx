// src/components/FeaturedCreators.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

type Creator = {
    id: string;
    full_name: string;
    avatar_url?: string;
    primary_niche?: string;
    ig_handle?: string;
    ig_followers?: string | number;
    tiktok_handle?: string;
    tiktok_followers?: string | number;
    yt_url?: string;
    yt_subscribers?: string | number;
};

export default function FeaturedCreators() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchCreators = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, primary_niche, ig_handle, ig_followers, tiktok_handle, tiktok_followers, yt_url, yt_subscribers')
                    .eq('role', 'creator')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (!error && data) {
                    setCreators(data);
                }
            } catch (err) {
                console.error('Failed to load creators', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCreators();
    }, []);

    // Helper: get top follower count for display
    const getTopFollowerCount = (creator: Creator) => {
        const counts = [
            Number(creator.ig_followers) || 0,
            Number(creator.tiktok_followers) || 0,
            Number(creator.yt_subscribers) || 0,
        ];
        const max = Math.max(...counts);
        return max > 0 ? `${(max / 1000).toFixed(0)}K followers` : 'New creator';
    };

    // Helper: generate platform tags
    const getPlatformTags = (creator: Creator) => {
        const tags = [];
        if (creator.ig_handle) tags.push('Instagram');
        if (creator.tiktok_handle) tags.push('TikTok');
        if (creator.yt_url) tags.push('YouTube');
        return tags;
    };

    // Fallback static data if no creators fetched
    const fallbackCreators = [
        {
            id: '1',
            full_name: 'Ayesha Noor',
            primary_niche: 'Fashion & Lifestyle',
            platformTags: ['Instagram', 'TikTok'],
            followers: '280K followers',
            engagement: '4.2% eng.',
        },
        {
            id: '2',
            full_name: 'Bilal Chaudhry',
            primary_niche: 'Tech & Gaming',
            platformTags: ['YouTube', 'Instagram'],
            followers: '520K followers',
            engagement: '3.8% eng.',
        },
        {
            id: '3',
            full_name: 'Sara Baig',
            primary_niche: 'Food & Travel',
            platformTags: ['Instagram'],
            followers: '190K followers',
            engagement: '5.1% eng.',
        },
        {
            id: '4',
            full_name: 'Hassan Mirza',
            primary_niche: 'Fitness & Health',
            platformTags: ['YouTube', 'TikTok'],
            followers: '145K followers',
            engagement: '6.2% eng.',
        },
    ];

    if (loading) {
        return (
            <div className="creators-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="creator-card border border-[#E5E5DF] rounded overflow-hidden bg-white animate-pulse">
                        <div className="h-44 bg-[#E8E8E2]" />
                        <div className="p-3.5 space-y-2">
                            <div className="h-4 bg-[#E0E0DA] rounded w-3/4" />
                            <div className="h-3 bg-[#E0E0DA] rounded w-1/2" />
                            <div className="h-3 bg-[#E0E0DA] rounded w-2/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (creators.length > 0) {
        return (
            <div className="creators-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {creators.map(creator => {
                    const platformTags = getPlatformTags(creator);
                    const followers = getTopFollowerCount(creator);
                    const engagement = '4.5% eng.'; // placeholder

                    return (
                        <div key={creator.id} className="creator-card border border-[#E5E5DF] rounded overflow-hidden bg-white">
                            <div className="creator-card-img h-44 bg-[#E8E8E2] flex items-center justify-center border-b border-[#E5E5DF] overflow-hidden">
                                {creator.avatar_url ? (
                                    <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-[11px] text-[#888880] uppercase tracking-[0.05em]">
                                        <span className="text-2xl font-bold">{creator.full_name?.charAt(0).toUpperCase()}</span>
                                        <span>[ Creator portrait ]</span>
                                    </div>
                                )}
                            </div>
                            <div className="creator-card-info p-3.5">
                                <div className="name font-medium text-sm">{creator.full_name}</div>
                                <div className="niche text-[11px] text-[#888880] uppercase tracking-[0.08em] mb-2">
                                    {creator.primary_niche || 'General'}
                                </div>
                                <div className="stats flex gap-3 text-[11px] text-[#3A3A36]">
                                    <span>{followers}</span><span>·</span><span>{engagement}</span>
                                </div>
                                <div className="mt-2 flex gap-1 flex-wrap">
                                    {platformTags.map(tag => (
                                        <span key={tag} className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">
                      {tag}
                    </span>
                                    ))}
                                    {platformTags.length === 0 && (
                                        <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">Creator</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Fallback
    return (
        <div className="creators-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {fallbackCreators.map(c => (
                <div key={c.id} className="creator-card border border-[#E5E5DF] rounded overflow-hidden bg-white">
                    <div className="creator-card-img h-44 bg-[#E8E8E2] flex items-center justify-center text-[11px] text-[#888880] uppercase tracking-[0.05em] border-b border-[#E5E5DF]">
                        [ Creator portrait ]
                    </div>
                    <div className="creator-card-info p-3.5">
                        <div className="name font-medium text-sm">{c.full_name}</div>
                        <div className="niche text-[11px] text-[#888880] uppercase tracking-[0.08em] mb-2">{c.primary_niche}</div>
                        <div className="stats flex gap-3 text-[11px] text-[#3A3A36]">
                            <span>{c.followers}</span><span>·</span><span>{c.engagement}</span>
                        </div>
                        <div className="mt-2 flex gap-1 flex-wrap">
                            {c.platformTags.map(tag => (
                                <span key={tag} className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}