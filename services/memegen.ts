export interface MemeTemplate {
  id: string;
  name: string;
  blank: string;
}

export async function getTrendingTemplates(): Promise<MemeTemplate[]> {
  const res = await fetch('https://api.memegen.link/templates/');
  if (!res.ok) throw new Error('Failed to fetch templates');
  const data = await res.json();
  
  // Return top 50
  return data.slice(0, 50).map((t: any) => ({
    id: t.id,
    name: t.name,
    blank: t.blank
  }));
}

export function getRandomTemplate(templates: MemeTemplate[]): MemeTemplate {
  if (!templates || templates.length === 0) return { id: 'aag', name: 'Ancient Aliens Guy', blank: 'https://api.memegen.link/images/aag.png' };
  return templates[Math.floor(Math.random() * templates.length)];
}
