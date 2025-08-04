
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatMessagesTable } from '../db/schema';
import { getChatMessages } from '../handlers/get_chat_messages';

describe('getChatMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no messages exist', async () => {
    // Create users first
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          full_name: 'User One',
          role: 'partner'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          full_name: 'User Two',
          role: 'farmer'
        }
      ])
      .returning()
      .execute();

    const result = await getChatMessages(users[0].id, users[1].id);

    expect(result).toEqual([]);
  });

  it('should return messages between two users in chronological order', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          full_name: 'User One',
          role: 'partner'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          full_name: 'User Two',
          role: 'farmer'
        }
      ])
      .returning()
      .execute();

    // Create messages with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    const later = new Date(now.getTime() + 60000); // 1 minute later

    await db.insert(chatMessagesTable)
      .values([
        {
          sender_id: users[0].id,
          receiver_id: users[1].id,
          message: 'Third message',
          created_at: later
        },
        {
          sender_id: users[1].id,
          receiver_id: users[0].id,
          message: 'First message',
          created_at: earlier
        },
        {
          sender_id: users[0].id,
          receiver_id: users[1].id,
          message: 'Second message',
          created_at: now
        }
      ])
      .execute();

    const result = await getChatMessages(users[0].id, users[1].id);

    expect(result).toHaveLength(3);
    expect(result[0].message).toEqual('First message');
    expect(result[1].message).toEqual('Second message');
    expect(result[2].message).toEqual('Third message');
    
    // Verify chronological ordering
    expect(result[0].created_at <= result[1].created_at).toBe(true);
    expect(result[1].created_at <= result[2].created_at).toBe(true);
  });

  it('should return messages in both directions between users', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          full_name: 'User One',
          role: 'partner'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          full_name: 'User Two',
          role: 'farmer'
        }
      ])
      .returning()
      .execute();

    // Create messages in both directions
    await db.insert(chatMessagesTable)
      .values([
        {
          sender_id: users[0].id,
          receiver_id: users[1].id,
          message: 'Hello from user 1'
        },
        {
          sender_id: users[1].id,
          receiver_id: users[0].id,
          message: 'Hello from user 2'
        }
      ])
      .execute();

    const result = await getChatMessages(users[0].id, users[1].id);

    expect(result).toHaveLength(2);
    
    // Should include both directions
    const senderIds = result.map(msg => msg.sender_id);
    expect(senderIds).toContain(users[0].id);
    expect(senderIds).toContain(users[1].id);
    
    const messages = result.map(msg => msg.message);
    expect(messages).toContain('Hello from user 1');
    expect(messages).toContain('Hello from user 2');
  });

  it('should not return messages from other conversations', async () => {
    // Create three users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          full_name: 'User One',
          role: 'partner'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          full_name: 'User Two',
          role: 'farmer'
        },
        {
          email: 'user3@example.com',
          password_hash: 'hash3',
          full_name: 'User Three',
          role: 'admin'
        }
      ])
      .returning()
      .execute();

    // Create messages between different user pairs
    await db.insert(chatMessagesTable)
      .values([
        {
          sender_id: users[0].id,
          receiver_id: users[1].id,
          message: 'Message between 1 and 2'
        },
        {
          sender_id: users[0].id,
          receiver_id: users[2].id,
          message: 'Message between 1 and 3'
        },
        {
          sender_id: users[1].id,
          receiver_id: users[2].id,
          message: 'Message between 2 and 3'
        }
      ])
      .execute();

    const result = await getChatMessages(users[0].id, users[1].id);

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual('Message between 1 and 2');
    expect(result[0].sender_id).toEqual(users[0].id);
    expect(result[0].receiver_id).toEqual(users[1].id);
  });

  it('should include read status in returned messages', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          full_name: 'User One',
          role: 'partner'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          full_name: 'User Two',
          role: 'farmer'
        }
      ])
      .returning()
      .execute();

    // Create messages with different read statuses
    await db.insert(chatMessagesTable)
      .values([
        {
          sender_id: users[0].id,
          receiver_id: users[1].id,
          message: 'Read message',
          is_read: true
        },
        {
          sender_id: users[1].id,
          receiver_id: users[0].id,
          message: 'Unread message',
          is_read: false
        }
      ])
      .execute();

    const result = await getChatMessages(users[0].id, users[1].id);

    expect(result).toHaveLength(2);
    
    const readMessage = result.find(msg => msg.message === 'Read message');
    const unreadMessage = result.find(msg => msg.message === 'Unread message');
    
    expect(readMessage?.is_read).toBe(true);
    expect(unreadMessage?.is_read).toBe(false);
  });
});
