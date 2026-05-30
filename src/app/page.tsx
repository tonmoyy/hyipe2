// src/app/page.tsx
import Link from 'next/link';
import ComingSoonBanner from "@/components/ComingSoonBanner";
import Image from "next/image";
import { headers } from 'next/headers';

interface Creator {
    id: string;
    full_name: string;
    niche: string;
    followers: string;
    engagement: string;
    platforms: string | string[];
    avatar?: string;
}

async function getFeaturedCreators(): Promise<Creator[]> {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    try {
        const res = await fetch(`${baseUrl}/api/creators/featured`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error('Fetch failed:', error);
        return [];
    }
}
const trustItems = [
    {
        icon: "🔒",
        title: "Escrow Protection",
        description:
            "Brand payment is locked in escrow before any work begins. You always get paid.",
    },
    {
        icon: "✓",
        title: "Verified Brands",
        description:
            "Every brand is verified with NTN and contact details before going live.",
    },
    {
        icon: "📲",
        title: "EasyPaisa / JazzCash",
        description:
            "Payouts via Pakistan's most popular mobile wallets. Fast, local, reliable.",
    },
];

export default async function HomePage() {
    const creators = await getFeaturedCreators();

    const safeCreators = creators.map((c) => ({
        ...c,
        platforms: Array.isArray(c.platforms)
            ? c.platforms
            : typeof c.platforms === 'string'
                ? c.platforms.split(',').map((p: string) => p.trim())
                : [],
    }));

    return (
        <div className="bg-[#FAFAF7] overflow-x-hidden max-w-[100vw]">
            <ComingSoonBanner />

            {/* Hero – flex layout for reliable side‑by‑side on desktop */}
            <section className="hp-hero max-w-[1200px] mx-auto px-4 md:px-10 py-12 md:py-20">


                    {/* Left column – text & buttons */}
                    <div className="flex-1">
                        <p className="hp-hero-tag font-cinzel font-bold tracking-[0.15em] uppercase text-sm md:text-base">
                            Pakistan’s First Influencer Marketplace
                        </p>
                        <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl leading-tight font-bold mb-4 md:mb-7">
                            Where Brands <br className="hidden sm:block" /> Meet <em className="text-[#888880] italic">Real</em><br />Creators.
                        </h1>
                        <p className="text-sm md:text-[15px] text-[#3A3A36] leading-relaxed mb-6 md:mb-8">
                            HYIPE connects Pakistani brands with verified content creators through a transparent,
                            escrow‑backed system. No more chasing payments. No more unpaid work.
                        </p>

                        {/* Desktop buttons */}
                        <div className="hidden md:flex gap-3 flex-wrap">
                            <Link href="/auth" className="btn-primary bg-[#0D0D0B] text-white px-5 py-2.5 md:px-7 md:py-3 text-xs md:text-[13px] uppercase tracking-[0.08em]">
                                I’m a Brand →
                            </Link>
                            <Link href="/auth" className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-5 py-2.5 md:px-7 md:py-3 text-xs md:text-[13px] uppercase tracking-[0.08em]">
                                I’m a Creator →
                            </Link>
                        </div>

                        {/* Mobile buttons */}
                        <div className="flex md:hidden flex-col gap-3 mt-6">
                            <Link
                                href="/auth"
                                className="block w-full py-3.5 px-5 text-center text-xs uppercase tracking-[0.08em] font-medium rounded-sm"
                                style={{ backgroundColor: '#C8F04A', color: '#0D0D0B', fontFamily: "'DM Sans', system-ui, sans-serif" }}
                            >
                                I’m a Brand →
                            </Link>
                            <Link
                                href="/auth"
                                className="block w-full py-3.5 px-5 text-center text-xs uppercase tracking-[0.08em] rounded-sm border"
                                style={{ borderColor: 'rgba(13,13,11,0.25)', color: '#0D0D0B', fontFamily: "'DM Sans', system-ui, sans-serif" }}
                            >
                                I’m a Creator →
                            </Link>
                        </div>
                    </div>

                    {/* Right column – stats grid (desktop only) */}
                    <div className="hidden md:block flex-1">
                        <div className="grid grid-cols-2 gap-px bg-[#E5E5DF] border-t border-b border-[#E5E5DF]">
                            <div className="bg-white py-5 px-4 text-center">
                                <div className="font-['Playfair_Display'] text-2xl leading-tight">2.4M+</div>
                                <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Paid to Creators</div>
                            </div>
                            <div className="bg-white py-5 px-4 text-center">
                                <div className="font-['Playfair_Display'] text-2xl leading-tight">340+</div>
                                <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Creators</div>
                            </div>
                            <div className="bg-white py-5 px-4 text-center">
                                <div className="font-['Playfair_Display'] text-2xl leading-tight">80+</div>
                                <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Brand Partners</div>
                            </div>
                            <div className="bg-white py-5 px-4 text-center">
                                <div className="font-['Playfair_Display'] text-2xl leading-tight">100%</div>
                                <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Escrow Secured</div>
                            </div>
                        </div>
                    </div>

            </section>
            {/* Mobile stats strip (below hero, visible only on mobile) */}
            <div className="md:hidden grid grid-cols-2 gap-px bg-[#E5E5DF] border-t border-b border-[#E5E5DF]">
                <div className="bg-white py-5 px-4 text-center">
                    <div className="font-['Playfair_Display'] text-2xl leading-tight">2.4M+</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Paid to Creators</div>
                </div>
                <div className="bg-white py-5 px-4 text-center">
                    <div className="font-['Playfair_Display'] text-2xl leading-tight">340+</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Creators</div>
                </div>
                <div className="bg-white py-5 px-4 text-center">
                    <div className="font-['Playfair_Display'] text-2xl leading-tight">80+</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Brand Partners</div>
                </div>
                <div className="bg-white py-5 px-4 text-center">
                    <div className="font-['Playfair_Display'] text-2xl leading-tight">100%</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] text-[#888880] mt-1">Escrow Secured</div>
                </div>
            </div>

            {/* Brand Marquee */}
            <div className="marquee-strip border-t border-b border-[#E5E5DF] py-4 overflow-hidden bg-white">
                <div className="marquee-inner whitespace-nowrap will-change-transform animate-marquee">
                    <span className="marquee-item text-xs md:text-sm">Khaadi</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Dawlance</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Bata Pakistan</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Nestlé Pakistan</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Jazz</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Habib Bank</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Interwood</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Foodpanda</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Alkaram</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Sapphire</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    {/* Duplicate for seamless loop */}
                    <span className="marquee-item text-xs md:text-sm">Khaadi</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Dawlance</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Bata Pakistan</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Nestlé Pakistan</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Jazz</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Habib Bank</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Interwood</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Foodpanda</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Alkaram</span><span className="marquee-sep text-xs md:text-sm">·</span>
                    <span className="marquee-item text-xs md:text-sm">Sapphire</span><span className="marquee-sep text-xs md:text-sm">·</span>
                </div>
            </div>

            {/* Featured Creators */}
            <section className="mob-section bg-white border-t border-b border-[#E5E5DF] py-8 md:py-12 px-4 md:px-10 border-t-[var(--rule)]">
                <div className="mob-section-inner max-w-[1000px] mx-auto">
                    <div className="mob-section-hd">
                        <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl mb-4 md:mb-6">How It Works</h2>
                    </div>
                    <div className="escrow-steps-mob flex flex-col gap-6 md:gap-8">
                        {/* Step 1 */}
                        <div className="escrow-step flex gap-4 items-start">
                            <div className="step-num w-8 h-8 flex items-center justify-center rounded-full bg-black text-white text-sm font-bold shrink-0">1</div>
                            <div className="step-body">
                                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Brand Posts Campaign</h4>
                                <p className="text-xs text-[#3A3A36] leading-relaxed">
                                    Brand deposits budget into HYIPE escrow and posts the campaign brief to the marketplace.
                                </p>
                            </div>
                        </div>
                        {/* Step 2 */}
                        <div className="escrow-step flex gap-4 items-start">
                            <div className="step-num w-8 h-8 flex items-center justify-center rounded-full bg-black text-white text-sm font-bold shrink-0">2</div>
                            <div className="step-body">
                                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Creator Applies</h4>
                                <p className="text-xs text-[#3A3A36] leading-relaxed">
                                    Verified creators browse and apply with a pitch. Brand reviews and selects the best fit.
                                </p>
                            </div>
                        </div>
                        {/* Step 3 */}
                        <div className="escrow-step flex gap-4 items-start">
                            <div className="step-num w-8 h-8 flex items-center justify-center rounded-full bg-black text-white text-sm font-bold shrink-0">3</div>
                            <div className="step-body">
                                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Content is Delivered</h4>
                                <p className="text-xs text-[#3A3A36] leading-relaxed">
                                    Creator delivers content on time. Brand reviews and approves within the agreed window.
                                </p>
                            </div>
                        </div>
                        {/* Step 4 */}
                        <div className="escrow-step flex gap-4 items-start">
                            <div className="step-num w-8 h-8 flex items-center justify-center rounded-full bg-black text-white text-sm font-bold shrink-0">4</div>
                            <div className="step-body">
                                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Payment Released</h4>
                                <p className="text-xs text-[#3A3A36] leading-relaxed">
                                    Once approved, HYIPE releases payment instantly. No chasing. No delays.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Box */}
            <section className="px-4 md:px-10 py-12 md:py-20">
                {/* Single container – stacks vertically on all screens, centered on desktop */}
                <div className="bg-[#0D0D0B] text-white rounded p-8 md:p-16 flex flex-col items-center max-w-[1120px] mx-auto">
                    {/* Heading – centered on all screens */}
                    <h2 className="text-3xl md:text-5xl md:font-['Playfair_Display'] leading-tight text-center mb-4 md:mb-6">
                        Ready to grow{" "}
                        <em className="not-italic text-lime-400 md:text-white/50 md:italic">
                            together?
                        </em>
                    </h2>

                    {/* Description – visible on all screens, centered */}
                    <p className="text-white/70 text-center max-w-sm md:max-w-2xl mx-auto mb-6 leading-relaxed text-sm md:text-base">
                        Join Pakistan&#39;s most trusted influencer marketplace. Start
                        collaborating with brands and creators today.
                    </p>

                    {/* Trust badge – desktop only, centered */}
                    <div className="hidden md:block text-xs text-white/40 text-center mb-6">
                        Trusted by 200+ brands across Pakistan
                    </div>

                    {/* Buttons container – stacked on mobile, side-by-side on desktop */}
                    <div className="flex flex-col md:flex-row gap-3 items-center mt-2">
                        <Link
                            href="/auth"
                            className="w-full max-w-xs px-6 py-3.5 bg-[#C8F04A] text-[#0D0D0B] font-semibold rounded-full
                       hover:bg-lime-300 transition text-center
                       md:w-auto md:max-w-none md:px-7 md:py-3 md:text-xs md:font-medium
                       md:uppercase md:tracking-[0.08em] md:rounded-sm"
                        >
                            Post a Campaign →
                        </Link>

                        <Link
                            href="/marketplace"
                            className="w-full max-w-xs px-6 py-3.5 bg-transparent text-white font-semibold rounded-full
                       border-2 border-white/30 hover:border-white/60 transition text-center
                       md:w-auto md:max-w-none md:px-7 md:py-3 md:text-xs md:font-medium
                       md:uppercase md:tracking-[0.08em] md:rounded-sm md:text-white/90
                       md:hover:bg-white/5"
                        >
                            Browse Campaigns →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Founder Note */}
            <section className="founder-section max-w-[800px] mx-auto my-12 md:my-16 px-4 md:px-10">
                <div className="founder-tag text-[11px] tracking-[0.12em] uppercase text-[#888880] mb-6 flex items-center gap-3">
                    <span className="block w-8 h-px bg-[#888880]"></span>
                    A note from the founder
                </div>
                <blockquote className="font-['Playfair_Display'] text-xl md:text-2xl leading-relaxed italic text-[#3A3A36] border-l-2 border-[#0D0D0B] pl-5 md:pl-7 mb-6">
                    &ldquo;I built HYIPE because I&rsquo;ve seen too many incredible Pakistani creators get burned by brands that never paid — and too many brands get let down by influencers who disappeared after payment. There had to be a better way.&rdquo;
                </blockquote>
                <div className="founder-sig flex items-center gap-3.5">
                    <div className="founder-avatar w-11 h-11 rounded-full bg-[#E0E0DA] flex items-center justify-center font-['Playfair_Display'] text-base font-bold text-[#3A3A36]">F</div>
                    <div className="founder-sig-info text-sm">
                        <strong className="block font-medium">[Founder Name]</strong>
                        <span className="text-[#888880] text-[11px] uppercase tracking-[0.06em]">Founder, HYIPE · Islamabad</span>
                    </div>
                </div>
                <div className="mt-6 text-sm text-[#3A3A36] leading-relaxed">
                    HYIPE is bootstrapped, proudly Pakistani, and built on a single promise: that every creator gets paid and every brand gets results. We&rsquo;re starting small and growing with you.
                </div>
            </section>

            {/* Transparency Note */}
            <section className="transparency bg-[#F5F5EF] border-t border-b border-[#E5E5DF] py-8 md:py-12 px-4 md:px-10">
                <div className="transparency-inner max-w-[1000px] mx-auto">
                    {/* Heading – same across all screens */}
                    <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl mb-4 md:mb-6">
                        Why creators trust us
                    </h3>

                    {/*
          MOBILE: simple vertical list (mob-trust, mob-trust-item)
          DESKTOP: 3-column card grid (adds gap, padding, background, border)
        */}
                    <div className="mob-trust grid grid-cols-1 md:grid-cols-3 md:gap-8">
                        {trustItems.map((item, index) => (
                            <div
                                key={index}
                                className="mob-trust-item md:p-5 md:bg-white md:border md:border-[#E5E5DF] md:rounded"
                            >
                                <div className="icon text-xl mb-2.5">{item.icon}</div>
                                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-[#3A3A36] leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0D0D0B] text-white">
                <div className="px-4 md:px-10 py-8 md:py-12">

                    {/* Mobile Layout */}
                    <div className="md:hidden">
                        {/* Logo */}
                        <Link href="/" className="inline-flex items-center mb-4">
                            <Image
                                src="/Layer 3.svg"
                                alt="HYIPE"
                                width={0}
                                height={0}
                                className="h-8 w-auto"
                                priority
                            />
                        </Link>

                        <p className="text-sm text-white/60 mb-8">
                            Pakistan&apos;s first escrow-backed influencer marketplace.
                        </p>

                        {/* Platform */}
                        <div className="mb-6">
                            <h4 className="text-xs uppercase tracking-[0.12em] text-white/40 mb-3">
                                Platform
                            </h4>

                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                                <a href="#" className="text-sm text-white/70">Marketplace</a>
                                <a href="#" className="text-sm text-white/70">How it Works</a>
                                <a href="#" className="text-sm text-white/70">For Brands</a>
                                <a href="#" className="text-sm text-white/70">For Creators</a>
                            </div>
                        </div>

                        {/* Company */}
                        <div className="mb-6">
                            <h4 className="text-xs uppercase tracking-[0.12em] text-white/40 mb-3">
                                Company
                            </h4>

                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                                <a href="#" className="text-sm text-white/70">About</a>
                                <a href="#" className="text-sm text-white/70">Blog</a>
                                <a href="#" className="text-sm text-white/70">Careers</a>
                                <a href="#" className="text-sm text-white/70">Contact</a>
                            </div>
                        </div>

                        {/* Legal */}
                        <div className="mb-8">
                            <h4 className="text-xs uppercase tracking-[0.12em] text-white/40 mb-3">
                                Legal
                            </h4>

                            <div className="flex flex-wrap gap-x-5 gap-y-2">
                                <a href="#" className="text-sm text-white/70">Privacy Policy</a>
                                <a href="#" className="text-sm text-white/70">Terms of Service</a>
                                <a href="#" className="text-sm text-white/70">Escrow Policy</a>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between text-[11px] text-white/30">
                                <span>© 2025 HYIPE. All rights reserved.</span>
                                <span>🇵🇰 Pakistan</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-4 gap-10">
                        <div>
                            <Link href="/" className="flex items-center mb-3">
                                <Image
                                    src="/Layer 3.svg"
                                    alt="HYIPE"
                                    width={0}
                                    height={0}
                                    className="h-8 w-auto"
                                    priority
                                />
                            </Link>

                            <p className="text-xs text-white/40 leading-relaxed mb-5">
                                Pakistan&apos;s first escrow-backed influencer marketplace.
                            </p>

                            <div className="text-[11px] text-white/30">
                                www.thehyipe.com
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] tracking-[0.12em] uppercase text-white/40 mb-3.5">
                                Platform
                            </h4>

                            <ul className="space-y-2">
                                <li><a href="#" className="text-white/70 text-sm">Marketplace</a></li>
                                <li><a href="#" className="text-white/70 text-sm">How it Works</a></li>
                                <li><a href="#" className="text-white/70 text-sm">For Brands</a></li>
                                <li><a href="#" className="text-white/70 text-sm">For Creators</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] tracking-[0.12em] uppercase text-white/40 mb-3.5">
                                Company
                            </h4>

                            <ul className="space-y-2">
                                <li><a href="#" className="text-white/70 text-sm">About</a></li>
                                <li><a href="#" className="text-white/70 text-sm">Blog</a></li>
                                <li><a href="#" className="text-white/70 text-sm">Careers</a></li>
                                <li><a href="#" className="text-white/70 text-sm">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] tracking-[0.12em] uppercase text-white/40 mb-3.5">
                                Legal
                            </h4>

                            <ul className="space-y-2">
                                <li><a href="#" className="text-white/70 text-sm">Privacy Policy</a></li>
                                <li><a href="#" className="text-white/70 text-sm">Terms of Service</a></li>
                                <li><a href="#" className="text-white/70 text-sm">Escrow Policy</a></li>
                                <li><a href="#" className="text-white/70 text-sm">Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Desktop Bottom Bar */}
                <div className="hidden md:flex border-t border-white/10 px-10 py-4 justify-between text-[11px] text-white/30">
                    <span>© 2025 HYIPE. All rights reserved.</span>
                    <span>🇵🇰 Pakistan</span>
                </div>
            </footer>


                <style>{`
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                  animation: marquee 30s linear infinite;
                }
                .marquee-item {
                  display: inline-block;
                  margin-right: 1rem;
                  font-weight: 500;
                }
                .marquee-sep {
                  display: inline-block;
                  margin-right: 1rem;
                  opacity: 0.4;
                }
            `}</style>
        </div>
    );
}