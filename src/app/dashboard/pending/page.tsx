// src/app/dashboard/pending/page.tsx
import Link from 'next/link';

export default function PendingVerificationPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-48px)] bg-[#F6F6F2]">
            <div className="text-center max-w-md">
                <div className="text-5xl mb-6">⏳</div>
                <h1 className="font-['Playfair_Display'] text-3xl mb-4">Verification Pending</h1>
                <p className="text-[#888880] text-sm leading-relaxed mb-8">
                    Your account is currently under review. Once our team verifies your profile, you’ll gain
                    full access to the platform. This usually takes 1–2 business days.
                </p>
                <div className="bg-white border border-[#E5E5DF] rounded p-5 mb-6">
                    <p className="text-sm text-[#3A3A36]">
                        If you believe this is an error or need immediate assistance, please contact support.
                    </p>
                </div>
                <Link
                    href="/"
                    className="btn-primary bg-[#0D0D0B] text-white px-6 py-3 text-xs uppercase tracking-[0.06em]"
                >
                    ← Back to Homepage
                </Link>
            </div>
        </div>
    );
}