import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "optional",
  preload: true,
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"], // 优化：减少字重数量 -50%，预计节省 ~100-200ms LCP
  display: "optional",
  adjustFontFallback: true, // 优化：减少字体加载时的布局偏移
  preload: true, // 优化：预加载关键字体
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "optional",
});

export const metadata: Metadata = {
  title: "超级视频Agent — AI视频生产力OS",
  description: "用AI生成顶尖短视频和长视频，支持脚本创意、分镜图、视频生成与二创",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* 内联关键CSS - 加速首屏渲染 */}
        <style dangerouslySetInnerHTML={{__html: `
          html{height:100%}
          body{min-height:100%;display:flex;flex-direction:column;background:#0a0a0f;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow-x:hidden}
          .hero-gradient{background:linear-gradient(to bottom right,#09090b,#18181b,rgba(6,182,212,0.2))}
          .title-gradient{background:linear-gradient(to right,#ffffff,#a5f3fc,#ffffff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
          .font-display{font-family:Georgia,serif}
          .font-body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
          main{flex:1;display:flex;flex-direction:column}
          .h-full{height:100%}
          .relative{position:relative}
          .flex{display:flex}
          .flex-col{flex-direction:column}
          .items-center{align-items:center}
          .justify-center{justify-content:center}
          .text-center{text-align:center}
          .text-base{font-size:1rem;line-height:1.5rem}
          .text-zinc-400{color:rgb(161 161 170)}
          .mb-8{margin-bottom:2rem}
          .max-w-2xl{max-width:42rem}
          .mx-auto{margin-left:auto;margin-right:auto}
          .px-4{padding-left:1rem;padding-right:1rem}
          .py-20{padding-top:5rem;padding-bottom:5rem}
        `}} />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="超级视频" />
        <meta name="application-name" content="超级视频Agent" />
        <meta name="theme-color" content="#06b6d4" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />

        {/* 预连接到外部域名 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS预解析 */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <WebVitalsReporter />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
