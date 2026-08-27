import { UI_ATTRIBUTE } from './textIndex';
import { rectFor, setActive } from './paint';
import { build, makeButton, makeInput, renderComment } from './ui';
import type { ParsedAnnotation } from './format';

/**
 * A rail of comment threads beside the document.
 *
 * Each thread sits level with the text it annotates and moves with it as the
 * reader scrolls, so a comment can be read against its subject without opening
 * anything. Threads whose anchors are close together would overlap, so they are
 * pushed down in document order — the arrangement a word processor's margin
 * comments use, and the reason the rail is laid out rather than simply listed.
 */
export type SidebarHandlers = {
  onReply: (id: string, body: string) => void;
  onToggleResolved: (id: string) => void;
  onDelete: (id: string) => void;
  onFocusAnchor: (id: string) => void;
};

const GAP = 8;
const TOP_MARGIN = 12;

let rail: HTMLElement | undefined;
let handlers: SidebarHandlers | undefined;
let cards = new Map<string, HTMLElement>();
let activeId: string | undefined;
let frame: number | undefined;

export function isOpen(): boolean {
  return document.documentElement.classList.contains('mec-sidebar-open');
}

export function install(scroller: HTMLElement, callbacks: SidebarHandlers): void {
  handlers = callbacks;

  rail = build('div', 'mec-rail');
  rail.setAttribute(UI_ATTRIBUTE, '');
  document.body.appendChild(rail);

  // Cards are placed from the anchors' viewport positions, so anything that
  // moves them has to trigger a re-layout.
  scroller.addEventListener('scroll', scheduleLayout, { passive: true });
  window.addEventListener('resize', scheduleLayout);
}

export function toggle(): boolean {
  const open = !isOpen();
  document.documentElement.classList.toggle('mec-sidebar-open', open);
  scheduleLayout();
  return open;
}

export function setOpen(open: boolean): void {
  document.documentElement.classList.toggle('mec-sidebar-open', open);
  scheduleLayout();
}

/** Mark one thread as the focused one, without moving the reader. */
export function focus(id: string | undefined): void {
  activeId = id;
  for (const [cardId, card] of cards) {
    card.classList.toggle('mec-card-active', cardId === id);
  }

  setActive(id);

  // Focusing reveals the reply box and actions, so the card grows and everything
  // below it has to be pushed down again.
  layout();

  const card = id === undefined ? undefined : cards.get(id);
  card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/**
 * Rebuild the rail for the current set of threads.
 *
 * Cards are recreated rather than diffed: a thread is small, and rebuilding
 * keeps the rail honest about resolved state, replies and outdated anchors
 * without tracking what changed.
 */
export function render(threads: Array<{ root: ParsedAnnotation; replies: ParsedAnnotation[]; outdated: boolean }>): void {
  if (rail === undefined) {
    return;
  }

  rail.textContent = '';
  cards = new Map();

  if (threads.length === 0) {
    rail.appendChild(build('div', 'mec-rail-empty', 'No comments yet.'));
    return;
  }

  for (const thread of threads) {
    const card = buildCard(thread);
    cards.set(thread.root.id, card);
    rail.appendChild(card);
  }

  scheduleLayout();
}

function buildCard(thread: { root: ParsedAnnotation; replies: ParsedAnnotation[]; outdated: boolean }): HTMLElement {
  const { root, replies, outdated } = thread;
  const card = build('div', 'mec-card');
  card.dataset.mecCard = root.id;

  if (root.resolved === true) {
    card.classList.add('mec-card-resolved');
  }

  card.appendChild(build('div', 'mec-quote', root.exact.length > 0 ? root.exact : '(no quoted text)'));
  card.appendChild(renderComment(root, outdated));
  for (const reply of replies) {
    card.appendChild(renderComment(reply, false));
  }

  const commit = () => {
    const body = input.value.trim();
    if (body.length > 0) {
      input.value = '';
      handlers?.onReply(root.id, body);
    }
  };

  const input = makeInput('Reply…', commit);
  input.classList.add('mec-card-input');
  card.appendChild(input);

  card.appendChild(actions(root, commit));

  // Clicking anywhere else on the card focuses it and its anchor.
  card.addEventListener('mousedown', event => {
    if ((event.target as HTMLElement).closest('button, textarea') === null) {
      focus(root.id);
      handlers?.onFocusAnchor(root.id);
    }
  });

  return card;
}

function actions(root: ParsedAnnotation, commit: () => void): HTMLElement {
  const row = build('div', 'mec-actions mec-card-actions');
  row.appendChild(build('span', 'mec-hint'));
  row.appendChild(makeButton('Delete', 'mec-danger', () => handlers?.onDelete(root.id)));
  row.appendChild(makeButton(root.resolved === true ? 'Reopen' : 'Resolve', '', () => handlers?.onToggleResolved(root.id)));
  row.appendChild(makeButton('Reply', 'mec-primary', commit));
  return row;
}

function scheduleLayout(): void {
  if (frame !== undefined) {
    cancelAnimationFrame(frame);
  }

  frame = requestAnimationFrame(() => {
    frame = undefined;
    layout();
  });
}

/**
 * Place each card level with its anchor, pushing later ones down to clear
 * earlier ones.
 *
 * A thread whose anchor has scrolled out of view keeps its place in the order
 * rather than being removed, so the rail does not reshuffle as the reader moves.
 */
function layout(): void {
  if (rail === undefined || !isOpen()) {
    return;
  }

  let previousBottom = TOP_MARGIN;

  for (const [id, card] of cards) {
    const anchor = rectFor(id);
    const desired = anchor === undefined ? previousBottom : anchor.top;
    const top = Math.max(desired, previousBottom);

    card.style.top = `${Math.round(top)}px`;
    card.classList.toggle('mec-card-offscreen', anchor === undefined);

    previousBottom = top + card.offsetHeight + GAP;
  }
}

/** The thread nearest the top of the viewport, for keyboard navigation. */
export function nearestVisible(): string | undefined {
  let best: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const id of cards.keys()) {
    const rect = rectFor(id);
    if (rect === undefined) {
      continue;
    }

    const distance = Math.abs(rect.top - TOP_MARGIN);
    if (distance < bestDistance) {
      best = id;
      bestDistance = distance;
    }
  }

  return best ?? activeId;
}
