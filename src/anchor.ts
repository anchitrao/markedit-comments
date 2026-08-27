import { normalize } from './format';
import type { Annotation } from './format';
import type { TextIndex } from './textIndex';

/** How much context is captured on each side of a quote when a comment is made. */
export const CONTEXT_LENGTH = 48;

export type Located = {
  start: number;
  end: number;
  /**
   * True when the quote itself could not be found and the comment fell back to
   * its recorded line. The anchor still points somewhere useful, but the text it
   * described has changed.
   */
  outdated: boolean;
};

/**
 * Find where an annotation's quote currently sits in the rendered text.
 *
 * `exact` alone is ambiguous whenever the quoted words repeat, which is why the
 * Web Annotation model pairs it with `prefix` and `suffix`; every occurrence is
 * scored by how much of that recorded context still agrees, and the best-scoring
 * one wins. When nothing matches at all the caller gets `undefined` and can fall
 * back to the block the comment was written against.
 */
export function locateQuote(index: TextIndex, annotation: Annotation): Located | undefined {
  const exact = normalize(annotation.exact);
  if (exact.length === 0) {
    return undefined;
  }

  const occurrences: number[] = [];
  for (let at = index.text.indexOf(exact); at !== -1; at = index.text.indexOf(exact, at + 1)) {
    occurrences.push(at);
  }

  if (occurrences.length === 0) {
    return undefined;
  }

  if (occurrences.length === 1) {
    return { start: occurrences[0], end: occurrences[0] + exact.length, outdated: false };
  }

  const prefix = normalize(annotation.prefix);
  const suffix = normalize(annotation.suffix);

  let best = occurrences[0];
  let bestScore = -1;

  for (const at of occurrences) {
    const before = index.text.slice(Math.max(0, at - prefix.length), at);
    const after = index.text.slice(at + exact.length, at + exact.length + suffix.length);
    const score = commonSuffixLength(before, prefix) + commonPrefixLength(after, suffix);

    if (score > bestScore) {
      best = at;
      bestScore = score;
    }
  }

  return { start: best, end: best + exact.length, outdated: false };
}

function commonPrefixLength(left: string, right: string): number {
  const limit = Math.min(left.length, right.length);
  let count = 0;
  while (count < limit && left[count] === right[count]) {
    count += 1;
  }

  return count;
}

function commonSuffixLength(left: string, right: string): number {
  const limit = Math.min(left.length, right.length);
  let count = 0;
  while (count < limit && left[left.length - 1 - count] === right[right.length - 1 - count]) {
    count += 1;
  }

  return count;
}

/**
 * Capture the selector for a newly made selection.
 *
 * The quote and its surrounding context are all read from the same normalized
 * text that `locateQuote` will later search, so a selector always round-trips
 * against an unchanged document.
 */
export function describeSelection(index: TextIndex, start: number, end: number) {
  return {
    exact: index.text.slice(start, end),
    prefix: index.text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
    suffix: index.text.slice(end, end + CONTEXT_LENGTH),
  };
}
