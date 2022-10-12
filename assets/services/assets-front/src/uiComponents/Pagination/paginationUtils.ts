export interface IPaginationProperties {
  offset: number;
  total: number;
  limit: number;
  actions: Array<() => void>;
}

export function buildPaginationOptions(
  total: number,
  limit: number,
  callback: (offset: number) => void,
): {
  actions: Array<() => void>;
} {
  const pageCount = Math.ceil(total / limit);
  const actions: Array<() => void> = [];
  for (let i = 0; i < pageCount; i++) {
    actions.push(() => callback(i * limit));
  }
  return { actions };
}
