
export const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

export const keysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc: {[key: string]: any}, key) => {
        acc[toSnakeCase(key)] = keysToSnakeCase(obj[key]);
        return acc;
      },
      {}
    );
  }
  return obj;
};

/**
 * Checks if an item is a non-array object.
 * @param item The item to check.
 * @returns {boolean} True if the item is an object, false otherwise.
 */
function isObject(item: any): item is object {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merges a source object into a target object.
 * This ensures that user settings (source) override defaults (target),
 * but new keys in defaults (target) are preserved.
 * @param target The default object (will be mutated/returned with overrides).
 * @param source The user's saved object (overrides).
 * @returns The merged object.
 */
export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  const output = { ...target } as T & U;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        (output as any)[key] = deepMerge(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        (output as any)[key] = sourceValue;
      }
    });
  }

  return output;
}
