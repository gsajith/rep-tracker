import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";
import UserBadge from "@/components/userBadge";
import SignIn from "@/components/signIn";

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
            <div style={{ fontSize: 24, color: "#747176", maxWidth: 320, textAlign: "center" }}>
              Welcome to <b>Rep Tracker</b>!
              <br /><br />Sign in to get started tracking your workouts.<br /><br />
            </div>
            <SignIn />
          </SignedOut>
          <SignedIn>
            <UserBadge />
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
