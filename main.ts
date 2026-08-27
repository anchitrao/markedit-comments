import { MarkEdit } from 'markedit-api';
import type { MenuItem } from 'markedit-api';

import { activate, handleSelection, orderedRoots, repaint, currentPane } from './src/preview';
import { installStyles } from './src/ui';
import { observeTheme } from './src/theme';
import { readAnnotations, removeAnnotation, roots, threadOf } from './src/store';
import { rectFor, setActive } from './src/paint';
import type { Settings } from './src/preview';
import type { ParsedAnnotation } from './src/format';

const SETTINGS_KEY = 'extension.markeditComments';

/**
 * Anchored review comments for MarkEdit's preview.
 *
 * Comments are stored in the Markdown itself, as HTML comment blocks holding a
 * W3C Web Annotation selector. Nothing is written inline, which is what makes the
 * format safe across every Markdown construct, including the ones no inline
 * scheme can annotate at all: code fences, indented code and inline code.
 */

function readSettings(): Settings {
  const configured = (MarkEdit.userSettings?.[SETTINGS_KEY] ?? {}) as Record<string, unknown>;
  return {
    author: typeof configured.author === 'string' ? configured.author : undefined,
    openOnSelect: configured.openOnSelect !== false,
    showResolved: configured.showResolved !== false,
  };
}

const settings = readSettings();

// Registered first: the menu is how the extension is discovered, and it should
// survive anything going wrong in the parts that touch the document.
MarkEdit.addMainMenuItem({
  title: 'Comments',
  icon: 'bubble.left.and.text.bubble.right',
  children: [
    {
      title: 'Comment on Selection',
      key: 'M',
      modifiers: ['Shift', 'Command'],
      action: () => {
        if (!handleSelection()) {
          void MarkEdit.showAlert({
            title: 'Nothing selected',
            message: 'Select text in the preview, then comment on it.',
          });
        }
      },
    },
    { separator: true },
    {
      title: 'Next Comment',
      key: ']',
      modifiers: ['Shift', 'Command'],
      action: () => step(1),
    },
    {
      title: 'Previous Comment',
      key: '[',
      modifiers: ['Shift', 'Command'],
      action: () => step(-1),
    },
    { separator: true },
    {
      title: 'Copy All Comments',
      action: () => copyForReview(),
    },
    {
      title: 'Delete Resolved Comments',
      state: () => ({ isEnabled: resolvedRoots().length > 0 }),
      action: () => void deleteResolved(),
    },
    { separator: true },
    {
      title: `Version ${__PKG_VERSION__}`,
      action: () => undefined,
    },
  ] satisfies MenuItem[],
});

installStyles();
observeTheme();
activate(settings);

function resolvedRoots() {
  return roots(readAnnotations()).filter(annotation => annotation.resolved === true);
}

let cursor = -1;

/** Scroll the preview through the comments in document order. */
function step(direction: number): void {
  const pane = currentPane();
  const comments = orderedRoots();
  if (pane === undefined || comments.length === 0) {
    return;
  }

  cursor = (cursor + direction + comments.length * 2) % comments.length;
  const id = comments[cursor].id;
  const rect = rectFor(id);
  if (rect === undefined) {
    return;
  }

  // There is no element to scroll to, so scroll the pane by the range's offset.
  const middle = rect.top + rect.height / 2 - pane.clientHeight / 2;
  pane.scrollBy({ top: middle, behavior: 'smooth' });

  setActive(id);
  setTimeout(() => setActive(undefined), 900);
}

/**
 * Put every comment on the clipboard as plain text.
 *
 * The point of storing comments in the document is that an agent can read them
 * straight from the file; this is for the times you would rather paste the
 * review into a conversation than point at the path.
 */
function copyForReview(): void {
  const all = readAnnotations();
  const comments = roots(all);

  if (comments.length === 0) {
    void MarkEdit.showAlert({ title: 'No comments', message: 'This document has no comments yet.' });
    return;
  }

  // `clipboard.write` has to be reached synchronously from the menu action or the
  // user activation is spent and the write is refused. Handing it a promise for
  // the text keeps the call synchronous while the file path is still being looked
  // up.
  const item = new ClipboardItem({
    'text/plain': reviewText(all, comments).then(text => new Blob([text], { type: 'text/plain' })),
  });

  navigator.clipboard.write([item]).catch((error: unknown) => {
    void MarkEdit.showAlert({
      title: 'Could not copy comments',
      message: error instanceof Error ? error.message : String(error),
    });
  });
}

async function reviewText(all: ParsedAnnotation[], comments: ParsedAnnotation[]): Promise<string> {
  const info = typeof MarkEdit.getFileInfo === 'function' ? await MarkEdit.getFileInfo() : undefined;
  const heading = info?.filePath === undefined ? 'Review comments' : `Review comments on ${info.filePath}`;

  const sections = comments.map((comment, position) => {
    const thread = threadOf(all, comment.id).map(entry =>
      `  ${entry.author ?? 'unknown'}: ${entry.body.replace(/\n/g, '\n  ')}`);

    return [
      `${position + 1}. ${comment.resolved === true ? '[resolved] ' : ''}on "${comment.exact}"`,
      ...thread,
    ].join('\n');
  });

  return [heading, ...sections].join('\n\n');
}

async function deleteResolved(): Promise<void> {
  const resolved = resolvedRoots();
  if (resolved.length === 0) {
    return;
  }

  const choice = await MarkEdit.showAlert({
    title: `Delete ${resolved.length} resolved comment${resolved.length === 1 ? '' : 's'}?`,
    message: 'This removes them from the document. It can be undone with Edit > Undo.',
    buttons: ['Delete', 'Cancel'],
  });

  if (choice !== 0) {
    return;
  }

  // Removal rewrites offsets, so each pass re-reads the document.
  for (const comment of resolved) {
    removeAnnotation(comment.id);
  }

  repaint();
}
