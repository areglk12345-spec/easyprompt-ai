import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { FontSizeProvider } from '../context/FontSizeContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';

import LoginModal from '../components/LoginModal';

import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'EasyPrompt AI | เครื่องมือสร้าง Prompt ฉบับเข้าใจง่าย',
  description: 'AI Accessibility Agent ที่ช่วยให้ทุกคนและผู้สูงอายุเข้าถึง AI ได้ง่ายขึ้น เปลี่ยนคำพูดธรรมดาให้เป็น Prompt ที่สมบูรณ์แบบ',
  openGraph: {
    title: 'EasyPrompt AI | เครื่องมือสร้าง Prompt ฉบับเข้าใจง่าย',
    description: 'AI Accessibility Agent ที่ช่วยให้ทุกคนและผู้สูงอายุเข้าถึง AI ได้ง่ายขึ้น เปลี่ยนคำพูดธรรมดาให้เป็น Prompt ที่สมบูรณ์แบบ',
    type: 'website',
    locale: 'th_TH',
    url: 'https://easyprompt.ai',
    siteName: 'EasyPrompt AI',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EasyPrompt AI Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyPrompt AI',
    description: 'AI Accessibility Agent ที่ช่วยให้ทุกคนและผู้สูงอายุเข้าถึง AI ได้ง่ายขึ้น',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <AuthProvider>
          <LanguageProvider>
            <FontSizeProvider>
              <ThemeProvider>
                <AccessibilityProvider>
                  {children}
                  <Toaster position="bottom-right" />

                  <LoginModal />
                </AccessibilityProvider>
              </ThemeProvider>
            </FontSizeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}