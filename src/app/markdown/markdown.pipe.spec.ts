import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('renders basic markdown', () => {
    const html = pipe.transform('**bold** and a [link](https://example.com)');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<a href="https://example.com">link</a>');
  });

  it('keeps single newlines as line breaks', () => {
    expect(pipe.transform('one\ntwo')).toContain('<br>');
  });

  it('returns an empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
  });
});
