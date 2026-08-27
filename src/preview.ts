import { MarkEdit } from 'markedit-api';

import { describeSelection } from './anchor';
import { normalize } from './format';
import { ID_ATTRIBUTE, clearHighlights, paintHighlights } from './paint';
import { addAnnotation, defaultAuthor, isEditorAttached, readAnnotations, removeAnnotation, roots, threadOf, toggleResolved, updateAnnotation } from './store';
import { buildTextIndex, positionOf, spansForRange, wrapSpan } from './textIndex';
import { closePanel, isOwnUI, isPanelOpen, showComposer, showThread } from './ui';
import { applyThemeColors } from './theme';
import type { PaintableAnnotation } from './paint';
import type { ParsedAnnotation } from './format';

export type Settings = {
  author?: string;
  /** Open the composer the moment a selection is made. */
  openOnSelect: boolean;
  /** Keep painting highlights for comments that have been resolved. */
  showResolved: boolean;
};

const PENDING = 'pending';

let pane: HTMLElement | undefined;
let settings: Settings;
let observer: MutationObserver | undefined;
let repaintHandle: number | undefined;

/** Start observing the preview; resolves once the pane exists. */
export function activate(options: Settings): void {
  settings = options;
  whenPaneExists(found => {
    pane = found;
    installListeners(found);
    watch(found);
    paintWhenReady();
  });
}

export function currentPane(): HTMLElement | undefined {
  return pane;
}

/**
 * Paint once there is a document to read.
 *
 * The preview pane can already exist when this script loads, but the editor
 * behind it may not be attached yet; painting then would read a document that
 * does not exist.
 */
function paintWhenReady(): void {
  if (isEditorAttached()) {
    repaint();
    return;
  }

  MarkEdit.onEditorReady(() => repaint());
}

/**
 * Wait for MarkEdit-preview to create its pane.
 *
 * User scripts load in name order, so this extension is running before the
 * preview extension has built anything; there is no readiness event to wait on.
 */
function whenPaneExists(found: (pane: HTMLElement) => void): void {
  const existing = document.querySelector<HTMLElement>('.markdown-body');
  if (existing !== null) {
    found(existing);
    return;
  }

  const watcher = new MutationObserver(() => {
    const pane = document.querySelector<HTMLElement>('.markdown-body');
    if (pane !== null) {
      watcher.disconnect();
      found(pane);
    }
  });

  watcher.observe(document.body, { childList: true, subtree: true });
}

/**
 * Repaint whenever the preview re-renders.
 *
 * The preview replaces its own contents wholesale on a debounce after each edit,
 * which wipes the highlights; observing is what makes them come back. The
 * observer is disconnected across our own painting so that wrapping text in
 * marks cannot re-trigger it.
 */
function watch(pane: HTMLElement): void {
  observer = new MutationObserver(() => scheduleRepaint());
  observer.observe(pane, { childList: true, subtree: true, characterData: true });
}

function scheduleRepaint(): void {
  if (repaintHandle !== undefined) {
    cancelAnimationFrame(repaintHandle);
  }

  repaintHandle = requestAnimationFrame(() => {
    repaintHandle = undefined;
    repaint();
  });
}

export function repaint(): void {
  if (pane === undefined || !isEditorAttached()) {
    return;
  }

  // Re-measure here as well: a repaint follows every render, which makes this the
  // reliable point at which the theme is known to be fully applied.
  applyThemeColors();

  const annotations = visibleAnnotations();

  observer?.disconnect();
  try {
    paintHighlights(pane, annotations);
  } finally {
    if (observer !== undefined) {
      observer.observe(pane, { childList: true, subtree: true, characterData: true });
    }
  }
}

function visibleAnnotations(): PaintableAnnotation[] {
  const all = readAnnotations();
  return roots(all)
    .filter(annotation => settings.showResolved || annotation.resolved !== true)
    .map(annotation => ({
      ...annotation,
      replyCount: all.filter(other => other.replyTo === annotation.id).length,
    }));
}

function installListeners(pane: HTMLElement): void {
  // A selection is only final once the mouse is released; reading it on the same
  // tick still reports the pre-release state, hence the deferral.
  pane.addEventListener('mouseup', event => {
    if (isOwnUI(event.target as Node)) {
      return;
    }

    setTimeout(() => handleSelection(), 0);
  });

  pane.addEventListener('click', event => {
    const target = event.target as Element | null;
    const mark = target?.closest?.(`[${ID_ATTRIBUTE}]`) as HTMLElement | null;
    const id = mark?.getAttribute(ID_ATTRIBUTE);

    if (id !== null && id !== undefined && id !== PENDING) {
      event.preventDefault();
      event.stopPropagation();
      openThread(id, mark!.getBoundingClientRect());
    }
  });

  document.addEventListener('mousedown', event => {
    if (isPanelOpen() && !isOwnUI(event.target as Node)) {
      closePanel();
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isPanelOpen()) {
      closePanel();
    }
  });
}

/**
 * Turn the current preview selection into a comment in progress.
 *
 * The selection is painted as a highlight before the composer takes focus,
 * because focusing an input clears the browser selection; without the paint the
 * reader would lose sight of what they are commenting on exactly as they start
 * to type.
 */
export function handleSelection(): boolean {
  if (pane === undefined || isPanelOpen()) {
    return false;
  }

  const captured = captureSelection(pane);
  if (captured === undefined) {
    return false;
  }

  if (!settings.openOnSelect) {
    return false;
  }

  openComposer(captured);
  return true;
}

type Capture = {
  exact: string;
  prefix: string;
  suffix: string;
  start: number;
  end: number;
  line: number | undefined;
  blockEndLine: number;
  rect: DOMRect;
};

function captureSelection(pane: HTMLElement): Capture | undefined {
  const selection = window.getSelection();
  if (selection === null || selection.isCollapsed || selection.rangeCount === 0) {
    return undefined;
  }

  const range = selection.getRangeAt(0);
  if (!pane.contains(range.commonAncestorContainer) || isOwnUI(range.commonAncestorContainer)) {
    return undefined;
  }

  const index = buildTextIndex(pane);
  const rawStart = positionOf(index, range.startContainer, range.startOffset);
  const rawEnd = positionOf(index, range.endContainer, range.endOffset);
  if (rawStart === undefined || rawEnd === undefined) {
    return undefined;
  }

  // Trim the whitespace a drag usually picks up at the edges, so the stored quote
  // is the words the reader meant rather than the pixels they covered.
  let start = rawStart;
  let end = rawEnd;
  while (start < end && /\s/.test(index.text[start])) {
    start += 1;
  }
  while (end > start && /\s/.test(index.text[end - 1])) {
    end -= 1;
  }

  if (end <= start) {
    return undefined;
  }

  const selector = describeSelection(index, start, end);
  const lines = lineRangeAround(pane, range.startContainer, range.endContainer);

  return {
    ...selector,
    start,
    end,
    line: lines?.from,
    blockEndLine: lines?.to ?? MarkEdit.editorAPI.getLineCount() - 1,
    rect: range.getBoundingClientRect(),
  };
}

function openComposer(capture: Capture): void {
  paintPending(capture.start, capture.end);
  window.getSelection()?.removeAllRanges();

  showComposer({
    quote: capture.exact,
    near: capture.rect,
    onCancel: () => repaint(),
    onSubmit: body => {
      addAnnotation({
        body,
        exact: capture.exact,
        prefix: capture.prefix,
        suffix: capture.suffix,
        author: defaultAuthor(settings.author),
        created: new Date().toISOString(),
        line: capture.line,
      }, capture.blockEndLine);
      // The preview re-renders on its own debounce and the repaint follows it;
      // the pending highlight stands in until then so nothing flickers.
    },
  });
}

function paintPending(start: number, end: number): void {
  if (pane === undefined) {
    return;
  }

  observer?.disconnect();
  try {
    const index = buildTextIndex(pane);
    for (const span of spansForRange(index, start, end)) {
      wrapSpan(span, () => {
        const mark = document.createElement('mark');
        mark.className = 'mec-highlight mec-active';
        mark.setAttribute(ID_ATTRIBUTE, PENDING);
        return mark;
      });
    }
  } finally {
    if (observer !== undefined && pane !== undefined) {
      observer.observe(pane, { childList: true, subtree: true, characterData: true });
    }
  }
}

function openThread(id: string, rect: DOMRect): void {
  const all = readAnnotations();
  const thread = threadOf(all, id);
  const root = thread[0];
  if (root === undefined) {
    return;
  }

  const mark = pane?.querySelector(`[${ID_ATTRIBUTE}="${id}"]`);
  const outdated = mark?.classList.contains('mec-outdated') === true;

  showThread({
    thread,
    quote: root.exact.length > 0 ? root.exact : '(no quoted text)',
    outdated,
    near: rect,
    onReply: body => {
      addAnnotation({
        body,
        exact: '',
        prefix: '',
        suffix: '',
        replyTo: id,
        author: defaultAuthor(settings.author),
        created: new Date().toISOString(),
      }, MarkEdit.editorAPI.getLineNumber(root.to));
    },
    onToggleResolved: () => {
      toggleResolved(id);
      scheduleRepaint();
    },
    onDelete: () => {
      removeAnnotation(id);
      scheduleRepaint();
    },
  });
}

/**
 * The source line range of the top-level block the selection sits in.
 *
 * `data-line-from` / `data-line-to` are emitted by the preview renderer for
 * scroll syncing; reusing them is what lets a comment be written directly after
 * the block it belongs to, which is the only placement that leaves the
 * surrounding Markdown structure intact.
 */
function lineRangeAround(pane: HTMLElement, start: Node, end: Node): { from: number; to: number } | undefined {
  const blocks = [topLevelBlock(pane, start), topLevelBlock(pane, end)]
    .filter((block): block is HTMLElement => block !== undefined);

  if (blocks.length === 0) {
    return undefined;
  }

  const ranges = blocks.map(lineRangeOf).filter((range): range is { from: number; to: number } => range !== undefined);
  if (ranges.length === 0) {
    return undefined;
  }

  return {
    from: Math.min(...ranges.map(range => range.from)),
    to: Math.max(...ranges.map(range => range.to)),
  };
}

function topLevelBlock(pane: HTMLElement, node: Node): HTMLElement | undefined {
  let element: HTMLElement | null = node instanceof HTMLElement ? node : node.parentElement;
  while (element !== null && element.parentElement !== pane) {
    element = element.parentElement;
  }

  return element ?? undefined;
}

/**
 * Widest line range covered by a block.
 *
 * The attributes may sit on the block or on something inside it: the preview
 * wraps code fences in an un-attributed container, for one.
 */
function lineRangeOf(block: HTMLElement): { from: number; to: number } | undefined {
  const candidates = [block, ...block.querySelectorAll<HTMLElement>('[data-line-from]')];

  let from = Number.POSITIVE_INFINITY;
  let to = Number.NEGATIVE_INFINITY;

  for (const element of candidates) {
    const start = readLine(element, 'data-line-from');
    const finish = readLine(element, 'data-line-to');
    if (start !== undefined) {
      from = Math.min(from, start);
    }
    if (finish !== undefined) {
      to = Math.max(to, finish);
    }
  }

  return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : undefined;
}

/**
 * Read a line attribute, treating a missing one as missing.
 *
 * `Number(null)` is `0`, which would otherwise make every element without the
 * attribute claim to start at the first line of the document.
 */
function readLine(element: HTMLElement, attribute: string): number | undefined {
  const raw = element.getAttribute(attribute);
  if (raw === null) {
    return undefined;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** Comments in document order, for the navigation commands. */
export function orderedRoots(): ParsedAnnotation[] {
  return roots(readAnnotations());
}

export { clearHighlights, normalize, updateAnnotation };
