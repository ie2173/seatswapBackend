/**
 * calculates geometric mean
 * @param {number[]} numbers - An array of numbers to calculate the geometric mean for.
 * @returns {number} The geometric mean of the input numbers.
 *
 */
export const geometricMean = (numbers: number[]): number => {
  if (numbers.length === 0) {
    throw new Error("Input array cannot be empty");
  }
  const product = numbers.reduce((acc, num) => acc * num, 1);
  return Math.pow(product, 1 / numbers.length);
};
