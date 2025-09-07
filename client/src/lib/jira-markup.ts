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
  
  let result = text;
  
  // 1. Обработка блоков (многострочные элементы) - обрабатываем сначала
  
  // {code} блоки с подсветкой синтаксиса
  result = result.replace(/\{code(?::([^}]*))?\}([\s\S]*?)\{code\}/g, (match, lang, code) => {
    const language = lang || 'text';
    return `<div class="code-block"><pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre></div>`;
  });
  
  // {noformat} блоки
  result = result.replace(/\{noformat\}([\s\S]*?)\{noformat\}/g, (match, code) => {
    return `<pre class="noformat">${escapeHtml(code.trim())}</pre>`;
  });
  
  // {quote} блоки
  result = result.replace(/\{quote\}([\s\S]*?)\{quote\}/g, '<blockquote>$1</blockquote>');
  
  // {panel} блоки с параметрами
  result = result.replace(/\{panel(?::([^}]*))?\}([\s\S]*?)\{panel\}/g, (match, params, content) => {
    const attributes = parseParameters(params);
    const style = buildPanelStyle(attributes);
    const title = attributes.title ? `<div class="panel-title">${attributes.title}</div>` : '';
    return `<div class="panel" style="${style}">${title}<div class="panel-content">${content.trim()}</div></div>`;
  });
  
  // {color} блоки
  result = result.replace(/\{color:([^}]+)\}([\s\S]*?)\{color\}/g, '<span style="color: $1">$2</span>');
  
  // 2. Headers
  result = result.replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>');
  
  // 3. Text breaks - обрабатываем раньше других элементов
  result = result.replace(/^----+$/gm, '<hr/>');                // Horizontal ruler
  result = result.replace(/---/g, '—');                         // Em dash
  result = result.replace(/--/g, '–');                          // En dash  
  result = result.replace(/\\\\/g, '<br/>');                   // Explicit line breaks
  
  // 4. Text effects (inline elements)
  result = result.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')        // Bold
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')                              // Italic
    .replace(/\?\?([^?\n]+)\?\?/g, '<cite>$1</cite>')                    // Citation
    .replace(/-([^-\n]+)-/g, '<del>$1</del>')                            // Deleted (single dash)
    .replace(/\+([^+\n]+)\+/g, '<ins>$1</ins>')                          // Inserted
    .replace(/\^([^\^\n]+)\^/g, '<sup>$1</sup>')                         // Superscript
    .replace(/~([^~\n]+)~/g, '<sub>$1</sub>')                            // Subscript
    .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>');                     // Monospaced
    
  // 5. Block quotes (bq.)
  result = result.replace(/^bq\.\s*(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // 6. Links - различные типы
  result = result
    // [text|url] - именованные ссылки
    .replace(/\[([^\|\]]+)\|([^\]]+)\]/g, '<a href="$2" target="_blank">$1</a>')
    // [http://url] - простые URL ссылки
    .replace(/\[(https?:\/\/[^\]]+)\]/g, '<a href="$1" target="_blank">$1</a>')
    // [mailto:email] - email ссылки
    .replace(/\[mailto:([^\]]+)\]/g, '<a href="mailto:$1">$1</a>')
    // [file:///path] - файловые ссылки
    .replace(/\[file:\/\/\/([^\]]+)\]/g, '<a href="file:///$1">$1</a>')
    // [#anchor] - якорные ссылки
    .replace(/\[#([^\]]+)\]/g, '<a href="#$1">#$1</a>')
    // [^attachment] - вложения
    .replace(/\[\^([^\]]+)\]/g, '<a href="#attachment-$1">$1</a>')
    // [~username] - пользователи
    .replace(/\[~([^\]]+)\]/g, '<a href="#user-$1" class="user-link">@$1</a>');
    
  // 7. Images
  result = result.replace(/!([^!\|]+)(?:\|([^!]*))??!/g, (match, src, attrs) => {
    const attributes = attrs ? parseImageAttributes(attrs) : {};
    const attrStr = Object.entries(attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
    return `<img src="${src}" ${attrStr} alt="${src}" />`;
  });
  
  // 8. Anchors
  result = result.replace(/\{anchor:([^}]+)\}/g, '<a id="$1" class="anchor"></a>');
  
  // 9. Обработка списков - самая сложная часть
  result = processLists(result);
  
  // 10. Tables
  result = processTables(result);
  
  // 11. Emoticons
  result = processEmoticons(result);
  
  // 12. Escape sequences - обрабатываем в конце
  result = result.replace(/\\(.)/g, '$1');
  
  // 13. Paragraph breaks - обрабатываем в самом конце
  result = result.replace(/\n\n+/g, '</p><p>');
  if (result.includes('<p>')) {
    result = '<p>' + result + '</p>';
  } else {
    result = result.replace(/\n/g, '<br/>');
  }
  
  return result;
}

// Вспомогательные функции

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function parseParameters(params: string): Record<string, string> {
  if (!params) return {};
  
  const result: Record<string, string> = {};
  const pairs = params.split('|');
  
  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length > 0) {
      result[key.trim()] = valueParts.join('=').trim();
    }
  }
  
  return result;
}

function buildPanelStyle(attributes: Record<string, string>): string {
  const styles: string[] = [];
  
  if (attributes.bgColor) styles.push(`background-color: ${attributes.bgColor}`);
  if (attributes.borderColor) styles.push(`border-color: ${attributes.borderColor}`);
  if (attributes.borderStyle) styles.push(`border-style: ${attributes.borderStyle}`);
  if (attributes.borderWidth) styles.push(`border-width: ${attributes.borderWidth}px`);
  
  styles.push('border: 1px solid #ccc', 'padding: 10px', 'margin: 10px 0');
  
  return styles.join('; ');
}

function parseImageAttributes(attrs: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pairs = attrs.split(',');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  }
  
  return result;
}

function processLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Проверяем, начинается ли строка со списка
    if (line.match(/^[\*#-]/)) {
      const listResult = processListBlock(lines, i);
      result.push(listResult.html);
      i = listResult.nextIndex;
    } else {
      result.push(line);
      i++;
    }
  }
  
  return result.join('\n');
}

function processListBlock(lines: string[], startIndex: number): {html: string, nextIndex: number} {
  const listStack: {type: 'ul' | 'ol', level: number}[] = [];
  const result: string[] = [];
  let i = startIndex;
  
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^([\*#-]+)\s+(.+)$/);
    
    if (!match) break;
    
    const [, markers, content] = match;
    const level = markers.length;
    const type = markers.includes('#') ? 'ol' : 'ul';
    
    // Закрываем списки, если уровень уменьшился
    while (listStack.length > 0 && listStack[listStack.length - 1].level >= level) {
      const closed = listStack.pop()!;
      result.push(`</${closed.type}>`);
    }
    
    // Открываем новый список, если нужно
    if (listStack.length === 0 || listStack[listStack.length - 1].level < level) {
      listStack.push({type, level});
      result.push(`<${type}>`);
    }
    
    result.push(`<li>${content}</li>`);
    i++;
  }
  
  // Закрываем оставшиеся списки
  while (listStack.length > 0) {
    const closed = listStack.pop()!;
    result.push(`</${closed.type}>`);
  }
  
  return {html: result.join('\n'), nextIndex: i};
}

function processTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.match(/^\|.*\|$/)) {
      const tableResult = processTableBlock(lines, i);
      result.push(tableResult.html);
      i = tableResult.nextIndex;
    } else {
      result.push(line);
      i++;
    }
  }
  
  return result.join('\n');
}

function processTableBlock(lines: string[], startIndex: number): {html: string, nextIndex: number} {
  const result: string[] = ['<table>'];
  let i = startIndex;
  let isFirstRow = true;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (!line.match(/^\|.*\|$/)) break;
    
    const cells = line.split('|').slice(1, -1); // Убираем пустые элементы с краёв
    const isHeaderRow = line.startsWith('||') || isFirstRow && cells.every(cell => cell.startsWith('|'));
    const tag = isHeaderRow ? 'th' : 'td';
    
    const processedCells = cells.map(cell => {
      const cleanCell = cell.replace(/^\|+/, '').trim();
      return `<${tag}>${cleanCell}</${tag}>`;
    });
    
    result.push(`<tr>${processedCells.join('')}</tr>`);
    i++;
    isFirstRow = false;
  }
  
  result.push('</table>');
  return {html: result.join('\n'), nextIndex: i};
}

function processEmoticons(text: string): string {
  const emoticons: Record<string, string> = {
    ':)': '😊', ':(': '😞', ':P': '😛', ':D': '😃', ';)': '😉',
    '(y)': '👍', '(n)': '👎', '(i)': 'ℹ️', '(/)': '✓', '(x)': '✗', '(!)': '⚠️',
    '(+)': '➕', '(-)': '➖', '(?)': '❓', '(on)': '💡', '(off)': '💡', 
    '(*)': '⭐', '(*r)': '🔴', '(*g)': '🟢', '(*b)': '🔵', '(*y)': '🟡',
    '(flag)': '🚩', '(flagoff)': '🏳️'
  };
  
  let result = text;
  for (const [emoticon, emoji] of Object.entries(emoticons)) {
    const escaped = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), emoji);
  }
  
  return result;
}