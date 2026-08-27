/**
 * A whitespace-normalized view of a subtree's text, with every character mapped
 * back to the DOM position it came from.
 *
 * Anchors are matched against rendered text rather than Markdown source, because
 * that is what the reader selected. Rendering introduces incidental newlines and
 * indentation between block elements, so the text is normalized as it is
 * collected and the mapping is what makes a match addressable again afterwards.
 */
export type TextIndex = {
  /** Normalized text: every run of whitespace collapsed to a single space. */
  text: string;
  /** `nodes[i]` and `offsets[i]` locate `text[i]` in the DOM. */
  nodes: Text[];
  offsets: number[];
};

/** Marks a subtree as belonging to this extension, so indexing steps over it. */
export const UI_ATTRIBUTE = 'data-mec-ui';

const isWhitespace = (character: string) => /\s/.test(character);

/**
 * Collect the normalized text of `root`.
 *
 * Subtrees belonging to this extension are skipped so that our own UI text never
 * pollutes the anchors we compute, and so that painting highlights does not
 * change what a later index would see.
 */
export function buildTextIndex(root: HTMLElement): TextIndex {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      const parent = node.parentElement;
      if (parent === null) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest(`[${UI_ATTRIBUTE}]`) !== null) {
        return NodeFilter.FILTER_REJECT;
      }

      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const characters: string[] = [];
  const nodes: Text[] = [];
  const offsets: number[] = [];

  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text;
    const value = text.data;

    for (let offset = 0; offset < value.length; offset += 1) {
      const character = value[offset];
      if (isWhitespace(character)) {
        // Collapse runs, and drop leading whitespace entirely, so that the
        // normalized text is stable regardless of how the HTML was formatted.
        if (characters.length === 0 || characters[characters.length - 1] === ' ') {
          continue;
        }

        characters.push(' ');
      } else {
        characters.push(character);
      }

      nodes.push(text);
      offsets.push(offset);
    }
  }

  return { text: characters.join(''), nodes, offsets };
}

/**
 * Map a DOM position onto its normalized index.
 *
 * Returns the first normalized position at or after the given DOM position, so
 * that a selection boundary landing inside collapsed whitespace still resolves.
 */
export function positionOf(index: TextIndex, node: Node, offset: number): number | undefined {
  if (node.nodeType !== Node.TEXT_NODE) {
    // A boundary on an element resolves to the first mapped character inside it.
    const first = index.nodes.findIndex(candidate => node.contains(candidate));
    return first === -1 ? undefined : first;
  }

  let fallback: number | undefined;
  for (let position = 0; position < index.nodes.length; position += 1) {
    if (index.nodes[position] !== node) {
      continue;
    }

    if (index.offsets[position] >= offset) {
      return position;
    }

    // Remember the last mapped character before `offset`; a boundary that sits
    // past every mapped character in the node belongs just after it.
    fallback = position + 1;
  }

  return fallback;
}

/**
 * A single Range covering a normalized span, which may cross element boundaries.
 *
 * One Range is enough because the highlight API paints across nodes; the
 * per-node spans below are only needed by callers that wrap elements.
 */
export function rangeBetween(index: TextIndex, start: number, end: number): Range | undefined {
  const startNode = index.nodes[start];
  const endNode = index.nodes[end - 1];
  if (startNode === undefined || endNode === undefined) {
    return undefined;
  }

  const range = document.createRange();
  range.setStart(startNode, index.offsets[start]);
  range.setEnd(endNode, Math.min(index.offsets[end - 1] + 1, endNode.data.length));
  return range;
}

