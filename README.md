# 📜 Read T&C

**Instantly understand Terms & Conditions, Privacy Policies, and legal documents.**

A Chrome extension that uses AI to analyze legal documents and give you a clear, plain-English summary with red flag detection.

## What It Does

- **One-click analysis** — Click the extension on any page to analyze its legal text
- **Auto-detection** — Automatically detects Terms & Conditions, Privacy Policies, EULAs, and other legal documents
- **Risk assessment** — Rates documents as Low / Medium / High risk
- **Red flag detection** — Highlights concerning clauses (data selling, arbitration, auto-renewal traps, liability waivers)
- **Structured breakdown** — Organized into Summary, Red Flags, Key Points, Your Rights, Data & Privacy, Costs & Cancellation
- **Copy to clipboard** — Export the analysis as clean Markdown
- **Works with any OpenAI-compatible API** — OpenAI, OpenRouter, local models

## Installation (Developer Mode)

1. Clone this repo
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" → select the `readtc` folder
5. Click the extension icon → Settings → enter your OpenAI API key
6. Navigate to any Terms & Conditions page and click "Analyze"

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| API Key | — | Your OpenAI API key (required) |
| Model | `gpt-4o-mini` | LLM model to use |
| API Base URL | `https://api.openai.com/v1` | Change for OpenRouter or local models |

### Using with OpenRouter

Set the base URL to `https://openrouter.ai/api/v1` and use your OpenRouter API key.

### Using with Local Models

Set the base URL to your local endpoint (e.g., `http://localhost:1234/v1` for LM Studio).

## How It Works

1. **Content Script** runs on every page, checking if it looks like a legal document (title, URL, headings)
2. When you click "Analyze", it **extracts the page text** (targeting main content, excluding nav/footer)
3. Text is sent to the configured LLM with a **specialized legal analysis prompt**
4. Results are parsed from structured JSON and displayed in the popup

## Tech Stack

- Chrome Extension (Manifest V3)
- Vanilla HTML/CSS/JS — no build step, no dependencies
- OpenAI-compatible API for LLM analysis
- Dark theme UI

## Screenshots

*Coming soon — MVP stage*

## Roadmap

- [ ] Chrome Web Store listing
- [ ] Selection-based analysis (highlight specific text)
- [ ] History of analyzed documents
- [ ] Comparison between different services' T&Cs
- [ ] Browser sidebar view for longer documents
- [ ] Firefox support

## Cost

Each analysis uses ~1-2k tokens input + ~500 tokens output. With GPT-4o-mini, that's approximately **$0.001-0.002 per analysis** (fraction of a cent).

## License

MIT

---

*Built by [Hephaestus](https://github.com/farfan-assistant) — the forge that turns ideas into working software.*
