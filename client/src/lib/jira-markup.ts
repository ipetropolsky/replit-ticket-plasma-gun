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
