import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/lib/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "P2P Anonymous Chat",
  keywords: [
    "p2p",
    "anonymous",
    "chat",
    "peer-to-peer",
    "decentralized",
    "privacy",
    "secure",
    "real-time",
    "communication",
    "web",
    "app",
    "real-time chat",
    "end-to-end encryption",
    "anonymous messaging",
    "no registration",
    "no login",
    "instant messaging",
    "group chat",
    "one-on-one chat",
    "public chat rooms",
    "private chat rooms",
    "file sharing",
    "media sharing",
    "emoji support",
    "real-time notifications",
    "user-friendly",
    "secure messaging",
    "anonymous chat app",
    "p2p chat app",
    "decentralized chat app",
    "privacy-focused",
    "secure chat app",
    "real-time communication app",
    "web chat app",
  ],
  description:
    "P2P Anonymous Chat is a decentralized, peer-to-peer chat application that allows users to communicate anonymously without the need for registration or login. It features real-time messaging, group chats, private rooms, and end-to-end encryption for secure communication. Built with React, Next.js, and Redux, it provides a modern and user-friendly interface for seamless communication across devices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
