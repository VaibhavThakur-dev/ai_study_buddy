import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
