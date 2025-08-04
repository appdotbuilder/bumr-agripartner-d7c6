
import { db } from '../db';
import { chatMessagesTable, usersTable } from '../db/schema';
import { type SendChatMessageInput, type ChatMessage } from '../schema';
import { eq } from 'drizzle-orm';

export const sendChatMessage = async (input: SendChatMessageInput): Promise<ChatMessage> => {
  try {
    // Validate that both sender and receiver exist
    const [sender, receiver] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, input.sender_id)).execute(),
      db.select().from(usersTable).where(eq(usersTable.id, input.receiver_id)).execute()
    ]);

    if (sender.length === 0) {
      throw new Error('Sender does not exist');
    }

    if (receiver.length === 0) {
      throw new Error('Receiver does not exist');
    }

    // Insert the chat message
    const result = await db.insert(chatMessagesTable)
      .values({
        sender_id: input.sender_id,
        receiver_id: input.receiver_id,
        message: input.message,
        is_read: false
      })
      .returning()
      .execute();

    const chatMessage = result[0];
    return {
      ...chatMessage,
      created_at: chatMessage.created_at
    };
  } catch (error) {
    console.error('Send chat message failed:', error);
    throw error;
  }
};
