import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      'quilted-gallery/react':  fileURLToPath(new URL('../../src/react/index.tsx',  import.meta.url)),
      'quilted-gallery/element': fileURLToPath(new URL('../../src/element/index.ts', import.meta.url)),
      'quilted-gallery':         fileURLToPath(new URL('../../src/index.ts',        import.meta.url))
    }
  },
  server: { fs: { allow: ['..', '.'] } }
});
