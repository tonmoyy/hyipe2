'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import Cookies from 'js-cookie';

export default function ComingSoonBanner() {
    // Read cookie immediately – no useEffect needed
    const [visible, setVisible] = useState<boolean>(() => {
        // Only run in the browser (avoid SSR mismatch)
        if (typeof window === 'undefined') return false;
        return !Cookies.get('hide-coming-soon');
    });

    const dismiss = () => {
        setVisible(false);
        Cookies.set('hide-coming-soon', 'true', { expires: 7 });
    };

    if (!visible) return null;

    return (
        <div className="relative z-50 bg-gradient-to-r from-[#0D0D0B] via-[#1A1A17] to-[#0D0D0B] text-white border-b border-[#C8F04A]/30 shadow-lg shadow-[#C8F04A]/10">
            <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                    <span className="text-xl" role="img" aria-label="rocket">🚀</span>
                    <p className="tracking-wider font-medium">
                        <span className="text-[#C8F04A] font-bold">HYIPE</span>{' '}
                        is launching soon! Join the waitlist for early access.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/auth?signup=true"
                        className="bg-[#C8F04A] text-[#0D0D0B] px-4 py-1.5 rounded text-xs font-bold uppercase tracking-[0.1em] hover:bg-[#A8D02A] transition-colors"
                    >
                        Get Early Access
                    </Link>
                    <button
                        onClick={dismiss}
                        className="text-white/40 hover:text-white/80 transition-colors"
                        aria-label="Close banner"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}