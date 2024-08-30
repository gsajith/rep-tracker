import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "RepTracker",
  description: "Light-weight workout tracker.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["rep", "tracker", "workout"],
  authors: [
    {
      name: "gsajith",
      url: "https://gsajith.com",
    },
  ],
  icons: [
    { rel: "apple-touch-icon", url: "icons/apple-touch-icon.png" },
    { rel: "icon", url: "icons/icon-128.png" },
  ],
};

export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>
      <html lang="en">
        <body className={inter.className}>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <div style={{ position: "absolute", top: 16, background: "rgba(0,0,0,.3)", padding: 8, borderRadius: 12, right: 12 }}>
              <UserButton showName />
            </div>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
