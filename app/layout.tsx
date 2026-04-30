import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/app/_lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ExamPro — Student & Admin Dashboard',
  description: 'Expert exam preparation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning style={{ height: '100%' }} className={cn("font-sans", geist.variable)}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@100..900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body style={{ height: '100%', margin: 0 }}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
