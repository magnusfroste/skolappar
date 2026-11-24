import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml, markdownText, editMarkdown } from '../markdown.mjs';

test('Markdown to HTML: what the articles use, and nothing unsafe', () => {
  const html = markdownToHtml('# Titel\n\nEn **fet** och *kursiv* rad med `kod` och [länk](https://x.se).\n\n- ett\n- två\n\n1. a\n2. b\n\n> citat\n\n```\n<b>x</b>\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |', { headingOffset: 1 });
  assert.match(html, /<h2>Titel<\/h2>/);
  assert.match(html, /<strong>fet<\/strong> och <em>kursiv<\/em>/);
  assert.match(html, /<code>kod<\/code>/);
  assert.match(html, /<a href="https:\/\/x.se" rel="noopener">länk<\/a>/);
  assert.match(html, /<ul><li>ett<\/li><li>två<\/li><\/ul>/);
  assert.match(html, /<ol><li>a<\/li><li>b<\/li><\/ol>/);
  assert.match(html, /<blockquote><p>citat<\/p><\/blockquote>/);
  assert.match(html, /<pre><code>&lt;b&gt;x&lt;\/b&gt;<\/code><\/pre>/);
  assert.match(html, /<th>A<\/th>.*<td>2<\/td>/s);
  const evil = markdownToHtml('<script>alert(1)</script> [x](javascript:alert(1))');
  assert.doesNotMatch(evil, /<script|javascript:/);
  assert.equal(markdownText('# Hej\n\nDet här är **en** [text](/x).', 100), 'Hej Det här är en text.');
});

test('editing parts of an article: exact text, whole sections, all or nothing', () => {
  const md = '# Guide\n\nIntro.\n\n## Steg 1\n\nGör A.\n\n### Detalj\n\nMer.\n\n## Steg 2\n\nGör B.\n';
  assert.equal(editMarkdown(md, [{ old_str: 'Gör A.', new_str: 'Gör A noga.' }]).content.includes('Gör A noga.'), true);
  assert.match(editMarkdown(md, [{ old_str: 'Gör', new_str: 'x' }]).error, /more than once/);
  assert.match(editMarkdown(md, [{ old_str: 'saknas', new_str: 'x' }]).error, /not found/);

  const replaced = editMarkdown(md, [{ section: 'Steg 1', content: 'Ny text.' }]).content;
  assert.match(replaced, /## Steg 1\n\nNy text.\n\n## Steg 2/, 'the section and its sub-sections are replaced, the next one stays');
  assert.doesNotMatch(replaced, /Detalj/);
  const removed = editMarkdown(md, [{ section: '## Steg 2', remove: true }]).content;
  assert.doesNotMatch(removed, /Steg 2|Gör B/);
  assert.match(editMarkdown(md, [{ section: 'Steg 9', content: 'x' }]).error, /the headings are: Guide \| Steg 1 \| Detalj \| Steg 2/);

  const failed = editMarkdown(md, [{ old_str: 'Intro.', new_str: 'Ny intro.' }, { old_str: 'saknas', new_str: '' }]);
  assert.ok(failed.error && !failed.content, 'one failing edit: nothing changes');
});
