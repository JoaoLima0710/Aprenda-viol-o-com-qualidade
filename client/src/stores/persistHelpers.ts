export const toArray = <T>(value: unknown): T[] => {
  if (value instanceof Set) {
    return Array.from(value) as T[];
  }
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
};

export const toSet = <T>(value: unknown): Set<T> => {
  if (value instanceof Set) {
    return value as Set<T>;
  }
  if (Array.isArray(value)) {
    return new Set(value as T[]);
  }
  return new Set<T>();
};
