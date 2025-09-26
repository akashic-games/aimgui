/// <reference types="vitest/config" />

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    typecheck: {
      enabled: true,
      include: ['src/**/__tests__/**/*.{test,spec}-d.?(c|m)[jt]s?(x)'],
      tsconfig: "tsconfig.test.json",
    },
  },
})
