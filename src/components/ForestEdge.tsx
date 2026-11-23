/**
 * The edge of the forest under the start page's greeting: two mossy hills and a row of spruces.
 * Colours come from the theme (index.css: --spruce, --moss-hill), so at night it is a night forest.
 */
const SPRUCES: Array<[number, number]> = [
  [40, 1.0], [86, 0.7], [128, 1.15], [205, 0.8], [262, 1.05], [300, 0.65], [372, 0.95], [455, 1.2], [498, 0.75],
  [560, 0.9], [640, 1.1], [684, 0.7], [760, 1.0], [842, 0.8], [905, 1.15], [948, 0.7], [1030, 0.95], [1104, 1.1], [1160, 0.75],
];

export function ForestEdge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className}>
      <path d="M0 90 V58 C150 30 300 34 450 52 C620 72 760 28 930 40 C1040 48 1130 60 1200 50 V90 Z" fill="hsl(var(--moss-hill))" opacity="0.55" />
      {SPRUCES.map(([x, k]) => (
        <g key={x} transform={`translate(${x} 78) scale(${k})`} fill="hsl(var(--spruce))">
          <path d="M0 -46 L11 -26 H6 L15 -10 H8 L18 6 H-18 L-8 -10 H-15 L-6 -26 H-11 Z" />
          <rect x="-2.5" y="6" width="5" height="8" />
        </g>
      ))}
      <path d="M0 90 V74 C200 60 380 82 600 72 C820 62 1000 84 1200 70 V90 Z" fill="hsl(var(--moss-hill))" />
    </svg>
  );
}
