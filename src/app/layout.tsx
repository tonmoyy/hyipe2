import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import AuthProvider from '@/providers/AuthProvider';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({
    subsets: ['latin'],
    weight: ['700'],  // only bold needed
    variable: '--font-cinzel',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-serif',
    weight: ['400', '500', '700'],
    style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
    weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
    title: 'HYIPE – Pakistan’s Creator Marketplace',
    description: 'Where brands meet real creators.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
        <body>
        <AuthProvider>
            <Header />
            <main>{children}</main>
        </AuthProvider>
        </body>
        </html>
    );
}