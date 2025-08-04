
import { db } from '../db';
import { notificationsTable } from '../db/schema';
import { type Notification } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  try {
    const results = await db.select()
      .from(notificationsTable)
      .where(eq(notificationsTable.user_id, userId))
      .orderBy(desc(notificationsTable.created_at))
      .execute();

    return results.map(notification => ({
      ...notification,
      created_at: notification.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch user notifications:', error);
    throw error;
  }
}
