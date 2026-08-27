import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * A stand-in for the editor holding a document in memory, exposing just the
 * surface `store.ts` uses. Placement is the part of this extension most likely to
 * corrupt a file, so it is exercised here directly rather than only end to end.
 */
const editor = {
  text: '',
  getText: () => editor.text,
  setText: (value: string, range?: { from: number; to: number }) => {
    const from = range?.from ?? 0;
    const to = range?.to ?? editor.text.length;
    editor.text = editor.text.slice(0, from) + value + editor.text.slice(to);
  },
  getLineCount: () => editor.text.split('\n').length,
  getLineRange: (row: number) => {
    const lines = editor.text.split('\n');
    let from = 0;
    for (let index = 0; index < row; index += 1) {
      from += lines[index].length + 1;
    }
    return { from, to: from + (lines[row]?.length ?? 0) };
  },
};

vi.mock('markedit-api', () => ({
  MarkEdit: {
    editorAPI: editor,
    getDirectoryPath: () => '/Users/example/Library/Containers/app.cyan.markedit/Data',
  },
}));

const { addAnnotation, removeAnnotation, readAnnotations, defaultAuthor, toggleResolved } =
  await import('../src/store');

const draft = (body: string) => ({ body, exact: 'x', prefix: '', suffix: '' });

/** Line index of the last line of the block containing `needle`. */
const lineOf = (needle: string) => editor.text.slice(0, editor.text.indexOf(needle)).split('\n').length - 1;

describe('placement', () => {
  beforeEach(() => { editor.text = 'Para one.\n\nPara two.\n'; });

  it('puts a comment after its block, with a blank line either side', () => {
    addAnnotation(draft('note'), lineOf('Para one.'));
    expect(editor.text).toBe(
      'Para one.\n\n<!-- annotation\nid=c1\nexact="x" prefix="" suffix=""\n\nnote\n-->\n\nPara two.\n');
  });

  it('restores the document exactly when the comment is removed', () => {
    const original = editor.text;
    addAnnotation(draft('note'), lineOf('Para one.'));
    removeAnnotation('c1');
    expect(editor.text).toBe(original);
  });

  it('round-trips a comment on the final block', () => {
    const original = editor.text;
    addAnnotation(draft('note'), lineOf('Para two.'));
    expect(editor.text.endsWith('-->\n')).toBe(true);
    removeAnnotation('c1');
    expect(editor.text).toBe(original);
  });

  it('keeps a second comment after the first, not between it and its text', () => {
    addAnnotation(draft('first'), lineOf('Para one.'));
    addAnnotation(draft('second'), lineOf('Para one.'));

    const [one, two] = readAnnotations();
    expect([one.body, two.body]).toEqual(['first', 'second']);
    expect(one.to).toBeLessThan(two.from);
    expect(editor.text).toContain('-->\n\n<!-- annotation');
  });

  it('attaches to the block itself when the block ends on a blank line', () => {
    editor.text = '- one\n- two\n\n\n> quoted\n';
    addAnnotation(draft('note'), 2); // a blank line, as list ranges often report

    const before = editor.text.slice(0, editor.text.indexOf('<!-- annotation'));
    expect(before).toBe('- one\n- two\n\n');
    // And the next block must still be separated from the terminator.
    expect(editor.text).toContain('-->\n\n');
  });

  it('does not disturb a document with no trailing newline', () => {
    editor.text = 'Only line.';
    const original = editor.text;
    addAnnotation(draft('note'), 0);
    expect(editor.text.startsWith('Only line.\n\n<!-- annotation')).toBe(true);
    removeAnnotation('c1');
    expect(editor.text).toBe(original);
  });
});

describe('threads', () => {
  beforeEach(() => { editor.text = 'Para one.\n\nPara two.\n'; });

  it('removes replies along with the comment they answer', () => {
    const original = editor.text;
    addAnnotation(draft('question'), lineOf('Para one.'));
    addAnnotation({ ...draft('answer'), replyTo: 'c1' }, lineOf('Para one.'));
    expect(readAnnotations()).toHaveLength(2);

    removeAnnotation('c1');
    expect(readAnnotations()).toHaveLength(0);
    expect(editor.text).toBe(original);
  });

  it('leaves other comments alone when one is deleted', () => {
    addAnnotation(draft('first'), lineOf('Para one.'));
    addAnnotation(draft('second'), lineOf('Para two.'));
    removeAnnotation('c1');

    const remaining = readAnnotations();
    expect(remaining.map(a => a.body)).toEqual(['second']);
    expect(editor.text).toContain('Para one.\n\nPara two.');
  });

  it('toggles resolved state in place', () => {
    addAnnotation(draft('note'), lineOf('Para one.'));
    toggleResolved('c1');
    expect(readAnnotations()[0].resolved).toBe(true);
    toggleResolved('c1');
    expect(readAnnotations()[0].resolved).toBe(false);
  });
});

describe('author', () => {
  it('prefers the configured name', () => {
    expect(defaultAuthor('reviewer')).toBe('reviewer');
  });

  it('recovers the account name from the sandbox container path', () => {
    // `home` resolves to the app container, so the naive basename would be "Data".
    expect(defaultAuthor()).toBe('example');
  });
});
