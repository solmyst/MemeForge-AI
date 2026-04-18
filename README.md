# ⚡ MemeForge AI (Meme Bhandar)

**MemeForge AI** (also known in-app as **Meme Bhandar**) is an open-source, **100% Local AI-powered** meme generator. Instead of generating generic AI images, it uses local Large Language Models (LLMs) and Vision-Language Models (VLMs) via [Ollama](https://ollama.com/) to analyze text topics or live camera photos and roast them into highly relatable, culturally specific internet memes. 

*"It doesn't generate images — it generates generational trauma ⚡"*

![MemeForge AI Showcase](https://img.shields.io/badge/AI-100%25%20Local-purple?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## 🌟 Key Features

- **🔒 100% Local AI:** Your data never leaves your machine. The app communicates directly with a local instance of Ollama. There are no cloud APIs, no subscriptions, and total privacy.
- **📸 Snap to Meme (Vision AI):** Take a picture or upload an image. The local vision model (e.g., LLaVA, Moondream) describes the photo context, and the text model writes a witty meme caption perfectly suited for your image. Captions are baked directly onto the image using HTML5 Canvas.
- **📝 Text to Meme:** Type a silly situation or personal pain point (e.g., *"When the code finally works at 4 AM"*), and the AI will generate appropriate text and overlay it on a trending meme template.
- **🤣 Rich Humor Personalities:** The AI responds in distinct personalities using strict system prompts. Modes include:
  - `🧠 GenZ Brainrot`: High-energy slang (sigma, skibidi, rizz).
  - `💀 Dark Humor`: Cynical, relatable dread.
  - `☕ Desi Brainrot`: A mix of Hindi & English (Hinglish), specifically tuned for Indian internet culture.
  - `🎬 Bollywood Roast` & `🏏 IPL Mode`: Hyper-localized pop culture references.
  - `💼 Corporate` & `💻 Indian IT Cell`: Office humor and engineering trauma.
- **🎲 Meme Roulette:** Get random, unhinged memes generated on the fly.
- **📱 PWA Ready:** Install the app to your home screen wrapper for a native-like experience.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript.
- **Styling:** Tailwind CSS, custom glassmorphism components (`glass`, `neon-glow`), Lucide React Icons.
- **AI Backend:** Ollama API (`http://localhost:11434/api/chat`).
- **Meme Image Source (for Text Mode):** [memegen.link](https://memegen.link/docs) APIs.

---

## 🚀 Getting Started

### 1. Prerequisites

1. **[Node.js](https://nodejs.org/en/)** (v18+)
2. **[Ollama](https://ollama.com/)** installed and running locally on your machine.

### 2. Prepare Local AI Models

You will need to pull the language and vision models using your terminal:

```bash
# Pull the standard text model for captions (Recommended: Llama 3.1 or 3.2)
ollama run llama3.1

# Pull a vision model for 'Snap to Meme' mode (Recommended: Moondream for speed, LLaVA for accuracy)
ollama run moondream
```

### 3. Install & Run MemeForge

Clone the repository and run the development server:

```bash
git clone https://github.com/yourusername/memeforge-ai.git
cd memeforge-ai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result!


## ⚙️ Configuration (Optional)

You can customize which Ollama models the app uses by defining environment variables in a `.env.local` file:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
OLLAMA_VISION_MODEL=moondream
```

## 🤝 Contributing

Contributions are welcome! Whether it's adding new humor styles, optimizing the canvas generation, or implementing new AI features—feel free to fork the repository and open a pull request. Make sure to adhere to the existing code standards.
