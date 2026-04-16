'use client';

import { useState } from 'react';
import { Share2, Download, Copy, Check, MessageCircle } from 'lucide-react';

interface ShareCardProps {
  memeUrl: string;
  topText: string;
  bottomText: string;
  isCustom?: boolean; // true for camera snap memes (data URL)
}

export default function ShareCard({ memeUrl, topText, bottomText, isCustom }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shareText = `${topText} | ${bottomText}\n\n🔥 Made with Meme Bhandar`;

  const handleNativeShare = async () => {
    if (!navigator.share) {
      // Fallback to copy
      handleCopy();
      return;
    }

    setSharing(true);
    try {
      if (isCustom && memeUrl.startsWith('data:')) {
        // Convert data URL to blob for sharing
        const response = await fetch(memeUrl);
        const blob = await response.blob();
        const file = new File([blob], 'meme.jpg', { type: 'image/jpeg' });
        
        await navigator.share({
          title: 'Check out this meme!',
          text: shareText,
          files: [file],
        });
      } else {
        await navigator.share({
          title: 'Check out this meme!',
          text: shareText,
          url: memeUrl,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        handleCopy();
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isCustom ? shareText : memeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = isCustom ? shareText : memeUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const url = isCustom
      ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + memeUrl)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const tweetText = isCustom
      ? encodeURIComponent(`${topText} | ${bottomText} 🔥\n\n#MemeForge #Memes`)
      : encodeURIComponent(`${topText} | ${bottomText} 🔥\n\n${memeUrl}\n\n#MemeForge #Memes`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const handleDownload = async () => {
    try {
      if (isCustom && memeUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = memeUrl;
        link.download = 'meme-bhandar.jpg';
        link.click();
      } else {
        const response = await fetch(memeUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'meme-bhandar.png';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      window.open(memeUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* Native Share (primary) */}
      <button
        onClick={handleNativeShare}
        disabled={sharing}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 text-sm"
      >
        <Share2 size={16} />
        Share
      </button>

      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl transition-all text-sm font-medium"
      >
        <MessageCircle size={16} />
        WhatsApp
      </button>

      {/* Twitter / X */}
      <button
        onClick={handleTwitter}
        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-all text-sm font-medium border border-zinc-700"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Post
      </button>

      {/* Download */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-all text-sm font-medium border border-zinc-700"
      >
        <Download size={16} />
        Save
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium border ${
          copied
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
        }`}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
