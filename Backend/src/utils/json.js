export const parseJson = (input, fallback = null) => {
  if (input === null || input === undefined) {
    return fallback;
  }
  if (typeof input === 'object') {
    return input;
  }
  try {
    return JSON.parse(input);
  } catch (error) {
    return fallback;
  }
};

export const stringifyJson = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    return null;
  }
};
