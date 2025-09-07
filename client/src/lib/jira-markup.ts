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
  
  // Более надёжная обработка JIRA разметки с поддержкой вложенных списков
  return text
    // Headers
    .replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>')
    
    // Bold, italic, underline, strikethrough  
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/\+([^+\n]+)\+/g, '<u>$1</u>')
    .replace(/--([^-\n]+)--/g, '<del>$1</del>')
    
    // Code inline - обрабатываем раньше списков, чтобы не конфликтовать
    .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>')
    
    // Links - также обрабатываем раньше
    .replace(/\[([^\|\]]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank">$1</a>')
    
    // Обрабатываем списки построчно с поддержкой вложенности
    .split('\n')
    .map(line => {
      // Основные пункты списка
      if (line.match(/^-\s+/)) {
        return `<li class="main-item">${line.replace(/^-\s+/, '')}</li>`;
      }
      // Подпункты (двойной дефис)  
      else if (line.match(/^--\s+/)) {
        return `<li class="sub-item" style="margin-left: 20px; list-style-type: circle;">${line.replace(/^--\s+/, '')}</li>`;
      }
      // Нумерованные списки
      else if (line.match(/^#\s+/)) {
        return `<li class="numbered">${line.replace(/^#\s+/, '')}</li>`;
      }
      // Обычные строки
      else {
        return line;
      }
    })
    .join('\n')
    
    // Группируем соседние элементы списка в ul
    .replace(/((?:<li class="main-item">.*?<\/li>\n?(?:<li class="sub-item"[^>]*>.*?<\/li>\n?)*)+)/g, '<ul>$1</ul>')
    
    // Группируем нумерованные списки
    .replace(/((?:<li class="numbered">.*?<\/li>\n?)+)/g, '<ol>$1</ol>')
    
    // Убираем классы после группировки
    .replace(/<li class="[^"]*"([^>]*)>/g, '<li$1>')
    
    // Line breaks для обычных строк (не внутри списков)
    .replace(/\n(?![^<]*<\/li>)/g, '<br/>');
}