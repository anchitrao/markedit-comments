import { MarkEdit } from 'markedit-api';

/**
 * Colors for the comment UI, taken from the editor theme that is currently set.
 *
 * MarkEdit builds its themes as CodeMirror style sheets and exposes no colors to
 * scripts, so they are recovered by measuring: a hidden probe element is placed
 * inside the editor, where the theme's scoped rules apply, and its computed style
 * is read back. Reusing the theme's own search-match color means a highlight
 * looks like it belongs to the editor rather than being painted on top of it.
 */
export type ThemeColors = {
  highlight: string;
  highlightStrong: string;
  accent: string;
  text: string;
  background: string;
  surface: string;
  border: string;
  muted: string;
};

const FALLBACK: ThemeColors = {
  highlight: 'rgba(250, 225, 125, 0.5)',
  highlightStrong: 'rgba(250, 225, 125, 0.85)',
  accent: '#0550ae',
  text: '#24292f',
  background: '#ffffff',
  surface: '#ffffff',
  border: 'rgba(36, 41, 47, 0.18)',
  muted: 'rgba(36, 41, 47, 0.6)',
};

/** Measure one computed property of a throwaway element carrying `className`. */
function probe(host: HTMLElement, className: string, property: 'color' | 'background-color'): string | undefined {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = 'x';
  // Kept in the layout tree but out of sight; `display: none` would leave some
  // computed values unresolved.
  element.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;top:-9999px';

  host.appendChild(element);
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  element.remove();

  return isMeaningful(value) ? value : undefined;
}

function isMeaningful(color: string): boolean {
  if (color.length === 0 || color === 'transparent') {
    return false;
  }

  const parsed = parseColor(color);
  return parsed !== undefined && parsed.alpha > 0;
}

type Rgba = { red: number; green: number; blue: number; alpha: number };

function parseColor(color: string): Rgba | undefined {
  const numeric = color.match(/-?[\d.]+/g);
  if (numeric === null || numeric.length < 3) {
    return undefined;
  }

  const [red, green, blue, alpha] = numeric.map(Number);
  return { red, green, blue, alpha: alpha === undefined ? 1 : alpha };
}

function withAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (parsed === undefined) {
    return color;
  }

  return `rgba(${parsed.red}, ${parsed.green}, ${parsed.blue}, ${alpha})`;
}

/** Scale an existing alpha, used to make a translucent theme color more solid. */
function amplify(color: string, factor: number): string {
  const parsed = parseColor(color);
  if (parsed === undefined) {
    return color;
  }

  return withAlpha(color, Math.min(1, parsed.alpha * factor));
}

export function readThemeColors(): ThemeColors {
  const host = MarkEdit.editorView?.dom;
  if (host === undefined || host === null) {
    return FALLBACK;
  }

  // `.cm-searchMatch` is the theme's own "this text is called out" color, and
  // `.cm-md-header` carries its accent.
  const highlight = probe(host, 'cm-searchMatch', 'background-color') ?? FALLBACK.highlight;
  const accent = probe(host, 'cm-md-header', 'color') ?? FALLBACK.accent;
  const text = getComputedStyle(host).color || FALLBACK.text;
  const background = opaqueBackground(host) ?? FALLBACK.background;

  return {
    highlight: amplify(highlight, 1),
    highlightStrong: amplify(highlight, 1.8),
    accent,
    text,
    background,
    surface: background,
    border: withAlpha(text, 0.18),
    muted: withAlpha(text, 0.55),
  };
}

/** Walk up for a background that is actually painted, not inherited transparency. */
function opaqueBackground(from: HTMLElement): string | undefined {
  for (let element: HTMLElement | null = from; element !== null; element = element.parentElement) {
    const color = getComputedStyle(element).backgroundColor;
    const parsed = parseColor(color);
    if (parsed !== undefined && parsed.alpha > 0.9) {
      return color;
    }
  }

  return undefined;
}

/** Publish the theme colors as custom properties for the stylesheet to consume. */
export function applyThemeColors(): ThemeColors {
  const colors = readThemeColors();
  const style = document.documentElement.style;

  style.setProperty('--mec-highlight', colors.highlight);
  style.setProperty('--mec-highlight-strong', colors.highlightStrong);
  style.setProperty('--mec-accent', colors.accent);
  style.setProperty('--mec-text', colors.text);
  style.setProperty('--mec-bg', colors.background);
  style.setProperty('--mec-surface', colors.surface);
  style.setProperty('--mec-border', colors.border);
  style.setProperty('--mec-muted', colors.muted);

  return colors;
}

/**
 * Keep the colors in step with the editor.
 *
 * The theme can change while a document is open, and the system can switch
 * between light and dark underneath a theme that follows it.
 */
export function observeTheme(): void {
  applyThemeColors();

  // Scripts run before the editor exists, so the first measurement necessarily
  // reads the fallbacks; this is the point at which the theme is really on screen.
  if (typeof MarkEdit.onEditorReady === 'function') {
    MarkEdit.onEditorReady(() => requestAnimationFrame(() => applyThemeColors()));
  }

  if (typeof MarkEdit.onEditorConfigChange === 'function') {
    MarkEdit.onEditorConfigChange((...change) => {
      if (change[0] === 'theme') {
        // The style sheet is swapped as part of the same update; measure after it.
        requestAnimationFrame(() => applyThemeColors());
      }
    });
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    requestAnimationFrame(() => applyThemeColors());
  });

  // Theme extensions install their style sheets from their own editor-ready
  // handler, which may run after this one; whoever loads first would otherwise
  // win. Watching for style sheets arriving makes the order stop mattering.
  const styleWatcher = new MutationObserver(() => {
    if (pending !== undefined) {
      clearTimeout(pending);
    }

    pending = setTimeout(() => {
      pending = undefined;
      applyThemeColors();
    }, 50);
  });

  styleWatcher.observe(document.head, { childList: true, subtree: true });
}

let pending: ReturnType<typeof setTimeout> | undefined;
