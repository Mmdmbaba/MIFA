import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/mifa/theme-provider";
import { QueryProvider } from "@/components/mifa/query-provider";

export const metadata: Metadata = {
  title: "MIFA — پولت رو بشناس، بیشتر نگه دار",
  description:
    "دستیار شخصی مدیریت مالی MIFA: برنامه هوشمند ماهانه با دوره دلخواه جلالی، سقف خرج روزانه، کشف نشت پول و پیش‌بینی آخر دوره",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/ribbon-tile-32.png",
    apple: "/brand/ribbon-apple.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#252A34",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
