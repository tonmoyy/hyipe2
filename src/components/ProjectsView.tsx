export default function ProjectsView({ role }: { role: string }) {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">{role === 'brand' ? 'My Campaigns' : 'My Projects'}</h1>
                <p className="text-sm text-[#888880] mt-1">Campaigns you've applied to or are actively working on.</p>
            </div>
            <div className="flex justify-end mb-4">
                {role === 'brand' ? (
                    <button className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">+ Post a New Campaign</button>
                ) : (
                    <a href="/marketplace" className="btn-primary bg-[#0D0D0B] text-white px-4 py-2 text-xs uppercase tracking-[0.06em]">Search for New Projects →</a>
                )}
            </div>
            <div className="tab-row flex border-b border-[#E5E5DF] mb-6">
                <button className="tab-btn active px-5 py-2.5 border-b-2 border-[#0D0D0B] text-[#0D0D0B] font-medium text-xs uppercase tracking-[0.06em]">All (3)</button>
                {/* ... */}
            </div>
            <div className="project-list flex flex-col gap-3">
                <div className="project-item bg-white border border-[#E5E5DF] rounded p-4 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                        <h4 className="text-sm font-medium">Summer Eid Collection Launch</h4>
                        <div className="brand-name text-xs text-[#888880]">Khaadi · Fashion</div>
                        <div className="tags flex gap-1.5 mt-2"><span className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase">Instagram</span></div>
                    </div>
                    <div className="text-right">
                        <span className="status-badge status-review bg-[#EEF2FF] text-[#3040A0] px-2.5 py-1 rounded text-[10px] uppercase font-medium">Under Review</span>
                        <div className="text-xs text-[#888880] mt-1.5">Applied 2 days ago</div>
                        <div className="font-['Playfair_Display'] text-[15px] mt-1">Rs. 35,000</div>
                    </div>
                </div>
                {/* ...repeat other items... */}
            </div>
        </>
    );
}