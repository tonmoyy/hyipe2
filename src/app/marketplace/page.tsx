// src/app/marketplace/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';

/* ─── Types ─── */
interface Campaign {
    id: string;
    title: string;
    niche: string;
    platform: string;
    budget: number;
    deliverable: string;
    brief: string;
    min_followers: number;
    deadline: string | null;
    requirements: string;
    status: string;
    created_at: string;
    brand: { full_name: string };
}

/* ─── Marketplace Component ─── */
export default function Marketplace() {
    const { user, profile } = useAuth();
    const supabase = createClient();

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewing, setViewing] = useState<Campaign | null>(null);

    // Application modal state
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyForm, setApplyForm] = useState({
        contentLink: '',
        pitch: '',
        portfolio: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [applySuccess, setApplySuccess] = useState(false);
    const [applyError, setApplyError] = useState('');

    // Fetch live campaigns on mount
    useEffect(() => {
        const fetchCampaigns = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('campaigns')
                .select(`
          id,
          title,
          niche,
          platform,
          budget,
          deliverable,
          brief,
          min_followers,
          deadline,
          requirements,
          status,
          created_at,
          brand:profiles!campaigns_brand_id_fkey(full_name)
        `)
                .eq('status', 'live')
                .order('created_at', { ascending: false });

            if (error) {
                console.error(error);
                setCampaigns([]);
                setLoading(false);
                return;
            }

            const mapped: Campaign[] = ((data as any[]) ?? []).map((item) => ({
                id: item.id,
                title: item.title,
                niche: item.niche,
                platform: item.platform,
                budget: item.budget,
                deliverable: item.deliverable,
                brief: item.brief,
                min_followers: item.min_followers,
                deadline: item.deadline,
                requirements: item.requirements,
                status: item.status,
                created_at: item.created_at,
                brand: {
                    full_name: Array.isArray(item.brand)
                        ? item.brand[0]?.full_name ?? 'Unknown Brand'
                        : item.brand?.full_name ?? 'Unknown Brand',
                },
            }));

            setCampaigns(mapped);
            setLoading(false);
        };
        fetchCampaigns();
    }, [supabase]);

    // Submit application
    const handleApply = async () => {
        if (!user || profile?.role !== 'influencer') {
            alert('You must be logged in as a Creator to apply.');
            return;
        }
        // ✅ Prevent unverified influencers from applying
        if (profile?.status !== 'active') {
            alert('Your account is not verified yet. Please wait for admin verification.');
            return;
        }
        setSubmitting(true);
        setApplyError('');

        const { error } = await supabase.from('applications').insert({
            campaign_id: viewing!.id,
            influencer_id: user.id,
            pitch: applyForm.pitch,
            status: 'applied',
        });

        if (error) {
            setApplyError(error.message);
        } else {
            setApplySuccess(true);
            setShowApplyModal(false);
        }
        setSubmitting(false);
    };

    // ─── UI States ───
    if (loading) {
        return (
            <div className="bg-[#FAFAF7] min-h-[calc(100vh-48px)] flex items-center justify-center">
                <p className="text-[#888880]">Loading campaigns…</p>
            </div>
        );
    }

    if (viewing) {
        // Determine if user can apply
        const canApply =
            user &&
            profile?.role === 'influencer' &&
            profile?.status === 'active';   // ✅ must be verified

        return (
            <div className="bg-[#FAFAF7] min-h-screen">
                <div className="max-w-[900px] mx-auto px-10 py-10">
                    <button
                        onClick={() => setViewing(null)}
                        className="text-xs text-[#888880] mb-6 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                        ← Back to Marketplace
                    </button>

                    <div className="camp-detail-hero bg-[#E8E8E2] h-72 rounded mb-8 flex items-center justify-center text-xs text-[#888880] uppercase tracking-[0.05em] border border-dashed border-[#C8C8C0]">
                        [ Campaign hero image ]
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
                        <div>
                            <div className="text-xs text-[#888880] mb-5 uppercase tracking-[0.06em]">
                                {viewing.brand?.full_name || 'Brand'} · {viewing.niche}
                            </div>
                            <h1 className="font-['Playfair_Display'] text-3xl mb-4">{viewing.title}</h1>
                            <h3 className="text-xs uppercase tracking-[0.08em] text-[#888880] mt-5 mb-2.5">Campaign Overview</h3>
                            <p className="text-sm text-[#3A3A36] leading-relaxed">{viewing.brief}</p>
                            <h3 className="text-xs uppercase tracking-[0.08em] text-[#888880] mt-5 mb-2.5">Requirements</h3>
                            <p className="text-sm text-[#3A3A36] leading-relaxed">{viewing.requirements}</p>
                            <h3 className="text-xs uppercase tracking-[0.08em] text-[#888880] mt-5 mb-2.5">Deliverables</h3>
                            <p className="text-sm text-[#3A3A36]">{viewing.deliverable}</p>

                            {/* ✅ Apply button logic with verification check */}
                            {canApply ? (
                                <button
                                    onClick={() => setShowApplyModal(true)}
                                    className="btn-primary bg-[#0D0D0B] text-white mt-6 px-8 py-3 text-[13px] uppercase tracking-[0.06em]"
                                >
                                    Apply for this Campaign →
                                </button>
                            ) : !user ? (
                                <Link
                                    href="/auth"
                                    className="btn-primary bg-[#0D0D0B] text-white mt-6 px-8 py-3 text-[13px] uppercase tracking-[0.06em] inline-block"
                                >
                                    Log In to Apply
                                </Link>
                            ) : profile?.role === 'influencer' && profile?.status !== 'active' ? (
                                <div className="mt-6 bg-[#FFF8E6] border border-[#F0D88A] rounded p-4 text-sm text-[#7A5200]">
                                    ⏳ Your account is pending verification. You can apply for campaigns once an admin approves your profile.
                                </div>
                            ) : profile?.role !== 'influencer' ? (
                                <p className="text-xs text-[#888880] mt-4">Only creators can apply for campaigns.</p>
                            ) : null}
                        </div>

                        <div className="camp-sidebar-card bg-white border border-[#E5E5DF] rounded p-5 sticky top-20">
                            <h4 className="text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-3">Campaign Details</h4>
                            <div className="flex justify-between py-2 border-b border-[#E5E5DF] text-xs">
                                <span className="text-[#888880]">Budget</span>
                                <span className="font-medium">Rs. {Number(viewing.budget).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[#E5E5DF] text-xs">
                                <span className="text-[#888880]">Platform</span>
                                <span>{viewing.platform}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[#E5E5DF] text-xs">
                                <span className="text-[#888880]">Deliverable</span>
                                <span>{viewing.deliverable}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[#E5E5DF] text-xs">
                                <span className="text-[#888880]">Niche</span>
                                <span>{viewing.niche}</span>
                            </div>
                            {viewing.deadline && (
                                <div className="flex justify-between py-2 border-b border-[#E5E5DF] text-xs">
                                    <span className="text-[#888880]">Deadline</span>
                                    <span>{new Date(viewing.deadline).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 text-xs">
                                <span className="text-[#888880]">Payment</span>
                                <span>Escrow ✓</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Apply Modal – only rendered if canApply is true, but keeping as is for safety */}
                {showApplyModal && (
                    <div className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center">
                        <div className="bg-white rounded p-9 max-w-[560px] w-[90%] max-h-[85vh] overflow-y-auto">
                            <h2 className="font-['Playfair_Display'] text-2xl mb-1">Apply for Campaign</h2>
                            <p className="text-xs text-[#888880] mb-6">{viewing.title} — {viewing.brand?.full_name}</p>

                            <div className="mb-4">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Relevant Content Example</label>
                                <input
                                    value={applyForm.contentLink}
                                    onChange={e => setApplyForm(p => ({ ...p, contentLink: e.target.value }))}
                                    placeholder="Link to a post, reel, or video"
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Application Pitch (min. 200 chars)</label>
                                <textarea
                                    value={applyForm.pitch}
                                    onChange={e => setApplyForm(p => ({ ...p, pitch: e.target.value }))}
                                    placeholder="Tell the brand why you&apos;re the right creator for this campaign..."
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm min-h-[120px]"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Portfolio / Social Link</label>
                                <input
                                    value={applyForm.portfolio}
                                    onChange={e => setApplyForm(p => ({ ...p, portfolio: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm"
                                />
                            </div>

                            {applyError && <p className="text-red-500 text-xs mb-4">{applyError}</p>}

                            <div className="flex justify-end gap-2.5 mt-5">
                                <button onClick={() => setShowApplyModal(false)} className="border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Cancel</button>
                                <button
                                    onClick={handleApply}
                                    disabled={submitting}
                                    className="bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em] disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Application →'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success overlay */}
                {applySuccess && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center">
                        <div className="bg-white rounded p-12 text-center max-w-[400px]">
                            <div className="w-14 h-14 border-2 border-[#0D0D0B] rounded-full mx-auto mb-5 flex items-center justify-center text-2xl">✓</div>
                            <h2 className="font-['Playfair_Display'] text-2xl mb-2.5">Application Submitted!</h2>
                            <p className="text-sm text-[#3A3A36] mb-6">Your application has been sent to the brand. You&apos;ll be notified via inbox when they respond.</p>
                            <button
                                onClick={() => { setApplySuccess(false); setViewing(null); }}
                                className="bg-[#0D0D0B] text-white w-full py-2.5 text-xs uppercase tracking-[0.06em]"
                            >
                                Back to Marketplace
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Grid View ───
    return (
        <div className="bg-[#FAFAF7]">
            <div className="market-header bg-white px-10 py-8 border-b border-[#E5E5DF]">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <h1 className="font-['Playfair_Display'] text-4xl font-bold mb-1">The Marketplace</h1>
                        <p className="text-xs text-[#888880]">Live campaigns from verified Pakistani brands.</p>
                    </div>
                    <div className="flex gap-2">
                        {user ? (
                            <>
                                {profile?.role === 'brand' && (
                                    <Link href="/dashboard/brand?tab=campaigns" className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-[11px] uppercase tracking-[0.06em]">
                                        Post a Campaign
                                    </Link>
                                )}
                            </>
                        ) : (
                            <Link href="/auth" className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-[11px] uppercase tracking-[0.06em]">
                                Log In to Apply
                            </Link>
                        )}
                    </div>
                </div>

                <div className="market-controls flex flex-wrap gap-3 mt-5">
                    <div className="search-bar flex border border-[#E5E5DF] rounded overflow-hidden flex-1">
                        <input placeholder="Search campaigns by brand, niche..." className="w-full p-2.5 text-sm border-none outline-none" />
                        <button className="bg-[#0D0D0B] text-white px-4 text-[11px] uppercase tracking-[0.06em]">Search</button>
                    </div>
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white">
                        <option>All Niches</option>
                    </select>
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white">
                        <option>All Platforms</option>
                    </select>
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white">
                        <option>All Budgets</option>
                    </select>
                </div>
            </div>

            <div className="market-body max-w-[1200px] mx-auto px-10 py-9">
                <div className="stats-strip grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="stat-card bg-white border border-[#E5E5DF] p-4 rounded text-center">
                        <div className="num font-['Playfair_Display'] text-2xl">{campaigns.length}</div>
                        <div className="lbl text-[10px] uppercase tracking-[0.08em] text-[#888880]">Live Campaigns</div>
                    </div>
                    <div className="stat-card bg-white border border-[#E5E5DF] p-4 rounded text-center">
                        <div className="num font-['Playfair_Display'] text-2xl">218</div>
                        <div className="lbl text-[10px] uppercase tracking-[0.08em] text-[#888880]">Creators</div>
                    </div>
                    <div className="stat-card bg-white border border-[#E5E5DF] p-4 rounded text-center">
                        <div className="num font-['Playfair_Display'] text-2xl">67</div>
                        <div className="lbl text-[10px] uppercase tracking-[0.08em] text-[#888880]">Verified Brands</div>
                    </div>
                    <div className="stat-card bg-white border border-[#E5E5DF] p-4 rounded text-center">
                        <div className="num font-['Playfair_Display'] text-2xl">Rs. 2.4M</div>
                        <div className="lbl text-[10px] uppercase tracking-[0.08em] text-[#888880]">Total Paid Out</div>
                    </div>
                </div>

                {campaigns.length === 0 ? (
                    <div className="text-center py-20 text-[#888880]">
                        <p className="text-lg font-['Playfair_Display']">No live campaigns right now.</p>
                        <p className="text-sm mt-2">Check back soon or log in as a brand to post one.</p>
                    </div>
                ) : (
                    <div className="campaigns-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {campaigns.map((c) => (
                            <div
                                key={c.id}
                                className="camp-card bg-white border border-[#E5E5DF] rounded overflow-hidden cursor-pointer hover:border-[#0D0D0B] transition"
                                onClick={() => setViewing(c)}
                            >
                                <div className="camp-card-img h-36 bg-[#E8E8E2] flex items-center justify-center text-[11px] text-[#888880] uppercase tracking-[0.05em] relative border-b border-[#E5E5DF]">
                  <span className="niche-badge absolute top-2 left-2 bg-white border border-[#E5E5DF] px-2 py-0.5 rounded text-[9px] uppercase">
                    {c.niche}
                  </span>
                                    [ Campaign image ]
                                </div>
                                <div className="p-4">
                                    <div className="text-[11px] text-[#888880] uppercase tracking-[0.06em] mb-1.5">
                                        {c.brand?.full_name || 'Brand'}
                                    </div>
                                    <h3 className="text-[15px] font-medium leading-tight mb-2.5">{c.title}</h3>
                                    <div className="flex justify-between items-center text-[11px] text-[#888880] pt-2.5 border-t border-[#E5E5DF]">
                                        <div>
                      <span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">
                        {c.platform}
                      </span>
                                        </div>
                                        <div className="font-['Playfair_Display'] text-[13px] font-medium text-[#0D0D0B]">
                                            Rs. {Number(c.budget).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}