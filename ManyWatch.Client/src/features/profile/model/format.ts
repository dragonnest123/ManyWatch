const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function formatProfileDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Unknown' : dateFormatter.format(date);
}

export function formatWatchedHours(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const hours = safeSeconds / 3600;

  if (hours === 0) {
    return '0';
  }

  if (hours < 10) {
    return (Math.round(hours * 10) / 10).toFixed(1).replace(/\.0$/, '');
  }

  return String(Math.round(hours));
}
