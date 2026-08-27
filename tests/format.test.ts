import { describe, it, expect } from 'vitest';
import { parseAnnotations, serializeAnnotation, nextIdentifier, normalize } from '../src/format';
import type { Annotation } from '../src/format';

const roundTrip = (annotation: Annotation) => {
  const parsed = parseAnnotations(`Body text.\n\n${serializeAnnotation(annotation)}\n\nMore.`);
  expect(parsed).toHaveLength(1);
  return parsed[0];
};

describe('round trip', () => {
  it('preserves a plain comment', () => {
    const source: Annotation = {
      id: 'c1', body: 'Tighten this up.', exact: 'brown fox',
      prefix: 'The quick ', suffix: ' jumps', author: 'anchit',
      created: '2026-08-26T18:04:00Z', line: 3,
    };
    expect(roundTrip(source)).toMatchObject(source);
  });

  it('preserves selectors containing quotes, pipes and backslashes', () => {
    const source: Annotation = {
      id: 'c2', body: 'note', exact: 'say "hi" | \\ here',
      prefix: '| cell | ', suffix: ' |',
    };
    const parsed = roundTrip(source);
    expect(parsed.exact).toBe('say "hi" | \\ here');
    expect(parsed.prefix).toBe('| cell | ');
    expect(parsed.suffix).toBe(' |');
  });

  it('preserves a multi-paragraph body', () => {
    const body = 'First paragraph.\n\nSecond paragraph, after a blank line.';
    expect(roundTrip({ id: 'c3', body, exact: 'x', prefix: '', suffix: '' }).body).toBe(body);
  });

  it('survives a body that contains the comment terminator', () => {
    const body = 'Close it with --> like that.';
    const serialized = serializeAnnotation({ id: 'c4', body, exact: 'x', prefix: '', suffix: '' });
    // The literal terminator must not appear early, or the block ends here.
    expect(serialized.indexOf('-->')).toBe(serialized.length - 3);
    expect(roundTrip({ id: 'c4', body, exact: 'x', prefix: '', suffix: '' }).body).toBe(body);
  });

  it('carries reply and resolved state', () => {
    const source: Annotation = {
      id: 'c5', body: 'Done.', exact: '', prefix: '', suffix: '',
      replyTo: 'c1', resolved: true,
    };
    const parsed = roundTrip(source);
    expect(parsed.replyTo).toBe('c1');
    expect(parsed.resolved).toBe(true);
  });
});

describe('parsing', () => {
  it('reports the exact character range of each block', () => {
    const block = serializeAnnotation({ id: 'c1', body: 'hi', exact: 'a', prefix: '', suffix: '' });
    const doc = `Intro.\n\n${block}\n\nOutro.`;
    const [parsed] = parseAnnotations(doc);
    expect(doc.slice(parsed.from, parsed.to)).toBe(block);
  });

  it('finds several blocks in one document', () => {
    const doc = ['A.', '',
      serializeAnnotation({ id: 'c1', body: 'one', exact: 'A', prefix: '', suffix: '' }), '',
      serializeAnnotation({ id: 'c2', body: 'two', exact: 'B', prefix: '', suffix: '' }), '',
      'B.'].join('\n');
    expect(parseAnnotations(doc).map(a => a.id)).toEqual(['c1', 'c2']);
  });

  it('ignores an opener that is not at the start of a line', () => {
    expect(parseAnnotations('prose <!-- annotation id=c1 -->')).toHaveLength(0);
  });

  it('ignores an unterminated block rather than consuming the rest of the file', () => {
    expect(parseAnnotations('<!-- annotation\nid=c1\n\nbody with no terminator\n')).toHaveLength(0);
  });

  it('skips a block with no id', () => {
    expect(parseAnnotations('<!-- annotation\nauthor="x"\n\nbody\n-->')).toHaveLength(0);
  });

  it('leaves ordinary HTML comments alone', () => {
    expect(parseAnnotations('<!-- just a note -->\n\n<!--@c1-->')).toHaveLength(0);
  });
});

describe('identifiers', () => {
  it('skips ids already in use', () => {
    expect(nextIdentifier(['c1', 'c2', 'c4'])).toBe('c3');
    expect(nextIdentifier([])).toBe('c1');
  });
});

describe('normalize', () => {
  it('collapses the incidental whitespace that rendering introduces', () => {
    expect(normalize('a\n   b\t c')).toBe('a b c');
  });
});
