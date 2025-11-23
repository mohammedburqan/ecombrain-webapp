# EcomBrain Agentic Webapp

A full-stack Next.js webapp for EcomBrain - a hybrid agentic system combining autonomous agents and multi-agent collaboration, supervised by Gemini 2.5 Pro and GPT, with comprehensive Shopify store creation/deployment capabilities.

## Features

- **Multi-Agent System**: Autonomous agents for market intelligence, copywriting, video generation, niche selection, color scheme generation, product management, and Shopify store creation
- **AI Integration**: Gemini 2.5 Pro and OpenAI GPT integration with intelligent routing and fallback
- **Shopify Integration**: Complete Shopify store creation workflow including niche selection, color schemes, product import, and deployment
- **Real-time Dashboard**: Comprehensive admin dashboard with real-time updates via Supabase Realtime
- **Store Creation Wizard**: Step-by-step wizard for creating fully configured Shopify stores
- **Analytics & Monitoring**: Track agent performance, store creation success rates, and ROI metrics

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) with React Server Components
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Gemini 2.5 Pro + OpenAI GPT
- **E-commerce**: Shopify API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Google Gemini API key
- Shopify Partner account (optional for development)

### Installation

1. Clone the repository:
```bash
cd ecombrain-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Provider Configuration
GEMINI_API_KEY=your_gemini_api_key
BYTEZ_API_KEY=your_bytez_api_key  # Optional: defaults to provided key if not set

# Shopify Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_PARTNER_API_KEY=your_shopify_partner_api_key
SHOPIFY_PARTNER_API_SECRET=your_shopify_partner_api_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Secret (for scheduled tasks)
CRON_SECRET=your_random_secret_string
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - Enable Row Level Security (RLS) policies as defined in the migration

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
ecombrain-webapp/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Core libraries
│   ├── agents/           # Agent implementations
│   ├── ai/               # AI provider integrations
│   ├── shopify/         # Shopify API integration
│   ├── supabase/        # Supabase client setup
│   └── workflows/       # Workflow orchestrators
├── supabase/             # Database migrations
├── types/                # TypeScript type definitions
└── public/              # Static assets
```

## Key Components

### Agents

- **MarketIntelligenceAgent**: Analyzes market trends and competitor data
- **CopywritingAgent**: Generates marketing copy and product descriptions
- **VideoGenerationAgent**: Creates video content (placeholder for integration)
- **MarketGapAgent**: Identifies market opportunities and gaps
- **NicheSelectionAgent**: Recommends e-commerce niches using AI
- **ColorSchemeAgent**: Generates color palettes based on niche/brand
- **ProductManagementAgent**: Manages products and collections
- **ShopifyStoreCreationAgent**: Creates Shopify store structures
- **ShopifyDeploymentAgent**: Deploys stores with products and themes

### Workflows

- **Store Creation Workflow**: Orchestrates the complete store creation process:
  1. Niche selection (AI-powered)
  2. Color scheme generation
  3. Product discovery/import
  4. Store creation
  5. Deployment

### API Routes

- `/api/agents` - Agent management
- `/api/tasks` - Task tracking
- `/api/shopify/*` - Shopify integration endpoints
- `/api/store-creation/*` - Store creation workflow
- `/api/analytics/*` - Analytics and metrics
- `/api/collaboration` - Multi-agent collaboration

## Usage

### Creating a Store

1. Navigate to Dashboard → Shopify Stores → Create New Store
2. Step 1: Enter niche description and get AI recommendations
3. Step 2: Select a niche and generate color schemes
4. Step 3: Configure store name and settings
5. The system will automatically create and deploy your store

### Managing Agents

1. Navigate to Dashboard → Agents (Admin only)
2. View agent status and metrics
3. Create, update, or delete agents
4. Monitor agent performance

### Viewing Analytics

1. Navigate to Dashboard → Analytics
2. View store creation success rates
3. Monitor task completion rates
4. Track ROI metrics

## Database Schema

The application uses the following main tables:
- `users` - User profiles and roles
- `agents` - Agent configurations
- `agent_tasks` - Task execution records
- `agent_logs` - Agent activity logs
- `agent_metrics` - Performance metrics
- `shopify_stores` - Shopify store records
- `store_creation_jobs` - Store creation workflow tracking
- `niche_recommendations` - AI-generated niche suggestions

## Scheduled Tasks

Set up a cron job to call `/api/cron` with the `CRON_SECRET` header for:
- Hourly competitor monitoring
- Real-time market trend tracking
- Automated image generation tasks
- Store health checks

Example cron setup (Vercel):
```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 * * * *"
  }]
}
```

## Development

### Running Tests
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

## Security Notes

- All API routes are protected with authentication
- Admin routes require admin role
- Row Level Security (RLS) policies enforce data access control
- Shopify access tokens should be encrypted in production
- Use environment variables for all secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open an issue on GitHub.
