export const getFromStorage = (key: string, parse: boolean): any => {
  const data = localStorage.getItem(key);
  if (!data) return undefined;
  if (!parse) return data;
  return JSON.parse(data);
};

export const setOnStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const clearStorage = (keys: string[]) => {
  for (const key of keys) {
    localStorage.removeItem(key);
  }
};
