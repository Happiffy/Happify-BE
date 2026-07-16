import sanitizeHtml from 'sanitize-html';

export function sanitizeRichText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li'],
    allowedAttributes: { p: ['style'] },
    allowedStyles: { p: { 'text-align': [/^(left|center|right|justify)$/] } },
  }).trim();
}

export function richTextToPlainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}
