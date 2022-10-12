export const parseValue = (value: number, format: string): string => {
  const seconds = Math.floor(value % 60);
  const minutes = Math.floor((value / 60) % 60);
  const hours = Math.floor((value / (60 * 60)) % 24);
  const days = Math.floor(value / (60 * 60 * 24));
  return format
    .replace('dd', () => String(days))
    .replace('hh', () => String(hours))
    .replace('mm', () => String(minutes))
    .replace('ss', () => String(seconds));
};

export const formatValue = (value: string, format: string): number => {
  const valueParts = value.split(':').map((v) => v || '0');
  const formatParts = format.split(':');
  const valueMultiplierMap: any = {
    dd: (v: number): number => v * 24 * 60 * 60,
    hh: (v: number): number => v * 60 * 60,
    mm: (v: number): number => v * 60,
    ss: (v: number): number => v,
  };
  return valueParts
    .map((v, i) => valueMultiplierMap[formatParts[i]](parseInt(v || '0')))
    .reduce((a, v) => (a += v), 0);
};

export const parseValueExtended = (value: number, format: string): string => {
  const minutes = Math.floor((value / 60) % 60);
  const hours = Math.floor((value / (60 * 60)) % 24);
  const days = Math.floor(value / (60 * 60 * 24));
  return `${days} days ${hours} hours ${minutes} minutes`;
};
