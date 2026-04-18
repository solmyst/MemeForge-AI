# PROJECT SPEC & CONTEXT: MemeForge AI (Meme Bhandar)

**Purpose**: This document contains every minute detail about the architecture, execution flow, component structure, state management, and edge cases of **MemeForge AI**. This can be fed directly to an AI (like ChatGPT) to give it 100% context on the project before asking for new features, bug fixes, or refactoring.

---

## 1. High-Level Summary
MemeForge AI is a Next.js 14 (App Router) web application designed to locally generate memes using Large Language Models (LLMs) and Vision-Language Models (VLMs) via **Ollama**.
- It entirely avoids external LLM provider costs (like OpenAI or Anthropic).
- Generating Memes works across two flows:
  1. **Text Mode**: User types a topic -> LLM generates top/bottom captions -> caption is appended to a trending meme template URL provided by `memegen.link`.
  2. **Camera Mode (Snap to Meme)**: User takes a photo/uploads image -> Image encoded in base64 -> VLM describes image in 1-2 sentences -> LLM uses description to generate funny top/bottom captions -> Captions are natively drawn onto the photo using HTML5 Canvas (`ctx.fillText`).

---

## 2. Core Technologies
- **Framework**: Next.js 14.2.35 (React 18, App Router layout).
- **Styling**: Tailwind CSS (v3.4.1) using custom utility classes defined in `globals.css` (e.g., `.glass`, `.glass-strong`, `.neon-glow`).
- **Icons**: `lucide-react` (Camera, Trash, RefreshCw, etc.).
- **AI Runtime**: Local **Ollama** running locally on default port `11434`.
- **Meme Images**: Custom Canvas baking (Camera Mode) OR `https://api.memegen.link/images/` (Text Mode).

---

## 3. Directory & File Structure
```
memeforge-ai/
├── app/
│   ├── layout.tsx         # Main HTML layout, imports globals.css
│   ├── page.tsx           # Entry point (`/`) -> Renders Hero UI and <MemeGenerator />
│   └── api/
│       ├── generate/route.ts        # POST endpoint -> Text Model (Ollama `/api/chat`)
│       ├── describe-photo/route.ts  # POST endpoint -> Vision Model (Ollama `/api/chat`)
│       ├── config/route.ts          # Endpoint to fetch server config (e.g., active models)
│       └── trending-topics/route.ts # Endpoint to fetch trending items
├── components/
│   ├── MemeGenerator.tsx        # The Core engine. Handles UI switching, Camera logic, Canvas drawing, API calling.
│   ├── MemeRoulette.tsx         # Random meme button component. Passes generation command up.
│   ├── MemeBattle.tsx           # Legacy/Alternate mode: Compares two memes side-by-side.
│   ├── ParticleBackground.tsx   # Visual background animation based on JS particles/CSS.
│   ├── PWAInstall.tsx           # Standalone component handling BeforeInstallPrompt for PWA.
│   ├── ShareCard.tsx            # UI to present meme and share buttons.
│   └── SoundFX.tsx              # Audio hook `useSoundFX` to play randomized success sounds on generation.
├── services/
│   └── memegen.ts               # Fetches random/trending templates from api.memegen.link
├── utils/
│   ├── localStorage.ts          # History manipulation (saving generated memes).
│   └── memeUrlBuilder.ts        # Helper to construct proper URLs for memegen.link templates.
```

---

## 4. API Endpoints Deep Dive

### A. `/api/generate` 
- **Method**: POST
- **Payload**: `{ topic: string, humorStyle: string, model?: string }`
- **Logic**:
  - Uses a massive string map `STYLE_PROMPTS` mapping the `humorStyle` (e.g., `GenZ`, `Desi Brainrot`, `Corporate`) to specific instructions. 
  - Hits Ollama locally: `POST http://localhost:11434/api/chat`.
  - Enforces `format: "json"` (except as a fallback for the final attempt) to get: `{"topText": "...", "bottomText": "..."}`.
  - Highly robust error-handling: It employs a `while`-loop (up to 3 attempts) to parse Ollama's sometimes malformed JSON. It regex cleans markdown code blocks (` ```json `), and traverses the JSON tree finding the longest strings if the exact keys aren't matched.
  - **Memory Management Notice**: Sends `keep_alive: "5m"` to keep Ollama models loaded dynamically but clean up eventually.
  - **Return**: `{ topText: string, bottomText: string }`

### B. `/api/describe-photo`
- **Method**: POST
- **Payload**: `{ image: "base64_string_data" }`
- **Logic**:
  - Requires a local vision model (Defaults to `llava` but user may use `moondream` or `gemma4` by setting `OLLAMA_VISION_MODEL`).
  - Calls Ollama with message format `{ role: 'user', content: '...', images: [base64] }`.
  - Prompts the vision model to analyze subjects/expressions for a 1-2 sentence breakdown.
  - **Return**: `{ description: string }`

---

## 5. Main Component: `<MemeGenerator />` Details
This huge wrapper component (`components/MemeGenerator.tsx`) oversees everything.

**State Flow Contexts:**
1. **Mode Switching**: `mode` state tracks `'text'` | `'camera'`.
2. **Settings**: Tracks `topic` (string) and `style` (string enum matching `/api/generate`).
3. **Hardware Context**: Uses `useRef` for `<video>` (camera feed) and `<canvas>` (image baking). Tracks `cameraState`: idle, active, or captured.
4. **Data States**: `templates` (from memegen), `currentMeme` (object displaying latest UI), `history` (array of `MemeHistoryItem`).
5. **UI FX**: Uses `useSoundFX` to play audio on success. Uses `ConfettiBurst` custom child component triggered by `showConfetti` boolean (auto-dismisses using a `setTimeout` hook).

**Core Functions:**
- `startCamera()`: Uses `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`. Saves to `streamRef`.
- `captureAndGenerate()`: Grabs video frame, pushes to hidden `<canvas>`, extracts base64 block, then calls `processImage()`.
- `processImage()`: 
   1. Sets `loading = true`.
   2. Calls `/api/describe-photo`. Gets description.
   3. Calls `generateCaption(description, style)`.
   4. Instantiates an html `Image()` object with the photo, draws it to canvas (`ctx.drawImage`). Passes to `drawMemeText()` for text rendering.
- `drawMemeText(ctx, width, height, top, bottom)`: Custom logic. Creates thick standard meme fonts ("Impact"). Computes dynamic resizing so text won't overflow the image limits. Implements stroke texts to give a hard outline.
- `handleGenerate()`: Function for **Text Mode**. Uses memegen.link templates instead of canvas drawing. Gets generated text and parses onto `buildMemeURL(id, top, bottom)`.

---

## 6. CSS & Theming Styles
- **Dark UI Base**: Mostly uses `bg-zinc-950` with purple gradients. 
- **Tailwind Config**: Uses modern JIT compilation.
- **Glassmorphism**: Handled by custom classes inside `globals.css`:
  - `.glass`: `background: rgba(24, 24, 27, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05);`
  - `.neon-glow`: Adds aggressive animated shadow layers `box-shadow: 0 0 20px rgba(168, 85, 247, 0.15)`.

---

## 7. Major Edge Cases Handled in App
- **Broken Camera HTTPS**: Mobile browsers block Camera without HTTPS. The app dynamically alerts users to use "From Gallery" file-upload input instead.
- **Timeout Management / Resource Constraints**: The `generate` API limits Ollama's `num_predict` dynamically to prevent rambling, speeds up CPU-only local processing, and handles abort controller timeouts manually if Ollama hangs.
- **JSON Breakage**: LLMs locally often halllucinate markdown blocks. The code features heavy Regex replacement, string extraction fallbacks.

---

## 8. Summary for ChatGPT Instructions
When dealing with updates for this app:
1. **Never use external APIs** for generation logic unless told otherwise. Rely on the local `/api/generate` utilizing Ollama.
2. If styling changes, utilize the pre-existing Tailwind/Zinc/Purple patterns (`border-zinc-800`, `text-purple-400`, `.glass` class).
3. Be conscious of **Canvas Lifecycle**. Whenever modifying image layout logic in Camera Mode, remember that changes happen imperatively via `CanvasRenderingContext2D`, NOT react standard DOM.
4. When dealing with new humor presets, add to BOTH `MemeGenerator.tsx` `<select>` array AND `route.ts` `STYLE_PROMPTS` map.
