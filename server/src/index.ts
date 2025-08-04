
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  registerUserInputSchema,
  loginUserInputSchema,
  createPartnershipInputSchema,
  createFarmPlotInputSchema,
  createFarmActivityInputSchema,
  createFinancialRecordInputSchema,
  createInsurancePolicyInputSchema,
  createRiskAlertInputSchema,
  createCommunityEventInputSchema,
  createNotificationInputSchema,
  sendChatMessageInputSchema
} from './schema';

// Handler imports
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { createPartnership } from './handlers/create_partnership';
import { getPartnerDashboard } from './handlers/get_partner_dashboard';
import { createFarmPlot } from './handlers/create_farm_plot';
import { createFarmActivity } from './handlers/create_farm_activity';
import { getFarmActivities } from './handlers/get_farm_activities';
import { createFinancialRecord } from './handlers/create_financial_record';
import { getFinancialSummary } from './handlers/get_financial_summary';
import { createInsurancePolicy } from './handlers/create_insurance_policy';
import { createRiskAlert } from './handlers/create_risk_alert';
import { getRiskAlerts } from './handlers/get_risk_alerts';
import { createCommunityEvent } from './handlers/create_community_event';
import { getCommunityEvents } from './handlers/get_community_events';
import { createNotification } from './handlers/create_notification';
import { getUserNotifications } from './handlers/get_user_notifications';
import { sendChatMessage } from './handlers/send_chat_message';
import { getChatMessages } from './handlers/get_chat_messages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),
    
  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Partnership management
  createPartnership: publicProcedure
    .input(createPartnershipInputSchema)
    .mutation(({ input }) => createPartnership(input)),
    
  getPartnerDashboard: publicProcedure
    .input(z.object({ partnerId: z.number() }))
    .query(({ input }) => getPartnerDashboard(input.partnerId)),

  // Farm plot management
  createFarmPlot: publicProcedure
    .input(createFarmPlotInputSchema)
    .mutation(({ input }) => createFarmPlot(input)),

  // Farm activity tracking
  createFarmActivity: publicProcedure
    .input(createFarmActivityInputSchema)
    .mutation(({ input }) => createFarmActivity(input)),
    
  getFarmActivities: publicProcedure
    .input(z.object({ farmPlotId: z.number() }))
    .query(({ input }) => getFarmActivities(input.farmPlotId)),

  // Financial management
  createFinancialRecord: publicProcedure
    .input(createFinancialRecordInputSchema)
    .mutation(({ input }) => createFinancialRecord(input)),
    
  getFinancialSummary: publicProcedure
    .input(z.object({ partnershipId: z.number() }))
    .query(({ input }) => getFinancialSummary(input.partnershipId)),

  // Insurance management
  createInsurancePolicy: publicProcedure
    .input(createInsurancePolicyInputSchema)
    .mutation(({ input }) => createInsurancePolicy(input)),

  // Risk management
  createRiskAlert: publicProcedure
    .input(createRiskAlertInputSchema)
    .mutation(({ input }) => createRiskAlert(input)),
    
  getRiskAlerts: publicProcedure
    .input(z.object({ farmPlotId: z.number().optional() }))
    .query(({ input }) => getRiskAlerts(input.farmPlotId)),

  // Community events
  createCommunityEvent: publicProcedure
    .input(createCommunityEventInputSchema)
    .mutation(({ input }) => createCommunityEvent(input)),
    
  getCommunityEvents: publicProcedure
    .query(() => getCommunityEvents()),

  // Notifications
  createNotification: publicProcedure
    .input(createNotificationInputSchema)
    .mutation(({ input }) => createNotification(input)),
    
  getUserNotifications: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserNotifications(input.userId)),

  // Chat support
  sendChatMessage: publicProcedure
    .input(sendChatMessageInputSchema)
    .mutation(({ input }) => sendChatMessage(input)),
    
  getChatMessages: publicProcedure
    .input(z.object({ userId1: z.number(), userId2: z.number() }))
    .query(({ input }) => getChatMessages(input.userId1, input.userId2)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`BUMR AgriPartner TRPC server listening at port: ${port}`);
}

start();
