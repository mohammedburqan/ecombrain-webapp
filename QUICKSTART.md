# EcomShark Webapp - Quick Start Guide

## ✅ What's Been Set Up

1. **Drizzle ORM** configured with Supabase PostgreSQL
2. **Initial Schema** with `projects` and `experiments` tables
3. **Relationships** between projects and experiments
4. **API Routes** for CRUD operations
5. **Migration System** ready to use

## 🚀 Next Steps

### 1. Push Schema to Database

```bash
npm run db:push
```

This will create the tables in your Supabase database.

### 2. Verify in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/vwfrzzynuolmsfdbxphe/editor
2. Check that `projects` and `experiments` tables exist
3. Verify the foreign key relationship

### 3. Test the API

```bash
# Start dev server
npm run dev

# Create a project (in another terminal)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"My first project"}'

# Create an experiment
curl -X POST http://localhost:3000/api/experiments \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<project-id>","name":"Test Experiment","description":"My first experiment"}'

# Get all projects with experiments
curl http://localhost:3000/api/projects/<project-id>
```

## 📊 Schema Overview

### Projects Table
- Basic fields: `id`, `name`, `description`
- Status tracking: `status` (active/archived/deleted)
- Flexible data: `metadata` (JSONB)
- User association: `user_id` (ready for auth)

### Experiments Table
- Basic fields: `id`, `name`, `description`
- Project relationship: `project_id` → projects.id
- Status tracking: `status` (draft/running/completed/failed)
- A/B testing: `variant` field
- Results storage: `results` (JSONB)
- Configuration: `config` (JSONB)

## 🔧 Available Commands

- `npm run db:generate` - Generate migration files
- `npm run db:push` - Push schema to database (dev)
- `npm run db:migrate` - Run migrations (production)
- `npm run db:studio` - Open Drizzle Studio

## 📝 Example Usage

```typescript
import { db } from '@/db';
import { projects, experiments } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Create project
const project = await db.insert(projects).values({
  name: 'E-commerce Optimization',
  description: 'Improving conversion rates',
}).returning();

// Create experiment
const experiment = await db.insert(experiments).values({
  projectId: project[0].id,
  name: 'Checkout Button Test',
  description: 'Testing button colors',
  variant: 'A',
  status: 'running',
}).returning();

// Query with relations
const projectWithExps = await db.query.projects.findFirst({
  where: eq(projects.id, project[0].id),
  with: { experiments: true },
});
```

## 🎯 What's Next?

The schema is ready for expansion. You can now:
- Add user authentication
- Add analytics tables
- Add A/B test results tracking
- Add experiment metrics
- Add project templates

All changes can be made in `db/schema.ts` and pushed with `npm run db:push`!

