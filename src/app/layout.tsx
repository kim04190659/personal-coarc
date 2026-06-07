import type { Metadata } from "next";
import "./globals.css";

// PWAとしてスマホのホーム画面に追加できるよう設定
export const metadata: Metadata = {
  title: "Personal CoArc",
  description: "帰宅前チェックイン：仕事を置いて、家族モードへ",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <head>
        {/* スマホのステータスバーの色を合わせる */}
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CoArc" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
