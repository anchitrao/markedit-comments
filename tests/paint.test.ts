import { describe, it, expect, vi } from 'vitest';
import { clearHighlights } from '../src/paint';

function makePane(html: string): HTMLElement {
  const pane = document.createElement('div');
  pane.className = 'markdown-body';
  pane.innerHTML = html;
  document.body.appendChild(pane);
  return pane;
}

describe('clearHighlights', () => {
  it('does not touch the DOM when there is nothing highlighted', () => {
    // `normalize()` rewrites text nodes across the whole pane. Doing that while
    // the reader has text selected makes WebKit paint a stale selection, which
    // left blue blocks over tables and, after a select-all, most of the page.
    const pane = makePane('<p>Some prose.</p><table><tr><td>Draft</td></tr></table>');
    const normalize = vi.spyOn(pane, 'normalize');

    clearHighlights(pane);

    expect(normalize).not.toHaveBeenCalled();
  });

  it('still unwraps highlights when there are some', () => {
    const pane = makePane('<p>The quick <mark data-mec-id="c1">brown fox</mark> jumps.</p>');
    const normalize = vi.spyOn(pane, 'normalize');

    clearHighlights(pane);

    expect(pane.querySelectorAll('[data-mec-id]')).toHaveLength(0);
    expect(pane.textContent).toBe('The quick brown fox jumps.');
    expect(normalize).toHaveBeenCalled();
  });

  it('unwraps every highlight, including nested ones', () => {
    const pane = makePane(
      '<p><mark data-mec-id="c1">outer <mark data-mec-id="c2">inner</mark> text</mark></p>');

    clearHighlights(pane);

    expect(pane.querySelectorAll('[data-mec-id]')).toHaveLength(0);
    expect(pane.textContent).toBe('outer inner text');
  });
});
