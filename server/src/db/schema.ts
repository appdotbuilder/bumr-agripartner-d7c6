
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  pgEnum,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'partner', 'farmer', 'management']);
export const partnershipStatusEnum = pgEnum('partnership_status', ['active', 'completed', 'cancelled', 'pending']);
export const activityTypeEnum = pgEnum('activity_type', ['planting', 'fertilizing', 'watering', 'pest_control', 'harvesting', 'other']);
export const expenseTypeEnum = pgEnum('expense_type', ['equipment', 'labor', 'land_rental', 'seeds', 'fertilizer', 'insurance', 'other']);
export const riskTypeEnum = pgEnum('risk_type', ['weather', 'pest', 'disease', 'flood', 'drought', 'other']);
export const eventTypeEnum = pgEnum('event_type', ['farm_visit', 'workshop', 'meeting', 'harvest_celebration', 'other']);
export const notificationTypeEnum = pgEnum('notification_type', ['payment', 'progress_update', 'risk_alert', 'event', 'general']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  is_verified: boolean('is_verified').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Partnerships table
export const partnershipsTable = pgTable('partnerships', {
  id: serial('id').primaryKey(),
  partner_id: integer('partner_id').references(() => usersTable.id).notNull(),
  investment_amount: numeric('investment_amount', { precision: 15, scale: 2 }).notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  estimated_return: numeric('estimated_return', { precision: 15, scale: 2 }).notNull(),
  current_progress: numeric('current_progress', { precision: 5, scale: 2 }).default('0').notNull(),
  current_phase: text('current_phase').default('planning').notNull(),
  status: partnershipStatusEnum('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Farm plots table
export const farmPlotsTable = pgTable('farm_plots', {
  id: serial('id').primaryKey(),
  partnership_id: integer('partnership_id').references(() => partnershipsTable.id).notNull(),
  plot_name: text('plot_name').notNull(),
  location_coordinates: text('location_coordinates').notNull(), // JSON string for lat/lng
  area_hectares: numeric('area_hectares', { precision: 10, scale: 4 }).notNull(),
  soil_type: text('soil_type'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Farm activities table
export const farmActivitiesTable = pgTable('farm_activities', {
  id: serial('id').primaryKey(),
  farm_plot_id: integer('farm_plot_id').references(() => farmPlotsTable.id).notNull(),
  activity_type: activityTypeEnum('activity_type').notNull(),
  description: text('description').notNull(),
  activity_date: timestamp('activity_date').notNull(),
  photos: jsonb('photos'), // JSON array of photo URLs
  videos: jsonb('videos'), // JSON array of video URLs
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Financial records table
export const financialRecordsTable = pgTable('financial_records', {
  id: serial('id').primaryKey(),
  partnership_id: integer('partnership_id').references(() => partnershipsTable.id).notNull(),
  expense_type: expenseTypeEnum('expense_type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description').notNull(),
  transaction_date: timestamp('transaction_date').notNull(),
  receipt_url: text('receipt_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Insurance policies table
export const insurancePoliciesTable = pgTable('insurance_policies', {
  id: serial('id').primaryKey(),
  partnership_id: integer('partnership_id').references(() => partnershipsTable.id).notNull(),
  policy_number: text('policy_number').notNull().unique(),
  coverage_amount: numeric('coverage_amount', { precision: 15, scale: 2 }).notNull(),
  premium_amount: numeric('premium_amount', { precision: 15, scale: 2 }).notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  coverage_details: text('coverage_details').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Risk alerts table
export const riskAlertsTable = pgTable('risk_alerts', {
  id: serial('id').primaryKey(),
  farm_plot_id: integer('farm_plot_id').references(() => farmPlotsTable.id).notNull(),
  risk_type: riskTypeEnum('risk_type').notNull(),
  severity_level: integer('severity_level').notNull(), // 1-5 scale
  title: text('title').notNull(),
  description: text('description').notNull(),
  alert_date: timestamp('alert_date').notNull(),
  is_resolved: boolean('is_resolved').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Community events table
export const communityEventsTable = pgTable('community_events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  event_type: eventTypeEnum('event_type').notNull(),
  event_date: timestamp('event_date').notNull(),
  location: text('location').notNull(),
  fee: numeric('fee', { precision: 10, scale: 2 }).default('0').notNull(),
  max_participants: integer('max_participants'),
  current_participants: integer('current_participants').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notificationsTable = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  notification_type: notificationTypeEnum('notification_type').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Chat messages table
export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sender_id: integer('sender_id').references(() => usersTable.id).notNull(),
  receiver_id: integer('receiver_id').references(() => usersTable.id).notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  partnerships: many(partnershipsTable),
  activities: many(farmActivitiesTable),
  notifications: many(notificationsTable),
  sentMessages: many(chatMessagesTable, { relationName: 'sender' }),
  receivedMessages: many(chatMessagesTable, { relationName: 'receiver' }),
  createdEvents: many(communityEventsTable),
}));

export const partnershipsRelations = relations(partnershipsTable, ({ one, many }) => ({
  partner: one(usersTable, {
    fields: [partnershipsTable.partner_id],
    references: [usersTable.id],
  }),
  farmPlots: many(farmPlotsTable),
  financialRecords: many(financialRecordsTable),
  insurancePolicies: many(insurancePoliciesTable),
}));

export const farmPlotsRelations = relations(farmPlotsTable, ({ one, many }) => ({
  partnership: one(partnershipsTable, {
    fields: [farmPlotsTable.partnership_id],
    references: [partnershipsTable.id],
  }),
  activities: many(farmActivitiesTable),
  riskAlerts: many(riskAlertsTable),
}));

export const farmActivitiesRelations = relations(farmActivitiesTable, ({ one }) => ({
  farmPlot: one(farmPlotsTable, {
    fields: [farmActivitiesTable.farm_plot_id],
    references: [farmPlotsTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [farmActivitiesTable.created_by],
    references: [usersTable.id],
  }),
}));

export const financialRecordsRelations = relations(financialRecordsTable, ({ one }) => ({
  partnership: one(partnershipsTable, {
    fields: [financialRecordsTable.partnership_id],
    references: [partnershipsTable.id],
  }),
}));

export const insurancePoliciesRelations = relations(insurancePoliciesTable, ({ one }) => ({
  partnership: one(partnershipsTable, {
    fields: [insurancePoliciesTable.partnership_id],
    references: [partnershipsTable.id],
  }),
}));

export const riskAlertsRelations = relations(riskAlertsTable, ({ one }) => ({
  farmPlot: one(farmPlotsTable, {
    fields: [riskAlertsTable.farm_plot_id],
    references: [farmPlotsTable.id],
  }),
}));

export const communityEventsRelations = relations(communityEventsTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [communityEventsTable.created_by],
    references: [usersTable.id],
  }),
}));

export const notificationsRelations = relations(notificationsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [notificationsTable.user_id],
    references: [usersTable.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  sender: one(usersTable, {
    fields: [chatMessagesTable.sender_id],
    references: [usersTable.id],
    relationName: 'sender',
  }),
  receiver: one(usersTable, {
    fields: [chatMessagesTable.receiver_id],
    references: [usersTable.id],
    relationName: 'receiver',
  }),
}));

// Export all tables for enabling relation queries
export const tables = {
  users: usersTable,
  partnerships: partnershipsTable,
  farmPlots: farmPlotsTable,
  farmActivities: farmActivitiesTable,
  financialRecords: financialRecordsTable,
  insurancePolicies: insurancePoliciesTable,
  riskAlerts: riskAlertsTable,
  communityEvents: communityEventsTable,
  notifications: notificationsTable,
  chatMessages: chatMessagesTable,
};
