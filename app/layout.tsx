import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KapitalX - Menaxhimi i Projekteve",
  description: "Sistemi profesional për menaxhimin e projekteve të konstruksioneve metalike dhe sistemeve solare",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sq" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(0, 0%, 7%)",
              border: "1px solid hsl(0, 0%, 14.9%)",
              color: "hsl(0, 0%, 98%)",
            },
          }}
        />
      </body>
    </html>
  );
}
