'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useEffect, useState } from 'react';

// Clerk renders its own sign-in surface, so the brand has to be described to it
// rather than styled from our stylesheet. This sits above ThemeProvider and
// reads the resolved appearance off the document instead of from that context,
// because it is the thing wrapping it.
//
// The values are literals kept in step with globals.css by hand: Clerk derives
// shades from the variables it is given and cannot do that arithmetic on a CSS
// custom property.
const BRAND = {
  light: {
    colorBackground: '#ffffff',
    colorText: '#191233',
    colorTextSecondary: '#625c7d',
    colorInputBackground: '#f0eef9',
    colorInputText: '#191233',
    colorPrimary: '#4b45c6',
  },
  dark: {
    colorBackground: '#201a42',
    colorText: '#f1effb',
    colorTextSecondary: '#a49dc4',
    colorInputBackground: '#1a1536',
    colorInputText: '#f1effb',
    colorPrimary: '#6656e0',
  },
};

export default function ClerkBrandProvider({ children }) {
  const [resolved, setResolved] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const read = () => {
      const attr = root.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') {
        setResolved(attr);
        return;
      }
      setResolved(media.matches ? 'dark' : 'light');
    };

    read();

    // The attribute is written by ThemeProvider below us, so watching the
    // element is the only way to hear about a change to it.
    const observer = new MutationObserver(read);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    media.addEventListener('change', read);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', read);
    };
  }, []);

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolved === 'dark' ? dark : undefined,
        variables: {
          ...BRAND[resolved],
          borderRadius: '16px',
          fontFamily: "'futura-pt', Futura, sans-serif",
        },
        elements: {
          card: { boxShadow: 'var(--lift)' },
          formButtonPrimary: { textTransform: 'none', fontWeight: 700 },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
