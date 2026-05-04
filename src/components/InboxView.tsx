export default function InboxView({ role }: { role: string }) {
    return (
        <>
            <div className="dash-header mb-7">
                <h1 className="font-['Playfair_Display'] text-3xl font-normal">Inbox</h1>
                <p className="text-sm text-[#888880] mt-1">{role === 'admin' ? 'Read-only view of all messages.' : 'Your direct messages with brands and HYIPE team.'}</p>
            </div>
            <div className="inbox-layout grid grid-cols-[280px_1fr] h-[calc(100vh-170px)] border border-[#E5E5DF] rounded overflow-hidden bg-white">
                <div className="inbox-list border-r border-[#E5E5DF] overflow-y-auto">
                    <div className="inbox-list-header px-4 py-4 border-b border-[#E5E5DF] text-xs uppercase tracking-[0.06em] text-[#888880] font-medium">Conversations</div>
                    <div className="inbox-item active px-4 py-3 bg-[#F6F6F2] border-b border-[#E5E5DF] cursor-pointer">
                        <div className="sender flex justify-between text-sm font-medium"><span><span className="unread-dot w-1.5 h-1.5 rounded-full bg-[#0D0D0B] inline-block mr-1"></span>Tecno Mobile</span><span className="text-[10px] text-[#888880] font-normal">2h ago</span></div>
                        <div className="campaign-tag text-[10px] text-[#888880] italic mt-0.5">Re: Smartphone Launch TikTok</div>
                        <div className="preview text-xs text-[#888880] truncate">Hey, can you send us the first draft by...</div>
                    </div>
                    {/* ...other conversations... */}
                </div>
                <div className="chat-pane flex flex-col">
                    <div className="chat-header px-5 py-4 border-b border-[#E5E5DF] flex items-center gap-3">
                        <div className="avatar w-9 h-9 rounded-full bg-[#E8E8E2] flex items-center justify-center text-sm font-medium">TM</div>
                        <div>
                            <strong className="text-sm block">Tecno Mobile</strong>
                            <span className="text-[11px] text-[#888880]">Smartphone Launch TikTok · Active</span>
                        </div>
                    </div>
                    <div className="chat-messages flex-1 p-5 overflow-y-auto flex flex-col gap-3">
                        <div className="msg other bg-[#F0F0EA] self-start max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">Hi Ayesha! Excited to be working with you...</div>
                        <div className="msg me bg-[#0D0D0B] text-white self-end max-w-[70%] px-3 py-2.5 rounded text-sm leading-relaxed">Thank you! I'll have the first concept ready by Wednesday.</div>
                    </div>
                    <div className="chat-input border-t border-[#E5E5DF] px-4 py-3 flex gap-2.5">
                        <input placeholder="Type a message..." className="flex-1 border border-[#E5E5DF] rounded px-3 py-2 text-sm outline-none" />
                        <button className="chat-send bg-[#0D0D0B] text-white px-5 py-2 text-xs uppercase tracking-[0.04em]">Send</button>
                    </div>
                </div>
            </div>
        </>
    );
}