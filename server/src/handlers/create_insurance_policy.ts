
import { db } from '../db';
import { insurancePoliciesTable, partnershipsTable } from '../db/schema';
import { type CreateInsurancePolicyInput, type InsurancePolicy } from '../schema';
import { eq } from 'drizzle-orm';

export const createInsurancePolicy = async (input: CreateInsurancePolicyInput): Promise<InsurancePolicy> => {
  try {
    // Verify partnership exists
    const partnership = await db.select()
      .from(partnershipsTable)
      .where(eq(partnershipsTable.id, input.partnership_id))
      .execute();

    if (partnership.length === 0) {
      throw new Error(`Partnership with id ${input.partnership_id} not found`);
    }

    // Insert insurance policy record
    const result = await db.insert(insurancePoliciesTable)
      .values({
        partnership_id: input.partnership_id,
        policy_number: input.policy_number,
        coverage_amount: input.coverage_amount.toString(),
        premium_amount: input.premium_amount.toString(),
        start_date: input.start_date,
        end_date: input.end_date,
        coverage_details: input.coverage_details,
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const policy = result[0];
    return {
      ...policy,
      coverage_amount: parseFloat(policy.coverage_amount),
      premium_amount: parseFloat(policy.premium_amount),
    };
  } catch (error) {
    console.error('Insurance policy creation failed:', error);
    throw error;
  }
};
