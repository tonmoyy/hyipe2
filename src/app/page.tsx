// src/app/page.tsx
import Link from 'next/link';
import ComingSoonBanner from "@/components/ComingSoonBanner";
import Image from "next/image";

// Shape of a creator returned by the API – platforms can be a string or an array
interface Creator {
  id: string;
  full_name: string;
  niche: string;
  followers: string;
  engagement: string;
  platforms: string | string[];      // allow both for API flexibility
  avatar?: string;
}

async function getFeaturedCreators(): Promise<Creator[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/creators/featured`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error('Failed to fetch featured creators');
    return [];
  }
  return res.json();
}

export default async function HomePage() {
  const creators = await getFeaturedCreators();

  // Normalize platforms to always be an array of strings
  const safeCreators = creators.map((c) => ({
    ...c,
    platforms: Array.isArray(c.platforms)
        ? c.platforms
        : typeof c.platforms === 'string'
            ? c.platforms.split(',').map((p: string) => p.trim())
            : [],
  }));

  return (
      <div className="bg-[#FAFAF7]">
        <ComingSoonBanner />

        {/* Hero – unchanged */}
        <section className="hp-hero max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-15 px-4 md:px-10 py-12 md:py-20">
          <div>
            <p className="hp-hero-tag font-cinzel font-bold tracking-[0.15em] uppercase text-sm md:text-base">
              Pakistan&rsquo;s First Influencer Marketplace
            </p>
            <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl leading-tight font-bold mb-4 md:mb-7">
              Where Brands <br className="hidden sm:block" /> Meet <em className="text-[#888880] italic">Real</em><br />Creators.
            </h1>
            <p className="text-sm md:text-[15px] text-[#3A3A36] leading-relaxed mb-6 md:mb-8 max-w-[380px]">
              HYIPE connects Pakistani brands with verified content creators through a transparent, escrow-backed system. No more chasing payments. No more unpaid work.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/auth" className="btn-primary bg-[#0D0D0B] text-white px-5 py-2.5 md:px-7 md:py-3 text-xs md:text-[13px] uppercase tracking-[0.08em]">
                I&rsquo;m a Brand →
              </Link>
              <Link href="/auth" className="btn-outline border border-[#0D0D0B] text-[#0D0D0B] px-5 py-2.5 md:px-7 md:py-3 text-xs md:text-[13px] uppercase tracking-[0.08em]">
                I&rsquo;m a Creator →
              </Link>
            </div>
          </div>
          <div className="relative mt-10 md:mt-0">
            <div className="hero-img-placeholder bg-[#E8E8E2] rounded h-60 sm:h-80 md:h-[420px] flex flex-col items-center justify-center gap-2 text-[#888880] text-xs uppercase tracking-[0.05em] border border-dashed border-[#C8C8C0]">
              [ Campaign preview image ]<br />
              <span className="text-[10px] opacity-60">Full-bleed lifestyle photo<br />of creator at work</span>
            </div>
            <div className="hero-float-badge absolute bottom-4 -left-0 md:bottom-8 md:-left-8 bg-white border border-[#E5E5DF] rounded p-2 md:p-3 text-xs shadow-sm">
              <strong className="block text-base md:text-lg font-['Playfair_Display']">Rs. 2.4M+</strong>
              Paid out to creators
            </div>
            <div className="hero-float-badge2 absolute top-4 -right-2 md:top-8 md:-right-5 bg-[#C8F04A] rounded p-2 md:p-2.5 text-[10px] md:text-[11px] font-medium uppercase tracking-[0.05em] shadow-sm">
              ✓ Escrow Protected
            </div>
          </div>
        </section>

        {/* Brand Marquee – unchanged */}
        <div className="marquee-strip border-t border-b border-[#E5E5DF] py-4 overflow-hidden bg-white">
          <div className="marquee-inner whitespace-nowrap inline-block animate-marquee">
            <span className="marquee-item">Khaadi</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Dawlance</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Bata Pakistan</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Nestlé Pakistan</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Jazz</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Habib Bank</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Interwood</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Foodpanda</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Alkaram</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Sapphire</span><span className="marquee-sep">·</span>
            {/* Duplicate */}
            <span className="marquee-item">Khaadi</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Dawlance</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Bata Pakistan</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Nestlé Pakistan</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Jazz</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Habib Bank</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Interwood</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Foodpanda</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Alkaram</span><span className="marquee-sep">·</span>
            <span className="marquee-item">Sapphire</span><span className="marquee-sep">·</span>
          </div>
        </div>

        {/* Featured Creators – DYNAMIC */}
        <section className="hp-section max-w-[1200px] mx-auto px-4 md:px-10 py-12 md:py-20">
          <div className="hp-section-header flex justify-between items-baseline border-b border-[#E5E5DF] pb-4 mb-6 md:mb-10">
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-normal">Featured Creators</h2>
            <span className="text-xs text-[#888880] uppercase tracking-[0.08em] hidden sm:inline">
            Browse all creators →
          </span>
          </div>

          {safeCreators.length === 0 ? (
              <p className="text-sm text-[#888880] italic text-center py-10">
                No featured creators yet. Check back soon!
              </p>
          ) : (
              <div className="creators-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {safeCreators.map((creator) => (
                    <div key={creator.id} className="creator-card border border-[#E5E5DF] rounded overflow-hidden bg-white">
                      <div className="creator-card-img h-44 bg-[#E8E8E2] flex items-center justify-center text-[11px] text-[#888880] uppercase tracking-[0.05em] border-b border-[#E5E5DF]">
                        {creator.avatar ? (
                            <Image
                                src={creator.avatar}
                                alt={creator.full_name || 'Creator portrait'}
                                width={176}
                                height={176}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>[ Creator portrait ]</span>
                        )}
                      </div>
                      <div className="creator-card-info p-3.5">
                        <div className="name font-medium text-sm">{creator.full_name}</div>
                        <div className="niche text-[11px] text-[#888880] uppercase tracking-[0.08em] mb-2">
                          {creator.niche}
                        </div>
                        <div className="stats flex gap-3 text-[11px] text-[#3A3A36]">
                          <span>{creator.followers}</span>
                          <span>·</span>
                          <span>{creator.engagement}</span>
                        </div>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {creator.platforms.map((platform: string) => (
                              <span
                                  key={platform}
                                  className="tag bg-[#F0F0EA] text-[#3A3A36] px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.06em]"
                              >
                        {platform}
                      </span>
                          ))}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </section>

        {/* CTA Box – unchanged */}
        <section className="px-4 md:px-10 py-12 md:py-20">
          <div className="cta-box bg-[#0D0D0B] text-white rounded p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1120px] mx-auto">
            <h2 className="font-['Playfair_Display'] text-3xl md:text-5xl leading-tight max-w-[500px] text-center md:text-left">
              Ready to run<br />your first <em className="text-white/50 italic">campaign?</em>
            </h2>
            <div className="cta-box-right flex flex-col gap-3 items-center md:items-end">
              <div className="text-xs text-white/40 text-center md:text-right mb-2">Trusted by 200+ brands across Pakistan</div>
              <Link href="/auth" className="btn-lime bg-[#C8F04A] text-[#0D0D0B] px-6 py-2.5 md:px-7 md:py-3 text-xs font-medium uppercase tracking-[0.08em]">
                Post a Campaign →
              </Link>
              <button className="bg-transparent border-none text-white/50 text-xs cursor-pointer mt-1">
                Apply as a Creator instead
              </button>
            </div>
          </div>
        </section>

        {/* Founder Note – unchanged */}
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

        {/* Transparency Note – unchanged */}
        <section className="transparency bg-[#F5F5EF] border-t border-b border-[#E5E5DF] py-8 md:py-12 px-4 md:px-10">
          <div className="transparency-inner max-w-[1000px] mx-auto">
            <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl mb-4 md:mb-6">How HYIPE Protects You</h3>
            <p className="text-sm text-[#3A3A36] max-w-[560px] mb-6 md:mb-8">
              We believe in radical transparency. Here&rsquo;s exactly how our escrow system works — no hidden steps, no surprises.
            </p>
            <div className="transparency-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mt-5 md:mt-7">
              <div className="trans-item p-4 md:p-5 bg-white border border-[#E5E5DF] rounded">
                <div className="icon text-xl mb-2.5">→</div>
                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Brand Posts Campaign</h4>
                <p className="text-xs text-[#3A3A36] leading-relaxed">
                  Your campaign is reviewed by our team before going live. We verify the brief and budget before any creator sees it.
                </p>
              </div>
              <div className="trans-item p-4 md:p-5 bg-white border border-[#E5E5DF] rounded">
                <div className="icon text-xl mb-2.5">🔒</div>
                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Payment Held Securely</h4>
                <p className="text-xs text-[#3A3A36] leading-relaxed">
                  Once a deal is confirmed, payment is held via our Manual Escrow via EasyPaisa or JazzCash. Creators know the money is there.
                </p>
              </div>
              <div className="trans-item p-4 md:p-5 bg-white border border-[#E5E5DF] rounded">
                <div className="icon text-xl mb-2.5">✓</div>
                <h4 className="font-medium text-sm uppercase tracking-[0.06em] mb-1.5">Delivered & Released</h4>
                <p className="text-xs text-[#3A3A36] leading-relaxed">
                  After content is approved and deliverables confirmed, we release payment directly to the creator. Zero risk for both sides.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer – unchanged */}
        <footer className="hp-footer bg-[#0D0D0B] text-white px-4 md:px-10 py-8 md:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div>
            <div className="footer-brand font-['Playfair_Display'] text-3xl font-bold mb-3">
              <Link href="/" className="flex items-center h-full">
                <Image
                    src="/Layer 3.svg"
                    alt="HYIPE"
                    width={0}
                    height={0}
                    className="h-8 w-auto"
                    priority
                />
              </Link>
            </div>
            <div className="footer-sub text-xs text-white/40 leading-relaxed mb-5">
              Pakistan&rsquo;s first creator marketplace.<br />Secure. Transparent. Proudly Pakistani.
            </div>
            <div className="text-[11px] text-white/30">www.thehyipe.com</div>
          </div>
          <div className="footer-col">
            <h4 className="text-[10px] tracking-[0.12em] uppercase text-white/40 mb-3.5">Platform</h4>
            <ul className="flex flex-col gap-2 list-none">
              <li><a href="#" className="text-white/70 text-sm no-underline">Marketplace</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">How it Works</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Pricing</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">For Brands</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">For Creators</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="text-[10px] tracking-[0.12em] uppercase text-white/40 mb-3.5">Company</h4>
            <ul className="flex flex-col gap-2 list-none">
              <li><a href="#" className="text-white/70 text-sm no-underline">About</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Blog</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Careers</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="text-[10px] tracking-[0.12em] uppercase text-white/40 mb-3.5">Legal</h4>
            <ul className="flex flex-col gap-2 list-none">
              <li><a href="#" className="text-white/70 text-sm no-underline">Privacy Policy</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Terms of Service</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Escrow Policy</a></li>
              <li><a href="#" className="text-white/70 text-sm no-underline">Refund Policy</a></li>
            </ul>
          </div>
        </footer>
        <div className="footer-bottom bg-[#0D0D0B] border-t border-white/10 px-4 md:px-10 py-4 flex flex-col sm:flex-row justify-between text-[11px] text-white/30 gap-2">
          <span>© 2025 HYIPE. All rights reserved.</span>
          <span>Built with ♥ in Pakistan</span>
        </div>

        {/* Marquee animation style */}
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