import { useState, useEffect } from 'react';

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0)    return `${days}d ${hours}h`;
  if (hours > 0)   return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function useCountdown(deadline: string | null | undefined): { label: string; urgent: boolean; expired: boolean } {
  const [ms, setMs] = useState(() =>
    deadline ? new Date(deadline).getTime() - Date.now() : 0
  );

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setMs(new Date(deadline).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return {
    label:   deadline ? formatCountdown(ms) : '—',
    urgent:  ms > 0 && ms < 2 * 60 * 60 * 1000, // < 2 hours
    expired: ms <= 0,
  };
}
