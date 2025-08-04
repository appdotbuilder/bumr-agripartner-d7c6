
import { db } from '../db';
import { farmActivitiesTable, farmPlotsTable, usersTable } from '../db/schema';
import { type CreateFarmActivityInput, type FarmActivity } from '../schema';
import { eq } from 'drizzle-orm';

export const createFarmActivity = async (input: CreateFarmActivityInput): Promise<FarmActivity> => {
  try {
    // Validate that farm plot exists
    const farmPlot = await db.select()
      .from(farmPlotsTable)
      .where(eq(farmPlotsTable.id, input.farm_plot_id))
      .execute();

    if (farmPlot.length === 0) {
      throw new Error('Farm plot not found');
    }

    // Validate that user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.created_by))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Insert farm activity record
    const result = await db.insert(farmActivitiesTable)
      .values({
        farm_plot_id: input.farm_plot_id,
        activity_type: input.activity_type,
        description: input.description,
        activity_date: input.activity_date,
        photos: input.photos || null,
        videos: input.videos || null,
        created_by: input.created_by
      })
      .returning()
      .execute();

    const activity = result[0];
    return {
      ...activity,
      photos: activity.photos as string[] | null,
      videos: activity.videos as string[] | null
    };
  } catch (error) {
    console.error('Farm activity creation failed:', error);
    throw error;
  }
};
