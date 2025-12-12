# Axiom

An open-source AI-powered answer engine built with Next.js, featuring intelligent search, multi-model support, and expert research mode.

---
<img width="1465" height="748" alt="image" src="https://github.com/user-attachments/assets/24d4d553-ca73-4be9-8055-c636671686ba" />
<img width="1452" height="744" alt="image" src="https://github.com/user-attachments/assets/b8da6ab1-ce05-4338-92b5-922e53f5ed8b" />


## Features

### Core Capabilities

- **AI-Powered Search**: Intelligent search across the web with source citations
- **Multi-Model Support**: Choose between Fast, Powerful, and Hyper AI models
- **Expert Mode**: Advanced research mode with step-by-step planning for complex queries
- **Focus Modes**: Specialized search modes (Web, Academic, Video, Social, Writing)
- **Real-time Streaming**: Live response streaming for instant feedback
- **Image Search**: Visual search results integrated into responses

### User Experience

- **User Authentication**: Email/password registration and login with NextAuth
- **Chat History**: Persistent conversation history for authenticated users
- **Discover Page**: Trending topics and curated news across categories
- **Library**: Save and organize your favorite searches
- **Dark/Light Theme**: Toggle between themes with system preference support
- **Responsive Design**: Full mobile and desktop support with collapsible sidebar

### Technical Features

- **Source Citations**: All answers include numbered citations linking to sources
- **Related Questions**: AI-generated follow-up questions for deeper exploration
- **Markdown Rendering**: Rich text responses with code syntax highlighting
- **Skeleton Loading**: Smooth shimmer animations during content loading
- **Accessibility**: Keyboard navigation, focus indicators, reduced motion support

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Database | PostgreSQL (via Prisma) |
| Authentication | NextAuth.js |
| State Management | Zustand |
| Data Fetching | TanStack Query |
| Animations | Framer Motion |
| Fonts | Geist Sans, JetBrains Mono |

---

## Prerequisites

- Node.js 18+
- PostgreSQL database
- API keys for LLM provider (OpenAI-compatible)
- (Optional) Search API key (Serper, Tavily, or similar)

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/axiom"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# LLM Provider
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY="your-llm-api-key"

# Search Provider (optional)
SEARCH_PROVIDER="serper"
SEARCH_API_KEY="your-search-api-key"

# Client-side settings
NEXT_PUBLIC_API_URL=""
NEXT_PUBLIC_PRO_MODE_ENABLED=true
NEXT_PUBLIC_LOCAL_MODE_ENABLED=true
```

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/axiom.git
cd axiom/web
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:

```bash
npm run dev
```

5. Open <http://localhost:3000> in your browser.

---

## Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── chat/           # Chat streaming endpoint
│   │   │   ├── history/        # Chat history endpoint
│   │   │   └── thread/         # Thread management
│   │   ├── discover/           # Discover page
│   │   ├── library/            # Library page
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   └── search/             # Search results page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ...                 # Feature components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and configs
│   │   ├── agent/              # AI agent logic (prompts, planning)
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── llm.ts              # LLM client configuration
│   │   └── search.ts           # Search provider integrations
│   ├── stores/                 # Zustand state stores
│   └── providers/              # React context providers
├── prisma/
│   └── schema.prisma           # Database schema
└── generated/                  # OpenAPI generated types
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema to database |
| `npx prisma studio` | Open Prisma database GUI |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Stream chat responses |
| `/api/history` | GET | Get user chat history |
| `/api/thread/[id]` | GET/DELETE | Get or delete a thread |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/discover` | GET | Get trending topics |

---

## Configuration

### AI Models

Configure available models in `src/lib/llm.ts`:

```typescript
export const MODELS: Record<string, string> = {
  fast: "gpt-3.5-turbo",
  powerful: "gpt-4",
  hyper: "gpt-4-turbo",
};
```

### Search Providers

Supported search providers (configure via `SEARCH_PROVIDER` env var):

- `serper` - Serper.dev API
- `tavily` - Tavily Search API
- `duckduckgo` - DuckDuckGo (no API key required)
- `google` - Google Custom Search

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t axiom .
docker run -p 3000:3000 --env-file .env axiom
```

### Self-Hosted

```bash
npm run build
npm run start
```

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

---

## License

MIT License - see LICENSE file for details.
