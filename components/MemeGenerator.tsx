/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { getTrendingTemplates, getRandomTemplate, MemeTemplate } from '@/services/memegen';
import { buildMemeURL } from '@/utils/memeUrlBuilder';
import { saveMemeToHistory, getMemeHistory, MemeHistoryItem } from '@/utils/localStorage';
import { Loader2, Shuffle, RefreshCw, Download, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function MemeGenerator() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('GenZ');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [currentMeme, setCurrentMeme] = useState<{url: string, top: string, bottom: string, template: MemeTemplate} | null>(null);
  const [history, setHistory] = useState<MemeHistoryItem[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Forging...");
  const [placeholder, setPlaceholder] = useState("Describe your situation...");

  const loadingMessages = [
    "Charging the Rizz-o-meter...",
    "Consulting the Meme Elders...",
    "Teaching the AI about sarcasm...",
    "Mining for fresh brainrot...",
    "Summoning the ghost of Harambe...",
    "Polishing the aura...",
    "Deleting your search history..."
  ];

  const placeholders = [
    "When the code finally works at 4 AM...",
    "Describe your pain here...",
    "Tell me why you're late for class...",
    "That feeling when the direct hits...",
    "Me in a relationship I wasn't ready for..."
  ];

  useEffect(() => {
    getTrendingTemplates().then(setTemplates).catch(console.error);
    setHistory(getMemeHistory());
    setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const generateCaption = async (topicStr: string, styleStr: string) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicStr, humorStyle: styleStr })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate");
    return data;
  };

  const handleGenerate = async () => {
    if (!topic || templates.length === 0) return;
    setLoading(true);
    
    try {
      const template = getRandomTemplate(templates);
      const { topText, bottomText } = await generateCaption(topic, style);
      const url = buildMemeURL(template.id, topText, bottomText);
      
      const newMeme = { url, top: topText, bottom: bottomText, template };
      setCurrentMeme(newMeme);
      
      const historyItem = { url, topic, timestamp: Date.now() };
      saveMemeToHistory(historyItem);
      setHistory(getMemeHistory());
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong generating the meme!");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCaption = async () => {
    if (!currentMeme) return;
    setLoading(true);
    try {
      const { topText, bottomText } = await generateCaption(topic, style);
      const url = buildMemeURL(currentMeme.template.id, topText, bottomText);
      setCurrentMeme({ ...currentMeme, url, top: topText, bottom: bottomText });
      
      const historyItem = { url, topic, timestamp: Date.now() };
      saveMemeToHistory(historyItem);
      setHistory(getMemeHistory());
    } catch (error: any) {
       console.error(error);
       alert(error.message || "Failed to regenerate caption");
    } finally {
      setLoading(false);
    }
  };

  const handleShuffleTemplate = () => {
    if (!currentMeme) return;
    const newTemplate = getRandomTemplate(templates);
    const url = buildMemeURL(newTemplate.id, currentMeme.top, currentMeme.bottom);
    setCurrentMeme({ ...currentMeme, url, template: newTemplate });
    
    const historyItem = { url, topic, timestamp: Date.now() };
    saveMemeToHistory(historyItem);
    setHistory(getMemeHistory());
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Main Generator Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={placeholder} 
            className="w-full px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none text-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={style} 
              onChange={(e) => setStyle(e.target.value)}
              className="px-6 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white sm:w-1/3 outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer appearance-none"
            >
              <option value="GenZ">🧠 GenZ Brainrot</option>
              <option value="Dark Humor">💀 Dark Humor</option>
              <option value="Sarcastic">🙄 Sarcastic</option>
              <option value="Corporate">💼 Corporate</option>
            </select>
            
            <button 
              onClick={handleGenerate} 
              disabled={loading || !topic}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center text-lg shadow-lg hover:shadow-purple-500/25"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" />
                  <span className="text-sm font-medium animate-pulse">{loadingMessage}</span>
                </div>
              ) : "Forge Meme ✨"}
            </button>
          </div>
        </div>

        {/* Current Meme Display */}
        {currentMeme && (
          <div className="mt-8 pt-8 border-t border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className={`relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex justify-center p-4 min-h-[300px] ${loading ? 'animate-forge' : ''}`}>
              {loading && <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-10 flex items-center justify-center font-bold text-purple-400 tracking-widest">{loadingMessage}</div>}
              <img src={currentMeme.url} alt="Generated Meme" className="max-h-[600px] object-contain w-full" />
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={handleRegenerateCaption} disabled={loading} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg text-sm font-medium text-zinc-200 flex items-center gap-2">
                <RefreshCw size={18} /> New Caption
              </button>
              <button onClick={handleShuffleTemplate} disabled={loading} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg text-sm font-medium text-zinc-200 flex items-center gap-2">
                <Shuffle size={18} /> New Template
              </button>
              <a href={currentMeme.url} download="meme.png" target="_blank" rel="noopener noreferrer" className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg text-sm font-medium text-zinc-200 flex items-center gap-2">
                <Download size={18} /> Download
              </a>
              <button onClick={() => copyToClipboard(currentMeme.url)} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg text-sm font-medium text-zinc-200 flex items-center gap-2">
                <LinkIcon size={18} /> Copy URL
              </button>
            </div>
            <div className="text-center italic text-zinc-600 text-[10px] mt-4">
              "Daily Rizz Tip: If you don't know what it means, you're too old."
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 text-zinc-400 font-medium">
            <ImageIcon size={20} />
            <h2 className="text-xl">The Hall of Shame (History)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {history.map((item, i) => (
              <div key={i} className="group relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 aspect-square cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                <img src={item.url} alt={item.topic} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                  <span className="text-xs text-zinc-300 line-clamp-3">{item.topic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
