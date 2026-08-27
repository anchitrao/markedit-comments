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

/** A contiguous span of one text node, the unit that can be wrapped in place. */
export type NodeSpan = { node: Text; from: number; to: number };

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
 * Convert a range of normalized positions into the DOM spans it covers.
 *
 * A normalized range can straddle several text nodes, and within one node the
 * mapped offsets need not be contiguous (collapsed whitespace leaves gaps). Each
 * node therefore contributes a single span from its lowest to its highest mapped
 * offset, which re-includes the whitespace that normalization hid.
 */
export function spansForRange(index: TextIndex, start: number, end: number): NodeSpan[] {
  const spans: NodeSpan[] = [];

  for (let position = start; position < end; position += 1) {
    const node = index.nodes[position];
    const offset = index.offsets[position];
    if (node === undefined) {
      break;
    }

    const previous = spans[spans.length - 1];
    if (previous !== undefined && previous.node === node) {
      previous.to = offset + 1;
    } else {
      spans.push({ node, from: offset, to: offset + 1 });
    }
  }

  return spans;
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
 * Wrap a span of a text node in a fresh element, in place.
 *
 * The span is always contained in a single text node, which is what makes
 * `surroundContents` safe here: it can never partially enclose an element.
 */
export function wrapSpan(span: NodeSpan, create: () => HTMLElement): HTMLElement {
  const range = document.createRange();
  range.setStart(span.node, span.from);
  range.setEnd(span.node, Math.min(span.to, span.node.data.length));

  const wrapper = create();
  range.surroundContents(wrapper);
  return wrapper;
}
