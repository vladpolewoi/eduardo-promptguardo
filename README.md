# Eduardo PromptGuardo

A Chrome extension that monitors and anonymizes email addresses in ChatGPT prompts to protect user privacy. The extension automatically detects email addresses in your prompts, replaces them with `[EMAIL ADDRESS]` placeholders before sending to ChatGPT, and provides a user interface to view detected emails and history.

## Features

- 🔍 **Automatic Email Detection**: Intercepts ChatGPT API requests and detects email addresses using regex
- 🔒 **Email Anonymization**: Replaces detected emails with `[EMAIL ADDRESS]` placeholder before sending to ChatGPT
- 📊 **Email History**: Tracks all detected emails with timestamps in browser storage
- 🔔 **Smart Notifications**: Automatically opens a modal when new email addresses are detected
- ⏰ **Dismiss System**: Dismiss emails for 24 hours to avoid repeated alerts
- 🎨 **Modern UI**: Built with React, TypeScript, and shadcn/ui components

## Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd eduardo-propmtguardo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` directory from the project root

5. **Test the extension**:
   - Navigate to [ChatGPT](https://chatgpt.com) or [chat.openai.com](https://chat.openai.com)
   - Type a message containing an email address (e.g., "Send an email to john@example.com")
   - The extension will automatically detect and anonymize the email
   - A modal will appear showing the detected email

### Production Build

1. **Build the extension**:
   ```bash
   npm run build
   ```

2. **Load from `dist` directory**:
   - Follow steps 4-5 from Development Setup above
   - The `dist` directory contains the production build

3. **Create ZIP for distribution**:
   - The build process automatically creates a ZIP file in the `release/` directory
   - File name format: `crx-Eduardo-PromptGuardo-<version>.zip`

## Architecture

### Overview

The extension uses a multi-layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Page Context                         │
│  (ChatGPT website - where fetch() is intercepted)      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  inject.js (FetchInterceptor)                    │  │
│  │  - Intercepts window.fetch()                      │  │
│  │  - Sends requests to content script               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │ window.postMessage
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Content Script                         │
│  (Isolated world - React UI + message routing)         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AppBootstrap                                     │  │
│  │  - Injects page script                            │  │
│  │  - Routes messages between page ↔ background      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React UI (App.tsx)                              │  │
│  │  - EmailModal, IssuesTab, HistoryTab             │  │
│  │  - EmailContext (state management)               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │ chrome.runtime.sendMessage
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Background Service Worker                  │
│  (Extension context - email detection & storage)      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  EmailDetectionService                           │  │
│  │  - Analyzes prompts for emails                   │  │
│  │  - Anonymizes text                                │  │
│  │  - Saves to EmailHistoryRepository                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. **Page Context (`src/inject/`)**
- **FetchInterceptor**: Intercepts `window.fetch()` calls to ChatGPT API
- Runs in page context (not isolated world) to access the real `fetch`
- Communicates with content script via `window.postMessage`

#### 2. **Content Script (`src/content/`)**
- **AppBootstrap**: Initializes the extension, injects page script, handles message routing
- **React UI**: Modal interface showing detected emails and history
- **EmailContext**: React Context API for state management
- **Hooks**: Custom hooks for email detection, history, and dismissal

#### 3. **Background Service Worker (`src/background/`)**
- **EmailDetectionService**: Core business logic for email detection and anonymization
- **EmailHistoryRepository**: Persists email history to `chrome.storage.local`
- Handles `ANALYZE_PROMPT` messages from content script

#### 4. **Shared (`src/shared/`)**
- **Types**: TypeScript type definitions for messages and entities
- **Helpers**: ChatGPT body parsing and processing utilities
- **Repositories**: Data access layer
- **Utils**: Utility functions (email dismissal logic, etc.)

### Data Flow

1. **User types message in ChatGPT** containing an email address
2. **FetchInterceptor** (page context) intercepts the `fetch()` call
3. **Request sent to content script** via `window.postMessage(CHATGPT_REQUEST)`
4. **Content script forwards to service worker** via `chrome.runtime.sendMessage(ANALYZE_PROMPT)`
5. **Service worker**:
   - Detects emails using regex
   - Anonymizes text (replaces emails with `[EMAIL ADDRESS]`)
   - Saves emails to storage
   - Returns anonymized body + detected emails
6. **Content script**:
   - Sends anonymized body back to page context
   - Dispatches `EMAIL_DETECTED` event for UI
7. **Page context** receives anonymized body and makes the actual API call
8. **UI** shows modal with detected emails

## Project Structure

```
src/
├── background/          # Service worker (background script)
│   ├── index.ts        # Message listener and routing
│   ├── services/       # Business logic
│   │   └── EmailDetectionService.ts
│   └── utils/         # Utility functions
│       └── anonymization.ts
│
├── content/            # Content script (React UI)
│   ├── main.tsx       # Entry point
│   ├── views/         # React components
│   │   └── App.tsx    # Main app component
│   ├── components/    # UI components
│   │   ├── EmailModal.tsx
│   │   ├── IssuesTab.tsx
│   │   ├── HistoryTab.tsx
│   │   └── ...
│   ├── context/       # React Context
│   │   └── EmailContext.tsx
│   ├── hooks/         # Custom React hooks
│   │   ├── useEmailDetection.ts
│   │   ├── useEmailHistory.ts
│   │   └── ...
│   └── services/      # Content script services
│       └── AppBootstrap.ts
│
├── inject/            # Page context script
│   ├── index.ts       # Entry point
│   └── services/
│       └── FetchInterceptor.ts
│
├── shared/            # Shared code
│   ├── types/         # TypeScript types
│   ├── helpers/       # Utility functions
│   ├── repositories/  # Data access layer
│   └── utils/         # Shared utilities
│
├── popup/             # Extension popup (optional)
└── sidepanel/         # Side panel (optional)
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically

### Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CRXJS** - Chrome extension development plugin
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling

### Code Style

- TypeScript strict mode enabled
- ESLint with React hooks rules
- Prettier for code formatting (if configured)

## Testing

The extension includes unit tests using Vitest. Run tests with:

```bash
npm test
```

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Chromium-based)
- ⚠️ Firefox (not tested, may require manifest adjustments)
- ❌ Safari (not supported)

## Privacy & Security

- All email detection happens locally in your browser
- No data is sent to external servers
- Email history is stored in `chrome.storage.local` (local only)
- The extension only runs on `chatgpt.com` and `chat.openai.com` domains

## Troubleshooting

### Extension not working

1. **Check console errors**:
   - Open DevTools (F12) on ChatGPT page
   - Check for errors in Console tab
   - Check Service Worker status in `chrome://extensions/`

2. **Verify permissions**:
   - Ensure extension has access to `chatgpt.com` or `chat.openai.com`
   - Check `chrome://extensions/` → Extension details → Site access

3. **Reload extension**:
   - Go to `chrome://extensions/`
   - Click reload button on the extension card

### Modal not appearing

- Check that emails are being detected (check browser console logs)
- Verify `EMAIL_DETECTED` events are being dispatched
- Check React DevTools to see if component is rendering

### Emails not being anonymized

- Verify `inject.js` is loaded (check Network tab in DevTools)
- Check that `FetchInterceptor` is installed (console log: `[FetchInterceptor] Installed`)
- Verify the request URL matches the pattern `/conversation`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license here]

## Acknowledgments

- Built with [CRXJS](https://crxjs.dev/) for Chrome extension development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
