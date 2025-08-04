
import { db } from '../db';
import { farmPlotsTable, partnershipsTable } from '../db/schema';
import { type CreateFarmPlotInput, type FarmPlot } from '../schema';
import { eq } from 'drizzle-orm';

export const createFarmPlot = async (input: CreateFarmPlotInput): Promise<FarmPlot> => {
  try {
    // Validate that the partnership exists
    const partnership = await db.select()
      .from(partnershipsTable)
      .where(eq(partnershipsTable.id, input.partnership_id))
      .execute();

    if (partnership.length === 0) {
      throw new Error(`Partnership with id ${input.partnership_id} not found`);
    }

    // Insert farm plot record
    const result = await db.insert(farmPlotsTable)
      .values({
        partnership_id: input.partnership_id,
        plot_name: input.plot_name,
        location_coordinates: input.location_coordinates,
        area_hectares: input.area_hectares.toString(), // Convert number to string for numeric column
        soil_type: input.soil_type || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const farmPlot = result[0];
    return {
      ...farmPlot,
      area_hectares: parseFloat(farmPlot.area_hectares) // Convert string back to number
    };
  } catch (error) {
    console.error('Farm plot creation failed:', error);
    throw error;
  }
};
