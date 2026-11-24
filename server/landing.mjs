// Pages per subject and grade (/appar/matte, /appar/matte/fk-2): the catalogue's apps for what
// parents and teachers search for, with a short text and the parts of Lgr22 the apps train. The
// same data feeds the page in the browser (GET /api/landing/…) and the server-rendered HTML.

const SUBJECTS = {
  matte: {
    name: 'Matte', noun: 'matteappar', plural: 'Matteappar',
    intro: 'Taluppfattning, de fyra räknesätten, klockan, geometri och problemlösning – övat i korta omgångar med direkt återkoppling.',
  },
  sprak: {
    name: 'Språk', noun: 'språkappar', plural: 'Språkappar',
    intro: 'Läsa, skriva, stava, rimma och öva glosor på svenska och engelska – i appar som läser upp och låter barnet försöka igen.',
  },
  stem: {
    name: 'STEM', noun: 'STEM-appar', plural: 'STEM-appar',
    intro: 'Naturvetenskap, teknik och programmering: experiment, konstruktioner och logik att utforska på egen hand.',
  },
  samhalle: {
    name: 'Samhälle', noun: 'samhällsappar', plural: 'Samhällsappar',
    intro: 'Geografi, kartor och hur samhället fungerar – för att hitta i världen och förstå den.',
  },
  kreativt: {
    name: 'Kreativt', noun: 'kreativa appar', plural: 'Kreativa appar',
    intro: 'Musik, berättande, teater och bild – appar där barnet skapar något eget.',
  },
};

const AGES = {
  fs: { name: 'förskoleklass', short: 'FS' },
  'fk-2': { name: 'förskoleklass till årskurs 2', short: 'FK–2' },
  '3-6': { name: 'årskurs 3–6', short: '3–6' },
  '7-9': { name: 'årskurs 7–9', short: '7–9' },
};

/** A page is worth having (and indexing) from this many apps. */
export const LANDING_MIN_APPS = 2;

const cat = (a, type) => a.categories.find((c) => c.type === type);

/** The pages that exist: every subject with apps, and subject × grade with at least LANDING_MIN_APPS. */
export function landingPages(store) {
  const apps = store.listPublicApps({ sort: 'recommended' });
  const pages = [];
  for (const subject of Object.keys(SUBJECTS)) {
    const inSubject = apps.filter((a) => a.categories.some((c) => c.type === 'subject' && c.slug === subject));
    if (inSubject.length >= LANDING_MIN_APPS) pages.push({ subject, age: null, count: inSubject.length });
    for (const age of Object.keys(AGES)) {
      const n = inSubject.filter((a) => a.categories.some((c) => c.type === 'age' && c.slug === age)).length;
      if (n >= LANDING_MIN_APPS) pages.push({ subject, age, count: n });
    }
  }
  return pages;
}

export const landingPath = (subject, age) => `/appar/${subject}${age ? `/${age}` : ''}`;

/** The page for a subject (and grade), or null when there is no such page. */
export function landing(store, subject, age = null) {
  const s = SUBJECTS[subject];
  if (!s || (age && !AGES[age])) return null;
  const pages = landingPages(store);
  if (!pages.some((p) => p.subject === subject && p.age === (age || null))) return null;
  const apps = store.listPublicApps({ sort: 'recommended', subjects: [subject], ages: age ? [age] : undefined });
  const g = age ? AGES[age] : null;
  const title = `${s.plural} för ${g ? g.name : 'barn'}`;
  const areas = new Map();
  for (const a of apps) {
    for (const p of a.curriculum || []) {
      const key = p.area_id || p.id;
      if (!areas.has(key)) areas.set(key, { id: key, name: `${p.subject_name || p.subject} ${String(p.stage || '').replace('-', '–')}: ${p.area || ''}`.trim(), apps: 0 });
      areas.get(key).apps++;
    }
  }
  const grades = [...new Set(apps.map((a) => cat(a, 'age')?.name).filter(Boolean))];
  const description = `${apps.length} gratis ${s.noun}${g ? ` för ${g.name}` : ''}, byggda av föräldrar och kopplade till Lgr22. ` +
    'Ingen inloggning, ingen reklam – fungerar på iPad och dator.';
  return {
    path: landingPath(subject, age),
    subject: { slug: subject, name: s.name },
    age: age ? { slug: age, name: g.name, short: g.short } : null,
    title,
    description,
    intro: `${s.intro} Alla appar är gratis, utan inloggning och utan reklam, och fungerar på iPad och dator.` +
      (grades.length && !g ? ` Här finns appar för ${grades.join(', ')}.` : ''),
    apps: apps.map((a) => ({
      id: a.id, title: a.title, description: a.description, url: a.url, image_url: a.image_url,
      categories: a.categories,
    })),
    curriculum: [...areas.values()].sort((x, y) => y.apps - x.apps).slice(0, 8),
    related: pages.filter((p) => p.subject === subject && p.age !== (age || null))
      .map((p) => ({ path: landingPath(p.subject, p.age), title: p.age ? `${s.name} ${AGES[p.age].short}` : `Alla ${s.noun}`, count: p.count })),
    other_subjects: Object.keys(SUBJECTS).filter((x) => x !== subject && pages.some((p) => p.subject === x && !p.age))
      .map((x) => ({ path: landingPath(x), title: SUBJECTS[x].plural })),
  };
}
