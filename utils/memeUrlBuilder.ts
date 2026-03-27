export function sanitizeText(text: string): string {
  if (!text) return '_';
  return text
    .replace(/-/g, '--')
    .replace(/_/g, '__')
    .replace(/\s+/g, '_')
    .replace(/\?/g, '~q')
    .replace(/&/g, '~a')
    .replace(/%/g, '~p')
    .replace(/#/g, '~h')
    .replace(/\//g, '~s')
    .replace(/\\/g, '~b')
    .replace(/</g, '~l')
    .replace(/>/g, '~g')
    .replace(/"/g, "''");
}

export function buildMemeURL(templateId: string, topText: string, bottomText: string): string {
  const safeTop = sanitizeText(topText);
  const safeBottom = sanitizeText(bottomText);
  return `https://api.memegen.link/images/${templateId}/${safeTop}/${safeBottom}.png`;
}
