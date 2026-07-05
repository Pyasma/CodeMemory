import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Inter, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeMemory",
  description: "Chat with Repos and their commits using amazing memory of Cognee",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "CodeMemory",
    description: "Chat with Repos and their commits using amazing memory of Cognee",
    images: [
      {
        url: "/image.png",
        width: 405,
        height: 617,
        alt: "CodeMemory preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeMemory",
    description: "Chat with Repos and their commits using amazing memory of Cognee",
    images: ["/image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ baseTheme: dark } as any}>
          <NextTopLoader
            color="#BC9BFF"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #BC9BFF,0 0 5px #BC9BFF"
          />
          {children}
          <Toaster position="bottom-right" theme="dark" closeButton richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}
