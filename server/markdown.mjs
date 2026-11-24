// A small Markdown to HTML converter for the server-rendered pages (articles, the build guide).
// It covers what the articles use: headings, paragraphs, lists, quotes, code blocks, tables,
// bold, italic, inline code and links. Everything is escaped first; only these tags come out.
import { escapeHtml } from './http.mjs';

function inline(text) {
  let s = escapeHtml(text);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const safe = /^(https?:\/\/|\/|#|mailto:)/i.test(href) ? href : '#';
    const external = /^https?:\/\//i.test(safe);
    return `<a href="${safe}"${external ? ' rel="noopener"' : ''}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/(^|[\s(])_([^_\s][^_]*)_/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
}

/** Markdown to HTML. headingOffset 1 turns "# x" into <h2> (the page has its own <h1>). */
export function markdownToHtml(md, { headingOffset = 0 } = {}) {
  const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^```/.exec(line);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(6, h[1].length + headingOffset);
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${markdownToHtml(body.join('\n'))}</blockquote>`);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r));
      const [head, ...rest] = body;
      out.push(`<table><thead><tr>${cells(head).map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
        `<tbody>${rest.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    const list = /^\s*([-*+]|\d+[.)])\s+/.exec(line);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) item += ` ${lines[i++].trim()}`;
        items.push(`<li>${inline(item.replace(/^\[[ x]\]\s*/i, ''))}</li>`);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*([-*+]|\d+[.)])\s+|\s*\|)/.test(lines[i])) para.push(lines[i++].trim());
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    else i++;
  }
  return out.join('\n');
}

/** Plain text of Markdown, for descriptions. */
export function markdownText(md, max = 300) {
  const text = String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`|]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text;
}

/**
 * Change parts of a Markdown text, all or nothing. Each edit is either
 *   {old_str, new_str}  – old_str must occur exactly once; new_str replaces it ('' deletes it)
 *   {section, content}  – the section under the heading whose text is `section` (any level), up to
 *                          the next heading of the same or a higher level, gets `content` as its body
 *                          ('' empties it); with `remove: true` the heading goes too.
 * Returns {content} or {error}.
 */
export function editMarkdown(md, edits) {
  let text = String(md || '');
  for (const [n, e] of edits.entries()) {
    const which = `edit ${n + 1}`;
    if (typeof e.old_str === 'string') {
      if (!e.old_str) return { error: `${which}: old_str is empty` };
      const first = text.indexOf(e.old_str);
      if (first < 0) return { error: `${which}: old_str was not found – copy it exactly from get_resource` };
      if (text.indexOf(e.old_str, first + 1) >= 0) return { error: `${which}: old_str occurs more than once – include more of the text around it` };
      text = text.slice(0, first) + String(e.new_str ?? '') + text.slice(first + e.old_str.length);
    } else if (typeof e.section === 'string') {
      const lines = text.split('\n');
      const wanted = e.section.replace(/^#+\s*/, '').trim().toLowerCase();
      const heads = lines.map((l, i) => ({ i, m: /^(#{1,6})\s+(.*)$/.exec(l) })).filter((h) => h.m);
      const hit = heads.filter((h) => h.m[2].trim().toLowerCase() === wanted);
      if (!hit.length) return { error: `${which}: no heading "${e.section}" – the headings are: ${heads.map((h) => h.m[2].trim()).join(' | ')}` };
      if (hit.length > 1) return { error: `${which}: more than one heading "${e.section}" – use old_str instead` };
      const start = hit[0].i;
      const level = hit[0].m[1].length;
      const next = heads.find((h) => h.i > start && h.m[1].length <= level);
      const end = next ? next.i : lines.length;
      const body = String(e.content ?? '').trim();
      const replacement = e.remove ? [] : [lines[start], '', ...(body ? [body, ''] : [])];
      text = [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join('\n').replace(/\n{3,}/g, '\n\n');
    } else {
      return { error: `${which}: give either old_str/new_str or section/content` };
    }
  }
  return { content: text };
}
