import withPWA from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Suppress Next.js 16 Turbopack error when PWA plugin adds a webpack config.
  // On Vercel (Turbopack), webpack plugin is silently skipped; sw.js is served
  // from the pre-committed public/ file. Locally we still build with --webpack.
  turbopack: {},
  transpilePackages: [
    'react-markdown',
    'remark-math',
    'rehype-katex',
    'remark-gfm',
    'unified',
    'bail',
    'is-plain-obj',
    'trough',
    'vfile',
    'unist-util-stringify-position',
    'mdast-util-from-markdown',
    'mdast-util-to-markdown',
    'mdast-util-math',
    'micromark-extension-math',
    'hast-util-to-jsx-runtime',
    'katex',
  ],
}

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig)
