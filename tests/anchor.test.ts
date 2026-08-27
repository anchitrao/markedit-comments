import { describe, it, expect } from 'vitest';
import markdownit from 'markdown-it';
import anchorPlugin from 'markdown-it-anchor';
import tasklist from 'markdown-it-task-lists';

import { buildTextIndex, rangeBetween, positionOf } from '../src/textIndex';
import { locateQuote, describeSelection } from '../src/anchor';
import { normalize } from '../src/format';

// The same markdown-it configuration MarkEdit-preview renders with, so these
// tests exercise the real shape of the DOM we anchor into.
const md = markdownit('default', { html: true, breaks: true, linkify: true })
  .use(anchorPlugin)
  .use(tasklist, { enabled: true, label: true });

function render(markdown: string): HTMLElement {
  const pane = document.createElement('div');
  pane.className = 'markdown-body';
  pane.innerHTML = md.render(markdown);
  document.body.appendChild(pane);
  return pane;
}

/** Anchor `quote` in a document, then find it again from a fresh index. */
function roundTrip(markdown: string, quote: string) {
  const pane = render(markdown);
  const index = buildTextIndex(pane);

  const start = index.text.indexOf(quote);
  expect(start, `"${quote}" should appear in rendered text: ${index.text}`).toBeGreaterThanOrEqual(0);
  const selector = describeSelection(index, start, start + quote.length);

  const reIndex = buildTextIndex(render(markdown));
  const located = locateQuote(reIndex, { id: 'c1', body: '', ...selector });
  return { pane, index, selector, located, reIndex };
}

const CONSTRUCTS: Array<[name: string, markdown: string, quote: string]> = [
  ['paragraph', 'The quick brown fox jumps over the lazy dog.', 'brown fox'],
  ['table cell', '| Feature | Status |\n| --- | --- |\n| Comments | Draft |', 'Draft'],
  ['fenced code', '```js\nconst timeout = 5000;\n```', 'timeout'],
  ['inline code', 'Call `fetchUser(id)` to load it.', 'fetchUser(id)'],
  ['heading', '## Design decisions', 'Design decisions'],
  ['list item', '- first item\n- second item\n- third item', 'second item'],
  ['task list', '- [ ] ship the thing', 'ship the thing'],
  ['blockquote', '> a quoted remark here', 'quoted remark'],
  ['link text', 'See [the API docs](https://x.com) now.', 'the API docs'],
  ['bold inside text', 'This is **really important** stuff.', 'really important'],
  ['nested list', '- outer\n  - inner detail', 'inner detail'],
];

describe('anchoring across markdown constructs', () => {
  it.each(CONSTRUCTS)('re-finds a quote in a %s', (_name, markdown, quote) => {
    const { located, reIndex } = roundTrip(markdown, quote);
    expect(located).toBeDefined();
    expect(reIndex.text.slice(located!.start, located!.end)).toBe(quote);
  });

  it.each(CONSTRUCTS)('builds a range covering exactly the quote in a %s', (_name, markdown, quote) => {
    const pane = render(markdown);
    const index = buildTextIndex(pane);
    const start = index.text.indexOf(quote);

    const range = rangeBetween(index, start, start + quote.length);

    expect(range).toBeDefined();
    expect(normalize(range!.toString())).toBe(quote);
    // Painting must never alter the document.
    expect(pane.querySelectorAll('mark')).toHaveLength(0);
  });
});

describe('disambiguation', () => {
  const repeated = 'The fox ran. Then the fox ate. Finally the fox slept.';

  it('picks the right occurrence using prefix and suffix', () => {
    const pane = render(repeated);
    const index = buildTextIndex(pane);

    // Anchor the *second* "fox".
    const second = index.text.indexOf('fox', index.text.indexOf('fox') + 1);
    const selector = describeSelection(index, second, second + 3);

    const located = locateQuote(buildTextIndex(render(repeated)), { id: 'c1', body: '', ...selector });
    expect(located!.start).toBe(second);
  });

  it('still resolves when a quote is unique', () => {
    const { located } = roundTrip(repeated, 'slept');
    expect(located).toBeDefined();
  });
});

describe('drift', () => {
  it('reports no match when the quoted text is gone', () => {
    const index = buildTextIndex(render('Completely different prose now.'));
    const located = locateQuote(index, {
      id: 'c1', body: '', exact: 'brown fox', prefix: 'The quick ', suffix: ' jumps',
    });
    expect(located).toBeUndefined();
  });

  it('still finds the quote after surrounding text is edited', () => {
    const original = render('The quick brown fox jumps over the lazy dog.');
    const index = buildTextIndex(original);
    const start = index.text.indexOf('brown fox');
    const selector = describeSelection(index, start, start + 'brown fox'.length);

    // Rewrite everything around the quote; only the quote itself survives.
    const edited = buildTextIndex(render('A slow brown fox naps beneath a tree.'));
    const located = locateQuote(edited, { id: 'c1', body: '', ...selector });
    expect(located).toBeDefined();
    expect(edited.text.slice(located!.start, located!.end)).toBe('brown fox');
  });
});

describe('selection mapping', () => {
  it('maps a DOM selection boundary back to a normalized position', () => {
    const pane = render('The quick brown fox jumps.');
    const index = buildTextIndex(pane);
    const node = index.nodes[0];

    const at = index.text.indexOf('brown');
    expect(positionOf(index, node, index.offsets[at])).toBe(at);
  });
});

describe('range building', () => {
  it('spans element boundaries in one range', () => {
    // `breaks: true` turns the newline into a <br>, so the quote crosses nodes.
    const pane = render('a phrase that\nwraps across lines');
    const index = buildTextIndex(pane);
    const start = index.text.indexOf('that wraps');

    const range = rangeBetween(index, start, start + 'that wraps'.length);

    expect(range).toBeDefined();
    expect(range!.startContainer).not.toBe(range!.endContainer);
    expect(normalize(range!.toString())).toBe('that wraps');
  });

  it('covers every block of a multi-block range', () => {
    const pane = render('First paragraph.\n\n## A heading\n\n- an item');
    const index = buildTextIndex(pane);

    const range = rangeBetween(index, 0, index.text.length);
    const covered = range!.toString();

    for (const word of ['First', 'heading', 'item']) {
      expect(covered).toContain(word);
    }
  });
});
