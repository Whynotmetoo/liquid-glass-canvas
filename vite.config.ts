import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.json',
      rollupTypes: true,
      exclude: ['demo/**']
    })
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LiquidGlassCanvas',
      fileName: (format) => `liquid-glass-canvas.${format === 'es' ? 'mjs' : 'umd.js'}`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    }
  }
});
