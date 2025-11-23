import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Projects table - expanded intelligently
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'), // active, archived, deleted
  userId: uuid('user_id'), // For future user association
  metadata: jsonb('metadata'), // Flexible JSON for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Experiments table - expanded intelligently
export const experiments = pgTable('experiments', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('draft'), // draft, running, completed, failed
  variant: text('variant'), // A/B test variant, experiment type, etc.
  results: jsonb('results'), // Store experiment results/metrics
  config: jsonb('config'), // Experiment configuration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  experiments: many(experiments),
}));

export const experimentsRelations = relations(experiments, ({ one }) => ({
  project: one(projects, {
    fields: [experiments.projectId],
    references: [projects.id],
  }),
}));

// Export types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Experiment = typeof experiments.$inferSelect;
export type NewExperiment = typeof experiments.$inferInsert;

