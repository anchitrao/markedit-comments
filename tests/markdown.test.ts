import { describe, it, expect, beforeEach } from 'vitest';
import { sanitize, renderInto } from '../src/markdown';

const fragment = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

const html = (node: DocumentFragment) => {
  const holder = document.createElement('div');
  holder.appendChild(node.cloneNode(true));
  return holder.innerHTML;
};

describe('sanitize', () => {
  it('removes scripts entirely, contents and all', () => {
    const content = fragment('<p>before</p><script>alert(1)</script><p>after</p>');
    sanitize(content);
    expect(html(content)).toBe('<p>before</p><p>after</p>');
  });

  it('strips event handlers but keeps the element', () => {
    const content = fragment('<p onclick="steal()">text</p>');
    sanitize(content);
    expect(html(content)).toBe('<p>text</p>');
  });

  it('drops javascript: urls', () => {
    const content = fragment('<a href="javascript:alert(1)">click</a>');
    sanitize(content);
    const link = content.querySelector('a');
    expect(link?.hasAttribute('href')).toBe(false);
    expect(link?.textContent).toBe('click');
  });

  it('keeps ordinary links and opens them safely', () => {
    const content = fragment('<a href="https://example.com">docs</a>');
    sanitize(content);
    const link = content.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('neutralises an image error handler', () => {
    const content = fragment('<img src="x" onerror="steal()">');
    sanitize(content);
    expect(content.querySelector('img')?.hasAttribute('onerror')).toBe(false);
  });

  it('unwraps unknown elements rather than losing their text', () => {
    const content = fragment('<custom-tag>kept text</custom-tag>');
    sanitize(content);
    expect(content.textContent).toBe('kept text');
    expect(content.querySelector('custom-tag')).toBeNull();
  });

  it('leaves ordinary markdown output alone', () => {
    const source = '<p>See <code>fn()</code> and <strong>this</strong>.</p><ul><li>one</li></ul>';
    const content = fragment(source);
    sanitize(content);
    expect(html(content)).toBe(source);
  });

  it('disables task-list checkboxes', () => {
    const content = fragment('<input type="checkbox" checked>');
    sanitize(content);
    expect(content.querySelector('input')?.hasAttribute('disabled')).toBe(true);
  });
});

describe('renderInto', () => {
  beforeEach(() => { delete (window as { MarkEditRenderHtml?: unknown }).MarkEditRenderHtml; });

  it('falls back to plain text when the preview renderer is absent', async () => {
    const target = document.createElement('div');
    await renderInto(target, '**bold** text');
    expect(target.textContent).toBe('**bold** text');
    expect(target.classList.contains('mec-rendered')).toBe(false);
  });

  it('renders markdown when the preview renderer is available', async () => {
    window.MarkEditRenderHtml = async (markdown: string) =>
      `<meta charset="UTF-8">\n<p><strong>${markdown.replaceAll('**', '')}</strong></p>`;

    const target = document.createElement('div');
    await renderInto(target, '**bold**');

    expect(target.querySelector('strong')?.textContent).toBe('bold');
    expect(target.innerHTML).not.toContain('meta charset');
    expect(target.classList.contains('mec-rendered')).toBe(true);
  });

  it('keeps the plain text when rendering throws', async () => {
    window.MarkEditRenderHtml = async () => { throw new Error('nope'); };
    const target = document.createElement('div');
    await renderInto(target, 'a comment');
    expect(target.textContent).toBe('a comment');
  });

  it('sanitises what the renderer returns', async () => {
    window.MarkEditRenderHtml = async () => '<p>hi</p><script>alert(1)</script>';
    const target = document.createElement('div');
    await renderInto(target, 'hi');
    expect(target.querySelector('script')).toBeNull();
    expect(target.textContent).toBe('hi');
  });
});
