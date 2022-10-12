export const formatLongDate = (date: number): string =>
  new Date(date as number).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
