# Chrome Extension

The LinkedIn Outreach Exporter is a Chrome extension that scrapes your LinkedIn connections page and imports contacts directly into the platform.

## Installation

### From Source (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from the project root
5. The extension icon will appear in your Chrome toolbar

### Configuration

1. Click the extension icon in your toolbar to open the popup
2. Enter your **App URL**:
   - Local development: `http://localhost:3000`
   - Production: `https://your-app.vercel.app` (no trailing slash)
3. Enter your **API Key**:
   - Find it in the app at **Settings > API Key**
   - Format: `key_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Click **Save**

Settings are stored in `chrome.storage.local` and persist across browser sessions.

## Usage

### Scraping Connections

1. Navigate to your LinkedIn connections page: `https://www.linkedin.com/mynetwork/invite-connect/connections/`
2. **Scroll down** to load the connections you want to import (LinkedIn uses infinite scroll)
3. Click the extension icon
4. Choose an action:

   **Scrape to App** — Sends all visible connections to your outreach platform. You'll see a success message with the count of imported contacts.

   **Download as CSV** — Downloads connections as a CSV file to your computer. Useful as a backup or for manual review before importing.

### What Gets Scraped

For each connection on the page, the extension extracts:

| Field | Source | Example |
|-------|--------|---------|
| Name | Connection card heading | "Jane Smith" |
| Title | Subtitle text below name | "VP of Marketing at Acme Corp" |
| LinkedIn URL | Profile link | `https://www.linkedin.com/in/janesmith` |
| Connected date | "Connected" timestamp | "Connected 2 weeks ago" |

The platform then automatically:
- Splits full names into first name / last name
- Extracts company name from title (parses "at" and "|" patterns)
- Sets status to `new`
- Records the import timestamp

### Content Script Badge

When you're on the LinkedIn connections page, the extension injects a small floating badge in the bottom-right corner of the page as a visual indicator that the extension is active and ready to scrape.

## Technical Details

### Manifest

The extension uses **Manifest V3** with these permissions:

```json
{
  "manifest_version": 3,
  "permissions": ["activeTab", "scripting", "storage"],
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/mynetwork/invite-connect/connections/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab to inject the scraping script |
| `scripting` | Execute scripts in the LinkedIn page context |
| `storage` | Persist app URL and API key settings |

### File Structure

```
extension/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI (settings form + action buttons)
├── popup.js            # Popup logic (settings, scraping, API calls)
├── content.js          # Content script (floating badge on LinkedIn)
├── icon16.png          # Toolbar icon (16x16)
├── icon48.png          # Extensions page icon (48x48)
└── icon128.png         # Chrome Web Store icon (128x128)
```

### How Scraping Works

1. User clicks "Scrape to App" in the popup
2. `popup.js` calls `chrome.scripting.executeScript()` to inject a function into the active tab
3. The injected function runs in the LinkedIn page context and queries the DOM for connection cards
4. It extracts name, title, URL, and connected date from each card
5. The data is returned to the popup via the script result
6. `popup.js` sends the connections to `POST /api/import-connections` with the API key as a Bearer token

### API Communication

```
Extension Popup
      │
      │  POST /api/import-connections
      │  Headers:
      │    Content-Type: application/json
      │    Authorization: Bearer key_xxx...
      │  Body:
      │    { "connections": [...] }
      │
      ▼
  App Server
      │
      │  1. Validate API key → resolve userId
      │  2. Parse names and titles
      │  3. Bulk insert into prospects table
      │
      ▼
  Response: { "added": 15, "message": "Imported 15 connections." }
```

CORS headers are set on the endpoint to allow cross-origin requests from the Chrome extension.

## Development

### Making Changes

1. Edit files in the `extension/` directory
2. Go to `chrome://extensions/`
3. Click the **reload** icon on the extension card
4. Test your changes

### Testing Locally

1. Start the dev server: `npm run dev`
2. Set the extension's App URL to `http://localhost:3000`
3. Navigate to your LinkedIn connections page
4. Click "Scrape to App" — connections will appear in your local app

### Debugging

- **Popup**: Right-click the extension icon > "Inspect popup" to open DevTools for the popup
- **Content script**: Open DevTools on the LinkedIn page (F12) and check the Console for `content.js` messages
- **Network**: Use the popup's DevTools Network tab to inspect the API request to `/api/import-connections`
- **Storage**: In the popup DevTools console, run `chrome.storage.local.get(null, console.log)` to see stored settings

### Common Issues

**"Failed to connect" error**: Verify the app URL is correct and the server is running. Ensure there's no trailing slash.

**"Unauthorized" error**: Check that the API key matches the one shown in your app's Settings page. Try regenerating it.

**No connections found**: Make sure you've scrolled down on the LinkedIn connections page to load connections. The extension only sees what's currently rendered in the DOM.

**Extension not appearing on LinkedIn**: The content script only activates on `linkedin.com/mynetwork/invite-connect/connections/` pages. Navigate to that specific URL.
