import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // CPU 사용량 제한
    maxWorkers: 2, // 최대 워커 프로세스 2개로 제한
    minWorkers: 1, // 최소 워커 1개
    fileParallelism: false, // 파일을 순차적으로 처리하여 CPU 부하 감소
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts',
        'examples/',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    testTimeout: 30000, // 30 seconds for tests that spawn MCP servers
    hookTimeout: 30000,
  },
});
