/**
 * Generates a random integer between min and max (inclusive).
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns A random integer.
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a string of random digits (e.g., a 6-digit code).
 * @param length The length of the code.
 * @returns A string of random digits.
 */
export const generateCode = (length: number): string => {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
