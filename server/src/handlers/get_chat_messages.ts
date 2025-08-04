
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type ChatMessage } from '../schema';
import { or, and, eq, asc } from 'drizzle-orm';

export async function getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]> {
  try {
    // Get all messages between the two users, ordered chronologically
    const results = await db.select()
      .from(chatMessagesTable)
      .where(
        or(
          and(
            eq(chatMessagesTable.sender_id, userId1),
            eq(chatMessagesTable.receiver_id, userId2)
          ),
          and(
            eq(chatMessagesTable.sender_id, userId2),
            eq(chatMessagesTable.receiver_id, userId1)
          )
        )
      )
      .orderBy(asc(chatMessagesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Get chat messages failed:', error);
    throw error;
  }
}
