
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, notificationsTable } from '../db/schema';
import { type RegisterUserInput, type CreateNotificationInput } from '../schema';
import { getUserNotifications } from '../handlers/get_user_notifications';

const testUser: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  role: 'partner',
  phone: '+1234567890'
};

const testNotification1: CreateNotificationInput = {
  user_id: 1,
  title: 'Payment Reminder',
  message: 'Your partnership payment is due soon',
  notification_type: 'payment'
};

const testNotification2: CreateNotificationInput = {
  user_id: 1,
  title: 'Progress Update',
  message: 'Your farm has reached 50% completion',
  notification_type: 'progress_update'
};

const testNotification3: CreateNotificationInput = {
  user_id: 2,
  title: 'Risk Alert',
  message: 'Weather warning for your area',
  notification_type: 'risk_alert'
};

describe('getUserNotifications', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return notifications for a specific user', async () => {
    // Create test users
    const user1 = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        role: testUser.role,
        phone: testUser.phone
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        full_name: 'User Two',
        role: 'farmer'
      })
      .returning()
      .execute();

    // Create notifications for both users
    await db.insert(notificationsTable)
      .values([
        {
          user_id: user1[0].id,
          title: testNotification1.title,
          message: testNotification1.message,
          notification_type: testNotification1.notification_type
        },
        {
          user_id: user1[0].id,
          title: testNotification2.title,
          message: testNotification2.message,
          notification_type: testNotification2.notification_type
        },
        {
          user_id: user2[0].id,
          title: testNotification3.title,
          message: testNotification3.message,
          notification_type: testNotification3.notification_type
        }
      ])
      .execute();

    const result = await getUserNotifications(user1[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBe(user1[0].id);
    expect(result[1].user_id).toBe(user1[0].id);
    
    // Check that notifications contain expected data
    const titles = result.map(n => n.title);
    expect(titles).toContain('Payment Reminder');
    expect(titles).toContain('Progress Update');
    expect(titles).not.toContain('Risk Alert'); // This belongs to user2
  });

  it('should return notifications ordered by created_at descending', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        role: testUser.role,
        phone: testUser.phone
      })
      .returning()
      .execute();

    // Create notifications with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await db.insert(notificationsTable)
      .values([
        {
          user_id: user[0].id,
          title: 'Oldest Notification',
          message: 'This is the oldest',
          notification_type: 'general',
          created_at: twoHoursAgo
        },
        {
          user_id: user[0].id,
          title: 'Middle Notification',
          message: 'This is in the middle',
          notification_type: 'general',
          created_at: oneHourAgo
        },
        {
          user_id: user[0].id,
          title: 'Newest Notification',
          message: 'This is the newest',
          notification_type: 'general',
          created_at: now
        }
      ])
      .execute();

    const result = await getUserNotifications(user[0].id);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Newest Notification');
    expect(result[1].title).toBe('Middle Notification');
    expect(result[2].title).toBe('Oldest Notification');
    
    // Verify ordering by timestamp
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
  });

  it('should return empty array for user with no notifications', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        role: testUser.role,
        phone: testUser.phone
      })
      .returning()
      .execute();

    const result = await getUserNotifications(user[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const result = await getUserNotifications(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should include all notification fields', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: 'hashed_password',
        full_name: testUser.full_name,
        role: testUser.role,
        phone: testUser.phone
      })
      .returning()
      .execute();

    // Create notification
    await db.insert(notificationsTable)
      .values({
        user_id: user[0].id,
        title: testNotification1.title,
        message: testNotification1.message,
        notification_type: testNotification1.notification_type,
        is_read: true
      })
      .execute();

    const result = await getUserNotifications(user[0].id);

    expect(result).toHaveLength(1);
    const notification = result[0];
    
    expect(notification.id).toBeDefined();
    expect(notification.user_id).toBe(user[0].id);
    expect(notification.title).toBe('Payment Reminder');
    expect(notification.message).toBe('Your partnership payment is due soon');
    expect(notification.notification_type).toBe('payment');
    expect(notification.is_read).toBe(true);
    expect(notification.created_at).toBeInstanceOf(Date);
  });
});
