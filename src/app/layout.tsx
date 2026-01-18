import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const metadata: Metadata = {
  title: "밥총무 - 똑똑한 더치페이",
  description: "귀엽고 편리한 모임 비용 관리 서비스",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" translate="no">
      <body className={cn(inter.className, "bg-orange-50/30 min-h-screen")}>
        <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-2xl shadow-orange-100 border-x border-orange-100 flex flex-col">
          <Header />
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
