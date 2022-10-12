export const hasDistinct = <T>(
  objArray: Array<T>,
  func: (element: T) => any,
): boolean => {
  const set = new Set(objArray.map(func));
  return set.size > 1;
};
