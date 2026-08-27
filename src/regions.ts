/**
 * Regions of a document that a comment must never be written into.
 *
 * Placement is otherwise driven by the line numbers the preview reports for each
 * block, and those cannot always be trusted: a Mermaid fence carries none at all,
 * so a comment about it fell back to the end of the file, and a wrong number puts
 * an HTML comment inside a code fence — which is not a comment in that language,
 * so it corrupts the very thing it annotates.
 *
 * Checking the source directly makes the guarantee independent of what any
 * renderer reports.
 */
export type Region = { from: number; to: number };

/**
 * Fenced code blocks and front matter, as character ranges.
 *
 * `to` is the offset just past the closing delimiter, so it is itself a safe
 * place to write.
 */
export function unsafeRegions(document: string): Region[] {
  const regions: Region[] = [];
  const lines = document.split('\n');

  let offset = 0;
  let fence: { marker: string; length: number; from: number } | undefined;

  for (const [index, line] of lines.entries()) {
    const lineStart = offset;
    offset += line.length + 1;
    const lineEnd = Math.min(offset - 1, document.length);

    // Front matter, which only counts as such on the very first line.
    if (index === 0 && /^---\s*$/.test(line)) {
      const closing = lines.findIndex((candidate, at) => at > 0 && /^(---|\.\.\.)\s*$/.test(candidate));
      if (closing > 0) {
        const end = lines.slice(0, closing + 1).reduce((total, text) => total + text.length + 1, 0);
        regions.push({ from: 0, to: Math.min(end - 1, document.length) });
      }
      continue;
    }

    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (match === null) {
      continue;
    }

    const marker = match[1][0];
    if (fence === undefined) {
      fence = { marker, length: match[1].length, from: lineStart };
      continue;
    }

    // A fence closes on the same character, repeated at least as many times, and
    // with nothing else on the line.
    if (marker === fence.marker && match[1].length >= fence.length && line.slice(match[1].length).trim() === '') {
      regions.push({ from: fence.from, to: lineEnd });
      fence = undefined;
    }
  }

  // An unterminated fence runs to the end of the document.
  if (fence !== undefined) {
    regions.push({ from: fence.from, to: document.length });
  }

  return regions;
}

/**
 * Move an insertion point out of any region it must not be written into.
 *
 * Nesting is handled by repeating until the offset is clear, so a fence reported
 * inside front matter still resolves to a position after both.
 */
export function safeInsertionPoint(document: string, at: number): number {
  let position = Math.max(0, Math.min(at, document.length));

  for (let pass = 0; pass < 8; pass += 1) {
    const region = unsafeRegions(document).find(candidate => position > candidate.from && position < candidate.to);
    if (region === undefined) {
      return position;
    }

    position = region.to;
  }

  return position;
}
