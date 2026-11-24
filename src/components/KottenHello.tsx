import { useEffect, useRef, useState } from 'react';
import { Kotten, type KottenMood } from '@/components/Kotten';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Kotten on the start page: asleep for a moment, then wakes up, grows, waves and asks what you want to build.
 * A tap makes it cheer. With reduced motion it is simply there, awake, with its greeting.
 */
export function KottenHello({ className }: { className?: string }) {
  const still = reducedMotion();
  const [mood, setMood] = useState<KottenMood>(still ? 'hej' : 'sover');
  const [awake, setAwake] = useState(still);
  const cheer = useRef<number>();

  useEffect(() => {
    if (still) return;
    const t = window.setTimeout(() => { setMood('hej'); setAwake(true); }, 700);
    return () => { window.clearTimeout(t); window.clearTimeout(cheer.current); };
  }, [still]);

  const tap = () => {
    setAwake(true);
    setMood('jublar');
    window.clearTimeout(cheer.current);
    cheer.current = window.setTimeout(() => setMood('hej'), 1400);
  };

  return (
    <div className={`kotten-hello ${awake ? 'is-awake' : ''} ${mood === 'jublar' ? 'is-cheering' : ''} ${className ?? ''}`}>
      <p className="kotten-bubble" aria-hidden={!awake}>
        {mood === 'jublar' ? 'Hurra!' : <>Vad vill ni bygga?</>}
      </p>
      <button type="button" onClick={tap} className="kotten-figure" aria-label="Kotten säger hej – tryck för att heja">
        <Kotten mood={mood} attribute={mood === 'jublar'} title="" className="h-full w-full" />
      </button>
    </div>
  );
}
