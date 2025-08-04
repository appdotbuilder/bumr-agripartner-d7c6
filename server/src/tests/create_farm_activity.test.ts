
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, farmPlotsTable, farmActivitiesTable } from '../db/schema';
import { type CreateFarmActivityInput } from '../schema';
import { createFarmActivity } from '../handlers/create_farm_activity';
import { eq } from 'drizzle-orm';

describe('createFarmActivity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testPartnershipId: number;
  let testFarmPlotId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'farmer',
        is_verified: true,
        is_active: true
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: testUserId,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '15000.00'
      })
      .returning()
      .execute();
    testPartnershipId = partnershipResult[0].id;

    // Create test farm plot
    const farmPlotResult = await db.insert(farmPlotsTable)
      .values({
        partnership_id: testPartnershipId,
        plot_name: 'Test Plot',
        location_coordinates: '{"lat": 1.0, "lng": 2.0}',
        area_hectares: '5.5'
      })
      .returning()
      .execute();
    testFarmPlotId = farmPlotResult[0].id;
  });

  const testInput: CreateFarmActivityInput = {
    farm_plot_id: 0, // Will be set in tests
    activity_type: 'planting',
    description: 'Planted tomato seeds',
    activity_date: new Date('2024-06-15'),
    photos: ['photo1.jpg', 'photo2.jpg'],
    videos: ['video1.mp4'],
    created_by: 0 // Will be set in tests
  };

  it('should create a farm activity', async () => {
    const input = {
      ...testInput,
      farm_plot_id: testFarmPlotId,
      created_by: testUserId
    };

    const result = await createFarmActivity(input);

    // Basic field validation
    expect(result.farm_plot_id).toEqual(testFarmPlotId);
    expect(result.activity_type).toEqual('planting');
    expect(result.description).toEqual('Planted tomato seeds');
    expect(result.activity_date).toEqual(new Date('2024-06-15'));
    expect(result.photos).toEqual(['photo1.jpg', 'photo2.jpg']);
    expect(result.videos).toEqual(['video1.mp4']);
    expect(result.created_by).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save farm activity to database', async () => {
    const input = {
      ...testInput,
      farm_plot_id: testFarmPlotId,
      created_by: testUserId
    };

    const result = await createFarmActivity(input);

    // Query database to verify save
    const activities = await db.select()
      .from(farmActivitiesTable)
      .where(eq(farmActivitiesTable.id, result.id))
      .execute();

    expect(activities).toHaveLength(1);
    expect(activities[0].farm_plot_id).toEqual(testFarmPlotId);
    expect(activities[0].activity_type).toEqual('planting');
    expect(activities[0].description).toEqual('Planted tomato seeds');
    expect(activities[0].activity_date).toEqual(new Date('2024-06-15'));
    expect(activities[0].photos).toEqual(['photo1.jpg', 'photo2.jpg']);
    expect(activities[0].videos).toEqual(['video1.mp4']);
    expect(activities[0].created_by).toEqual(testUserId);
    expect(activities[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle activity without photos and videos', async () => {
    const input = {
      farm_plot_id: testFarmPlotId,
      activity_type: 'watering' as const,
      description: 'Watered the crops',
      activity_date: new Date('2024-06-16'),
      created_by: testUserId
    };

    const result = await createFarmActivity(input);

    expect(result.photos).toBeNull();
    expect(result.videos).toBeNull();
    expect(result.activity_type).toEqual('watering');
    expect(result.description).toEqual('Watered the crops');
  });

  it('should throw error for non-existent farm plot', async () => {
    const input = {
      ...testInput,
      farm_plot_id: 99999,
      created_by: testUserId
    };

    await expect(createFarmActivity(input)).rejects.toThrow(/farm plot not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...testInput,
      farm_plot_id: testFarmPlotId,
      created_by: 99999
    };

    await expect(createFarmActivity(input)).rejects.toThrow(/user not found/i);
  });

  it('should handle different activity types correctly', async () => {
    const activityTypes = ['fertilizing', 'pest_control', 'harvesting', 'other'] as const;

    for (const activityType of activityTypes) {
      const input = {
        farm_plot_id: testFarmPlotId,
        activity_type: activityType,
        description: `Test ${activityType} activity`,
        activity_date: new Date('2024-06-17'),
        created_by: testUserId
      };

      const result = await createFarmActivity(input);
      expect(result.activity_type).toEqual(activityType);
      expect(result.description).toEqual(`Test ${activityType} activity`);
    }
  });
});
