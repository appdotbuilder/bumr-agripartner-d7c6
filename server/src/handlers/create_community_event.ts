
import { db } from '../db';
import { communityEventsTable, usersTable } from '../db/schema';
import { type CreateCommunityEventInput, type CommunityEvent } from '../schema';
import { eq } from 'drizzle-orm';

export const createCommunityEvent = async (input: CreateCommunityEventInput): Promise<CommunityEvent> => {
  try {
    // Verify the creator exists
    const creator = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (creator.length === 0) {
      throw new Error('Creator user not found');
    }

    // Insert community event record
    const result = await db.insert(communityEventsTable)
      .values({
        title: input.title,
        description: input.description,
        event_type: input.event_type,
        event_date: input.event_date,
        location: input.location,
        fee: input.fee.toString(), // Convert number to string for numeric column
        max_participants: input.max_participants,
        created_by: input.created_by
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const event = result[0];
    return {
      ...event,
      fee: parseFloat(event.fee) // Convert string back to number
    };
  } catch (error) {
    console.error('Community event creation failed:', error);
    throw error;
  }
};
