'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Marketplace() {
    const [viewing, setViewing] = useState(false);

    const campaigns = [
        { id: 1, brand: 'Khaadi Pakistan', title: 'Summer Eid Collection Launch', budget: 'Rs. 35,000', platform: 'Instagram', niche: 'Fashion' },
        { id: 2, brand: 'Tecno Mobile PK', title: 'New Smartphone Launch — TikTok Series', budget: 'Rs. 60,000', platform: 'TikTok', niche: 'Tech' },
        // ... other campaigns
    ];

    if (viewing) {
        return (
            <div className="camp-detail active max-w-[900px] mx-auto px-10 py-10">
                <button className="text-xs text-[#888880] mb-6 flex items-center gap-1 bg-transparent border-none cursor-pointer" onClick={() => setViewing(false)}>← Back to Marketplace</button>
                <div className="camp-detail-hero bg-[#E8E8E2] h-72 rounded mb-8 flex items-center justify-center text-xs text-[#888880] uppercase tracking-[0.05em] border border-dashed border-[#C8C8C0]">[ Campaign hero image ]</div>
                <div className="camp-detail-layout grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
                    <div>
                        <div className="brand-row text-xs text-[#888880] mb-5 uppercase tracking-[0.06em]">Khaadi Pakistan · Fashion & Lifestyle</div>
                        <h1 className="font-['Playfair_Display'] text-3xl mb-2">Summer Eid Collection Launch</h1>
                        <h3 className="text-xs uppercase tracking-[0.08em] text-[#888880] mt-5 mb-2.5">Campaign Overview</h3>
                        <p className="text-sm text-[#3A3A36] leading-relaxed">We're launching our most anticipated Eid collection...</p>
                        {/* ...more content from the wireframe... */}
                        <button className="btn-primary bg-[#0D0D0B] text-white mt-6 px-8 py-3 text-[13px] uppercase tracking-[0.06em]" onClick={() => alert('Apply modal')}>Apply for this Campaign →</button>
                    </div>
                    <div className="camp-sidebar-card bg-white border border-[#E5E5DF] rounded p-5">
                        <h4 className="text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-3">Campaign Details</h4>
                        <div className="camp-info-row flex justify-between py-2 border-b border-[#E5E5DF] text-xs"><span className="lbl text-[#888880]">Budget</span><span className="val font-medium">Rs. 35,000</span></div>
                        {/* ... */}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="market-header bg-white px-10 py-8 border-b border-[#E5E5DF]">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <h1 className="font-['Playfair_Display'] text-4xl font-bold mb-1">The Marketplace</h1>
                        <p className="text-xs text-[#888880]">Live campaigns from verified Pakistani brands.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/auth" className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-[11px] uppercase tracking-[0.06em]">Log In to Apply</Link>
                        <button className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-[11px] uppercase tracking-[0.06em]">Post a Campaign</button>
                    </div>
                </div>
                <div className="market-controls flex flex-wrap gap-3 mt-5">
                    <div className="search-bar flex border border-[#E5E5DF] rounded overflow-hidden flex-1">
                        <input placeholder="Search campaigns by brand, niche..." className="w-full p-2.5 text-sm border-none outline-none" />
                        <button className="bg-[#0D0D0B] text-white px-4 text-[11px] uppercase tracking-[0.06em]">Search</button>
                    </div>
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white"><option>All Niches</option></select>
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white"><option>All Platforms</option></select>
                    <select className="filter-select border border-[#E5E5DF] rounded px-3 py-2 text-xs bg-white"><option>All Budgets</option></select>
                </div>
            </div>

            <div className="market-body max-w-[1200px] mx-auto px-10 py-9">
                <div className="stats-strip grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="stat-card bg-white border border-[#E5E5DF] p-4 rounded text-center">
                        <div className="num font-['Playfair_Display'] text-2xl">42</div>
                        <div className="lbl text-[10px] uppercase tracking-[0.08em] text-[#888880]">Live Campaigns</div>
                    </div>
                    {/* ...other stats... */}
                </div>

                <div className="campaigns-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {campaigns.map((c) => (
                        <div key={c.id} className="camp-card bg-white border border-[#E5E5DF] rounded overflow-hidden cursor-pointer" onClick={() => setViewing(true)}>
                            <div className="camp-card-img h-36 bg-[#E8E8E2] flex items-center justify-center text-[11px] text-[#888880] uppercase tracking-[0.05em] relative border-b border-[#E5E5DF]">
                                <span className="niche-badge absolute top-2 left-2 bg-white border border-[#E5E5DF] px-2 py-0.5 rounded text-[9px] uppercase">{c.niche}</span>
                                [ Campaign image ]
                            </div>
                            <div className="camp-card-body p-4">
                                <div className="brand text-[11px] text-[#888880] uppercase tracking-[0.06em] mb-1.5">{c.brand}</div>
                                <h3 className="text-[15px] font-medium leading-tight mb-2.5">{c.title}</h3>
                                <div className="camp-meta flex justify-between items-center text-[11px] text-[#888880] pt-2.5 border-t border-[#E5E5DF]">
                                    <div><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">{c.platform}</span></div>
                                    <div className="budget font-['Playfair_Display'] text-[13px] font-medium text-[#0D0D0B]">{c.budget}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}