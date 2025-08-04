
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, farmPlotsTable, riskAlertsTable } from '../db/schema';
import { type CreateRiskAlertInput } from '../schema';
import { createRiskAlert } from '../handlers/create_risk_alert';
import { eq } from 'drizzle-orm';

// Test prerequisite data
const testUser = {
  email: 'test@example.com',
  phone: '+1234567890',
  password_hash: 'hashed_password',
  full_name: 'Test Partner',
  role: 'partner' as const,
  is_verified: true,
  is_active: true
};

const testPartnership = {
  partner_id: 0, // Will be set after user creation
  investment_amount: '10000.00',
  start_date: new Date(),
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  estimated_return: '12000.00',
  current_progress: '25.50',
  current_phase: 'planting',
  status: 'active' as const
};

const testFarmPlot = {
  partnership_id: 0, // Will be set after partnership creation
  plot_name: 'Test Plot A',
  location_coordinates: '{"lat": 40.7128, "lng": -74.0060}',
  area_hectares: '2.5000',
  soil_type: 'loamy'
};

const testInput: CreateRiskAlertInput = {
  farm_plot_id: 0, // Will be set after farm plot creation
  risk_type: 'weather',
  severity_level: 3,
  title: 'Heavy Rain Warning',
  description: 'Expected heavy rainfall may cause flooding in the farm area',
  alert_date: new Date()
};

describe('createRiskAlert', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a risk alert', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values(testUser).returning().execute();
    const partnership = await db.insert(partnershipsTable)
      .values({ ...testPartnership, partner_id: user[0].id })
      .returning()
      .execute();
    const farmPlot = await db.insert(farmPlotsTable)
      .values({ ...testFarmPlot, partnership_id: partnership[0].id })
      .returning()
      .execute();

    const input = { ...testInput, farm_plot_id: farmPlot[0].id };
    const result = await createRiskAlert(input);

    // Basic field validation
    expect(result.farm_plot_id).toEqual(farmPlot[0].id);
    expect(result.risk_type).toEqual('weather');
    expect(result.severity_level).toEqual(3);
    expect(result.title).toEqual('Heavy Rain Warning');
    expect(result.description).toEqual(input.description);
    expect(result.alert_date).toBeInstanceOf(Date);
    expect(result.is_resolved).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save risk alert to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values(testUser).returning().execute();
    const partnership = await db.insert(partnershipsTable)
      .values({ ...testPartnership, partner_id: user[0].id })
      .returning()
      .execute();
    const farmPlot = await db.insert(farmPlotsTable)
      .values({ ...testFarmPlot, partnership_id: partnership[0].id })
      .returning()
      .execute();

    const input = { ...testInput, farm_plot_id: farmPlot[0].id };
    const result = await createRiskAlert(input);

    // Query database to verify record was saved
    const riskAlerts = await db.select()
      .from(riskAlertsTable)
      .where(eq(riskAlertsTable.id, result.id))
      .execute();

    expect(riskAlerts).toHaveLength(1);
    expect(riskAlerts[0].farm_plot_id).toEqual(farmPlot[0].id);
    expect(riskAlerts[0].risk_type).toEqual('weather');
    expect(riskAlerts[0].severity_level).toEqual(3);
    expect(riskAlerts[0].title).toEqual('Heavy Rain Warning');
    expect(riskAlerts[0].is_resolved).toEqual(false);
    expect(riskAlerts[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent farm plot', async () => {
    const input = { ...testInput, farm_plot_id: 999 };

    await expect(createRiskAlert(input)).rejects.toThrow(/farm plot.*not found/i);
  });

  it('should create alerts with different severity levels', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values(testUser).returning().execute();
    const partnership = await db.insert(partnershipsTable)
      .values({ ...testPartnership, partner_id: user[0].id })
      .returning()
      .execute();
    const farmPlot = await db.insert(farmPlotsTable)
      .values({ ...testFarmPlot, partnership_id: partnership[0].id })
      .returning()
      .execute();

    // Test different severity levels
    const severityLevels = [1, 2, 3, 4, 5];
    
    for (const level of severityLevels) {
      const input = {
        ...testInput,
        farm_plot_id: farmPlot[0].id,
        severity_level: level,
        title: `Alert Level ${level}`
      };
      
      const result = await createRiskAlert(input);
      expect(result.severity_level).toEqual(level);
      expect(result.title).toEqual(`Alert Level ${level}`);
    }
  });

  it('should create alerts with different risk types', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable).values(testUser).returning().execute();
    const partnership = await db.insert(partnershipsTable)
      .values({ ...testPartnership, partner_id: user[0].id })
      .returning()
      .execute();
    const farmPlot = await db.insert(farmPlotsTable)
      .values({ ...testFarmPlot, partnership_id: partnership[0].id })
      .returning()
      .execute();

    const riskTypes = ['weather', 'pest', 'disease', 'flood', 'drought', 'other'] as const;
    
    for (const riskType of riskTypes) {
      const input = {
        ...testInput,
        farm_plot_id: farmPlot[0].id,
        risk_type: riskType,
        title: `${riskType} Alert`
      };
      
      const result = await createRiskAlert(input);
      expect(result.risk_type).toEqual(riskType);
      expect(result.title).toEqual(`${riskType} Alert`);
    }
  });
});
