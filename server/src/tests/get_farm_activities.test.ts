
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, farmPlotsTable, farmActivitiesTable } from '../db/schema';
import { getFarmActivities } from '../handlers/get_farm_activities';

describe('getFarmActivities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return activities for a specific farm plot ordered by activity date desc', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'farmer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Farmer',
        role: 'farmer',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userId,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '12000.00',
      })
      .returning()
      .execute();

    const partnershipId = partnershipResult[0].id;

    // Create test farm plot
    const farmPlotResult = await db.insert(farmPlotsTable)
      .values({
        partnership_id: partnershipId,
        plot_name: 'Test Plot',
        location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
        area_hectares: '5.5',
      })
      .returning()
      .execute();

    const farmPlotId = farmPlotResult[0].id;

    // Create test activities with different dates
    await db.insert(farmActivitiesTable)
      .values([
        {
          farm_plot_id: farmPlotId,
          activity_type: 'planting',
          description: 'Planted corn seeds',
          activity_date: new Date('2024-03-15'),
          photos: ['photo1.jpg', 'photo2.jpg'],
          videos: ['video1.mp4'],
          created_by: userId,
        },
        {
          farm_plot_id: farmPlotId,
          activity_type: 'watering',
          description: 'Watered the crops',
          activity_date: new Date('2024-03-20'),
          photos: null,
          videos: null,
          created_by: userId,
        },
        {
          farm_plot_id: farmPlotId,
          activity_type: 'fertilizing',
          description: 'Applied organic fertilizer',
          activity_date: new Date('2024-03-10'),
          photos: ['fertilizer.jpg'],
          videos: ['fertilizing.mp4'],
          created_by: userId,
        },
      ])
      .execute();

    const activities = await getFarmActivities(farmPlotId);

    expect(activities).toHaveLength(3);

    // Check ordering (most recent first)
    expect(activities[0].activity_type).toBe('watering');
    expect(activities[0].activity_date).toEqual(new Date('2024-03-20'));
    expect(activities[1].activity_type).toBe('planting');
    expect(activities[1].activity_date).toEqual(new Date('2024-03-15'));
    expect(activities[2].activity_type).toBe('fertilizing');
    expect(activities[2].activity_date).toEqual(new Date('2024-03-10'));

    // Check media arrays
    expect(activities[1].photos).toEqual(['photo1.jpg', 'photo2.jpg']);
    expect(activities[1].videos).toEqual(['video1.mp4']);
    expect(activities[0].photos).toBeNull();
    expect(activities[0].videos).toBeNull();
  });

  it('should return empty array for farm plot with no activities', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'farmer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Farmer',
        role: 'farmer',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userId,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '12000.00',
      })
      .returning()
      .execute();

    const partnershipId = partnershipResult[0].id;

    // Create test farm plot without activities
    const farmPlotResult = await db.insert(farmPlotsTable)
      .values({
        partnership_id: partnershipId,
        plot_name: 'Empty Plot',
        location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
        area_hectares: '2.0',
      })
      .returning()
      .execute();

    const farmPlotId = farmPlotResult[0].id;

    const activities = await getFarmActivities(farmPlotId);

    expect(activities).toHaveLength(0);
  });

  it('should only return activities for the specified farm plot', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'farmer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Farmer',
        role: 'farmer',
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userId,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '12000.00',
      })
      .returning()
      .execute();

    const partnershipId = partnershipResult[0].id;

    // Create two farm plots
    const farmPlotResults = await db.insert(farmPlotsTable)
      .values([
        {
          partnership_id: partnershipId,
          plot_name: 'Plot 1',
          location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
          area_hectares: '3.0',
        },
        {
          partnership_id: partnershipId,
          plot_name: 'Plot 2',
          location_coordinates: '{"lat": 40.7500, "lng": -74.0500}',
          area_hectares: '4.0',
        },
      ])
      .returning()
      .execute();

    const farmPlot1Id = farmPlotResults[0].id;
    const farmPlot2Id = farmPlotResults[1].id;

    // Create activities for both plots
    await db.insert(farmActivitiesTable)
      .values([
        {
          farm_plot_id: farmPlot1Id,
          activity_type: 'planting',
          description: 'Plot 1 activity',
          activity_date: new Date('2024-03-15'),
          created_by: userId,
        },
        {
          farm_plot_id: farmPlot2Id,
          activity_type: 'watering',
          description: 'Plot 2 activity',
          activity_date: new Date('2024-03-16'),
          created_by: userId,
        },
      ])
      .execute();

    const plot1Activities = await getFarmActivities(farmPlot1Id);
    const plot2Activities = await getFarmActivities(farmPlot2Id);

    expect(plot1Activities).toHaveLength(1);
    expect(plot1Activities[0].description).toBe('Plot 1 activity');
    expect(plot1Activities[0].farm_plot_id).toBe(farmPlot1Id);

    expect(plot2Activities).toHaveLength(1);
    expect(plot2Activities[0].description).toBe('Plot 2 activity');
    expect(plot2Activities[0].farm_plot_id).toBe(farmPlot2Id);
  });
});
