
import { db } from '../db';
import { riskAlertsTable } from '../db/schema';
import { type RiskAlert } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getRiskAlerts = async (farmPlotId?: number): Promise<RiskAlert[]> => {
  try {
    // Build query based on whether filter is provided
    const results = farmPlotId !== undefined
      ? await db.select()
          .from(riskAlertsTable)
          .where(eq(riskAlertsTable.farm_plot_id, farmPlotId))
          .orderBy(
            desc(riskAlertsTable.severity_level),
            desc(riskAlertsTable.created_at)
          )
          .execute()
      : await db.select()
          .from(riskAlertsTable)
          .orderBy(
            desc(riskAlertsTable.severity_level),
            desc(riskAlertsTable.created_at)
          )
          .execute();

    // Return results (no numeric conversion needed for integer fields)
    return results;
  } catch (error) {
    console.error('Risk alerts retrieval failed:', error);
    throw error;
  }
};
