/**
 * Utilities for handling JIRA markup
 */

/**
 * Removes JIRA markup from text, leaving plain text
 */
export function stripJiraMarkup(text: string): string {
    if (!text) return '';
    return (
        text
            // Remove headers (h1. h2. h3. etc)
            .replace(/^h[1-6]\.\s*/gm, '')
            // Remove text formatting
            .replace(/\*([^*]+)\*/g, '$1') // *bold* -> bold
            .replace(/_([^_]+)_/g, '$1') // _italic_ -> italic
            .replace(/\+([^+]+)\+/g, '$1') // +underline+ -> underline
            .replace(/-([^-\n]+)-/g, '$1') // -strikethrough- -> strikethrough
            .replace(/\^([^\^]+)\^/g, '$1') // ^superscript^ -> superscript
            .replace(/~([^~]+)~/g, '$1') // ~subscript~ -> subscript
            .replace(/\{\{([^}]+)\}\}/g, '$1') // {{monospace}} -> monospace
            // Remove list markers
            .replace(/^[\*#]\s+/gm, '')
            // Remove links [text|url] -> text
            .replace(/\[([^\|\]]+)\|[^\]]+\]/g, '$1')
            .replace(/\[~([^\]]+)\]/g, '@$1')
            .replace(/\[#([^\]]+)\]/g, '#$1')
            .replace(/\[mailto:([^\]]+)\]/g, '$1')
            // Remove code blocks
            .replace(/\{code[^}]*\}[\s\S]*?\{\/code\}/g, '[code]')
            .replace(/\{noformat\}[\s\S]*?\{\/noformat\}/g, '[preformatted]')
            .replace(/\{panel[^}]*\}[\s\S]*?\{\/panel\}/g, '[panel]')
            // Clean up extra whitespace
            .replace(/\s+/g, ' ')
            .trim()
    );
}

/**
 * Converts JIRA markup to HTML following official JIRA syntax
 */
export function jiraMarkupToHtml(text: string): string {
    if (!text) return '';

    let result = text;

    // 1. Handle code blocks first (prevent processing markup inside code)
    const codeBlocks: string[] = [];
    const codeBlockMap = new Map<string, string>();
    result = result.replace(/\{code(?::([^}]*))?\}([\s\S]*?)\{\/code\}/g, (match, lang, code) => {
        const language = lang || 'text';
        const id = `CODEBLOCK${codeBlocks.length}PLACEHOLDER${Math.random().toString(36).substring(2, 8)}`;
        const blockHtml = `<div class="code-block"><pre><code class="language-${escapeHtml(language)}">${escapeHtml(
                code.trim()
            )}</code></pre></div>`;
        codeBlocks.push(blockHtml);
        codeBlockMap.set(id, blockHtml);
        return id;
    });

    // Handle noformat blocks
    const noformatBlocks: string[] = [];
    const noformatBlockMap = new Map<string, string>();
    result = result.replace(/\{noformat\}([\s\S]*?)\{\/noformat\}/g, (match, content) => {
        const id = `NOFORMATBLOCK${noformatBlocks.length}PLACEHOLDER${Math.random().toString(36).substring(2, 8)}`;
        const blockHtml = `<pre class="noformat">${escapeHtml(content.trim())}</pre>`;
        noformatBlocks.push(blockHtml);
        noformatBlockMap.set(id, blockHtml);
        return id;
    });

    // Handle quote blocks
    result = result.replace(/\{quote\}([\s\S]*?)\{quote\}/g, '<blockquote>$1</blockquote>');
    result = result.replace(/\{quote\}([\s\S]*?)\{\/quote\}/g, '<blockquote>$1</blockquote>');

    // Handle color blocks
    result = result.replace(/\{color:([^}]+)\}([\s\S]*?)\{color\}/g, '<span style="color: $1">$2</span>');

    // Handle panels
    result = result.replace(/\{panel(?::([^}]*))?\}([\s\S]*?)\{\/panel\}/g, (match, params, content) => {
        const attributes = parseParameters(params || '');
        let panelHtml = '<div class="panel"';

        if (attributes.bgColor || attributes.borderColor) {
            const styles = [];
            if (attributes.bgColor) styles.push(`background-color: ${attributes.bgColor}`);
            if (attributes.borderColor) styles.push(`border-color: ${attributes.borderColor}`);
            styles.push('border: 1px solid #ccc', 'padding: 10px', 'margin: 10px 0');
            panelHtml += ` style="${styles.join('; ')}"`;
        }

        panelHtml += '>';
        if (attributes.title) {
            panelHtml += `<div class="panel-title"><strong>${attributes.title}</strong></div>`;
        }
        panelHtml += `<div class="panel-content">${content.trim()}</div></div>`;

        return panelHtml;
    });

    // 2. Headers (h1. to h6.)
    result = result.replace(/^h([1-6])\.\s*(.+)$/gm, '<h$1>$2</h$1>');

    // 3. Text breaks and rules
    result = result.replace(/^-{4,}$/gm, '<hr>'); // Horizontal rules
    result = result.replace(/\\\\/g, '<br/>');

    // 4. Links first (to protect URLs from text formatting)
    result = result
        // Named links [text|url]
        .replace(/\[([^\|\]]+)\|([^\]]+)\]/g, (match, text, url) => {
            if (url.startsWith('mailto:')) {
                return `<a href="${url}">${text}</a>`;
            }
            return `<a href="${url}" target="_blank">${text}</a>`;
        })
        // User links [~username]
        .replace(/\[~([^\]]+)\]/g, '<a href="#user-$1" class="user-link">@$1</a>')
        // Anchor links [#anchor]
        .replace(/\[#([^\]]+)\]/g, '<a href="#$1">#$1</a>')
        // Email links [mailto:email]
        .replace(/\[mailto:([^\]]+)\]/g, '<a href="mailto:$1">$1</a>')
        // File links [file:///path]
        .replace(/\[file:\/\/\/([^\]]+)\]/g, '<a href="file:///$1">file:///$1</a>')
        // Direct HTTP links [http://url]
        .replace(/\[(https?:\/\/[^\]]+)\]/g, '<a href="$1" target="_blank">$1</a>')
        // Attachment links [^attachment]
        .replace(/\[\^([^\]]+)\]/g, '<span class="error">[^$1]</span>');

    // 5. Block quotes
    result = result.replace(/^bq\.\s*(.+)$/gm, '<blockquote>$1</blockquote>');

    // 6. Text formatting (after links are processed)
    result = result
        .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>') // *bold*
        .replace(/_([^_\n]+)_/g, '<em>$1</em>') // _italic_
        .replace(/\?\?([^?\n]+)\?\?/g, '<cite>$1</cite>') // ??citation??
        .replace(/\+([^+\n]+)\+/g, '<u>$1</u>') // +underline+
        .replace(/(^|[^-\w])-([^-\n]+)-([^-\w]|$)/g, '$1<del>$2</del>$3') // -strikethrough- with word boundaries
        .replace(/\^([^\^\n]+)\^/g, '<sup>$1</sup>') // ^superscript^
        .replace(/~([^~\n]+)~/g, '<sub>$1</sub>') // ~subscript~
        .replace(/\{\{([^}]+)\}\}/g, '<code>$1</code>'); // {{monospace}}

    // 7. Anchors
    result = result.replace(/\{anchor:([^}]+)\}/g, '<a id="$1" class="anchor"></a>');

    // 8. Images !image.jpg! or !image.jpg|attributes!
    result = result.replace(/!([^!\|]+)(?:\|([^!]*))??!/g, (match, src, attrs) => {
        let imgHtml = `<img src="${src}" alt="${src}"`;

        if (attrs) {
            const attributes = parseImageAttributes(attrs);
            for (const [key, value] of Object.entries(attributes)) {
                if (key === 'width' || key === 'height') {
                    imgHtml += ` ${key}="${value}"`;
                } else if (key === 'align') {
                    imgHtml += ` style="float: ${value}"`;
                }
            }
        }

        imgHtml += '>';
        return imgHtml;
    });

    // 9. Lists
    result = processLists(result);

    // 10. Process dashes (after lists to avoid interfering with -- list markers)
    result = result.replace(/---/g, '\u2014'); // Em dash
    result = result.replace(/--/g, '\u2013'); // En dash

    // 11. Tables
    result = processTables(result);

    // 12. Emoticons
    result = processEmoticons(result);

    // 13. Handle escape sequences
    result = result.replace(/\\(.)/g, '$1');

    // 14. Convert line breaks to paragraphs/br tags
    const lines = result.split('\n');
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
            if (currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join('<br>'));
                currentParagraph = [];
            }
        } else {
            currentParagraph.push(trimmedLine);
        }
    }

    if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join('<br>'));
    }

    result = paragraphs.map((p) => `<p>${p}</p>`).join('\n');

    // 15. Restore code blocks (after all other processing is complete)
    for (const [id, blockHtml] of codeBlockMap) {
        result = result.replace(new RegExp(id, 'g'), blockHtml);
    }

    for (const [id, blockHtml] of noformatBlockMap) {
        result = result.replace(new RegExp(id, 'g'), blockHtml);
    }

    return result;
}

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
        const line = lines[i].trim();

        if (line.match(/^[*#-]\s/)) {
            const listResult = processListBlock(lines, i);
            result.push(listResult.html);
            i = listResult.nextIndex;
        } else {
            result.push(lines[i]);
            i++;
        }
    }

    return result.join('\n');
}

function processListBlock(lines: string[], startIndex: number): { html: string; nextIndex: number } {
    const listStack: { type: 'ul' | 'ol'; level: number }[] = [];
    const result: string[] = [];
    let i = startIndex;

    while (i < lines.length) {
        const line = lines[i].trim();
        const match = line.match(/^([*#-]+)\s+(.+)$/);

        if (!match) break;

        const [, markers, content] = match;
        const level = markers.length;
        const type = markers[markers.length - 1] === '#' ? 'ol' : 'ul';

        // Close lists if level decreased
        while (listStack.length > 0 && listStack[listStack.length - 1].level >= level) {
            const closed = listStack.pop()!;
            result.push(`</${closed.type}>`);
        }

        // Open new list if needed
        if (listStack.length === 0 || listStack[listStack.length - 1].level < level) {
            listStack.push({ type, level });
            result.push(`<${type}>`);
        }

        result.push(`<li>${content}</li>`);
        i++;
    }

    // Close remaining lists
    while (listStack.length > 0) {
        const closed = listStack.pop()!;
        result.push(`</${closed.type}>`);
    }

    return { html: result.join('\n'), nextIndex: i };
}

function processTables(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (line.match(/^\|.*\|$/)) {
            const tableResult = processTableBlock(lines, i);
            result.push(tableResult.html);
            i = tableResult.nextIndex;
        } else {
            result.push(lines[i]);
            i++;
        }
    }

    return result.join('\n');
}

function processTableBlock(lines: string[], startIndex: number): { html: string; nextIndex: number } {
    const result: string[] = ['<table>'];
    let i = startIndex;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line.match(/^\|.*\|$/)) break;

        // Check if it's a header row (starts with ||)
        const isHeaderRow = line.startsWith('||');
        const cells = isHeaderRow ? line.split('||').filter((cell) => cell !== '') : line.split('|').slice(1, -1); // Remove empty elements at edges

        const tag = isHeaderRow ? 'th' : 'td';
        const processedCells = cells.map((cell) => `<${tag}>${cell.trim()}</${tag}>`);

        result.push(`<tr>${processedCells.join('')}</tr>`);
        i++;
    }

    result.push('</table>');
    return { html: result.join('\n'), nextIndex: i };
}

function processEmoticons(text: string): string {
    const emoticons: Record<string, string> = {
        ':)': '😊',
        ':(': '😞',
        ':P': '😛',
        ':D': '😃',
        ';)': '😉',
        '(y)': '👍',
        '(n)': '👎',
        '(i)': 'ℹ️',
        '(/)': '✓',
        '(x)': '✗',
        '(!)': '⚠️',
        '(+)': '➕',
        '(-)': '➖',
        '(?)': '❓',
        '(on)': '💡',
        '(off)': '🔆',
        '(*)': '⭐',
        '(*r)': '🔴',
        '(*g)': '🟢',
        '(*b)': '🔵',
        '(*y)': '🟡',
    };

    let result = text;
    for (const [emoticon, emoji] of Object.entries(emoticons)) {
        const escaped = emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(escaped, 'g'), emoji);
    }

    return result;
}
