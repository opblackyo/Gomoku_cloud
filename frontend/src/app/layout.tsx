import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "五子棋對戰平台 | Gomoku Online",
  description: "高性能五子棋對戰網頁應用程式，支援即時對戰、積分系統、段位排名",
  keywords: ["五子棋", "Gomoku", "對戰", "線上遊戲", "棋類遊戲"],
};

/**
 * 根佈局元件
 * 
 * 提供全域樣式和 Provider 包裝
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        {children}
      </body>
    </html>
  );
}
