// next.config.mjs

import withPWA from 'next-pwa';
import defaultRuntimeCaching from 'next-pwa/cache.js';

// next-pwa's defaults include an "apis" rule that caches same-origin /api/
// responses for 24 hours. That rule was inert while the app had no API routes,
// but it now matches per-user workout data. On a shared device an offline visit
// could surface whatever the previous signed-in user had cached, so the rule is
// removed. The "others" rule already excludes /api/, so these requests match no
// rule at all and go straight to the network.
const runtimeCaching = defaultRuntimeCaching.filter(
  (entry) => entry.options?.cacheName !== 'apis'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable React strict mode for improved error handling
  swcMinify: true, // Enable SWC minification for improved performance
  compiler: {
    // Strip console.log from production, but keep console.error. Stripping
    // everything is what made the old silent failures impossible to diagnose:
    // the handlers logged and the log never existed in the deployed app.
    removeConsole:
      process.env.NODE_ENV === 'development' ? false : { exclude: ['error'] },
  },
};

export default withPWA({
  dest: 'public', // destination directory for the PWA files
  disable: process.env.NODE_ENV === 'development', // disable PWA in the development environment
  register: true, // register the PWA service worker
  skipWaiting: true, // skip waiting for service worker activation
  runtimeCaching,
})(nextConfig);
