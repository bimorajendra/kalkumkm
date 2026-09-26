import { useEffect, useRef, useState } from 'react';

export function useTweenedNumber(value: number, duration = 180): number {
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);

  useEffect(() => {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || duration <= 0) {
      displayedRef.current = value;
      setDisplayed(value);
      return;
    }

    const startValue = displayedRef.current;
    let startTime: number | undefined;
    let frame = 0;

    function animate(timestamp: number) {
      startTime ??= timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 2;
      const nextValue = startValue + (value - startValue) * eased;
      displayedRef.current = nextValue;
      setDisplayed(nextValue);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return displayed;
}
