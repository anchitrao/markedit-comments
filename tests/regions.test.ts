import { describe, it, expect } from 'vitest';
import { unsafeRegions, safeInsertionPoint } from '../src/regions';

/** Offset just after the first occurrence of `needle`. */
const after = (doc: string, needle: string) => doc.indexOf(needle) + needle.length;

describe('unsafeRegions', () => {
  it('finds a backtick fence', () => {
    const doc = 'Intro.\n\n```js\nconst x = 1;\n```\n\nOutro.\n';
    const [region] = unsafeRegions(doc);
    expect(doc.slice(region.from, region.to)).toBe('```js\nconst x = 1;\n```');
  });

  it('finds a tilde fence', () => {
    const doc = 'a\n\n~~~\nplain\n~~~\n\nb\n';
    expect(unsafeRegions(doc)).toHaveLength(1);
  });

  it('does not close a backtick fence on a tilde line', () => {
    const doc = '```\ncode\n~~~\nstill code\n```\n';
    expect(unsafeRegions(doc)).toHaveLength(1);
  });

  it('treats an unterminated fence as running to the end', () => {
    const doc = 'a\n\n```js\nconst x = 1;\n';
    const [region] = unsafeRegions(doc);
    expect(region.to).toBe(doc.length);
  });

  it('finds front matter only at the top of the file', () => {
    const doc = '---\ntitle: T\n---\n\nBody.\n';
    const [region] = unsafeRegions(doc);
    expect(doc.slice(region.from, region.to)).toBe('---\ntitle: T\n---');
  });

  it('ignores a --- that is a thematic break rather than front matter', () => {
    const doc = 'Body.\n\n---\n\nMore.\n';
    expect(unsafeRegions(doc)).toHaveLength(0);
  });

  it('finds several fences', () => {
    const doc = '```\na\n```\n\ntext\n\n```\nb\n```\n';
    expect(unsafeRegions(doc)).toHaveLength(2);
  });
});

describe('safeInsertionPoint', () => {
  const doc = 'Intro.\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\nOutro.\n';

  it('moves an offset inside a fence to just after it', () => {
    // This is the reported failure: a comment written between two lines of a
    // Mermaid diagram is not a comment in that language, and breaks the diagram.
    const inside = doc.indexOf('flowchart');
    const moved = safeInsertionPoint(doc, inside);

    expect(moved).toBeGreaterThan(doc.indexOf('  A --> B'));
    expect(doc.slice(moved - 3, moved)).toBe('```');
    expect(doc.slice(0, moved)).toContain('flowchart LR');
  });

  it('leaves a safe offset alone', () => {
    const at = after(doc, 'Intro.');
    expect(safeInsertionPoint(doc, at)).toBe(at);
  });

  it('moves out of front matter', () => {
    const withMatter = '---\ntitle: T\n---\n\nBody.\n';
    const moved = safeInsertionPoint(withMatter, withMatter.indexOf('title'));
    expect(moved).toBe(withMatter.indexOf('---\n\nBody') + 3);
  });

  it('clamps an offset past the end of the document', () => {
    expect(safeInsertionPoint(doc, doc.length + 500)).toBe(doc.length);
  });

  it('never returns an offset inside any unsafe region', () => {
    for (let at = 0; at <= doc.length; at += 1) {
      const moved = safeInsertionPoint(doc, at);
      const trapped = unsafeRegions(doc).some(r => moved > r.from && moved < r.to);
      expect(trapped, `offset ${at} resolved to ${moved}`).toBe(false);
    }
  });
});
