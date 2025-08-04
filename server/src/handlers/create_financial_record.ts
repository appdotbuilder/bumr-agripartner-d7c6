
import { db } from '../db';
import { financialRecordsTable, partnershipsTable } from '../db/schema';
import { type CreateFinancialRecordInput, type FinancialRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const createFinancialRecord = async (input: CreateFinancialRecordInput): Promise<FinancialRecord> => {
  try {
    // Validate that the partnership exists
    const partnership = await db.select()
      .from(partnershipsTable)
      .where(eq(partnershipsTable.id, input.partnership_id))
      .execute();

    if (partnership.length === 0) {
      throw new Error(`Partnership with id ${input.partnership_id} does not exist`);
    }

    // Insert financial record
    const result = await db.insert(financialRecordsTable)
      .values({
        partnership_id: input.partnership_id,
        expense_type: input.expense_type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        transaction_date: input.transaction_date,
        receipt_url: input.receipt_url || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const record = result[0];
    return {
      ...record,
      amount: parseFloat(record.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Financial record creation failed:', error);
    throw error;
  }
};
