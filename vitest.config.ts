import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: {
      'JSX': true,
    },
    environment: 'jsdom',
  },
});
