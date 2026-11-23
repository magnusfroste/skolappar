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

  /** Points by subject (code or name), stage, area and words in the text or the area's name. */
  function search({ subject, stage, area, q, limit = 60 } = {}) {
    const subj = subject?.trim().toLocaleLowerCase('sv');
    const words = (q || '').toLocaleLowerCase('sv').split(/\s+/).filter(Boolean);
    return all.filter((p) => (!subj || p.subject.toLocaleLowerCase('sv') === subj || p.subject_name.toLocaleLowerCase('sv') === subj)
      && (!stage || p.stage === stage)
      && (!area || p.area_id === area)
      && words.every((w) => `${p.text} ${p.area}`.toLocaleLowerCase('sv').includes(w))).slice(0, limit);
  }

  return {
    source,
    overview,
    search,
    point: (id) => points.get(id) || null,
    area: (id) => areas.get(id) || null,
    /** {known, unknown} for a list of point ids. */
    sort(ids = []) {
      const unique = [...new Set(ids)];
      return { known: unique.filter((id) => points.has(id)), unknown: unique.filter((id) => !points.has(id)) };
    },
  };
}
