import { describe, test, expect } from "bun:test";
import { geometricMean } from "../math";

describe("geometricMean", () => {
  test("should calculate geometric mean for positive numbers", () => {
    const result = geometricMean([4, 1, 1 / 32]);
    expect(result).toBeCloseTo(0.5, 5);
  });

  test("should calculate geometric mean for array of same numbers", () => {
    const result = geometricMean([5, 5, 5, 5]);
    expect(result).toBe(5);
  });

  test("should calculate geometric mean for two numbers", () => {
    const result = geometricMean([9, 16]);
    expect(result).toBe(12);
  });

  test("should calculate geometric mean for single number", () => {
    const result = geometricMean([42]);
    expect(result).toBe(42);
  });

  test("should handle large numbers", () => {
    const result = geometricMean([100, 1000, 10000]);
    expect(result).toBeCloseTo(1000, 5);
  });

  test("should handle decimal results", () => {
    const result = geometricMean([2, 8]);
    expect(result).toBe(4);
  });

  test("should throw error for empty array", () => {
    expect(() => geometricMean([])).toThrow("Input array cannot be empty");
  });

  test("should handle array with zeros", () => {
    const result = geometricMean([0, 5, 10]);
    expect(result).toBe(0);
  });
});
