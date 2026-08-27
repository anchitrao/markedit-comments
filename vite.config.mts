import { defineConfig, mergeConfig } from 'vite';
import { defaultViteConfig } from 'markedit-vite';

import mainPackage from './package.json' with { type: 'json' };

export default defineConfig(mergeConfig(defaultViteConfig(), {
  define: {
    __PKG_VERSION__: JSON.stringify(mainPackage.version),
  },
}));
