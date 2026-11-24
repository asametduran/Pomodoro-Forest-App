import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number toward `target` every animation frame, so growth that is reported in
 * coarse steps (a 250ms timer tick, a scrubber, a demo jump) still looks fluid.
 * With `enabled` false the target is returned as-is.
 */
export function useSmoothValue(target: number, enabled = true, speed = 0.12): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const step = () => {
      const diff = target - current.current;
      if (Math.abs(diff) < 0.0005) {
        current.current = target;
        setValue(target);
        return;
      }
      current.current += diff * speed;
      setValue(current.current);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, speed]);

  return enabled ? value : target;
}
