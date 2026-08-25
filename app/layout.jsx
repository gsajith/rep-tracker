import './globals.css';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import TopRail from '@/components/topRail';
import SignedOutSurface from '@/components/landing/signedOutSurface';
import { WorkoutsProvider } from '@/context/workoutsProvider';
import BottomBar from '@/components/bottomBar';
import ClerkBrandProvider from '@/components/clerkBrandProvider';
import { ThemeProvider } from '@/context/themeProvider';
import { WeightUnitProvider } from '@/context/unitProvider';

export const metadata = {
  title: 'RepTracker',
  description:
    'A workout log built for one thumb and the twenty seconds between sets.',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['rep', 'tracker', 'workout'],
  authors: [
    {
      name: 'gsajith',
      url: 'https://gsajith.com',
    },
  ],
  icons: [
    { rel: 'apple-touch-icon', url: 'icons/apple-touch-icon.png' },
    { rel: 'icon', url: 'icons/icon-128.png' },
  ],
};

export const viewport = {
  viewport:
    'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
};

// Runs before first paint so the landing page never flashes in an installed
// app. matchMedia covers every modern browser; navigator.standalone covers iOS
// before 16.4, which is a real share of home-screen installs.
const STANDALONE_PROBE = `try{if(window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone){document.documentElement.setAttribute('data-standalone','')}}catch(e){}`;

// Applies the stored appearance before first paint, so someone who chose dark
// does not get a frame of light ground on every cold load.
const THEME_PROBE = `try{var t=JSON.parse(localStorage.getItem('appearance'));if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default async function RootLayout({ children }) {
  // Server-side session read, so the document arrives already in the right
  // layout mode. Deriving it from <SignedIn>/<SignedOut> instead would mean the
  // landing page's scrolling layout only applied after hydration.
  const { userId } = await auth();

  return (
    <ClerkBrandProvider>
      <ThemeProvider>
        <WeightUnitProvider>
          <html lang="en" data-surface={userId ? 'app' : 'landing'}>
            <head>
              <script dangerouslySetInnerHTML={{ __html: STANDALONE_PROBE }} />
              <script dangerouslySetInnerHTML={{ __html: THEME_PROBE }} />
            </head>
            <body>
              <SignedOut>
                <SignedOutSurface />
              </SignedOut>
              <SignedIn>
                <TopRail />
                <WorkoutsProvider>{children}</WorkoutsProvider>
                <BottomBar />
              </SignedIn>
            </body>
          </html>
        </WeightUnitProvider>
      </ThemeProvider>
    </ClerkBrandProvider>
  );
}
