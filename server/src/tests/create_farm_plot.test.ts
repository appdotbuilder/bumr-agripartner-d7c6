
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { farmPlotsTable, partnershipsTable, usersTable } from '../db/schema';
import { type CreateFarmPlotInput } from '../schema';
import { createFarmPlot } from '../handlers/create_farm_plot';
import { eq } from 'drizzle-orm';

describe('createFarmPlot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test user and partnership
  const createTestUserAndPartnership = async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'partner',
        phone: '+1234567890'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: user.id,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '75000.00'
      })
      .returning()
      .execute();

    return partnershipResult[0];
  };

  it('should create a farm plot', async () => {
    const partnership = await createTestUserAndPartnership();

    const testInput: CreateFarmPlotInput = {
      partnership_id: partnership.id,
      plot_name: 'Test Farm Plot',
      location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
      area_hectares: 5.25,
      soil_type: 'Loamy'
    };

    const result = await createFarmPlot(testInput);

    // Basic field validation
    expect(result.partnership_id).toEqual(partnership.id);
    expect(result.plot_name).toEqual('Test Farm Plot');
    expect(result.location_coordinates).toEqual('{"lat": 40.7128, "lng": -74.0060}');
    expect(result.area_hectares).toEqual(5.25);
    expect(result.soil_type).toEqual('Loamy');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.area_hectares).toBe('number');
  });

  it('should save farm plot to database', async () => {
    const partnership = await createTestUserAndPartnership();

    const testInput: CreateFarmPlotInput = {
      partnership_id: partnership.id,
      plot_name: 'Database Test Plot',
      location_coordinates: '{"lat": 34.0522, "lng": -118.2437}',
      area_hectares: 3.75,
      soil_type: 'Clay'
    };

    const result = await createFarmPlot(testInput);

    // Query using proper drizzle syntax
    const farmPlots = await db.select()
      .from(farmPlotsTable)
      .where(eq(farmPlotsTable.id, result.id))
      .execute();

    expect(farmPlots).toHaveLength(1);
    expect(farmPlots[0].plot_name).toEqual('Database Test Plot');
    expect(farmPlots[0].location_coordinates).toEqual('{"lat": 34.0522, "lng": -118.2437}');
    expect(parseFloat(farmPlots[0].area_hectares)).toEqual(3.75);
    expect(farmPlots[0].soil_type).toEqual('Clay');
    expect(farmPlots[0].created_at).toBeInstanceOf(Date);
  });

  it('should create farm plot without soil_type', async () => {
    const partnership = await createTestUserAndPartnership();

    const testInput: CreateFarmPlotInput = {
      partnership_id: partnership.id,
      plot_name: 'No Soil Type Plot',
      location_coordinates: '{"lat": 51.5074, "lng": -0.1278}',
      area_hectares: 2.5
    };

    const result = await createFarmPlot(testInput);

    expect(result.partnership_id).toEqual(partnership.id);
    expect(result.plot_name).toEqual('No Soil Type Plot');
    expect(result.soil_type).toBeNull();
    expect(result.area_hectares).toEqual(2.5);
  });

  it('should throw error for non-existent partnership', async () => {
    const testInput: CreateFarmPlotInput = {
      partnership_id: 999,
      plot_name: 'Invalid Partnership Plot',
      location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
      area_hectares: 1.0
    };

    expect(createFarmPlot(testInput)).rejects.toThrow(/partnership.*not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    const partnership = await createTestUserAndPartnership();

    const testInput: CreateFarmPlotInput = {
      partnership_id: partnership.id,
      plot_name: 'Precision Test Plot',
      location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
      area_hectares: 10.1234, // Test decimal precision
      soil_type: 'Sandy'
    };

    const result = await createFarmPlot(testInput);

    expect(result.area_hectares).toEqual(10.1234);
    expect(typeof result.area_hectares).toBe('number');

    // Verify in database
    const saved = await db.select()
      .from(farmPlotsTable)
      .where(eq(farmPlotsTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].area_hectares)).toEqual(10.1234);
  });
});
