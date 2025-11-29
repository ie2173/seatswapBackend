import { expect } from "bun:test";

// Extend expect with custom matchers
declare module "bun:test" {
  interface Matchers<T = unknown> {
    toBeOneOf(values: T[]): void;
  }
}

// Add toBeOneOf matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be one of ${expected.join(", ")}`
          : `Expected ${received} to be one of ${expected.join(", ")}`,
    };
  },
});
