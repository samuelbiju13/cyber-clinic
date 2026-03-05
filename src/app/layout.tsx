import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Cyber-Clinic | Neural Hospital Management System",
  description:
    "A futuristic, high-fidelity Hospital Management System with AI-powered drug interaction analysis, encrypted medical records, and real-time vitals monitoring.",
  keywords: ["hospital", "management", "AI", "prescriptions", "medical records"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (/Loading chunk [\\d]+ failed/.test(e.message) || /ChunkLoadError/.test(e.message)) {
                  console.warn('ChunkLoadError detected. Reloading...');
                  window.location.reload(true);
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#0B0E11' }}
      >
        {children}
      </body>
    </html>
  );
}
