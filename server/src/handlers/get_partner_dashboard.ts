
import { db } from '../db';
import { 
  partnershipsTable, 
  farmPlotsTable, 
  farmActivitiesTable, 
  financialRecordsTable,
  notificationsTable,
  riskAlertsTable,
  usersTable
} from '../db/schema';
import { type PartnerDashboardData } from '../schema';
import { eq, desc, and, inArray } from 'drizzle-orm';

export async function getPartnerDashboard(partnerId: number): Promise<PartnerDashboardData> {
  try {
    // Get partnership data for this partner
    const partnerships = await db.select()
      .from(partnershipsTable)
      .where(eq(partnershipsTable.partner_id, partnerId))
      .execute();

    if (partnerships.length === 0) {
      throw new Error('Partnership not found for this partner');
    }

    const partnership = partnerships[0];
    const partnershipId = partnership.id;

    // Get farm plots for this partnership
    const farmPlots = await db.select()
      .from(farmPlotsTable)
      .where(eq(farmPlotsTable.partnership_id, partnershipId))
      .execute();

    // Get recent activities from all farm plots (limit to 10 most recent)
    const farmPlotIds = farmPlots.map(plot => plot.id);
    
    const recentActivities = farmPlotIds.length > 0
      ? await db.select()
          .from(farmActivitiesTable)
          .innerJoin(usersTable, eq(farmActivitiesTable.created_by, usersTable.id))
          .where(inArray(farmActivitiesTable.farm_plot_id, farmPlotIds))
          .orderBy(desc(farmActivitiesTable.created_at))
          .limit(10)
          .execute()
      : [];

    // Get financial records and calculate summary
    const financialRecords = await db.select()
      .from(financialRecordsTable)
      .where(eq(financialRecordsTable.partnership_id, partnershipId))
      .execute();

    const totalExpenses = financialRecords.reduce((sum, record) => 
      sum + parseFloat(record.amount), 0
    );

    const expenseBreakdown = financialRecords.reduce((breakdown, record) => {
      const expenseType = record.expense_type;
      const amount = parseFloat(record.amount);
      breakdown[expenseType] = (breakdown[expenseType] || 0) + amount;
      return breakdown;
    }, {} as Record<string, number>);

    // Get notifications for this partner (limit to 20 most recent)
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, partnerId))
      .orderBy(desc(notificationsTable.created_at))
      .limit(20)
      .execute();

    // Get risk alerts from all farm plots
    const riskAlerts = farmPlotIds.length > 0
      ? await db.select()
          .from(riskAlertsTable)
          .where(inArray(riskAlertsTable.farm_plot_id, farmPlotIds))
          .orderBy(desc(riskAlertsTable.created_at))
          .execute()
      : [];

    // Convert numeric fields and format data
    const formattedPartnership = {
      ...partnership,
      investment_amount: parseFloat(partnership.investment_amount),
      estimated_return: parseFloat(partnership.estimated_return),
      current_progress: parseFloat(partnership.current_progress),
    };

    const formattedFarmPlots = farmPlots.map(plot => ({
      ...plot,
      area_hectares: parseFloat(plot.area_hectares),
    }));

    const formattedActivities = recentActivities.map(result => ({
      ...result.farm_activities,
      photos: result.farm_activities.photos as string[] | null,
      videos: result.farm_activities.videos as string[] | null,
    }));

    const formattedRiskAlerts = riskAlerts.map(alert => ({
      ...alert,
    }));

    return {
      partnership: formattedPartnership,
      farm_plots: formattedFarmPlots,
      recent_activities: formattedActivities,
      financial_summary: {
        total_expenses: totalExpenses,
        expense_breakdown: expenseBreakdown,
      },
      notifications: notifications,
      risk_alerts: formattedRiskAlerts,
    };
  } catch (error) {
    console.error('Get partner dashboard failed:', error);
    throw error;
  }
}
