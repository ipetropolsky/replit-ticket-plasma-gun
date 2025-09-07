/**
 * Utilities for handling JIRA markup
 */

// @ts-ignore - jira2md doesn't have TypeScript declarations
import * as j2m from 'jira2md';

/**
 * Removes JIRA markup from text, leaving plain text
 * Handles: h1-h6 headers, *bold*, _italic_, -strikethrough-, lists, etc.
 */
export function stripJiraMarkup(text: string): string {
  if (!text) return '';
  
  return text
    // Remove headers (h1. h2. h3. etc)
    .replace(/^h[1-6]\.\s*/gm, '')
    // Remove bold/italic/underline markup
    .replace(/\*([^*]+)\*/g, '$1')  // *bold* -> bold
    .replace(/_([^_]+)_/g, '$1')    // _italic_ -> italic
    .replace(/\+([^+]+)\+/g, '$1')  // +underline+ -> underline  
    .replace(/-([^-]+)-/g, '$1')    // -strikethrough- -> strikethrough
    // Remove list markers
    .replace(/^[\*\-\+]\s+/gm, '')  // * item -> item
    .replace(/^#\s+/gm, '')         // # numbered -> numbered
    // Remove links [text|url] -> text
    .replace(/\[([^\|\]]+)\|[^\]]+\]/g, '$1')
    // Remove code blocks
    .replace(/\{code[^}]*\}[\s\S]*?\{code\}/g, '[код]')
    .replace(/\{noformat\}[\s\S]*?\{noformat\}/g, '[текст]')
    // Remove quotes
    .replace(/\{quote\}[\s\S]*?\{quote\}/g, '[цитата]')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts JIRA markup to HTML using jira2md library
 * Properly handles lists, headers, formatting, and other JIRA syntax
 */
export function jiraMarkupToHtml(text: string): string {
  if (!text) return '';
  
  try {
    // Use jira2md to convert JIRA markup to HTML
    return j2m.jira_to_html(text);
  } catch (error) {
    console.warn('Failed to convert JIRA markup to HTML:', error);
    // Improved fallback with basic JIRA markup support
    return text
      // Headers
      .replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>')
      // Bold, italic, underline, strikethrough
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/\+([^+]+)\+/g, '<u>$1</u>')
      .replace(/--([^-]+)--/g, '<del>$1</del>')  // JIRA uses double dash, not single
      // Simple lists - wrap consecutive list items
      .replace(/((?:^[\*\-]\s+.+(?:\n|$))+)/gm, '<ul>$1</ul>')
      .replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/((?:^#\s+.+(?:\n|$))+)/gm, '<ol>$1</ol>')
      .replace(/^#\s+(.+)$/gm, '<li>$1</li>')
      // Links [text|url] -> <a href="url">text</a>
      .replace(/\[([^\|\]]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank">$1</a>')
      // Code inline
      .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');
  }
}