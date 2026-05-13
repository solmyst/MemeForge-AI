/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getTrendingTemplates, getRandomTemplate, MemeTemplate } from '@/services/memegen';
import { buildMemeURL } from '@/utils/memeUrlBuilder';
import { saveMemeToHistory, getMemeHistory, MemeHistoryItem } from '@/utils/localStorage';
import { Loader2, Shuffle, RefreshCw, Image as ImageIcon, Camera, Type, CameraOff, Aperture, Monitor, Trash2, X, Settings, Key, Check, Info } from 'lucide-react';

import MemeRoulette from './MemeRoulette';
import MemeBattle from './MemeBattle';
import ShareCard from './ShareCard';
import { useSoundFX, SoundToggle } from './SoundFX';

type Mode = 'text' | 'camera';
type CameraState = 'idle' | 'active' | 'captured';

// Confetti burst component
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const confettiEmojis = ['🎉', '🔥', '💀', '😂', '🧠', '⚡', '🎯', '✨'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-xl"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${20 + Math.random() * 30}%`,
            animation: `confettiBurst ${0.6 + Math.random() * 0.6}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          {confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]}
        </span>
      ))}
    </div>
  );
}

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
  const [showConfetti, setShowConfetti] = useState(false);

  // Camera-specific state
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [_capturedImage, setCapturedImage] = useState<string | null>(null); // base64
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null); // data URL for display
  const [photoDescription, setPhotoDescription] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');

  // Sound FX
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, playRandomSound } = useSoundFX();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Charging the Rizz-o-meter...",
    "Consulting the Meme Elders...",
    "Teaching the AI about sarcasm...",
    "Mining for fresh brainrot...",
    "Summoning the ghost of Harambe...",
    "Polishing the aura...",
    "Analyzing your vibe...",
    "Processing the cringe...",
    "Downloading sigma energy...",
    "Asking Baburao for paisa...",
    "Loading Sharma ji ka beta's grades...",
    "Thala for a reason... wait...",
    "Jugaad engineering in progress...",
  ];

  const placeholders = [
    "When the code finally works at 4 AM...",
    "Describe your pain here...",
    "Tell me why you're late for class...",
    "That feeling when Zomato says 10 mins...",
    "Me in a relationship I wasn't ready for...",
    "When Sharma ji ka beta gets promoted...",
    "Indian parents when you score 99%...",
    "IPL match me last over ka scene...",
    "Monday morning standup call vibes...",
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
    
    // Load API Key from localStorage
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setUserApiKey(savedKey);
      setTempApiKey(savedKey);
    }

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

  // Confetti effect — auto-dismiss
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

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
    // lineHeight computed dynamically below after adjustment
    const padding = width * 0.05;
    const maxWidth = width - (padding * 2);

    // Professional Meme Typography
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.letterSpacing = '1px';
    
    // Setup shadow for extra readability on complex backgrounds
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = Math.max(2, fontSize / 15);
    ctx.shadowOffsetX = Math.max(1, fontSize / 20);
    ctx.shadowOffsetY = Math.max(1, fontSize / 20);

    const wrapText = (text: string): string[] => {
      const words = text.toUpperCase().split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const widthRes = ctx.measureText(currentLine + " " + word).width;
        if (widthRes < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const topLines = top ? wrapText(top) : [];
    const bottomLines = bottom ? wrapText(bottom) : [];
    const totalLines = topLines.length + bottomLines.length;

    // Dynamic Scaling: Reduce font size if there are too many lines
    let adjustedFontSize = fontSize;
    if (totalLines > 3) {
      adjustedFontSize = Math.floor(fontSize * (3 / totalLines));
      ctx.font = `bold ${adjustedFontSize}px Impact, sans-serif`;
      ctx.lineWidth = Math.floor(adjustedFontSize / 8);
    }
    const adjustedLineHeight = adjustedFontSize * 1.2;

    const drawLines = (lines: string[], startY: number, align: 'top' | 'bottom') => {
      lines.forEach((line, index) => {
        const y = align === 'top' 
          ? startY + (index * adjustedLineHeight)
          : startY - ((lines.length - 1 - index) * adjustedLineHeight);
        
        // Draw inner stroke (thick)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(2, adjustedFontSize / 6);
        ctx.strokeText(line, width / 2, y);

        // Draw outer thin stroke for sharpness
        ctx.lineWidth = Math.max(1, adjustedFontSize / 12);
        ctx.strokeText(line, width / 2, y);
        
        // Remove shadow for the fill to keep it crisp
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'white';
        ctx.fillText(line, width / 2, y);
        
        // Restore shadow for next lines if needed
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
      });
    };

    if (topLines.length > 0) {
      ctx.textBaseline = 'top';
      drawLines(topLines, height * 0.05, 'top');
    }

    if (bottomLines.length > 0) {
      ctx.textBaseline = 'bottom';
      drawLines(bottomLines, height * 0.95, 'bottom');
    }
  };

  const triggerMemeSuccess = () => {
    setShowConfetti(true);
    playRandomSound();
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
        body: JSON.stringify({ image: base64, userApiKey }),
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
      const memeDataURL = canvas.toDataURL('image/jpeg', 1.0);

      const newMeme = { 
        url: memeDataURL, 
        top: topText, 
        bottom: bottomText, 
        template: { id: 'custom', name: 'Your Snap', blank: '' } 
      };
      
      setCurrentMeme(newMeme);
      triggerMemeSuccess();
      
      if (memeDataURL.length < 500000) { 
        saveMemeToHistory({ 
          url: memeDataURL, 
          topic: description, 
          top: topText, 
          bottom: bottomText, 
          template: { id: 'custom', name: 'Your Snap', blank: '' },
          timestamp: Date.now() 
        });
        setHistory(getMemeHistory());
      }
      
      console.log("Custom meme generated successfully!");
    } catch (error: Error | any) {
      console.error("Generation error:", error);
      const errorMessage = error.message || 'Something went wrong!';
      const helpText = errorMessage.includes('Ollama') 
        ? '\n\n💡 Tip: Check if Ollama is running, or add an OpenAI API key to .env.local'
        : errorMessage.includes('OpenAI')
        ? '\n\n💡 Tip: Check your OpenAI API key and quota.'
        : '';
      
      alert(`Meme Forge Error: ${errorMessage}${helpText}`);
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
    const scale = Math.min(1, 1024 / originalWidth);
    const width = originalWidth * scale;
    const height = originalHeight * scale;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, width, height);
    const rawDataURL = canvas.toDataURL('image/jpeg', 0.95);
    const rawBase64 = rawDataURL.split(',')[1];
    
    stopCamera();
    processImage(rawDataURL, rawBase64);
  };

  const regenerateCaptionOnly = async () => {
    if (!photoDescription || !capturedPreview) return;
    
    setLoading(true);
    try {
      // Reuse existing description to get a new caption
      const { topText, bottomText } = await generateCaption(photoDescription, style);
      
      // Redraw on the existing canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = capturedPreview;
      await new Promise(resolve => img.onload = resolve);
      
      ctx.drawImage(img, 0, 0);
      drawMemeText(ctx, canvas.width, canvas.height, topText, bottomText);
      const memeDataURL = canvas.toDataURL('image/jpeg', 1.0);

      const newMeme = { 
        url: memeDataURL, 
        top: topText, 
        bottom: bottomText, 
        template: { id: 'custom', name: 'Your Snap', blank: '' } 
      };
      
      setCurrentMeme(newMeme);
      triggerMemeSuccess();
      saveMemeToHistory({ 
        url: memeDataURL, 
        topic: photoDescription, 
        top: topText, 
        bottom: bottomText, 
        template: { id: 'custom', name: 'Your Snap', blank: '' },
        timestamp: Date.now() 
      });
      setHistory(getMemeHistory());
    } catch (err) {
      console.error("Regeneration error:", err);
      if (err instanceof Error) alert(err.message);
    } finally {
      setLoading(false);
    }
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
        const scale = Math.min(1, 1024 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const scaledDataURL = canvas.toDataURL('image/jpeg', 0.95);
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
      body: JSON.stringify({ topic: topicStr, humorStyle: styleStr, userApiKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate');
    return data;
  };

  const handleGenerate = async () => {
    if (!topic || templates.length === 0) return;
    setLoading(true);
    try {
      const { topText, bottomText } = await generateCaption(topic, style);
      let newMeme;
      
      if (capturedPreview && canvasRef.current) {
        // Use custom captured image
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context missing");

        const img = new Image();
        img.src = capturedPreview;
        await new Promise(resolve => img.onload = resolve);
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        drawMemeText(ctx, canvas.width, canvas.height, topText, bottomText);
        const memeDataURL = canvas.toDataURL('image/jpeg', 1.0);

        newMeme = { 
          url: memeDataURL, 
          top: topText, 
          bottom: bottomText, 
          template: { id: 'custom', name: 'Your Snap', blank: '' } 
        };
      } else {
        // Use random memegen template
        const template = getRandomTemplate(templates);
        const url = buildMemeURL(template.id, topText, bottomText);
        newMeme = { url, top: topText, bottom: bottomText, template };
      }

      setCurrentMeme(newMeme);
      triggerMemeSuccess();
      saveMemeToHistory({ 
        url: newMeme.url, 
        topic, 
        top: topText, 
        bottom: bottomText, 
        template: newMeme.template, 
        timestamp: Date.now() 
      });
      setHistory(getMemeHistory());
    } catch (error: Error | any) {
      console.error(error);
            alert(`Meme Forge Error: ${error.message || 'Something went wrong!'}\n\n💡 Tip: Check if Ollama is running, or add an OpenAI API key to .env.local`);

    } finally {
      setLoading(false);
    }
  };

  const handleRouletteGenerate = async (rouletteTopic: string, rouletteStyle: string) => {
    if (templates.length === 0) return;
    setLoading(true);
    try {
      const template = getRandomTemplate(templates);
      const { topText, bottomText } = await generateCaption(rouletteTopic, rouletteStyle);
      const url = buildMemeURL(template.id, topText, bottomText);
      const newMeme = { url, top: topText, bottom: bottomText, template };
      setCurrentMeme(newMeme);
      triggerMemeSuccess();
      setTopic(rouletteTopic);
      setStyle(rouletteStyle);
      saveMemeToHistory({
        url,
        topic: rouletteTopic,
        top: topText,
        bottom: bottomText,
        template,
        timestamp: Date.now()
      });
      setHistory(getMemeHistory());
    } catch (error: any) {
      console.error(error);
      alert(`Meme Forge Error: ${error.message || 'Something went wrong!'}\n\n💡 Tip: Check if Ollama is running, or add an OpenAI API key to .env.local`);
    } finally {
      setLoading(false);
    }
  };


  const handleRegenerateCaption = async () => {
    if (!currentMeme) return;
    
    // Case 1: Custom Snap Meme
    if (currentMeme.template.id === 'custom') {
      await regenerateCaptionOnly();
      return;
    }

    // Case 2: Standard Template Meme
    const topicStr = mode === 'camera' ? (photoDescription || topic) : topic;
    setLoading(true);
    try {
      const { topText, bottomText } = await generateCaption(topicStr, style);
      const url = buildMemeURL(currentMeme.template.id, topText, bottomText);
      const newMeme = { ...currentMeme, url, top: topText, bottom: bottomText };
      setCurrentMeme(newMeme);
      triggerMemeSuccess();
      saveMemeToHistory({ 
        url, 
        topic: topicStr, 
        top: topText, 
        bottom: bottomText, 
        template: currentMeme.template, 
        timestamp: Date.now() 
      });
      setHistory(getMemeHistory());
    } catch (error: any) {
      console.error(error);
      alert(`Meme Forge Error: ${error.message || 'Failed to regenerate caption'}\n\n💡 Tip: Check your API key or connection.`);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffleTemplate = () => {
    if (!currentMeme) return;
    const newTemplate = getRandomTemplate(templates);
    const url = buildMemeURL(newTemplate.id, currentMeme.top, currentMeme.bottom);
    const newMeme = { ...currentMeme, url, template: newTemplate };
    setCurrentMeme(newMeme);
    playRandomSound();
    const topicStr = mode === 'camera' ? (photoDescription || 'snap') : topic;
    saveMemeToHistory({ 
      url, 
      topic: topicStr, 
      top: currentMeme.top, 
      bottom: currentMeme.bottom, 
      template: newTemplate, 
      timestamp: Date.now() 
    });
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

  const clearHistory = () => {
    if (confirm('Are you sure you want to delete your meme history? This cannot be undone.')) {
      localStorage.removeItem('memeHistory');
      setHistory([]);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('openai_api_key', tempApiKey);
    setUserApiKey(tempApiKey);
    setShowSettings(false);
    alert('Settings saved! Using your OpenAI key for next memes.');
  };

  const HUMOR_STYLES = [
    { value: 'GenZ', label: '🧠 GenZ Brainrot' },
    { value: 'Dark Humor', label: '💀 Dark Humor' },
    { value: 'Sarcastic', label: '🙄 Sarcastic' },
    { value: 'Savage Roast', label: '🔥 Savage Roast' },
    { value: 'Corporate', label: '💼 Corporate' },
    { value: 'Desi Brainrot', label: '☕ Desi Brainrot' },
    { value: 'IPL Mode', label: '🏏 IPL Mode' },
    { value: 'Bollywood Roast', label: '🎬 Bollywood Roast' },
    { value: 'Indian IT Cell', label: '💻 Indian IT Cell' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ConfettiBurst active={showConfetti} />

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="glass rounded-xl p-4 flex items-center justify-between neon-glow animate-slide-up">
          <div className="flex items-center gap-3">
            <Monitor className="text-purple-400" size={20} />
            <span className="text-sm text-zinc-200">Install Meme Bhandar for the best mobile experience!</span>
          </div>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Install Now
          </button>
        </div>
      )}


      {/* ── Meme Roulette ── */}
      <MemeRoulette onGenerate={handleRouletteGenerate} loading={loading} />

      {/* ── Mode Tabs & Style Selector ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mx-auto">
        <div className="flex gap-1 p-1 glass rounded-xl">
          <button
            onClick={() => handleModeChange('text')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'text'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Type size={15} /> Type a Topic
          </button>
          <button
            onClick={() => handleModeChange('camera')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'camera'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Camera size={15} /> Snap to Meme
          </button>
        </div>

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="px-4 py-3 glass rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer appearance-none text-sm font-medium"
        >
          {HUMOR_STYLES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <SoundToggle enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
        
        <button
          onClick={() => setShowSettings(true)}
          className={`p-3 glass rounded-xl text-zinc-400 hover:text-white transition-all ${showSettings ? 'bg-purple-600/20 text-purple-400' : ''}`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-strong rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl border border-white/10 animate-zoom-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="text-purple-400" size={24} />
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Key size={14} className="text-purple-400" />
                  OpenAI API Key (Optional)
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
                <p className="text-[10px] text-zinc-500 flex items-start gap-1">
                  <Info size={10} className="mt-0.5 shrink-0" />
                  Stored locally in your browser. Used to power cloud-based generation if Ollama is unavailable.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={saveSettings}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Generator Section ── */}
      <div className="glass-strong rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 neon-glow">

        {/* ── TEXT MODE ── */}
        {mode === 'text' && (
          <div className="space-y-4">
            
            {/* Custom Image Preview Thumbnail */}
            {capturedPreview && (
              <div className="flex justify-center mb-4">
                <div className="relative inline-block hover-lift">
                  <img src={capturedPreview} alt="Using custom snap" className="h-24 w-auto max-w-[200px] object-contain rounded-xl border-2 border-purple-500/40 bg-zinc-950" />
                  <button 
                    onClick={() => {
                      setCapturedPreview(null);
                      setCapturedImage(null);
                      setPhotoDescription(null);
                    }} 
                    className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors border border-black/50"
                    title="Remove custom image"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                    <ImageIcon size={10} className="text-purple-400" />
                    <span className="text-[10px] text-white font-medium whitespace-nowrap">Using Snap</span>
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={placeholder}
                className="w-full px-6 py-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs hidden sm:block">
                Press Enter ↵
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerate}
                disabled={loading || !topic}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center text-lg shadow-lg hover:shadow-purple-500/25 animate-pulse-glow"
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
              <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-zinc-700/50 rounded-xl bg-zinc-950/30">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-pulse-glow">
                  <Camera size={28} className="text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-zinc-300 font-medium">Point your camera at anything</p>
                  <p className="text-zinc-500 text-sm mt-1">AI will roast it into a meme</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm px-4">
                  <button
                    onClick={startCamera}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                  >
                    <Camera size={18} /> Open Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700/50"
                  >
                    <ImageIcon size={18} /> From Gallery
                  </button>
                </div>
                <div className="mt-2 text-center">
                   <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs text-zinc-500 hover:text-zinc-400 underline underline-offset-4"
                  >
                    Use System Camera App instead
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
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
                    {!loading && (
                      <button
                        onClick={retakePhoto}
                        className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        <Camera size={16} />
                        New Photo
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
          <div className="mt-8 pt-8 border-t border-zinc-800/50 animate-bounce-in space-y-6">
            <div className={`relative rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950 flex justify-center p-4 min-h-[300px] ${loading ? 'animate-forge' : ''}`}>
              {loading && (
                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-10 flex items-center justify-center font-bold text-purple-400 tracking-widest">
                  {loadingMessage}
                </div>
              )}
              <img src={currentMeme.url} alt="Generated Meme" className="max-h-[600px] object-contain w-full" />
              
              {/* Watermark */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] text-zinc-500 font-medium">
                Meme Bhandar ⚡
              </div>
            </div>

            {/* Action buttons: Regenerate + Shuffle */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={handleRegenerateCaption} disabled={loading} className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-50 transition-colors rounded-xl text-sm font-medium text-zinc-200 flex items-center gap-2 border border-zinc-700/50">
                <RefreshCw size={16} /> New Caption
              </button>
              {currentMeme.template.id !== 'custom' && (
                <button onClick={handleShuffleTemplate} disabled={loading} className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-50 transition-colors rounded-xl text-sm font-medium text-zinc-200 flex items-center gap-2 border border-zinc-700/50">
                  <Shuffle size={16} /> New Template
                </button>
              )}
            </div>

            {/* Share Card */}
            <ShareCard
              memeUrl={currentMeme.url}
              topText={currentMeme.top}
              bottomText={currentMeme.bottom}
              isCustom={currentMeme.template.id === 'custom'}
            />

            <div className="text-center italic text-zinc-600 text-[10px] mt-4">
              &quot;Kuch toh log kahenge, logon ka kaam hai kehna&quot; — probably someone wise
            </div>
          </div>
        )}
      </div>

      {/* ── Meme Battle ── */}
      <MemeBattle templates={templates} onSoundFX={playRandomSound} />

      {/* ── History Section ── */}
      {history.length > 0 && (
        <div className="glass-strong rounded-2xl p-6 md:p-8 space-y-6 neon-glow">
          <div className="flex items-center justify-between gap-2 text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <ImageIcon size={20} />
              <h2 className="text-xl font-bold">The Hall of Shame</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-500 rounded-full">
                {history.length} memes
              </span>
            </div>
            <button 
              onClick={clearHistory}
              className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map((item, i) => (
              <div key={i} className="group relative rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950 aspect-square cursor-pointer hover-lift" 
                onClick={() => {
                  if (item.top && item.bottom && item.template) {
                    setCurrentMeme({ url: item.url, top: item.top, bottom: item.bottom, template: item.template });
                    setTopic(item.topic);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    window.open(item.url, '_blank');
                  }
                }}>
                <img src={item.url} alt={item.topic} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] text-zinc-300 line-clamp-2 font-medium">{item.topic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
