// Lgr22: the central content of the compulsory school's syllabuses, from Skolverket's open data
// (server/content/lgr22.json, built by scripts/lgr22.mjs). Every point has an id by position:
// <subject>.<stage>.<area>.<point>, e.g. MA.1-3.1.2; an area is the id without the last part.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), 'content', 'lgr22.json');

export const POINT_ID = '^[A-ZÅÄÖ]{2,4}\\.\\d-\\d\\.\\d{1,2}\\.\\d{1,2}$';
export const AREA_ID = '^[A-ZÅÄÖ]{2,4}\\.\\d-\\d\\.\\d{1,2}$';

export function loadCurriculum() {
  const { source, subjects } = JSON.parse(readFileSync(file, 'utf8'));
  const points = new Map();
  const areas = new Map();
  for (const s of subjects) {
    for (const st of s.stages) {
      st.areas.forEach((a, ai) => {
        const areaId = `${s.code}.${st.stage}.${ai + 1}`;
        areas.set(areaId, { id: areaId, subject: s.code, subject_name: s.name, stage: st.stage, area: a.name });
        a.points.forEach((text, pi) => {
          const id = `${areaId}.${pi + 1}`;
          points.set(id, { id, subject: s.code, subject_name: s.name, stage: st.stage, area_id: areaId, area: a.name, text });
        });
      });
    }
  }
  const all = [...points.values()];

  /** The subjects with their stages and areas (no points): what there is to ask for. */
  const overview = () => subjects.map((s) => ({
    subject: s.code, name: s.name,
    stages: s.stages.map((st) => ({ stage: st.stage, areas: st.areas.map((a, ai) => ({ id: `${s.code}.${st.stage}.${ai + 1}`, name: a.name, points: a.points.length })) })),
  }));

  // Lgr22 is written in general terms: a parent's or agent's word is often not in it ("klockan" is
  // "tid", "gånger" is "räknesätt"). These lead such words to the words the curriculum uses.
  const SYNONYMS = {
    klocka: ['tid'], klockan: ['tid'], klockor: ['tid'], timme: ['tid'], minut: ['tid'], kalender: ['tid'],
    plus: ['räknesätt'], minus: ['räknesätt'], addition: ['räknesätt'], subtraktion: ['räknesätt'],
    gånger: ['räknesätt'], multiplikation: ['räknesätt'], division: ['räknesätt'], tabell: ['räknesätt'], gångertabell: ['räknesätt'],
    tiokamrater: ['delas upp', 'naturliga tal'], talkamrater: ['delas upp', 'naturliga tal'], räkna: ['räknesätt', 'antal'],
    pengar: ['pengar', 'ekonomi'], mynt: ['pengar'], former: ['geometriska'], figurer: ['geometriska'], mäta: ['mätning'], längd: ['längd'],
    stavning: ['stavning'], stava: ['stavning'], läsa: ['läsa', 'läsning'], läsning: ['läsa'], rim: ['rim', 'ljud'], bokstäver: ['bokstäver', 'ljud'],
    glosor: ['ord'], ordförråd: ['ord'], engelska: ['engelska'], programmering: ['programmering'], karta: ['kartor'], kartor: ['kartor'],
    djur: ['djur'], kroppen: ['kroppen', 'människokroppen'], väder: ['väder'], musik: ['musik'], noter: ['noter', 'musik'],
  };
  const SUBJECT_ALIASES = { matte: 'MA', matematik: 'MA', svenska: 'SV', engelska: 'EN', no: null, so: null, bild: 'BL', musik: 'MU', teknik: 'TK' };
  // a Swedish word without its usual endings, so "klockor" and "klockan" both find "klock…"
  const stem = (w) => (w.length > 5 ? w.replace(/(orna|arna|erna|ens|ans|en|an|et|or|ar|er|na|n)$/u, '') : w);
  const lower = (v) => String(v || '').trim().toLocaleLowerCase('sv');

  function subjectCode(subject) {
    const s = lower(subject);
    if (!s) return null;
    if (s in SUBJECT_ALIASES && SUBJECT_ALIASES[s]) return SUBJECT_ALIASES[s];
    const hit = subjects.find((x) => x.code.toLocaleLowerCase('sv') === s || x.name.toLocaleLowerCase('sv') === s);
    return hit ? hit.code : undefined;   // undefined: given but not known
  }

  /**
   * Points by subject (code, name or a common short name like "matte"), stage, area and words. A word
   * matches the point's text or area name, its stem, or the curriculum's word for it (SYNONYMS); with
   * several words the points that match most come first. Returns the points; `unknownSubject` when the
   * subject was not recognised.
   */
  function search({ subject, stage, area, q, limit = 60 } = {}) {
    const code = subjectCode(subject);
    if (code === undefined) return Object.assign([], { unknownSubject: true });
    const words = lower(q).split(/[\s,]+/).filter(Boolean);
    const alternatives = words.map((w) => [...new Set([w, stem(w), ...(SYNONYMS[w] || SYNONYMS[stem(w)] || [])])]);
    const scored = [];
    for (const p of all) {
      if ((code && p.subject !== code) || (stage && p.stage !== stage) || (area && p.area_id !== area)) continue;
      if (!alternatives.length) { scored.push([p, 0]); continue; }
      const hay = `${p.text} ${p.area}`.toLocaleLowerCase('sv');
      const score = alternatives.filter((alts) => alts.some((a) => hay.includes(a))).length;
      if (score) scored.push([p, score]);
    }
    return scored.sort((a, b) => b[1] - a[1]).map(([p]) => p).slice(0, limit);
  }

  return {
    source,
    overview,
    search,
    subjectCode,
    point: (id) => points.get(id) || null,
    area: (id) => areas.get(id) || null,
    /** {known, unknown} for a list of point ids. */
    sort(ids = []) {
      const unique = [...new Set(ids)];
      return { known: unique.filter((id) => points.has(id)), unknown: unique.filter((id) => !points.has(id)) };
    },
  };
}
