
import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['admin', 'partner', 'farmer', 'management']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User authentication schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  phone: z.string().nullable(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  is_verified: z.boolean(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const registerUserInputSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  full_name: z.string(),
  role: userRoleSchema,
});
export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Partnership schemas
export const partnershipStatusSchema = z.enum(['active', 'completed', 'cancelled', 'pending']);
export type PartnershipStatus = z.infer<typeof partnershipStatusSchema>;

export const partnershipSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  investment_amount: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  estimated_return: z.number(),
  current_progress: z.number().min(0).max(100),
  current_phase: z.string(),
  status: partnershipStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Partnership = z.infer<typeof partnershipSchema>;

export const createPartnershipInputSchema = z.object({
  partner_id: z.number(),
  investment_amount: z.number().positive(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  estimated_return: z.number().positive(),
});
export type CreatePartnershipInput = z.infer<typeof createPartnershipInputSchema>;

// Farm plot schemas
export const farmPlotSchema = z.object({
  id: z.number(),
  partnership_id: z.number(),
  plot_name: z.string(),
  location_coordinates: z.string(), // JSON string for lat/lng
  area_hectares: z.number(),
  soil_type: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type FarmPlot = z.infer<typeof farmPlotSchema>;

export const createFarmPlotInputSchema = z.object({
  partnership_id: z.number(),
  plot_name: z.string(),
  location_coordinates: z.string(),
  area_hectares: z.number().positive(),
  soil_type: z.string().optional(),
});
export type CreateFarmPlotInput = z.infer<typeof createFarmPlotInputSchema>;

// Activity tracking schemas
export const activityTypeSchema = z.enum(['planting', 'fertilizing', 'watering', 'pest_control', 'harvesting', 'other']);
export type ActivityType = z.infer<typeof activityTypeSchema>;

export const farmActivitySchema = z.object({
  id: z.number(),
  farm_plot_id: z.number(),
  activity_type: activityTypeSchema,
  description: z.string(),
  activity_date: z.coerce.date(),
  photos: z.array(z.string()).nullable(), // JSON array of photo URLs
  videos: z.array(z.string()).nullable(), // JSON array of video URLs
  created_by: z.number(),
  created_at: z.coerce.date(),
});
export type FarmActivity = z.infer<typeof farmActivitySchema>;

export const createFarmActivityInputSchema = z.object({
  farm_plot_id: z.number(),
  activity_type: activityTypeSchema,
  description: z.string(),
  activity_date: z.coerce.date(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  created_by: z.number(),
});
export type CreateFarmActivityInput = z.infer<typeof createFarmActivityInputSchema>;

// Financial tracking schemas
export const expenseTypeSchema = z.enum(['equipment', 'labor', 'land_rental', 'seeds', 'fertilizer', 'insurance', 'other']);
export type ExpenseType = z.infer<typeof expenseTypeSchema>;

export const financialRecordSchema = z.object({
  id: z.number(),
  partnership_id: z.number(),
  expense_type: expenseTypeSchema,
  amount: z.number(),
  description: z.string(),
  transaction_date: z.coerce.date(),
  receipt_url: z.string().nullable(),
  created_at: z.coerce.date(),
});
export type FinancialRecord = z.infer<typeof financialRecordSchema>;

export const createFinancialRecordInputSchema = z.object({
  partnership_id: z.number(),
  expense_type: expenseTypeSchema,
  amount: z.number(),
  description: z.string(),
  transaction_date: z.coerce.date(),
  receipt_url: z.string().optional(),
});
export type CreateFinancialRecordInput = z.infer<typeof createFinancialRecordInputSchema>;

// Insurance schemas
export const insurancePolicySchema = z.object({
  id: z.number(),
  partnership_id: z.number(),
  policy_number: z.string(),
  coverage_amount: z.number(),
  premium_amount: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  coverage_details: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
});
export type InsurancePolicy = z.infer<typeof insurancePolicySchema>;

export const createInsurancePolicyInputSchema = z.object({
  partnership_id: z.number(),
  policy_number: z.string(),
  coverage_amount: z.number().positive(),
  premium_amount: z.number().positive(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  coverage_details: z.string(),
});
export type CreateInsurancePolicyInput = z.infer<typeof createInsurancePolicyInputSchema>;

// Risk alert schemas
export const riskTypeSchema = z.enum(['weather', 'pest', 'disease', 'flood', 'drought', 'other']);
export type RiskType = z.infer<typeof riskTypeSchema>;

export const riskAlertSchema = z.object({
  id: z.number(),
  farm_plot_id: z.number(),
  risk_type: riskTypeSchema,
  severity_level: z.number().min(1).max(5),
  title: z.string(),
  description: z.string(),
  alert_date: z.coerce.date(),
  is_resolved: z.boolean(),
  created_at: z.coerce.date(),
});
export type RiskAlert = z.infer<typeof riskAlertSchema>;

export const createRiskAlertInputSchema = z.object({
  farm_plot_id: z.number(),
  risk_type: riskTypeSchema,
  severity_level: z.number().min(1).max(5),
  title: z.string(),
  description: z.string(),
  alert_date: z.coerce.date(),
});
export type CreateRiskAlertInput = z.infer<typeof createRiskAlertInputSchema>;

// Community event schemas
export const eventTypeSchema = z.enum(['farm_visit', 'workshop', 'meeting', 'harvest_celebration', 'other']);
export type EventType = z.infer<typeof eventTypeSchema>;

export const communityEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  event_type: eventTypeSchema,
  event_date: z.coerce.date(),
  location: z.string(),
  fee: z.number(),
  max_participants: z.number().nullable(),
  current_participants: z.number(),
  is_active: z.boolean(),
  created_by: z.number(),
  created_at: z.coerce.date(),
});
export type CommunityEvent = z.infer<typeof communityEventSchema>;

export const createCommunityEventInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  event_type: eventTypeSchema,
  event_date: z.coerce.date(),
  location: z.string(),
  fee: z.number().nonnegative(),
  max_participants: z.number().positive().optional(),
  created_by: z.number(),
});
export type CreateCommunityEventInput = z.infer<typeof createCommunityEventInputSchema>;

// Notification schemas
export const notificationTypeSchema = z.enum(['payment', 'progress_update', 'risk_alert', 'event', 'general']);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  message: z.string(),
  notification_type: notificationTypeSchema,
  is_read: z.boolean(),
  created_at: z.coerce.date(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationInputSchema = z.object({
  user_id: z.number(),
  title: z.string(),
  message: z.string(),
  notification_type: notificationTypeSchema,
});
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

// Chat support schemas
export const chatMessageSchema = z.object({
  id: z.number(),
  sender_id: z.number(),
  receiver_id: z.number(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const sendChatMessageInputSchema = z.object({
  sender_id: z.number(),
  receiver_id: z.number(),
  message: z.string(),
});
export type SendChatMessageInput = z.infer<typeof sendChatMessageInputSchema>;

// Dashboard data schemas
export const partnerDashboardDataSchema = z.object({
  partnership: partnershipSchema,
  farm_plots: z.array(farmPlotSchema),
  recent_activities: z.array(farmActivitySchema),
  financial_summary: z.object({
    total_expenses: z.number(),
    expense_breakdown: z.record(z.number()),
  }),
  notifications: z.array(notificationSchema),
  risk_alerts: z.array(riskAlertSchema),
});
export type PartnerDashboardData = z.infer<typeof partnerDashboardDataSchema>;
