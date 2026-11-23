/** Ramens toning per ämne (mörk → ljus). Okänt eller inget ämne får neutral mörkgrå. */
const FRAME_COLORS: Record<string, [string, string]> = {
  matte: ['#1d3577', '#3457b8'],
  stem: ['#0f5c4d', '#1f8a6f'],
  sprak: ['#4a2585', '#7446bd'],
  kreativt: ['#7a1d4a', '#b33a74'],
  samhalle: ['#7a3d12', '#b8601f'],
};
const FRAME_NEUTRAL: [string, string] = ['#2b3038', '#4a515c'];

export interface ThumbnailCategory {
  type?: string;
  slug?: string;
  icon?: string | null;
  name?: string;
}

/** Ämnets symbol (emoji), för kortet utan bild. */
export function subjectIcon(categories?: ThumbnailCategory[]): string | null {
  return categories?.find((c) => c.type === 'subject')?.icon || null;
}

export function frameColors(categories?: ThumbnailCategory[]): [string, string] {
  const subject = categories?.find((c) => c.type === 'subject')?.slug;
  return (subject && FRAME_COLORS[subject]) || FRAME_NEUTRAL;
}
