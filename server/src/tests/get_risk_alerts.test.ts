
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, farmPlotsTable, riskAlertsTable } from '../db/schema';
import { getRiskAlerts } from '../handlers/get_risk_alerts';

describe('getRiskAlerts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all risk alerts when no farm plot filter is provided', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    const partnership = await db.insert(partnershipsTable)
      .values({
        partner_id: user[0].id,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '12000.00'
      })
      .returning()
      .execute();

    const farmPlot = await db.insert(farmPlotsTable)
      .values({
        partnership_id: partnership[0].id,
        plot_name: 'Test Plot',
        location_coordinates: '{"lat": 1.0, "lng": 2.0}',
        area_hectares: '5.0000'
      })
      .returning()
      .execute();

    // Create multiple risk alerts with different severity levels
    await db.insert(riskAlertsTable)
      .values([
        {
          farm_plot_id: farmPlot[0].id,
          risk_type: 'weather',
          severity_level: 5,
          title: 'Severe Storm Warning',
          description: 'Heavy storms expected',
          alert_date: new Date('2024-01-15')
        },
        {
          farm_plot_id: farmPlot[0].id,
          risk_type: 'pest',
          severity_level: 3,
          title: 'Pest Detection',
          description: 'Minor pest activity observed',
          alert_date: new Date('2024-01-10')
        }
      ])
      .execute();

    const results = await getRiskAlerts();

    expect(results).toHaveLength(2);
    
    // Should be ordered by severity (descending) first
    expect(results[0].severity_level).toEqual(5);
    expect(results[0].title).toEqual('Severe Storm Warning');
    expect(results[1].severity_level).toEqual(3);
    expect(results[1].title).toEqual('Pest Detection');

    // Verify all fields are present
    expect(results[0].id).toBeDefined();
    expect(results[0].farm_plot_id).toEqual(farmPlot[0].id);
    expect(results[0].risk_type).toEqual('weather');
    expect(results[0].description).toEqual('Heavy storms expected');
    expect(results[0].alert_date).toBeInstanceOf(Date);
    expect(results[0].is_resolved).toEqual(false);
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter risk alerts by farm plot id', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    const partnership = await db.insert(partnershipsTable)
      .values({
        partner_id: user[0].id,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '12000.00'
      })
      .returning()
      .execute();

    // Create two farm plots
    const farmPlots = await db.insert(farmPlotsTable)
      .values([
        {
          partnership_id: partnership[0].id,
          plot_name: 'Plot A',
          location_coordinates: '{"lat": 1.0, "lng": 2.0}',
          area_hectares: '5.0000'
        },
        {
          partnership_id: partnership[0].id,
          plot_name: 'Plot B',
          location_coordinates: '{"lat": 3.0, "lng": 4.0}',
          area_hectares: '3.0000'
        }
      ])
      .returning()
      .execute();

    // Create risk alerts for different plots
    await db.insert(riskAlertsTable)
      .values([
        {
          farm_plot_id: farmPlots[0].id,
          risk_type: 'weather',
          severity_level: 4,
          title: 'Plot A Alert',
          description: 'Alert for plot A',
          alert_date: new Date('2024-01-15')
        },
        {
          farm_plot_id: farmPlots[1].id,
          risk_type: 'pest',
          severity_level: 2,
          title: 'Plot B Alert',
          description: 'Alert for plot B',
          alert_date: new Date('2024-01-10')
        }
      ])
      .execute();

    // Filter by first farm plot
    const results = await getRiskAlerts(farmPlots[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].farm_plot_id).toEqual(farmPlots[0].id);
    expect(results[0].title).toEqual('Plot A Alert');
    expect(results[0].severity_level).toEqual(4);
  });

  it('should return empty array when no risk alerts exist', async () => {
    const results = await getRiskAlerts();
    expect(results).toHaveLength(0);
  });

  it('should return empty array when filtering by non-existent farm plot', async () => {
    const results = await getRiskAlerts(999);
    expect(results).toHaveLength(0);
  });

  it('should order alerts by severity level and creation date correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    const partnership = await db.insert(partnershipsTable)
      .values({
        partner_id: user[0].id,
        investment_amount: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '12000.00'
      })
      .returning()
      .execute();

    const farmPlot = await db.insert(farmPlotsTable)
      .values({
        partnership_id: partnership[0].id,
        plot_name: 'Test Plot',
        location_coordinates: '{"lat": 1.0, "lng": 2.0}',
        area_hectares: '5.0000'
      })
      .returning()
      .execute();

    // Create alerts with different severity and dates
    const baseDate = new Date('2024-01-01');
    await db.insert(riskAlertsTable)
      .values([
        {
          farm_plot_id: farmPlot[0].id,
          risk_type: 'weather',
          severity_level: 3,
          title: 'Medium Priority - Older',
          description: 'Medium priority alert created earlier',
          alert_date: baseDate
        },
        {
          farm_plot_id: farmPlot[0].id,
          risk_type: 'pest',
          severity_level: 5,
          title: 'High Priority',
          description: 'High priority alert',
          alert_date: baseDate
        },
        {
          farm_plot_id: farmPlot[0].id,
          risk_type: 'drought',
          severity_level: 3,
          title: 'Medium Priority - Newer',
          description: 'Medium priority alert created later',
          alert_date: baseDate
        }
      ])
      .execute();

    const results = await getRiskAlerts();

    expect(results).toHaveLength(3);
    
    // First should be highest severity
    expect(results[0].severity_level).toEqual(5);
    expect(results[0].title).toEqual('High Priority');
    
    // Next two should be medium severity, ordered by creation date (descending)
    expect(results[1].severity_level).toEqual(3);
    expect(results[2].severity_level).toEqual(3);
    
    // Verify creation dates are in descending order for same severity
    expect(results[1].created_at >= results[2].created_at).toBe(true);
  });
});
