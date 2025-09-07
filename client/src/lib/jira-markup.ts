/**
 * Utilities for handling JIRA markup
 */

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
    return j2m.to_html(text);
  } catch (error) {
    console.warn('Failed to convert JIRA markup to HTML:', error);
    // Fallback: just escape HTML and preserve line breaks
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  }
}