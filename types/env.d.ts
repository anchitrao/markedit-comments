/// <reference types="vite/client" />

declare module '*.css?raw' {
  const content: string;
  export default content;
}

/** Package version, injected at build time from package.json. */
declare const __PKG_VERSION__: string;

declare module 'markdown-it-task-lists';
