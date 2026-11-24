import { useEffect, useState } from 'react';

/** Current time in ms, refreshed every `intervalMs` while `enabled`. */
export function useNow(enabled: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const immediate = setTimeout(tick, 0); // catch up right after (re)enabling
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(immediate);
      clearInterval(id);
    };
  }, [enabled, intervalMs]);

  return now;
}
