// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import solidJs from '@astrojs/solid-js';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { asidesPlugin } from './src/lib/build-time/asidesPlugin';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[asidesPlugin, {}], rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    }
  },

  integrations: [
    solidJs(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[asidesPlugin, {}], rehypeKatex],
      shikiConfig: {
        themes: {
          light: 'github-light',
          dark: 'github-dark'
        }
      }
    })
  ],
  adapter: vercel()
});