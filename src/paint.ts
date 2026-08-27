import { locateQuote } from './anchor';
import { buildTextIndex, rangeBetween } from './textIndex';
import type { TextIndex } from './textIndex';
import type { ParsedAnnotation } from './format';

/**
 * Highlights, drawn without touching the document.
 *
 * An earlier version wrapped the quoted text in `<mark>` elements. That worked,
 * but rewriting text nodes is exactly what makes WebKit go on painting a
 * selection it still holds, which left blue blocks over the preview after a drag
 * — and no amount of ordering the clear against the mutation fixed it reliably.
 *
 * The CSS Custom Highlight API paints a Range directly, so the DOM is never
 * modified and the problem cannot arise. The cost is that there is no element to
 * hang a click handler on, so hit testing goes through `annotationAt` instead.
 */
export type PaintableAnnotation = ParsedAnnotation & { replyCount?: number };

type Painted = {
  id: string;
  range: Range;
  outdated: boolean;
  replyCount: number;
};

/** Highlight registry names, one per visual state. */
const NAMES = {
  comment: 'mec-comment',
  resolved: 'mec-comment-resolved',
  outdated: 'mec-comment-outdated',
  pending: 'mec-comment-pending',
  active: 'mec-comment-active',
} as const;

let painted: Painted[] = [];

/** Whether the browser can paint ranges without a wrapper element. */
export function isSupported(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function';
}

/**
 * Paint the highlights for a set of comments.
 *
 * Because nothing is mutated, the text index is built once and shared by every
 * comment, rather than being rebuilt after each one as it had to be when
 * painting split the nodes underneath.
 */
export function paintHighlights(pane: HTMLElement, annotations: PaintableAnnotation[]): void {
  const index = buildTextIndex(pane);
  const groups: Record<string, Range[]> = { comment: [], resolved: [], outdated: [] };
  painted = [];

  for (const annotation of annotations) {
    const found = rangeFor(pane, index, annotation);
    if (found === undefined) {
      continue;
    }

    const { range, outdated } = found;
    painted.push({ id: annotation.id, range, outdated, replyCount: annotation.replyCount ?? 0 });

    const bucket = outdated ? 'outdated' : (annotation.resolved === true ? 'resolved' : 'comment');
    groups[bucket].push(range);
  }

  apply(NAMES.comment, groups.comment);
  apply(NAMES.resolved, groups.resolved);
  apply(NAMES.outdated, groups.outdated);

  // A full repaint means the saved comments are now on screen, so the stand-in
  // painted while one was being written has done its job. Leaving it would
  // double up on the comment just made, and would outlive its range if the text
  // it covered moved.
  apply(NAMES.pending, []);
}

function rangeFor(pane: HTMLElement, index: TextIndex, annotation: PaintableAnnotation) {
  const located = locateQuote(index, annotation);
  if (located !== undefined) {
    const range = rangeBetween(index, located.start, located.end);
    return range === undefined ? undefined : { range, outdated: false };
  }

  // The quote is gone; fall back to the block it was written against, the way a
  // code review keeps an outdated comment attached to its file.
  const block = blockForLine(pane, annotation.line);
  if (block === undefined || block.textContent === null || block.textContent.trim().length === 0) {
    return undefined;
  }

  const range = document.createRange();
  range.selectNodeContents(block);
  return { range, outdated: true };
}

/**
 * Highlight objects are created once and their contents replaced.
 *
 * Removing an entry from `CSS.highlights` empties the registry but does not
 * invalidate what was already painted, so the highlight stays on screen with
 * nothing registered and survives scrolling. Emptying a registered highlight in
 * place repaints properly, so every name keeps its object for the session.
 */
const registry = new Map<string, Highlight>();

function apply(name: string, ranges: Range[]): void {
  if (!isSupported()) {
    return;
  }

  let highlight = registry.get(name);
  if (highlight === undefined) {
    highlight = new Highlight();
    registry.set(name, highlight);
    CSS.highlights.set(name, highlight);
  }

  highlight.clear();
  for (const range of ranges) {
    highlight.add(range);
  }
}

/** Paint the range a comment is being written about, before it is saved. */
export function paintPendingRange(range: Range): void {
  apply(NAMES.pending, [range]);
}

export function clearPending(): void {
  apply(NAMES.pending, []);
}

/** Briefly emphasise one comment, used when stepping through them. */
export function setActive(id: string | undefined): void {
  const found = painted.find(entry => entry.id === id);
  apply(NAMES.active, found === undefined ? [] : [found.range]);
}

/** Remove every highlight this extension has drawn. */
export function clearHighlights(): void {
  painted = [];
  for (const name of Object.values(NAMES)) {
    apply(name, []);
  }
}

/**
 * The comment covering a point on screen.
 *
 * With no element to receive the click, the point is turned back into a document
 * position and tested against the ranges that were painted.
 */
export function annotationAt(x: number, y: number): { id: string; outdated: boolean } | undefined {
  const caret = document.caretRangeFromPoint?.(x, y);
  if (caret === null || caret === undefined) {
    return undefined;
  }

  for (const entry of painted) {
    try {
      if (entry.range.comparePoint(caret.startContainer, caret.startOffset) === 0) {
        return { id: entry.id, outdated: entry.outdated };
      }
    } catch {
      // A range whose nodes have gone stale simply does not match.
    }
  }

  return undefined;
}

/** Where a comment currently sits on screen, for positioning UI against it. */
export function rectFor(id: string): DOMRect | undefined {
  const entry = painted.find(candidate => candidate.id === id);
  if (entry === undefined) {
    return undefined;
  }

  const rect = entry.range.getBoundingClientRect();
  return rect.width === 0 && rect.height === 0 ? undefined : rect;
}

/** The rendered block whose source line range contains `line`. */
export function blockForLine(pane: HTMLElement, line: number | undefined): HTMLElement | undefined {
  if (line === undefined) {
    return undefined;
  }

  let best: HTMLElement | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const element of pane.querySelectorAll<HTMLElement>('[data-line-from]')) {
    const from = Number(element.getAttribute('data-line-from'));
    const rawTo = element.getAttribute('data-line-to');
    const to = rawTo === null ? from : Number(rawTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      continue;
    }

    const distance = line >= from && line <= to ? 0 : Math.min(Math.abs(line - from), Math.abs(line - to));
    if (distance < bestDistance) {
      best = element;
      bestDistance = distance;
    }
  }

  return best;
}
