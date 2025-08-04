
import { db } from '../db';
import { financialRecordsTable, farmPlotsTable, partnershipsTable } from '../db/schema';
import { eq, sum } from 'drizzle-orm';

export interface FinancialSummary {
  total_expenses: number;
  expense_breakdown: Record<string, number>;
  estimated_yield: number;
  current_market_price: number;
  projected_revenue: number;
}

export async function getFinancialSummary(partnershipId: number): Promise<FinancialSummary> {
  try {
    // Get total expenses for the partnership
    const expenseResults = await db.select({
      expense_type: financialRecordsTable.expense_type,
      total: sum(financialRecordsTable.amount)
    })
    .from(financialRecordsTable)
    .where(eq(financialRecordsTable.partnership_id, partnershipId))
    .groupBy(financialRecordsTable.expense_type)
    .execute();

    // Calculate total expenses and breakdown
    let total_expenses = 0;
    const expense_breakdown: Record<string, number> = {};

    for (const record of expenseResults) {
      const amount = parseFloat(record.total || '0');
      expense_breakdown[record.expense_type] = amount;
      total_expenses += amount;
    }

    // Get total area for yield calculation
    const farmPlots = await db.select({
      total_area: sum(farmPlotsTable.area_hectares)
    })
    .from(farmPlotsTable)
    .where(eq(farmPlotsTable.partnership_id, partnershipId))
    .execute();

    const total_area = parseFloat(farmPlots[0]?.total_area || '0');
    
    // Fixed constants for calculation
    const estimated_yield = 5; // tons per hectare
    const current_market_price = 12000; // per ton (converted from per kg in placeholder)
    
    // Calculate projected revenue
    const projected_revenue = total_area * estimated_yield * current_market_price;

    return {
      total_expenses,
      expense_breakdown,
      estimated_yield,
      current_market_price,
      projected_revenue,
    };
  } catch (error) {
    console.error('Financial summary generation failed:', error);
    throw error;
  }
}
