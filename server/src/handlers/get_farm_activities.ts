
import { db } from '../db';
import { farmActivitiesTable, usersTable } from '../db/schema';
import { type FarmActivity } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getFarmActivities(farmPlotId: number): Promise<FarmActivity[]> {
  try {
    const results = await db.select()
      .from(farmActivitiesTable)
      .innerJoin(usersTable, eq(farmActivitiesTable.created_by, usersTable.id))
      .where(eq(farmActivitiesTable.farm_plot_id, farmPlotId))
      .orderBy(desc(farmActivitiesTable.activity_date))
      .execute();

    return results.map(result => ({
      id: result.farm_activities.id,
      farm_plot_id: result.farm_activities.farm_plot_id,
      activity_type: result.farm_activities.activity_type,
      description: result.farm_activities.description,
      activity_date: result.farm_activities.activity_date,
      photos: result.farm_activities.photos as string[] | null,
      videos: result.farm_activities.videos as string[] | null,
      created_by: result.farm_activities.created_by,
      created_at: result.farm_activities.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch farm activities:', error);
    throw error;
  }
}
