export default function ProfileView({ role }: { role: string }) {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">{role === 'brand' ? 'Brand Profile' : 'My Profile'}</h1>
                <p className="text-sm text-[#888880] mt-1">Complete your profile to start applying for campaigns.</p>
            </div>
            <div className="bg-[#FFF8E6] border border-[#F0D88A] rounded p-3.5 mb-6 text-sm flex justify-between items-center">
                <span>⚠ Your profile is 45% complete.</span>
                <div className="progress-bar w-40 h-1 bg-[#F0F0EA] rounded">
                    <div className="progress-fill bg-[#0D0D0B] h-1 rounded w-[45%]"></div>
                </div>
            </div>
            {/* Profile card – personal info */}
            <div className="profile-card bg-white border border-[#E5E5DF] rounded p-7 mb-5">
                <h3 className="text-[13px] uppercase tracking-[0.06em] text-[#888880] mb-5 pb-3 border-b border-[#E5E5DF]">Personal Information</h3>
                <div className="profile-avatar-row flex items-center gap-5 mb-6">
                    <div className="profile-avatar-box w-18 h-18 bg-[#E8E8E2] rounded-full flex items-center justify-center font-['Playfair_Display'] text-2xl font-bold text-[#3A3A36] border border-dashed border-[#C0C0B8]">AN</div>
                    <div>
                        <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-3 py-1.5 text-[11px] uppercase tracking-[0.06em]">Upload Photo</button>
                        <p className="text-xs text-[#888880] mt-1.5">JPG or PNG · Max 2MB</p>
                    </div>
                </div>
                <div className="form-row grid grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Full Name</label>
                        <input defaultValue="Ayesha Noor" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#888880] mb-1.5">Display Name / Handle</label>
                        <input defaultValue="@ayeshanoor" className="w-full p-2.5 border border-[#E5E5DF] rounded text-sm" />
                    </div>
                </div>
                {/* Add more fields exactly as in wireframe */}
            </div>
            <div className="flex justify-end gap-2.5 mt-4">
                <button className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-4 py-2 text-xs uppercase tracking-[0.06em]">Save Draft</button>
                <button className="btn-primary bg-[#0D0D0B] text-white px-7 py-2.5 text-xs uppercase tracking-[0.06em]">Save Profile</button>
            </div>
        </>
    );
}