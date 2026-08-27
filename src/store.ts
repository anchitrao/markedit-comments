import { MarkEdit } from 'markedit-api';
import { parseAnnotations, serializeAnnotation, nextIdentifier } from './format';
import { safeInsertionPoint } from './regions';
import type { Annotation, ParsedAnnotation } from './format';

/**
 * Reads and writes annotations in the open document.
 *
 * Every block is written at column zero between two top-level blocks, separated
 * by blank lines. That placement is what keeps the format safe: an HTML comment
 * indented into a list, dropped between table rows, or nested inside a blockquote
 * changes how the surrounding Markdown parses, whereas one sitting alone between
 * blocks is invisible to every renderer and inert to the parser.
 */
export function readAnnotations(): ParsedAnnotation[] {
  if (!isEditorAttached()) {
    return [];
  }

  return parseAnnotations(MarkEdit.editorAPI.getText());
}

/**
 * Whether the editor is attached to a document yet.
 *
 * User scripts run before that happens, and the text API reaches through the
 * editor view, so reading the document too early throws rather than returning
 * empty. Callers that can run at load time check this first.
 */
export function isEditorAttached(): boolean {
  return MarkEdit.editorView?.state !== undefined;
}

/** Comments on the same anchor, oldest first, with replies following their parent. */
export function threadOf(annotations: ParsedAnnotation[], id: string): ParsedAnnotation[] {
  const root = annotations.find(annotation => annotation.id === id);
  if (root === undefined) {
    return [];
  }

  return [root, ...annotations.filter(annotation => annotation.replyTo === id)];
}

/** Top-level comments, i.e. those that carry an anchor of their own. */
export function roots(annotations: ParsedAnnotation[]): ParsedAnnotation[] {
  return annotations.filter(annotation => annotation.replyTo === undefined);
}

/**
 * Insert a new comment after the top-level block that ends on `blockEndLine`.
 *
 * Existing comments already attached to that block are stepped over, so a thread
 * accumulates in the order it was written instead of stacking in reverse.
 */
export function addAnnotation(draft: Omit<Annotation, 'id'>, blockEndLine: number): string {
  const api = MarkEdit.editorAPI;
  const document = api.getText();
  const existing = parseAnnotations(document);

  const annotation: Annotation = { ...draft, id: nextIdentifier(existing.map(item => item.id)) };

  // The line the preview reported can land inside a code fence — a Mermaid fence
  // reports no lines at all — and an HTML comment written there is not a comment
  // in that language, so it breaks the block it was meant to annotate. The source
  // is checked directly rather than trusting the reported line.
  const requested = lastContentOffset(document, endOfLine(blockEndLine));
  const at = insertionPoint(document, existing, safeInsertionPoint(document, requested));

  const block = `\n\n${serializeAnnotation(annotation)}${trailingSeparator(document, at)}`;
  api.setText(block, { from: at, to: at });
  return annotation.id;
}

/** Replace a comment in place, keeping its position in the document. */
export function updateAnnotation(id: string, changes: Partial<Annotation>): void {
  const existing = readAnnotations();
  const target = existing.find(annotation => annotation.id === id);
  if (target === undefined) {
    return;
  }

  const { from, to, ...current } = target;
  MarkEdit.editorAPI.setText(serializeAnnotation({ ...current, ...changes }), { from, to });
}

/**
 * Delete a comment and, when it is a root, every reply beneath it.
 *
 * Ranges are removed back to front so that each deletion leaves the offsets of
 * the ones still pending untouched.
 */
export function removeAnnotation(id: string): void {
  const api = MarkEdit.editorAPI;
  const document = api.getText();
  const existing = parseAnnotations(document);

  const doomed = existing.filter(annotation => annotation.id === id || annotation.replyTo === id);
  const ordered = [...doomed].sort((left, right) => right.from - left.from);

  for (const annotation of ordered) {
    // Take the blank line that introduced the block with it, so removing a
    // comment leaves the document exactly as it was before the comment existed.
    const from = document.startsWith('\n\n', annotation.from - 2)
      ? annotation.from - 2
      : annotation.from;

    api.setText('', { from, to: annotation.to });
  }
}

/** Toggle a comment between open and resolved. */
export function toggleResolved(id: string): void {
  const target = readAnnotations().find(annotation => annotation.id === id);
  if (target !== undefined) {
    updateAnnotation(id, { resolved: target.resolved !== true });
  }
}

/**
 * Step back over blank lines to the end of the last line with content.
 *
 * A block's reported end can fall on the blank line that terminates it, and
 * inserting there would leave the comment adrift between two blocks rather than
 * attached to the one it annotates.
 */
function lastContentOffset(document: string, from: number): number {
  let at = from;

  while (at > 0) {
    const lineStart = document.lastIndexOf('\n', at - 1) + 1;
    if (document.slice(lineStart, at).trim() !== '') {
      return at;
    }

    at = lineStart === 0 ? 0 : lineStart - 1;
  }

  return at;
}

/**
 * Whatever is needed to leave a blank line between the block and what follows.
 *
 * A comment block that runs straight into the next line is read as part of it by
 * some parsers, so the separation is made explicit rather than assumed.
 */
function trailingSeparator(document: string, at: number): string {
  const rest = document.slice(at);

  // Nothing but the final newline follows, so there is nothing to separate from.
  // Adding one here would survive the block's own removal and leave the document
  // a line longer than it started.
  if (rest.trim().length === 0 || rest.startsWith('\n\n')) {
    return '';
  }

  return rest.startsWith('\n') ? '\n' : '\n\n';
}

function endOfLine(row: number): number {
  const api = MarkEdit.editorAPI;
  const clamped = Math.max(0, Math.min(row, api.getLineCount() - 1));
  return api.getLineRange(clamped).to;
}

/**
 * Walk forward over comment blocks that already follow this position, so a new
 * one lands after them rather than between them and the text they annotate.
 */
function insertionPoint(document: string, existing: ParsedAnnotation[], after: number): number {
  let at = after;

  for (;;) {
    const next = existing.find(annotation =>
      annotation.from >= at && document.slice(at, annotation.from).trim() === '');

    if (next === undefined) {
      return at;
    }

    at = next.to;
  }
}

/**
 * The author to attribute new comments to.
 *
 * The API exposes no user identity, and the app is sandboxed, so `home` resolves
 * to the app's container rather than the account. The account name is recovered
 * from the container path instead. An `author` setting overrides it, which is how
 * a document reviewed by more than one person (or by an agent) keeps its comments
 * distinguishable.
 */
export function defaultAuthor(configured?: string): string {
  if (typeof configured === 'string' && configured.length > 0) {
    return configured;
  }

  try {
    const container = MarkEdit.getDirectoryPath('home');
    const match = container.match(/^\/Users\/([^/]+)/);
    return match?.[1] ?? 'me';
  } catch {
    return 'me';
  }
}
