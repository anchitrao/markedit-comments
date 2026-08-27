/**
 * Rendering for comment bodies.
 *
 * Comments are written in Markdown — agents in particular emit lists, code
 * fences and emphasis — so a body shown as raw source is hard to read. The
 * preview extension already exposes its own parser, and reusing it means a
 * comment renders exactly like the document it annotates rather than through a
 * second, subtly different Markdown implementation.
 */

/**
 * Elements a comment body may contain.
 *
 * Everything else is unwrapped rather than dropped, so that unexpected markup
 * costs the reader its formatting but never its text.
 */
const ALLOWED_ELEMENTS = new Set([
  'P', 'BR', 'HR', 'SPAN', 'DIV',
  'STRONG', 'B', 'EM', 'I', 'DEL', 'S', 'MARK', 'SUP', 'SUB',
  'CODE', 'PRE', 'KBD', 'SAMP',
  'A', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
  'IMG', 'INPUT',
]);

/** Elements whose *contents* are dangerous, so they go entirely. */
const DROPPED_ELEMENTS = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'LINK', 'META', 'BASE', 'NOSCRIPT',
]);

const ALLOWED_ATTRIBUTES = new Set(['href', 'src', 'alt', 'title', 'type', 'checked', 'disabled', 'colspan', 'rowspan']);

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }

  return /^(https?|mailto):/.test(trimmed);
}

/**
 * Strip anything that could run code, in place.
 *
 * The body comes from the document, which is as trusted as the rest of it — but
 * this extension is what injects it into the page as markup, so the checking
 * belongs here rather than being assumed of whoever wrote the file.
 */
export function sanitize(root: ParentNode): void {
  for (const element of [...root.querySelectorAll('*')]) {
    if (DROPPED_ELEMENTS.has(element.tagName)) {
      element.remove();
      continue;
    }

    if (!ALLOWED_ELEMENTS.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const keep = ALLOWED_ATTRIBUTES.has(name)
        && !name.startsWith('on')
        && ((name !== 'href' && name !== 'src') || isSafeUrl(attribute.value));

      if (!keep) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element.tagName === 'A') {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noopener noreferrer');
    }

    if (element.tagName === 'INPUT') {
      element.setAttribute('disabled', '');
    }
  }
}

/**
 * Render `body` into `target`.
 *
 * The plain text is placed first and replaced once the rendered markup is ready,
 * so the comment is readable immediately and stays readable on a host where the
 * preview's renderer is not available.
 */
export async function renderInto(target: HTMLElement, body: string): Promise<void> {
  target.textContent = body;

  const render = window.MarkEditRenderHtml;
  if (typeof render !== 'function') {
    return;
  }

  try {
    const html = await render(body, false);
    const template = document.createElement('template');
    // The renderer prefixes a charset declaration for standalone documents.
    template.innerHTML = html.replace(/^\s*<meta charset="UTF-8">\s*/i, '');

    sanitize(template.content);
    if (template.content.textContent?.trim().length === 0) {
      return;
    }

    target.textContent = '';
    target.appendChild(template.content);
    target.classList.add('mec-rendered');
  } catch {
    // Leave the plain text in place; a body that will not parse is still a body.
  }
}
