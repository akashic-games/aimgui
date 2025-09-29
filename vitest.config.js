/// <reference types="vitest/config" />

const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    typecheck: {
      enabled: true,
      include: ['src/**/__tests__/**/*.{test,spec}-d.?(c|m)[jt]s?(x)'],
      tsconfig: "tsconfig.test.json",
    },
  },
});