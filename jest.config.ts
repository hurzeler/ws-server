import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "tsconfig.json"
    }]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testMatch: ["**/test/**/*.test.ts", "**/test/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  roots: ["<rootDir>/src", "<rootDir>/test"],
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000
};

export default config;