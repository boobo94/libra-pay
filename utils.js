
/**
 * Generate a random number between values
 * @param {Number} min
 * @param {Number} max
 * @returns a random integer from min to max:
 */
export function random (min, max) {
  return Math.floor(Math.random() * max) + min
}
