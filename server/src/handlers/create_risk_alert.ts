
import { db } from '../db';
import { riskAlertsTable, farmPlotsTable } from '../db/schema';
import { type CreateRiskAlertInput, type RiskAlert } from '../schema';
import { eq } from 'drizzle-orm';

export const createRiskAlert = async (input: CreateRiskAlertInput): Promise<RiskAlert> => {
  try {
    // Verify the farm plot exists to prevent foreign key constraint violations
    const farmPlot = await db.select()
      .from(farmPlotsTable)
      .where(eq(farmPlotsTable.id, input.farm_plot_id))
      .execute();

    if (farmPlot.length === 0) {
      throw new Error(`Farm plot with id ${input.farm_plot_id} not found`);
    }

    // Insert risk alert record
    const result = await db.insert(riskAlertsTable)
      .values({
        farm_plot_id: input.farm_plot_id,
        risk_type: input.risk_type,
        severity_level: input.severity_level,
        title: input.title,
        description: input.description,
        alert_date: input.alert_date,
        is_resolved: false // Default value for new alerts
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Risk alert creation failed:', error);
    throw error;
  }
};
