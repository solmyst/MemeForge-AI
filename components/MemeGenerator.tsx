/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTrendingTemplates, getRandomTemplate, MemeTemplate } from '@/services/memegen';
import { buildMemeURL } from '@/utils/memeUrlBuilder';
import { saveMemeToHistory, getMemeHistory, MemeHistoryItem } from '@/utils/localStorage';
import { Loader2, Shuffle, RefreshCw, Download, Link as LinkIcon, Image as ImageIcon, Camera, Type, CameraOff, Aperture, Monitor } from 'lucide-react';

type Mode = 'text' | 'camera';
type CameraState = 'idle' | 'active' | 'captured';

export default function MemeGenerator() {
  const [mode, setMode] = useState<Mode>('text');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('GenZ');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [currentMeme, setCurrentMeme] = useState<{url: string, top: string, bottom: string, template: MemeTemplate} | null>(null);
  const [history, setHistory] = useState<MemeHistoryItem[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Forging...");
  const [placeholder, setPlaceholder] = useState("Describe your situation...");

  // Camera-specific state
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // base64
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null); // data URL for display
  const [photoDescription, setPhotoDescription] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadingMessages = [
    "Charging the Rizz-o-meter...",
    "Consulting the Meme Elders...",
    "Teaching the AI about sarcasm...",
    "Mining for fresh brainrot...",
    "Summoning the ghost of Harambe...",
    "Polishing the aura...",
    "Deleting your search history...",
    "Analyzing your vibe...",
    "Processing the cringe...",
  ];

  const placeholders = [
    "When the code finally works at 4 AM...",
    "Describe your pain here...",
    "Tell me why you're late for class...",
    "That feeling when the direct hits...",
    "Me in a relationship I wasn't ready for...",
  ];

  useEffect(() => {
    getTrendingTemplates().then(setTemplates).catch(console.error);
    setHistory(getMemeHistory());
    setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);

    // PWA Install Prompt Listener
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
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

  // Stop camera when switching to text mode
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraState('idle');
  }, []);

  const handleModeChange = (newMode: Mode) => {
    if (newMode === 'text') {
      stopCamera();
      setCapturedImage(null);
      setCapturedPreview(null);
      setPhotoDescription(null);
      setCameraError(null);
    }
    setMode(newMode);
    setCurrentMeme(null);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraState('active');
    } catch (err: any) {
      console.error('Camera error:', err);
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        setCameraError('🚨 Mobile browsers block camera access over HTTP. Please use "From Gallery" or use the app on your computer!');
      } else {
        setCameraError('Could not access camera. Please allow camera permission and try again.');
      }
    }
  };

  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [cameraState]);

  const drawMemeText = (ctx: CanvasRenderingContext2D, width: number, height: number, top: string, bottom: string) => {
    const fontSize = Math.floor(width / 12);
    const lineHeight = fontSize * 1.2;
    const padding = width * 0.05;
    const maxWidth = width - (padding * 2);

    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.floor(fontSize / 8);
    ctx.textAlign = 'center';

    const wrapText = (text: string): string[] => {
      const words = text.toUpperCase().split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const drawLines = (lines: string[], startY: number, align: 'top' | 'bottom') => {
      lines.forEach((line, index) => {
        const y = align === 'top' 
          ? startY + (index * lineHeight)
          : startY - ((lines.length - 1 - index) * lineHeight);
        
        ctx.strokeText(line, width / 2, y);
        ctx.fillText(line, width / 2, y);
      });
    };

    if (top) {
      ctx.textBaseline = 'top';
      const topLines = wrapText(top);
      drawLines(topLines, height * 0.05, 'top');
    }

    if (bottom) {
      ctx.textBaseline = 'bottom';
      const bottomLines = wrapText(bottom);
      drawLines(bottomLines, height * 0.95, 'bottom');
    }
  };

  const processImage = async (dataURL: string, base64: string) => {
    setCapturedPreview(dataURL);
    setCapturedImage(base64);
    setCameraState('captured');
    setLoading(true);

    try {
      // 1. Describe
      const descRes = await fetch('/api/describe-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const { description, error } = await descRes.json();
      if (!descRes.ok) throw new Error(error || 'Failed to describe photo');
      setPhotoDescription(description);

      // 2. Generate Caption
      const { topText, bottomText } = await generateCaption(description, style);
      
      // 3. Draw Meme
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = dataURL;
      await new Promise(resolve => img.onload = resolve);
      
      // Match canvas to image for drawing
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      drawMemeText(ctx, canvas.width, canvas.height, topText, bottomText);
      const memeDataURL = canvas.toDataURL('image/jpeg', 0.85);

      const newMeme = { 
        url: memeDataURL, 
        top: topText, 
        bottom: bottomText, 
        template: { id: 'custom', name: 'Your Snap', blank: '' } 
      };
      
      setCurrentMeme(newMeme);
      
      if (memeDataURL.length < 500000) { 
        saveMemeToHistory({ url: memeDataURL, topic: description, timestamp: Date.now() });
        setHistory(getMemeHistory());
      }
      
      console.log("Custom meme generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      const isTimeout = error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('signal');
      const helpText = isTimeout 
        ? ' - The AI is taking too long to load. Try closing other apps or freeing up disk space!' 
        : ' - Check your connection to Ollama.';
      alert((error.message || 'Something went wrong!') + helpText);
    } finally {
      setLoading(false);
    }
  };

  const captureAndGenerate = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const originalWidth = video.videoWidth || video.clientWidth || 640;
    const originalHeight = video.videoHeight || video.clientHeight || 480;
    const scale = Math.min(1, 800 / originalWidth);
    const width = originalWidth * scale;
    const height = originalHeight * scale;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, width, height);
    const rawDataURL = canvas.toDataURL('image/jpeg', 0.8);
    const rawBase64 = rawDataURL.split(',')[1];
    
    stopCamera();
    processImage(rawDataURL, rawBase64);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataURL = event.target?.result as string;
      
      // Downscale uploaded image via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 800 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const scaledDataURL = canvas.toDataURL('image/jpeg', 0.8);
          const scaledBase64 = scaledDataURL.split(',')[1];
          processImage(scaledDataURL, scaledBase64);
        }
      };
      img.src = dataURL;
    };
    reader.readAsDataURL(file);
  };
  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedPreview(null);
    setPhotoDescription(null);
    setCameraError(null);
    setCurrentMeme(null);
    setCameraState('idle'); // Ensure UI resets immediately
    startCamera();
  };

  const generateCaption = async (topicStr: string, styleStr: string) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topicStr, humorStyle: styleStr }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate');
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
      saveMemeToHistory({ url, topic, timestamp: Date.now() });
      setHistory(getMemeHistory());
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Something went wrong generating the meme!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCaption = async () => {
    if (!currentMeme) return;
    const topicStr = mode === 'camera' ? (photoDescription || topic) : topic;
    setLoading(true);
    try {
      const { topText, bottomText } = await generateCaption(topicStr, style);
      const url = buildMemeURL(currentMeme.template.id, topText, bottomText);
      setCurrentMeme({ ...currentMeme, url, top: topText, bottom: bottomText });
      saveMemeToHistory({ url, topic: topicStr, timestamp: Date.now() });
      setHistory(getMemeHistory());
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to regenerate caption');
    } finally {
      setLoading(false);
    }
  };

  const handleShuffleTemplate = () => {
    if (!currentMeme) return;
    const newTemplate = getRandomTemplate(templates);
    const url = buildMemeURL(newTemplate.id, currentMeme.top, currentMeme.bottom);
    setCurrentMeme({ ...currentMeme, url, template: newTemplate });
    const topicStr = mode === 'camera' ? (photoDescription || 'snap') : topic;
    saveMemeToHistory({ url, topic: topicStr, timestamp: Date.now() });
    setHistory(getMemeHistory());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="bg-purple-600/20 border border-purple-500/30 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Monitor className="text-purple-400" size={20} />
            <span className="text-sm text-zinc-200">Install MemeForge for the best mobile experience!</span>
          </div>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Install Now
          </button>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit mx-auto">
        <button
          onClick={() => handleModeChange('text')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === 'text'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Type size={15} /> Type a Topic
        </button>
        <button
          onClick={() => handleModeChange('camera')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === 'camera'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Camera size={15} /> Snap to Meme
        </button>
      </div>

      {/* Main Generator Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">

        {/* ── TEXT MODE ── */}
        {mode === 'text' && (
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
                ) : 'Forge Meme ✨'}
              </button>
            </div>
          </div>
        )}

        {/* ── CAMERA MODE ── */}
        {mode === 'camera' && (
          <div className="space-y-4">
            {/* Idle: Start Camera Button */}
            {cameraState === 'idle' && (
              <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-950/50">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Camera size={28} className="text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-zinc-300 font-medium">Point your camera at anything</p>
                  <p className="text-zinc-500 text-sm mt-1">AI will roast it into a meme</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <button
                    onClick={startCamera}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                  >
                    <Camera size={18} /> Open Camera
                  </button>
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <ImageIcon size={18} /> From Gallery
                  </button>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {cameraError && (
                  <p className="text-red-400 text-sm text-center max-w-xs">{cameraError}</p>
                )}
              </div>
            )}

            {/* Active: Live Camera Preview */}
            {cameraState === 'active' && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br" />
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={captureAndGenerate}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
                  >
                    <Aperture size={18} /> Capture
                  </button>
                  <button
                    onClick={() => { stopCamera(); setCameraError(null); }}
                    className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors text-sm font-medium"
                  >
                    <CameraOff size={16} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Captured: Auto-generating... */}
            {cameraState === 'captured' && capturedPreview && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Captured photo thumbnail */}
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-zinc-950 flex-shrink-0 w-full sm:w-48 h-36">
                    <img src={capturedPreview} alt="Captured" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                      <span className="text-xs text-purple-300 font-medium">📸 Your snap</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {loading && (
                      <div className="flex items-center gap-2 text-purple-400 text-sm">
                        <Loader2 className="animate-spin" size={16} />
                        <span className="animate-pulse">{loadingMessage}</span>
                      </div>
                    )}
                    {photoDescription && (
                      <div className="px-4 py-3 bg-zinc-950 border border-purple-500/20 rounded-lg">
                        <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-1">AI saw:</p>
                        <p className="text-zinc-300 text-sm italic">"{photoDescription}"</p>
                      </div>
                    )}
                    {!loading && (
                      <button
                        onClick={retakePhoto}
                        className="px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/5 group"
                      >
                        <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        Create a new meme
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Hidden canvas for capture ── */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ── Meme Result (shared between modes) ── */}
        {currentMeme && (
          <div className="mt-8 pt-8 border-t border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className={`relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex justify-center p-4 min-h-[300px] ${loading ? 'animate-forge' : ''}`}>
              {loading && (
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-10 flex items-center justify-center font-bold text-purple-400 tracking-widest">
                  {loadingMessage}
                </div>
              )}
              <img src={currentMeme.url} alt="Generated Meme" className="max-h-[600px] object-contain w-full" />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={handleRegenerateCaption} disabled={loading} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg text-sm font-medium text-zinc-200 flex items-center gap-2">
                <RefreshCw size={18} /> New Caption
              </button>
              {currentMeme.template.id !== 'custom' && (
                <button onClick={handleShuffleTemplate} disabled={loading} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors rounded-lg text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <Shuffle size={18} /> New Template
                </button>
              )}
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
