import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function changeLabel(change: string): string {
  const map: Record<string, string> = {
    much_better: 'Much Better',
    slightly_better: 'Slightly Better',
    same: 'No Change',
    slightly_worse: 'Slightly Worse',
    much_worse: 'Much Worse',
  };
  return map[change] ?? change;
}

export function changeColor(change: string): string {
  const map: Record<string, string> = {
    much_better: '#10b981',
    slightly_better: '#34d399',
    same: '#94a3b8',
    slightly_worse: '#f97316',
    much_worse: '#ef4444',
  };
  return map[change] ?? '#94a3b8';
}

export function feelingEmoji(level: number): string {
  const emojis = ['', '\u{1F623}', '\u{1F61F}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'];
  return emojis[level] ?? '\u{1F610}';
}

export function painColor(level: number): string {
  if (level <= 3) return '#10b981';
  if (level <= 5) return '#f59e0b';
  if (level <= 7) return '#f97316';
  return '#ef4444';
}

export function trendLabel(trend: string): string {
  const map: Record<string, string> = {
    improving: 'Improving',
    stable: 'Stable',
    declining: 'Declining',
    mixed: 'Mixed',
    worsening: 'Worsening',
  };
  return map[trend] ?? trend;
}

export function trendColor(trend: string): string {
  const map: Record<string, string> = {
    improving: '#10b981',
    stable: '#6366f1',
    declining: '#ef4444',
    mixed: '#f59e0b',
    worsening: '#ef4444',
  };
  return map[trend] ?? '#94a3b8';
}
