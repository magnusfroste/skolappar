import { useId, type ReactNode } from 'react';

/** Kotten's faces. The expression carries the meaning; a small attribute beside it helps. */
export type KottenMood = 'hej' | 'vantar' | 'granskar' | 'godkand' | 'jublar' | 'gillar' | 'forsok' | 'sover';

const INK = '#1c1408';
const DARK = '#6b3f1c';
const SHAPE = 'M60 7 C78 19 102 46 102 72 C102 98 82 112 60 112 C38 112 18 98 18 72 C18 46 42 19 60 7 Z';

const Scale = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x - 10} ${y} Q${x} ${y + 19} ${x + 10} ${y} Z`} fill="#b47a44" stroke={DARK} strokeWidth="1.6" strokeLinejoin="round" />
);

/** One eye: large, slightly slanted, an oval pupil and a flick at the outer corner. */
function Eye({ cx, look, wide, scale = 1 }: { cx: number; look: [number, number]; wide: boolean; scale?: number }) {
  const left = cx < 60;
  const [px, py] = look;
  const lid = left
    ? `M${cx - 16} 62 L${cx - 12.5} 66 Q${cx} 52 ${cx + 12.5} 66`
    : `M${cx - 12.5} 66 Q${cx} 52 ${cx + 12.5} 66 L${cx + 16} 62`;
  return (
    <g transform={`rotate(${left ? 7 : -7} ${cx} 71) translate(${cx} 71) scale(${scale}) translate(${-cx} -71)`}>
      <ellipse cx={cx} cy="71" rx="12.5" ry="13.5" fill="#fff" />
      <ellipse cx={cx + px} cy={71 + py} rx="9.6" ry="11" fill="#74bf52" />
      <ellipse cx={cx + px} cy={71 + py} rx={wide ? 6.6 : 5.2} ry="9" fill={INK} />
      <circle cx={cx + px - 3.6} cy={71 + py - 4.6} r={wide ? 3.8 : 3} fill="#fff" />
      <circle cx={cx + px + 3.2} cy={71 + py + 4.2} r="1.6" fill="#fff" />
      <path d={lid} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const Arc = ({ cx, down = false }: { cx: number; down?: boolean }) => (
  <path d={`M${cx - 10} ${down ? 68 : 74} Q${cx} ${down ? 79 : 61} ${cx + 10} ${down ? 68 : 74}`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
);
const Heart = ({ cx, cy, k }: { cx: number; cy: number; k: number }) => (
  <path transform={`translate(${cx} ${cy}) scale(${k})`} d="M0 5 C-9 -2 -5 -9 0 -4 C5 -9 9 -2 0 5 Z" fill="#ef4f7b" />
);
const Star = ({ x, y, s, c }: { x: number; y: number; s: number; c: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2.2 -2.2 L8 0 L2.2 2.2 L0 8 L-2.2 2.2 L-8 0 L-2.2 -2.2 Z" fill={c} />
);

/**
 * Skolappar's mascot: a pine cone seen from the front, with big cat eyes.
 * `attribute={false}` leaves out the small mark beside it (for a logo, or very small sizes).
 */
export function Kotten({ mood = 'hej', attribute = true, className, title = 'Kotten' }: {
  mood?: KottenMood; attribute?: boolean; className?: string; title?: string;
}) {
  const clip = useId();
  const up = mood === 'jublar';
  const look: [number, number] = mood === 'vantar' ? [3, -3] : mood === 'forsok' ? [0, 3] : mood === 'granskar' ? [1, 1] : [0, 0];

  const scales: ReactNode[] = [];
  for (let row = 6; row >= 0; row--) {
    for (let i = 0; i < 7; i++) scales.push(<Scale key={`${row}-${i}`} x={6 + i * 18 + (row % 2) * 9} y={12 + row * 14} />);
  }

  let eyes: ReactNode;
  if (mood === 'godkand') eyes = <><Arc cx={45} /><Arc cx={75} /></>;
  else if (mood === 'sover') eyes = <><Arc cx={45} down /><Arc cx={75} down /></>;
  else if (mood === 'gillar') eyes = <><Heart cx={45} cy={71} k={1.7} /><Heart cx={75} cy={71} k={1.7} /></>;
  else eyes = <><Eye cx={45} look={look} wide={up} /><Eye cx={75} look={look} wide={up} scale={mood === 'granskar' ? 1.18 : 1} /></>;

  const cat = <path d="M53 87 q3.5 4.5 7 0 q3.5 4.5 7 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />;
  const mouth: ReactNode =
    mood === 'jublar' ? <><path d="M55 88.5 q5 9 10 0 z" fill="#8a2f3a" />{cat}</>
      : mood === 'vantar' || mood === 'granskar' ? <circle cx="60" cy="89.5" r="2.4" fill={INK} />
        : mood === 'forsok' ? <path d="M54 90 q3 -3 6 0 q3 3 6 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          : mood === 'sover' ? <path d="M57 89 q3 2 6 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            : cat;

  const mark: ReactNode = !attribute ? null
    : mood === 'vantar' ? <>{[0, 1, 2].map((i) => <circle key={i} cx={86 + i * 10} cy="14" r="3.4" fill="#f0a35c" />)}</>
      : mood === 'godkand' ? <><circle cx="100" cy="20" r="13" fill="#1f8a6f" /><path d="M93.5 20.5 l4.5 4.5 l8.5 -9" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></>
        : mood === 'jublar' ? <><Star x={18} y={20} s={1.1} c="#ffc23d" /><Star x={104} y={16} s={0.9} c="#19b3a6" /><Star x={100} y={44} s={0.6} c="#f2603a" /></>
          : mood === 'forsok' ? <><circle cx="100" cy="20" r="13" fill="#f0a35c" /><path d="M94 20 a6 6 0 1 1 2.4 4.8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><path d="M92 26.5 l4.6 -1 l-1 -4.6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>
            : mood === 'sover' ? <><text x="86" y="26" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="17" fill="#7446bd">z</text><text x="100" y="14" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="11" fill="#7446bd">z</text></>
              : mood === 'gillar' ? <Heart cx={100} cy={20} k={1.5} />
                : null;
  const magnifier = mood === 'granskar' && attribute
    ? <><circle cx="76" cy="71" r="18" fill="#bfe6ff" fillOpacity=".28" stroke="#1f2433" strokeWidth="4" /><path d="M89 84 L103 99" stroke="#1f2433" strokeWidth="6" strokeLinecap="round" /></>
    : null;

  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title} className={className}>
      {mark}
      <g transform={up ? 'translate(0 -4)' : undefined}>
        <ellipse cx="46" cy="112" rx="9" ry="4.5" fill="#d9b07a" /><ellipse cx="74" cy="112" rx="9" ry="4.5" fill="#d9b07a" />
        <path d={up ? 'M22 80 q-10 -6 -10 -18' : 'M22 84 q-8 4 -9 12'} fill="none" stroke="#d9b07a" strokeWidth="5" strokeLinecap="round" />
        <path className={mood === 'hej' ? 'kotten-wave' : undefined} d={up || mood === 'hej' ? 'M98 80 q10 -6 10 -18' : 'M98 84 q8 4 9 12'} fill="none" stroke="#d9b07a" strokeWidth="5" strokeLinecap="round" />
        <path d={SHAPE} fill="#9c6434" />
        <clipPath id={clip}><path d={SHAPE} /></clipPath>
        <g clipPath={`url(#${clip})`}>{scales}</g>
        <path d="M60 45 C83 45 93 60 93 75 C93 93 78 102 60 102 C42 102 27 93 27 75 C27 60 37 45 60 45 Z" fill="#e6bb85" />
        {[42, 60, 78].map((x) => <path key={x} d={`M${x - 10} 38 Q${x} 57 ${x + 10} 38 Z`} fill="#b47a44" stroke={DARK} strokeWidth="1.6" strokeLinejoin="round" />)}
        {eyes}
        {mood === 'forsok' && <path d="M33 55 L51 50 M69 50 L87 55" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
        <path d="M57 81.5 h6 l-3 3.4 z" fill="#d9657a" />
        {mouth}
        <ellipse cx="33" cy="86" rx="5" ry="3" fill="#ef6f6f" opacity=".45" /><ellipse cx="87" cy="86" rx="5" ry="3" fill="#ef6f6f" opacity=".45" />
        {magnifier}
      </g>
    </svg>
  );
}
