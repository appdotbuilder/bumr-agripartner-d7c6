
import { db } from '../db';
import { partnershipsTable, usersTable } from '../db/schema';
import { type CreatePartnershipInput, type Partnership } from '../schema';
import { eq } from 'drizzle-orm';

export const createPartnership = async (input: CreatePartnershipInput): Promise<Partnership> => {
  try {
    // Validate that the partner exists and has the 'partner' role
    const partner = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.partner_id))
      .execute();

    if (partner.length === 0) {
      throw new Error('Partner not found');
    }

    if (partner[0].role !== 'partner') {
      throw new Error('User is not a partner');
    }

    // Insert partnership record
    const result = await db.insert(partnershipsTable)
      .values({
        partner_id: input.partner_id,
        investment_amount: input.investment_amount.toString(),
        start_date: input.start_date,
        end_date: input.end_date,
        estimated_return: input.estimated_return.toString(),
        current_progress: '0', // Default to 0
        current_phase: 'planning', // Default phase
        status: 'pending' // Default status
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const partnership = result[0];
    return {
      ...partnership,
      investment_amount: parseFloat(partnership.investment_amount),
      estimated_return: parseFloat(partnership.estimated_return),
      current_progress: parseFloat(partnership.current_progress)
    };
  } catch (error) {
    console.error('Partnership creation failed:', error);
    throw error;
  }
};
