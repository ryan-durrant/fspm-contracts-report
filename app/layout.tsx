import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "FSPM Contracts Report",
  description: "Weekly First Serve Property Management contracts report.",
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/fspm-logo.svg` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full`} style={{ colorScheme: "light" }}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
