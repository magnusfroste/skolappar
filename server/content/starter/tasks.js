// THE CONTENT OF THE APP. Replace this file to make another app; app.js stays as it is.
//
// makeTask(level) returns one task:
//   prompt   what is shown, short
//   say      what is read aloud (Swedish, a full sentence)
//   options  the answers to choose from (2–4), as strings
//   answer   the right one (must be one of options)
//   hint     shown after a wrong answer – help, not the answer
//   picture  optional: {filled, total} draws dots (see drawPicture in app.js)
//
// Levels start at 1 and go up when the child gets things right, down when it is hard.

export const APP = {
  title: 'Tiokamrater',
  lead: 'Vilket tal fattas för att det ska bli tio?',
  storageKey: 'tiokamrater', // unique per app: progress is kept on the device under this name
  roundLength: 8,            // tasks per round: short rounds with a clear end
  maxLevel: 3,
};

const random = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const shuffle = (list) => list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

export function makeTask(level) {
  // level 1: 5–9 with dots to count · level 2: 1–9 with dots · level 3: 1–9 without the picture
  const n = level === 1 ? random(5, 9) : random(1, 9);
  const answer = 10 - n;
  const wrong = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== answer)).slice(0, 3);
  return {
    prompt: `${n} + ? = 10`,
    say: `Vilket tal ska du lägga till ${n} för att få tio?`,
    options: shuffle([answer, ...wrong]).map(String),
    answer: String(answer),
    hint: level < 3 ? 'Räkna de tomma ringarna.' : `Räkna upp från ${n} till tio.`,
    picture: level < 3 ? { filled: n, total: 10 } : null,
  };
}
