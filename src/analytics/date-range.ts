export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function weekdayLabel(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function startOfWeekSunday(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function weekRange(which: 'this' | 'last' = 'this') {
  const start = startOfWeekSunday(new Date());
  if (which === 'last') {
    const from = new Date(start);
    from.setDate(from.getDate() - 7);
    const to = new Date(start);
    to.setDate(to.getDate() - 1);
    return { from: startOfDay(from), to: endOfDay(to) };
  }
  const to = new Date(start);
  to.setDate(to.getDate() + 6);
  return { from: startOfDay(start), to: endOfDay(to) };
}

export function previousPeriod(from: Date, to: Date) {
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: startOfDay(prevFrom), to: endOfDay(prevTo) };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function resolveRange(range?: string, dateFrom?: string, dateTo?: string) {
  const now = new Date();
  if (range === 'custom' || dateFrom || dateTo) {
    return {
      from: dateFrom ? startOfDay(new Date(dateFrom)) : startOfDay(now),
      to: dateTo ? endOfDay(new Date(dateTo)) : endOfDay(now),
    };
  }
  switch (range) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'this_week':
      return weekRange('this');
    case 'last_week':
      return weekRange('last');
    case '7d': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'this_month':
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(now),
      };
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case 'this_year':
      return {
        from: startOfDay(new Date(now.getFullYear(), 0, 1)),
        to: endOfDay(now),
      };
    case '30d':
    default: {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
  }
}

export function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = startOfDay(from);
  const last = startOfDay(to);
  while (cursor <= last) {
    days.push(ymd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
