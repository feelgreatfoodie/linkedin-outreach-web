# Setup & Deployment Guide

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** 9+ (or pnpm/yarn/bun)
- **PostgreSQL** database (Supabase recommended)
- **Google Cloud Console** account (for OAuth)
- **AI API key** — Google Gemini or Anthropic Claude (optional for demo mode)

## Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd linkedin-outreach-web
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
# ── Database ──
DATABASE_URL=postgresql://user:password@host:5432/dbname

# ── Auth ──
AUTH_SECRET=your-secret-here
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# ── AI Provider (optional — runs demo mode without) ──
AI_PROVIDER=gemini
MODEL=gemini-2.0-flash
GOOGLE_API_KEY=your-google-ai-key

# Or for Anthropic:
# AI_PROVIDER=anthropic
# MODEL=claude-sonnet-4-5-20250929
# ANTHROPIC_API_KEY=your-anthropic-key
```

### 3. Set Up the Database

#### Option A: Supabase (Recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings > Database** and copy the connection string
3. Set `DATABASE_URL` in `.env.local` with the connection string
4. Push the schema:

```bash
npx drizzle-kit push
```

#### Option B: Local PostgreSQL

```bash
# Create a database
createdb linkedin_outreach

# Set the connection string
# DATABASE_URL=postgresql://localhost:5432/linkedin_outreach

# Push the schema
npx drizzle-kit push
```

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret** into `.env.local`

### 5. Generate Auth Secret

```bash
npx auth secret
```

Copy the generated value into `AUTH_SECRET` in `.env.local`.

### 6. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the login page.

---

## AI Provider Setup

The platform supports two AI providers. You only need one.

### Google Gemini (Default)

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click **Get API Key**
3. Create a new key or use an existing one
4. Set in `.env.local`:

```env
AI_PROVIDER=gemini
MODEL=gemini-2.0-flash
GOOGLE_API_KEY=your-key
```

**Available models**: `gemini-2.0-flash` (fastest, recommended), `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-pro`

### Anthropic Claude

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Navigate to **API Keys** and create a new key
3. Set in `.env.local`:

```env
AI_PROVIDER=anthropic
MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_API_KEY=your-key
```

**Available models**: `claude-sonnet-4-5-20250929` (recommended), `claude-opus-4-20250514`, `claude-haiku-3-5-20241022`

### Demo Mode (No API Key)

If no AI API key is configured, the platform automatically runs in **demo mode**. Pre-written sample sequences are matched to prospects by industry and title pattern, with prospect variables filled in. This allows full product evaluation without any API cost.

---

## Database Management

### Drizzle Kit Commands

```bash
# Push schema changes directly to the database (dev)
npx drizzle-kit push

# Generate SQL migration files
npx drizzle-kit generate

# Apply pending migrations
npx drizzle-kit migrate

# Open Drizzle Studio (visual database browser)
npx drizzle-kit studio
```

### Schema Changes

1. Edit `src/lib/db/schema.ts`
2. Run `npx drizzle-kit push` (development) or `npx drizzle-kit generate` + `npx drizzle-kit migrate` (production)

### Tables Created

| Table | Purpose |
|-------|---------|
| `users` | User accounts (Auth.js + API key) |
| `accounts` | OAuth provider accounts (Auth.js) |
| `sessions` | Active sessions (Auth.js) |
| `verificationTokens` | Email verification (Auth.js) |
| `prospects` | Imported LinkedIn contacts |
| `sequences` | Generated outreach sequences |

---

## Deployment to Vercel

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and import your Git repository
2. Vercel will auto-detect the Next.js framework

### 2. Set Environment Variables

In the Vercel project settings, add all the environment variables from `.env.local`:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase connection string (use the "pooled" connection for Vercel) |
| `AUTH_SECRET` | Yes | Same value as local |
| `AUTH_GOOGLE_ID` | Yes | Same OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Same OAuth client secret |
| `AI_PROVIDER` | No | Defaults to `gemini` |
| `MODEL` | No | Defaults to `gemini-2.0-flash` |
| `GOOGLE_API_KEY` | Conditional | Required if `AI_PROVIDER=gemini` |
| `ANTHROPIC_API_KEY` | Conditional | Required if `AI_PROVIDER=anthropic` |

### 3. Update Google OAuth Redirect

Add your Vercel production URL to the Google OAuth authorized redirect URIs:

```
https://your-app.vercel.app/api/auth/callback/google
```

### 4. Deploy

Push to your main branch or trigger a deployment from the Vercel dashboard. The build runs:

```bash
next build
```

### Vercel Configuration Notes

- **Function timeout**: The batch generation endpoint (`/api/generate-batch`) sets `maxDuration = 300` (5 minutes). This requires a Vercel Pro plan or higher. On the Hobby plan, the max is 60 seconds.
- **Database connection**: Use Supabase's **pooled connection string** (port 6543) for Vercel serverless functions to avoid connection exhaustion.
- **Region**: Deploy in the same region as your Supabase instance for lowest latency.

---

## Chrome Extension Setup

See [CHROME_EXTENSION.md](CHROME_EXTENSION.md) for complete Chrome extension installation and development instructions.

Quick summary:
1. Open `chrome://extensions/` and enable **Developer mode**
2. Click **Load unpacked** and select the `extension/` folder
3. Open the extension popup and configure your app URL + API key (found in Settings page)
4. Navigate to your LinkedIn connections page and click **Scrape to App**

---

## Troubleshooting

### "Unauthorized" errors
- Ensure `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are set correctly
- Verify Google OAuth redirect URIs include your current URL
- Check that the database is running and accessible

### "API key not configured" on generation
- Set either `GOOGLE_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`
- Ensure `AI_PROVIDER` matches the key you've set
- Check `/api/health` to verify provider configuration

### Database connection errors
- Verify `DATABASE_URL` is correct and the database is accessible
- For Supabase: ensure you're using the correct connection string (direct for local, pooled for Vercel)
- Run `npx drizzle-kit push` to ensure tables exist

### Chrome extension not connecting
- Verify the app URL in the extension popup doesn't have a trailing slash
- Ensure your API key is correct (copy from Settings page)
- Check the browser console for CORS errors
- The app must be running (locally or deployed) for the extension to connect
