import { UI_ATTRIBUTE } from './textIndex';
import { renderInto } from './markdown';
import type { ParsedAnnotation } from './format';

import styles from './styles.css?raw';

/**
 * The floating panels: the composer that opens on a selection, and the thread
 * that opens on an existing highlight.
 *
 * Only one is ever on screen. Both are appended to the document body rather than
 * into the preview, so that their own text is never part of the rendered document
 * that quotes are captured from.
 */

let current: HTMLElement | undefined;
let dismiss: (() => void) | undefined;

export function installStyles(): void {
  const element = document.createElement('style');
  element.textContent = styles;
  element.setAttribute(UI_ATTRIBUTE, '');
  document.head.appendChild(element);
}

/** Close whatever panel is open, running its cancel handler. */
export function closePanel(): void {
  const onDismiss = dismiss;
  current?.remove();
  current = undefined;
  dismiss = undefined;
  onDismiss?.();
}

export function isPanelOpen(): boolean {
  return current !== undefined;
}

/** True when `node` is inside our own UI, which most handlers should ignore. */
export function isOwnUI(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement ?? null;
  return element?.closest(`[${UI_ATTRIBUTE}]`) !== null && element !== null;
}

function present(panel: HTMLElement, near: DOMRect, onDismiss?: () => void): void {
  closePanel();

  panel.classList.add('mec-panel');
  panel.setAttribute(UI_ATTRIBUTE, '');
  document.body.appendChild(panel);

  position(panel, near);
  current = panel;
  dismiss = onDismiss;
}

/** Place the panel under the anchor, flipping above it when it would overflow. */
function position(panel: HTMLElement, near: DOMRect): void {
  const margin = 8;
  const { width, height } = panel.getBoundingClientRect();

  const left = Math.min(
    Math.max(margin, near.left),
    Math.max(margin, window.innerWidth - width - margin),
  );

  const below = near.bottom + margin;
  const top = below + height > window.innerHeight - margin
    ? Math.max(margin, near.top - height - margin)
    : below;

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function build(tag: string, className?: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className !== undefined) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

/**
 * A textarea wired for "type, then commit".
 *
 * Return submits, because the whole point of opening on selection is that the
 * reader can type a sentence and be done; Shift-Return is left for the occasional
 * multi-line comment, and Escape abandons it.
 */
function makeInput(placeholder: string, submit: () => void): HTMLTextAreaElement {
  const input = document.createElement('textarea');
  input.className = 'mec-input';
  input.placeholder = placeholder;
  input.rows = 3;

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      submit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePanel();
    }
  });

  return input;
}

function actionRow(hint: string, buttons: HTMLElement[]): HTMLElement {
  const row = build('div', 'mec-actions');
  row.appendChild(build('span', 'mec-hint', hint));
  buttons.forEach(button => row.appendChild(button));
  return row;
}

function makeButton(label: string, className: string, action: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `mec-button ${className}`;
  button.textContent = label;
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    action();
  });

  return button;
}

export type ComposerOptions = {
  quote: string;
  near: DOMRect;
  onSubmit: (body: string) => void;
  onCancel: () => void;
};

/**
 * Open the composer over a fresh selection, focused and ready for typing.
 *
 * Focusing the textarea clears the browser's selection, which is why the caller
 * paints its own highlight over the range first: the reader keeps seeing what
 * they are commenting on while they write.
 */
export function showComposer({ quote, near, onSubmit, onCancel }: ComposerOptions): void {
  const panel = build('div');
  let committed = false;

  const commit = () => {
    const body = input.value.trim();
    if (body.length === 0) {
      return;
    }

    committed = true;
    closePanel();
    onSubmit(body);
  };

  const input = makeInput('Comment on the highlighted text…', commit);
  const submitButton = makeButton('Comment', 'mec-primary', commit);
  submitButton.disabled = true;
  input.addEventListener('input', () => { submitButton.disabled = input.value.trim().length === 0; });

  panel.appendChild(build('div', 'mec-quote', quote));
  panel.appendChild(input);
  panel.appendChild(actionRow('↵ to save', [
    makeButton('Cancel', '', closePanel),
    submitButton,
  ]));

  present(panel, near, () => {
    if (!committed) {
      onCancel();
    }
  });

  input.focus();
}

export type ThreadOptions = {
  thread: ParsedAnnotation[];
  quote: string;
  outdated: boolean;
  near: DOMRect;
  onReply: (body: string) => void;
  onToggleResolved: () => void;
  onDelete: () => void;
};

/** Open the conversation attached to a highlight. */
export function showThread(options: ThreadOptions): void {
  const { thread, quote, outdated, near } = options;
  const [root] = thread;
  if (root === undefined) {
    return;
  }

  const panel = build('div');
  panel.appendChild(build('div', 'mec-quote', quote));

  const list = build('div', 'mec-thread');
  for (const comment of thread) {
    list.appendChild(renderComment(comment, outdated && comment === root));
  }
  panel.appendChild(list);

  const commit = () => {
    const body = input.value.trim();
    if (body.length > 0) {
      closePanel();
      options.onReply(body);
    }
  };

  const input = makeInput('Reply…', commit);
  panel.appendChild(input);

  panel.appendChild(actionRow('', [
    makeButton('Delete', 'mec-danger', () => { closePanel(); options.onDelete(); }),
    makeButton(root.resolved === true ? 'Reopen' : 'Resolve', '', () => {
      closePanel();
      options.onToggleResolved();
    }),
    makeButton('Reply', 'mec-primary', commit),
  ]));

  present(panel, near);
}

function renderComment(comment: ParsedAnnotation, outdated: boolean): HTMLElement {
  const container = build('div', 'mec-comment');

  const byline = build('div', 'mec-byline');
  byline.appendChild(build('span', 'mec-author', comment.author ?? 'unknown'));
  byline.appendChild(build('span', '', formatTimestamp(comment.created)));

  if (comment.resolved === true) {
    byline.appendChild(build('span', 'mec-flag', 'resolved'));
  }

  if (outdated) {
    const flag = build('span', 'mec-flag', 'outdated');
    flag.title = 'The text this comment quoted has changed.';
    byline.appendChild(flag);
  }

  container.appendChild(byline);

  const body = build('div', 'mec-body');
  void renderInto(body, comment.body);
  container.appendChild(body);
  return container;
}

function formatTimestamp(value: string | undefined): string {
  if (value === undefined) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
