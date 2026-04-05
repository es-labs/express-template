// https://www.samanthaming.com/tidbits/94-how-to-check-if-object-is-empty/
/**
 * check if object is empty, also false if not object
 * @param {any} value - time to measure the number of calls
 * @returns {boolean} -  true if empty object, false otherwise
 */
export const emptyObject = value => value && Object.keys(value).length === 0 && value.constructor === Object;
