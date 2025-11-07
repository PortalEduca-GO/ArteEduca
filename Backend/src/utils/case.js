export const toCamel = (str = '') => str.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());

export const keysToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(keysToCamel);
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[toCamel(key)] = keysToCamel(value);
      return acc;
    }, {});
  }
  return obj;
};

export const toSnake = (str = '') => str
  .replace(/([A-Z])/g, '_$1')
  .replace(/-/g, '_')
  .toLowerCase();

export const keysToSnake = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(keysToSnake);
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[toSnake(key)] = keysToSnake(value);
      return acc;
    }, {});
  }
  return obj;
};
