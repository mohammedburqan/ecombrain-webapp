# EcomShark Webapp - Drizzle ORM Setup

This project uses **Drizzle ORM** with **Supabase PostgreSQL** for database management.

## Quick Start

### 1. Set up Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:rvQGAMjkJ870rlJ5@db.vwfrzzynuolmsfdbxphe.supabase.co:5432/postgres
```

### 2. Generate and Push Schema

```bash
# Generate migration files
npm run db:generate

# Push schema to database (recommended for development)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 3. Open Drizzle Studio (Optional)

```bash
npm run db:studio
```

This opens a visual database browser at http://localhost:4983

## Database Schema

### Current Tables

#### `projects`
- `id` (uuid, primary key)
- `name` (text)
- `description` (text)
- `status` (text, default: 'active')
- `user_id` (uuid, nullable)
- `metadata` (jsonb, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `experiments`
- `id` (uuid, primary key)
- `project_id` (uuid, foreign key → projects.id)
- `name` (text)
- `description` (text)
- `status` (text, default: 'draft')
- `variant` (text, nullable)
- `results` (jsonb, nullable)
- `config` (jsonb, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Relationships

- **Projects** → **Experiments** (one-to-many)
  - A project can have multiple experiments
  - Deleting a project cascades to delete its experiments

## Drizzle Commands

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:push` - Push schema changes directly to database (dev)
- `npm run db:migrate` - Run migrations (production)
- `npm run db:studio` - Open Drizzle Studio (visual DB browser)

## Usage Example

```typescript
import { db } from '@/db';
import { projects, experiments } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Create a project
const newProject = await db.insert(projects).values({
  name: 'My E-commerce Project',
  description: 'Testing new checkout flow',
}).returning();

// Create an experiment for the project
const newExperiment = await db.insert(experiments).values({
  projectId: newProject[0].id,
  name: 'Checkout Button Color',
  description: 'Testing red vs blue checkout buttons',
  variant: 'A',
  status: 'running',
}).returning();

// Query with relations
const projectWithExperiments = await db.query.projects.findFirst({
  where: eq(projects.id, newProject[0].id),
  with: {
    experiments: true,
  },
});
```

## Schema Evolution

The schema starts minimal and expands intelligently:

1. ✅ **Initial**: `projects` and `experiments` with name/description
2. ✅ **Expanded**: Added status, relationships, JSON fields for flexibility
3. 🔄 **Future**: Can add users, analytics, A/B test results, etc.

## Best Practices

1. **Always generate migrations** before pushing to production
2. **Use `db:push` for development** - faster iteration
3. **Use `db:migrate` for production** - version-controlled migrations
4. **Review generated SQL** in `drizzle/` folder before applying
5. **Use TypeScript types** exported from schema for type safety

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is set correctly in `.env.local`
- Check Supabase project is active
- Ensure network allows connections to Supabase

### Migration Issues
- Check `drizzle.config.ts` paths are correct
- Verify schema file exports are correct
- Review generated SQL in `drizzle/` folder

### Type Issues
- Run `npm run db:generate` after schema changes
- Restart TypeScript server in your IDE
- Check that schema exports are correct

