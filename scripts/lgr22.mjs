// Builds server/content/lgr22.json: the central content (centralt innehåll) of the compulsory
// school's syllabuses, from Skolverket's open Syllabus API. Run it again when Skolverket changes a
// syllabus:  node scripts/lgr22.mjs
// A point's id is <subject>.<stage>.<area>.<point> by position (e.g. MA.1-3.1.2). Apps refer to
// points by id, so after a run read the diff: if points moved, apps linked to them need a look.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.skolverket.se/syllabus/v1';
// The subjects every school has. Mother tongues, sign language, Sami, dance and Jewish studies are left out.
const SUBJECTS = ['GRGRBIL01', 'GRGRBIO01', 'GRGRENG01', 'GRGRFYS01', 'GRGRGEO01', 'GRGRHIS01', 'GRGRHKK01', 'GRGRIDR01', 'GRGRKEM01',
  'GRGRMAT01', 'GRGRMUS01', 'GRGRREL01', 'GRGRSAM01', 'GRGRSLJ01', 'GRGRSVE01', 'GRGRSVA01', 'GRGRTEK01'];

const clean = (html) => html.replace(/<[^>]+>/g, ' ').replace(/­/g, '').replace(/&amp;/g, '&').replace(/&nbsp;| /g, ' ')
  .replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

const subjects = [];
let source;
for (const code of SUBJECTS) {
  const data = await get(`/subjects/${code}`);
  source ||= { name: data.apiName, publisher: data.apiPublisher, documentation: data.apiDocumentation, fetched: data.dateParam };
  const s = data.subject;
  const stages = [];
  for (const cc of s.centralContents) {
    if (/<li>(?:(?!<\/li>).)*<ul/s.test(cc.text)) throw new Error(`${code} ${cc.year}: nested list – the parser needs a look`);
    const areas = [];
    for (const part of cc.text.split(/(?=<h4>)/).slice(1)) {
      const name = clean(/<h4>(.*?)<\/h4>/s.exec(part)[1]);
      const points = [...part.matchAll(/<li>(.*?)<\/li>/gs)].map((m) => clean(m[1])).filter(Boolean);
      if (!points.length) throw new Error(`${code} ${cc.year} ${name}: no points`);
      areas.push({ name, points });
    }
    if (!areas.length) throw new Error(`${code} ${cc.year}: no areas`);
    stages.push({ stage: cc.year, areas });
  }
  subjects.push({ code: s.designation, name: s.name, syllabus: s.code, version: s.version, modified: s.modifiedDate, regulation: [s.skolfsGrund, s.skolfsAndring].filter(Boolean).join(', ändrad '), stages });
  console.log(s.designation.padEnd(4), s.name.padEnd(28), stages.map((st) => `${st.stage}: ${st.areas.length} områden, ${st.areas.reduce((n, a) => n + a.points.length, 0)} punkter`).join(' · '));
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'server', 'content', 'lgr22.json');
writeFileSync(out, `${JSON.stringify({ source, subjects }, null, 1)}\n`);
console.log(`wrote ${out}`);
