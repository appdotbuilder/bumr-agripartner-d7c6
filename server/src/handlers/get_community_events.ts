
import { db } from '../db';
import { communityEventsTable } from '../db/schema';
import { type CommunityEvent } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getCommunityEvents = async (): Promise<CommunityEvent[]> => {
  try {
    // Fetch all active community events ordered by event date
    const results = await db.select()
      .from(communityEventsTable)
      .where(eq(communityEventsTable.is_active, true))
      .orderBy(desc(communityEventsTable.event_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(event => ({
      ...event,
      fee: parseFloat(event.fee)
    }));
  } catch (error) {
    console.error('Failed to fetch community events:', error);
    throw error;
  }
};
