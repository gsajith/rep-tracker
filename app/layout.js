import './globals.css';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import { shadesOfPurple } from '@clerk/themes';
import UserBadge from '@/components/userBadge';
import SignIn from '@/components/signIn';
import styles from './layout.module.css';

export const metadata = {
  title: 'RepTracker',
  description: 'Light-weight workout tracker.',
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
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#FFFFFF' }],
  viewport:
    'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider appearance={{ baseTheme: shadesOfPurple }}>
      <html lang="en">
        <body>
          <SignedOut>
            <div className={styles.signedOutText}>
              Welcome to <b>Rep Tracker</b>!
              <br />
              <br />
              Sign in to get started tracking your workouts.
              <br />
              <br />
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
