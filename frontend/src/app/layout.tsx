import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { FontSizeProvider } from '../context/FontSizeContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';

import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://easyprompt.piravat.space'),
  title: 'Verbaqo | เครื่องมือสร้าง Prompt ฉบับเข้าใจง่าย',
  description: 'AI Accessibility Agent ที่ช่วยให้ทุกคนและผู้สูงอายุเข้าถึง AI ได้ง่ายขึ้น เปลี่ยนคำพูดธรรมดาให้เป็น Prompt ที่สมบูรณ์แบบ',
  openGraph: {
    title: 'Verbaqo | เครื่องมือสร้าง Prompt ฉบับเข้าใจง่าย',
    description: 'AI Accessibility Agent ที่ช่วยให้ทุกคนและผู้สูงอายุเข้าถึง AI ได้ง่ายขึ้น เปลี่ยนคำพูดธรรมดาให้เป็น Prompt ที่สมบูรณ์แบบ',
    type: 'website',
    locale: 'th_TH',
    url: 'https://easyprompt.piravat.space',
    siteName: 'Verbaqo',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Verbaqo Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verbaqo',
    description: 'AI Accessibility Agent ที่ช่วยให้ทุกคนและผู้สูงอายุเข้าถึง AI ได้ง่ายขึ้น',
    images: ['/og-image.png'],
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

import MascotAgent from '../components/MascotAgent';
import LoginModal from '../components/LoginModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <FontSizeProvider>
              <ThemeProvider>
                <AccessibilityProvider>
                  {children}
                  <LoginModal />
                  <Toaster 
                    position="bottom-right" 
                    containerStyle={{
                      position: 'absolute',
                      bottom: '24px',
                      right: '24px',
                      top: 'auto',
                      left: 'auto',
                      width: 'auto',
                      height: 'auto',
                      pointerEvents: 'none'
                    }}
                  />
                  <MascotAgent />
                </AccessibilityProvider>
              </ThemeProvider>
            </FontSizeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}