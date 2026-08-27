/**
 * On-disk representation of an annotation.
 *
 * Comments are stored in the Markdown itself as HTML comment blocks, which every
 * Markdown renderer drops from its output. The payload is a flattened W3C Web
 * Annotation selector (https://www.w3.org/TR/annotation-model/): `exact` plus the
 * `prefix`/`suffix` context that disambiguates it. Nothing is ever written inline,
 * so annotating text can never perturb tables, lists, code fences or front matter.
 *
 * Wire format:
 *
 *     <!-- annotation
 *     id=c1 author="anchit" created="2026-08-26T18:04:00Z" line=3
 *     exact="Draft" prefix="| Comments | " suffix="  |"
 *
 *     Should this say "In review" instead?
 *     -->
 *
 * The attribute section runs to the first blank line; everything after it is the
 * comment body, which may itself contain blank lines.
 */
export type Annotation = {
  id: string;
  /** Comment text. May be multi-line Markdown. */
  body: string;
  /** The quoted text this comment is anchored to, whitespace-normalized. */
  exact: string;
  /** Text immediately before `exact`, used to disambiguate repeated quotes. */
  prefix: string;
  /** Text immediately after `exact`, used to disambiguate repeated quotes. */
  suffix: string;
  author?: string;
  created?: string;
  /** Source line the anchor was on when written. A hint for tie-breaking only. */
  line?: number;
  /** Set on replies; points at the id of the comment being replied to. */
  replyTo?: string;
  resolved?: boolean;
};

/** An annotation plus the character range it occupies in the document. */
export type ParsedAnnotation = Annotation & { from: number; to: number };

const OPENING = '<!-- annotation';
const CLOSING = '-->';

/**
 * `-->` cannot appear literally inside an HTML comment, so bodies escape it.
 * The escape is chosen to still read as the original when skimmed.
 */
const escapeBody = (body: string) => body.replace(/-->/g, '--\\>');
const unescapeBody = (body: string) => body.replace(/--\\>/g, '-->');

/**
 * Collapse whitespace runs to single spaces.
 *
 * Rendered HTML carries incidental newlines and indentation that the source does
 * not, so every quote is normalized on both the write and the match side.
 */
export function normalize(text: string): string {
  return text.replace(/\s+/g, ' ');
}

/**
 * Find every annotation block in `doc`.
 *
 * Blocks are located by scanning rather than with a single regex so that a
 * malformed block (one missing its terminator) truncates parsing at that point
 * instead of swallowing the rest of the document.
 */
export function parseAnnotations(doc: string): ParsedAnnotation[] {
  const results: ParsedAnnotation[] = [];
  let cursor = 0;

  while (cursor < doc.length) {
    const start = doc.indexOf(OPENING, cursor);
    if (start === -1) {
      break;
    }

    // Only recognize blocks that begin a line; an "<!-- annotation" appearing
    // mid-sentence is prose, not a record.
    if (start > 0 && doc[start - 1] !== '\n') {
      cursor = start + OPENING.length;
      continue;
    }

    const end = findTerminator(doc, start + OPENING.length);
    if (end === -1) {
      break;
    }

    const parsed = parseBlock(doc.slice(start + OPENING.length, end));
    if (parsed !== undefined) {
      results.push({ ...parsed, from: start, to: end + CLOSING.length });
    }

    cursor = end + CLOSING.length;
  }

  return results;
}

/** Locate the `-->` that sits alone on its own line, which closes a block. */
function findTerminator(doc: string, from: number): number {
  let cursor = from;

  while (cursor < doc.length) {
    const candidate = doc.indexOf(CLOSING, cursor);
    if (candidate === -1) {
      return -1;
    }

    const lineStart = doc.lastIndexOf('\n', candidate) + 1;
    if (doc.slice(lineStart, candidate).trim() === '') {
      return candidate;
    }

    cursor = candidate + CLOSING.length;
  }

  return -1;
}

function parseBlock(content: string): Annotation | undefined {
  // The attribute section ends at the first blank line. Only the *first* one
  // separates, so bodies are free to contain blank lines of their own.
  const separator = content.match(/\n[ \t]*\n/);
  const head = separator === null ? content : content.slice(0, separator.index);
  const body = separator === null
    ? ''
    : content.slice((separator.index ?? 0) + separator[0].length);

  const attributes = parseAttributes(head);
  const id = attributes.get('id');
  if (id === undefined) {
    return undefined;
  }

  const line = Number(attributes.get('line'));

  return {
    id,
    body: unescapeBody(stripTerminatorLine(body)).trim(),
    exact: attributes.get('exact') ?? '',
    prefix: attributes.get('prefix') ?? '',
    suffix: attributes.get('suffix') ?? '',
    author: attributes.get('author'),
    created: attributes.get('created'),
    line: Number.isFinite(line) ? line : undefined,
    replyTo: attributes.get('reply-to'),
    resolved: attributes.get('resolved') === 'true',
  };
}

/** Drop the trailing line that held the `-->` terminator. */
function stripTerminatorLine(body: string): string {
  return body.replace(/\n[ \t]*$/, '');
}

/**
 * Parse whitespace-separated `key=value` pairs, where a value is either a bare
 * token or a JSON string. JSON is used for quoted values so that quotes,
 * backslashes and newlines inside a selector survive a round trip unambiguously.
 */
function parseAttributes(head: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const pattern = /([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g;

  for (const match of head.matchAll(pattern)) {
    const [, key, quoted, bare] = match;
    if (quoted !== undefined) {
      try {
        attributes.set(key, JSON.parse(`"${quoted}"`) as string);
      } catch {
        attributes.set(key, quoted);
      }
    } else {
      attributes.set(key, bare);
    }
  }

  return attributes;
}

/** Render an annotation as the HTML comment block that will be written to disk. */
export function serializeAnnotation(annotation: Annotation): string {
  const quote = (value: string) => JSON.stringify(value);

  const identity = [`id=${annotation.id}`];
  if (annotation.author !== undefined) {
    identity.push(`author=${quote(annotation.author)}`);
  }
  if (annotation.created !== undefined) {
    identity.push(`created=${quote(annotation.created)}`);
  }
  if (annotation.line !== undefined) {
    identity.push(`line=${annotation.line}`);
  }
  if (annotation.replyTo !== undefined) {
    identity.push(`reply-to=${annotation.replyTo}`);
  }
  if (annotation.resolved === true) {
    identity.push('resolved=true');
  }

  // Replies inherit their anchor from the comment they answer, so they carry no
  // selector of their own; omitting it keeps the block readable.
  const lines = [OPENING, identity.join(' ')];
  if (annotation.replyTo === undefined) {
    lines.push([
      `exact=${quote(annotation.exact)}`,
      `prefix=${quote(annotation.prefix)}`,
      `suffix=${quote(annotation.suffix)}`,
    ].join(' '));
  }

  lines.push('', escapeBody(annotation.body.trim()), CLOSING);
  return lines.join('\n');
}

/** Mint an id that is short, readable in source, and unused in `existing`. */
export function nextIdentifier(existing: Iterable<string>): string {
  const taken = new Set(existing);
  for (let index = 1; ; index += 1) {
    const candidate = `c${index}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
}
