
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { type CreateNotificationInput } from '../schema';
import { createNotification } from '../handlers/create_notification';
import { eq } from 'drizzle-orm';

describe('createNotification', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'partner',
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  const testInput: CreateNotificationInput = {
    user_id: 0, // Will be set in beforeEach
    title: 'Test Notification',
    message: 'This is a test notification message',
    notification_type: 'general',
  };

  it('should create a notification', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createNotification(input);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('Test Notification');
    expect(result.message).toEqual(testInput.message);
    expect(result.notification_type).toEqual('general');
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save notification to database', async () => {
    const input = { ...testInput, user_id: testUserId };
    const result = await createNotification(input);

    // Query using proper drizzle syntax
    const notifications = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, result.id))
      .execute();

    expect(notifications).toHaveLength(1);
    expect(notifications[0].user_id).toEqual(testUserId);
    expect(notifications[0].title).toEqual('Test Notification');
    expect(notifications[0].message).toEqual(testInput.message);
    expect(notifications[0].notification_type).toEqual('general');
    expect(notifications[0].is_read).toEqual(false);
    expect(notifications[0].created_at).toBeInstanceOf(Date);
  });

  it('should create notifications with different types', async () => {
    const notificationTypes = ['payment', 'progress_update', 'risk_alert', 'event', 'general'] as const;
    
    for (const type of notificationTypes) {
      const input = {
        ...testInput,
        user_id: testUserId,
        notification_type: type,
        title: `${type} notification`,
      };
      
      const result = await createNotification(input);
      
      expect(result.notification_type).toEqual(type);
      expect(result.title).toEqual(`${type} notification`);
    }
  });

  it('should handle long messages', async () => {
    const longMessage = 'A'.repeat(1000); // Long message
    const input = {
      ...testInput,
      user_id: testUserId,
      message: longMessage,
    };
    
    const result = await createNotification(input);
    
    expect(result.message).toEqual(longMessage);
    expect(result.message.length).toEqual(1000);
  });

  it('should fail when user does not exist', async () => {
    const input = {
      ...testInput,
      user_id: 99999, // Non-existent user ID
    };
    
    await expect(createNotification(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
