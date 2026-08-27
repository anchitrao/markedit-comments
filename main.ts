import { MarkEdit } from 'markedit-api';
import type { MenuItem } from 'markedit-api';

import { activate, handleSelection, orderedRoots, repaint, currentPane } from './src/preview';
import { installStyles } from './src/ui';
import { observeTheme } from './src/theme';
import { readAnnotations, removeAnnotation, roots, threadOf } from './src/store';
import { ID_ATTRIBUTE } from './src/paint';
import type { Settings } from './src/preview';

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

installStyles();
observeTheme();
activate(settings);

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
      action: () => void copyForReview(),
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
  const target = pane.querySelector(`[${ID_ATTRIBUTE}="${comments[cursor].id}"]`);

  if (target === null) {
    return;
  }

  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (target as HTMLElement).classList.add('mec-active');
  setTimeout(() => (target as HTMLElement).classList.remove('mec-active'), 900);
}

/**
 * Put every comment on the clipboard as plain text.
 *
 * The point of storing comments in the document is that an agent can read them
 * straight from the file; this is for the times you would rather paste the
 * review into a conversation than point at the path.
 */
async function copyForReview(): Promise<void> {
  const all = readAnnotations();
  const comments = roots(all);

  if (comments.length === 0) {
    await MarkEdit.showAlert({ title: 'No comments', message: 'This document has no comments yet.' });
    return;
  }

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

  const text = [heading, '', ...sections].join('\n\n');
  await navigator.clipboard.writeText(text);
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
