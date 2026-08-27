import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * happy-dom has no Custom Highlight API, so it is stubbed closely enough to
 * assert the property that matters: entries are never removed from the registry.
 */
class FakeHighlight {
  ranges = new Set<Range>();
  clear() { this.ranges.clear(); }
  add(range: Range) { this.ranges.add(range); }
  [Symbol.iterator]() { return this.ranges[Symbol.iterator](); }
}

const registry = new Map<string, FakeHighlight>();
const deletions: string[] = [];

beforeEach(() => {
  registry.clear();
  deletions.length = 0;
  vi.stubGlobal('Highlight', FakeHighlight);
  vi.stubGlobal('CSS', {
    highlights: {
      set: (name: string, value: FakeHighlight) => registry.set(name, value),
      get: (name: string) => registry.get(name),
      delete: (name: string) => { deletions.push(name); return registry.delete(name); },
      keys: () => registry.keys(),
    },
  });
});

const { paintHighlights, clearHighlights, clearPending, isSupported } = await import('../src/paint');

function makePane(): HTMLElement {
  const pane = document.createElement('div');
  pane.className = 'markdown-body';
  pane.innerHTML = '<p>The quick brown fox jumps over the lazy dog.</p>';
  document.body.appendChild(pane);
  return pane;
}

const annotation = {
  id: 'c1', body: 'note', exact: 'brown fox', prefix: 'The quick ', suffix: ' jumps',
  from: 0, to: 0,
};

describe('highlight registry', () => {
  it('is available in this environment', () => {
    expect(isSupported()).toBe(true);
  });

  it('empties highlights in place rather than removing them', () => {
    // WebKit does not invalidate what it has already painted when an entry is
    // deleted from CSS.highlights: the highlight stays on screen with nothing
    // registered, and survives scrolling. Emptying a registered highlight
    // repaints correctly, so entries must persist.
    const pane = makePane();
    paintHighlights(pane, [annotation]);
    expect([...(registry.get('mec-comment') ?? [])]).toHaveLength(1);

    clearHighlights();

    expect(deletions).toEqual([]);
    expect(registry.has('mec-comment')).toBe(true);
    expect([...(registry.get('mec-comment') ?? [])]).toHaveLength(0);
  });

  it('clears the pending highlight without removing its entry', () => {
    makePane();
    clearPending();
    expect(deletions).toEqual([]);
  });

  it('drops the stand-in highlight once a repaint has drawn the real ones', () => {
    const pane = makePane();
    paintHighlights(pane, [annotation]);
    expect([...(registry.get('mec-comment-pending') ?? [])]).toHaveLength(0);
  });

  it('leaves the document untouched', () => {
    const pane = makePane();
    const before = pane.innerHTML;
    paintHighlights(pane, [annotation]);
    expect(pane.innerHTML).toBe(before);
    expect(pane.querySelectorAll('mark')).toHaveLength(0);
  });
});
