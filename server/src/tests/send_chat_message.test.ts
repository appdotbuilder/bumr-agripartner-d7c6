
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatMessagesTable } from '../db/schema';
import { type SendChatMessageInput } from '../schema';
import { sendChatMessage } from '../handlers/send_chat_message';
import { eq } from 'drizzle-orm';

// Test users
const testSender = {
  email: 'sender@example.com',
  phone: '1234567890',
  password_hash: 'hashed_password',
  full_name: 'Test Sender',
  role: 'partner' as const,
  is_verified: true,
  is_active: true
};

const testReceiver = {
  email: 'receiver@example.com',
  phone: '0987654321',
  password_hash: 'hashed_password',
  full_name: 'Test Receiver',
  role: 'farmer' as const,
  is_verified: true,
  is_active: true
};

describe('sendChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should send a chat message between existing users', async () => {
    // Create test users
    const senderResult = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const receiverResult = await db.insert(usersTable)
      .values(testReceiver)
      .returning()
      .execute();

    const senderId = senderResult[0].id;
    const receiverId = receiverResult[0].id;

    const testInput: SendChatMessageInput = {
      sender_id: senderId,
      receiver_id: receiverId,
      message: 'Hello, how is the farm doing?'
    };

    const result = await sendChatMessage(testInput);

    // Validate message properties
    expect(result.sender_id).toEqual(senderId);
    expect(result.receiver_id).toEqual(receiverId);
    expect(result.message).toEqual('Hello, how is the farm doing?');
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chat message to database', async () => {
    // Create test users
    const senderResult = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const receiverResult = await db.insert(usersTable)
      .values(testReceiver)
      .returning()
      .execute();

    const senderId = senderResult[0].id;
    const receiverId = receiverResult[0].id;

    const testInput: SendChatMessageInput = {
      sender_id: senderId,
      receiver_id: receiverId,
      message: 'Test message for database storage'
    };

    const result = await sendChatMessage(testInput);

    // Query database to verify message was saved
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].sender_id).toEqual(senderId);
    expect(messages[0].receiver_id).toEqual(receiverId);
    expect(messages[0].message).toEqual('Test message for database storage');
    expect(messages[0].is_read).toEqual(false);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when sender does not exist', async () => {
    // Create only receiver
    const receiverResult = await db.insert(usersTable)
      .values(testReceiver)
      .returning()
      .execute();

    const testInput: SendChatMessageInput = {
      sender_id: 999, // Non-existent sender
      receiver_id: receiverResult[0].id,
      message: 'This should fail'
    };

    await expect(sendChatMessage(testInput)).rejects.toThrow(/sender does not exist/i);
  });

  it('should throw error when receiver does not exist', async () => {
    // Create only sender
    const senderResult = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const testInput: SendChatMessageInput = {
      sender_id: senderResult[0].id,
      receiver_id: 999, // Non-existent receiver
      message: 'This should fail'
    };

    await expect(sendChatMessage(testInput)).rejects.toThrow(/receiver does not exist/i);
  });

  it('should handle long messages correctly', async () => {
    // Create test users
    const senderResult = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const receiverResult = await db.insert(usersTable)
      .values(testReceiver)
      .returning()
      .execute();

    const longMessage = 'A'.repeat(500); // Long message
    const testInput: SendChatMessageInput = {
      sender_id: senderResult[0].id,
      receiver_id: receiverResult[0].id,
      message: longMessage
    };

    const result = await sendChatMessage(testInput);

    expect(result.message).toEqual(longMessage);
    expect(result.message.length).toEqual(500);
  });
});
