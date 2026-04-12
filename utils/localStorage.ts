export interface MemeHistoryItem {
  url: string;
  topic: string;
  top?: string;
  bottom?: string;
  template?: any;
  timestamp: number;
}

export function saveMemeToHistory(meme: MemeHistoryItem) {
  if (typeof window === 'undefined') return;
  const history = getMemeHistory();
  history.unshift(meme);
  // Keep only last 5
  if (history.length > 10) history.pop();
  localStorage.setItem('memeHistory', JSON.stringify(history));
}

export function getMemeHistory(): MemeHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('memeHistory');
  return data ? JSON.parse(data) : [];
}
