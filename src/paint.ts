import { locateQuote } from './anchor';
import { buildTextIndex, spansForRange, wrapSpan } from './textIndex';
import type { ParsedAnnotation } from './format';

/** A comment as the preview needs it: the record plus how many replies it has. */
export type PaintableAnnotation = ParsedAnnotation & { replyCount?: number };

export const ID_ATTRIBUTE = 'data-mec-id';
export const PENDING_CLASS = 'mec-pending';

/**
 * Paint the highlights for a set of comments onto the rendered preview.
 *
 * Comments live in the Markdown as quotes rather than as inline markers, so the
 * highlight has to be found again on every render. Anything whose quote no longer
 * appears falls back to the block it was written against and is marked outdated,
 * which keeps a comment visible and answerable after the text beneath it moved on
 * instead of silently dropping it.
 */
export function paintHighlights(pane: HTMLElement, annotations: PaintableAnnotation[]): void {
  clearHighlights(pane);

  for (const annotation of annotations) {
    // The index is rebuilt per comment because wrapping splits text nodes, which
    // invalidates the positions recorded for everything painted after it.
    const index = buildTextIndex(pane);
    const located = locateQuote(index, annotation);

    if (located === undefined) {
      paintFallback(pane, annotation);
      continue;
    }

    const spans = spansForRange(index, located.start, located.end);
    const marks = spans.map(span => wrapSpan(span, () => createMark(annotation, false)));
    tagLastMark(marks, annotation);
  }
}

/** Remove every highlight, restoring the preview to what the renderer produced. */
export function clearHighlights(pane: HTMLElement): void {
  const marks = pane.querySelectorAll<HTMLElement>(`[${ID_ATTRIBUTE}]`);
  if (marks.length === 0) {
    // Nothing to unwrap. Returning early matters: `normalize()` below rewrites
    // text nodes across the whole pane, and doing that under a live selection
    // leaves WebKit painting a stale one.
    return;
  }

  for (const mark of marks) {
    const parent = mark.parentNode;
    if (parent === null) {
      continue;
    }

    while (mark.firstChild !== null) {
      parent.insertBefore(mark.firstChild, mark);
    }

    mark.remove();
  }

  // Re-join the text nodes that wrapping split, so the next index sees the same
  // node layout the renderer produced.
  pane.normalize();
}

function createMark(annotation: PaintableAnnotation, outdated: boolean): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = 'mec-highlight';
  mark.setAttribute(ID_ATTRIBUTE, annotation.id);
  mark.setAttribute('role', 'button');
  mark.tabIndex = 0;

  if (annotation.resolved === true) {
    mark.classList.add('mec-resolved');
  }

  if (outdated) {
    mark.classList.add('mec-outdated');
    mark.title = 'The text this comment was written against has changed.';
  }

  return mark;
}

/**
 * Put the comment count on the final mark of a group.
 *
 * The badge is drawn by the style sheet from this attribute rather than as a
 * child element, so it contributes no text of its own and cannot leak into the
 * quotes captured for later comments.
 */
function tagLastMark(marks: HTMLElement[], annotation: PaintableAnnotation): void {
  const last = marks[marks.length - 1];
  if (last !== undefined) {
    last.classList.add('mec-highlight-end');
    last.setAttribute('data-mec-count', String(annotation.replyCount ?? 0));
  }
}

/**
 * Highlight the block a comment was written against, when its quote is gone.
 *
 * This mirrors how a code review keeps an outdated comment attached to its file
 * instead of discarding it.
 */
function paintFallback(pane: HTMLElement, annotation: PaintableAnnotation): void {
  const block = blockForLine(pane, annotation.line);
  if (block === undefined) {
    return;
  }

  const index = buildTextIndex(block);
  if (index.text.trim().length === 0) {
    return;
  }

  const spans = spansForRange(index, 0, index.text.length);
  const marks = spans.map(span => wrapSpan(span, () => createMark(annotation, true)));
  tagLastMark(marks, annotation);
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

    // Prefer a block that contains the line; otherwise take the nearest one.
    const distance = line >= from && line <= to ? 0 : Math.min(Math.abs(line - from), Math.abs(line - to));
    if (distance < bestDistance) {
      best = element;
      bestDistance = distance;
    }
  }

  return best;
}
