import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

/**
 * Renders user-submitted Markdown to an HTML string.
 *
 * The result is meant for `[innerHTML]`, where Angular's built-in sanitizer
 * strips scripts, event handlers and unsafe URLs, so untrusted input is safe.
 * Single newlines are kept as line breaks so existing plain-text descriptions
 * look the same as before.
 */
@Pipe({ name: 'markdown', standalone: false })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return marked.parse(value, { async: false, breaks: true, gfm: true });
  }
}
