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
    // Stands for an attached editor; `store` checks this before reading text.
    editorView: { state: {} },
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

describe('before the editor is attached', () => {
  it('reads no comments instead of throwing', async () => {
    // User scripts load before the editor exists. Reaching for the document then
    // threw, which aborted the rest of module initialization — including the
    // menu registration on the following line.
    vi.resetModules();
    vi.doMock('markedit-api', () => ({
      MarkEdit: {
        editorView: undefined,
        editorAPI: {
          getText: () => { throw new TypeError("undefined is not an object (evaluating 'this.state.doc')"); },
        },
        getDirectoryPath: () => '/Users/example/Library/Containers/app.cyan.markedit/Data',
      },
    }));

    const detached = await import('../src/store');
    expect(detached.isEditorAttached()).toBe(false);
    expect(detached.readAnnotations()).toEqual([]);
  });
});

describe('placement near code fences', () => {
  const DOC = 'Intro.\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\nOutro.\n';

  beforeEach(() => { editor.text = DOC; });

  it('never writes inside a fence, even when told to', () => {
    // A Mermaid fence reports no line numbers, so the line handed in here can
    // point into the middle of the diagram. An HTML comment written there is not
    // a comment in Mermaid, and breaks the diagram it was annotating.
    addAnnotation(draft('about the diagram'), 3); // "flowchart LR"

    const fenceStart = editor.text.indexOf('```mermaid');
    const fenceEnd = editor.text.indexOf('```', fenceStart + 3) + 3;
    const at = editor.text.indexOf('<!-- annotation');

    expect(at).toBeGreaterThan(fenceEnd);
    expect(editor.text).toContain('```mermaid\nflowchart LR\n  A --> B\n```');
  });

  it('leaves the diagram byte-identical', () => {
    addAnnotation(draft('note'), 4);
    const fence = editor.text.slice(editor.text.indexOf('```mermaid'), editor.text.indexOf('```', editor.text.indexOf('```mermaid') + 3) + 3);
    expect(fence).toBe('```mermaid\nflowchart LR\n  A --> B\n```');
  });

  it('still round-trips cleanly', () => {
    addAnnotation(draft('note'), 3);
    removeAnnotation('c1');
    expect(editor.text).toBe(DOC);
  });

  it('does not write into front matter', () => {
    editor.text = '---\ntitle: T\n---\n\nBody.\n';
    addAnnotation(draft('note'), 1); // inside the front matter
    expect(editor.text.startsWith('---\ntitle: T\n---')).toBe(true);
    expect(editor.text.indexOf('<!-- annotation')).toBeGreaterThan(editor.text.indexOf('---\n\n'));
  });
});
