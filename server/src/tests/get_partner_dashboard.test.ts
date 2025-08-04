
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  partnershipsTable, 
  farmPlotsTable, 
  farmActivitiesTable,
  financialRecordsTable,
  notificationsTable,
  riskAlertsTable
} from '../db/schema';
import { getPartnerDashboard } from '../handlers/get_partner_dashboard';

describe('getPartnerDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get comprehensive dashboard data for a partner', async () => {
    // Create test user (partner)
    const users = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Partner',
        role: 'partner',
        is_verified: true,
        is_active: true,
      })
      .returning()
      .execute();

    const partnerId = users[0].id;

    // Create farmer user for activities
    const farmers = await db.insert(usersTable)
      .values({
        email: 'farmer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Farmer',
        role: 'farmer',
        is_verified: true,
        is_active: true,
      })
      .returning()
      .execute();

    const farmerId = farmers[0].id;

    // Create partnership
    const partnerships = await db.insert(partnershipsTable)
      .values({
        partner_id: partnerId,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '62500.00',
        current_progress: '45.50',
        current_phase: 'growing',
        status: 'active',
      })
      .returning()
      .execute();

    const partnershipId = partnerships[0].id;

    // Create farm plots
    const farmPlots = await db.insert(farmPlotsTable)
      .values([
        {
          partnership_id: partnershipId,
          plot_name: 'North Field',
          location_coordinates: '{"lat": -1.2921, "lng": 36.8219}',
          area_hectares: '2.5000',
          soil_type: 'Clay loam',
        },
        {
          partnership_id: partnershipId,
          plot_name: 'South Field',
          location_coordinates: '{"lat": -1.2950, "lng": 36.8200}',
          area_hectares: '1.8000',
          soil_type: 'Sandy loam',
        }
      ])
      .returning()
      .execute();

    // Create farm activities
    await db.insert(farmActivitiesTable)
      .values([
        {
          farm_plot_id: farmPlots[0].id,
          activity_type: 'planting',
          description: 'Planted maize seeds',
          activity_date: new Date('2024-02-01'),
          photos: ['photo1.jpg', 'photo2.jpg'],
          videos: ['video1.mp4'],
          created_by: farmerId,
        },
        {
          farm_plot_id: farmPlots[1].id,
          activity_type: 'fertilizing',
          description: 'Applied nitrogen fertilizer',
          activity_date: new Date('2024-02-15'),
          photos: null,
          videos: null,
          created_by: farmerId,
        }
      ])
      .execute();

    // Create financial records
    await db.insert(financialRecordsTable)
      .values([
        {
          partnership_id: partnershipId,
          expense_type: 'seeds',
          amount: '5000.00',
          description: 'Maize seeds purchase',
          transaction_date: new Date('2024-01-15'),
          receipt_url: 'receipt1.pdf',
        },
        {
          partnership_id: partnershipId,
          expense_type: 'fertilizer',
          amount: '3000.00',
          description: 'Nitrogen fertilizer',
          transaction_date: new Date('2024-02-10'),
          receipt_url: null,
        },
        {
          partnership_id: partnershipId,
          expense_type: 'labor',
          amount: '2000.00',
          description: 'Farm labor costs',
          transaction_date: new Date('2024-02-20'),
          receipt_url: null,
        }
      ])
      .execute();

    // Create notifications with different timestamps
    const baseTime = new Date('2024-03-01T10:00:00Z');
    await db.insert(notificationsTable)
      .values([
        {
          user_id: partnerId,
          title: 'Progress Update',
          message: 'Your farm plots have been planted successfully',
          notification_type: 'progress_update',
          is_read: false,
          created_at: baseTime,
        },
        {
          user_id: partnerId,
          title: 'Payment Due',
          message: 'Insurance premium payment is due',
          notification_type: 'payment',
          is_read: true,
          created_at: new Date(baseTime.getTime() + 1000), // 1 second later
        }
      ])
      .execute();

    // Create risk alerts
    await db.insert(riskAlertsTable)
      .values([
        {
          farm_plot_id: farmPlots[0].id,
          risk_type: 'weather',
          severity_level: 3,
          title: 'Heavy Rain Warning',
          description: 'Heavy rainfall expected in the next 48 hours',
          alert_date: new Date('2024-03-01'),
          is_resolved: false,
        },
        {
          farm_plot_id: farmPlots[1].id,
          risk_type: 'pest',
          severity_level: 2,
          title: 'Aphid Infestation',
          description: 'Low level aphid activity detected',
          alert_date: new Date('2024-02-25'),
          is_resolved: true,
        }
      ])
      .execute();

    // Get dashboard data
    const result = await getPartnerDashboard(partnerId);

    // Verify partnership data
    expect(result.partnership).toBeDefined();
    expect(result.partnership.id).toBe(partnershipId);
    expect(result.partnership.partner_id).toBe(partnerId);
    expect(result.partnership.investment_amount).toBe(50000.00);
    expect(result.partnership.estimated_return).toBe(62500.00);
    expect(result.partnership.current_progress).toBe(45.50);
    expect(result.partnership.current_phase).toBe('growing');
    expect(result.partnership.status).toBe('active');

    // Verify farm plots
    expect(result.farm_plots).toHaveLength(2);
    expect(result.farm_plots[0].plot_name).toBe('North Field');
    expect(result.farm_plots[0].area_hectares).toBe(2.5);
    expect(result.farm_plots[1].plot_name).toBe('South Field');
    expect(result.farm_plots[1].area_hectares).toBe(1.8);

    // Verify recent activities
    expect(result.recent_activities).toHaveLength(2);
    expect(result.recent_activities[0].activity_type).toBe('fertilizing'); // Most recent first
    expect(result.recent_activities[0].description).toBe('Applied nitrogen fertilizer');
    expect(result.recent_activities[1].activity_type).toBe('planting');
    expect(result.recent_activities[1].photos).toEqual(['photo1.jpg', 'photo2.jpg']);
    expect(result.recent_activities[1].videos).toEqual(['video1.mp4']);

    // Verify financial summary
    expect(result.financial_summary.total_expenses).toBe(10000);
    expect(result.financial_summary.expense_breakdown).toEqual({
      seeds: 5000,
      fertilizer: 3000,
      labor: 2000,
    });

    // Verify notifications
    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0].title).toBe('Payment Due'); // Most recent first
    expect(result.notifications[1].title).toBe('Progress Update');

    // Verify risk alerts
    expect(result.risk_alerts).toHaveLength(2);
    expect(result.risk_alerts[0].title).toBe('Heavy Rain Warning'); // Most recent first
    expect(result.risk_alerts[0].severity_level).toBe(3);
    expect(result.risk_alerts[1].title).toBe('Aphid Infestation');
    expect(result.risk_alerts[1].is_resolved).toBe(true);
  });

  it('should handle partner with no farm plots', async () => {
    // Create test user (partner)
    const users = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Partner',
        role: 'partner',
        is_verified: true,
        is_active: true,
      })
      .returning()
      .execute();

    const partnerId = users[0].id;

    // Create partnership but no farm plots
    await db.insert(partnershipsTable)
      .values({
        partner_id: partnerId,
        investment_amount: '25000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '31250.00',
        current_progress: '0.00',
        current_phase: 'planning',
        status: 'pending',
      })
      .execute();

    const result = await getPartnerDashboard(partnerId);

    expect(result.partnership).toBeDefined();
    expect(result.partnership.current_phase).toBe('planning');
    expect(result.farm_plots).toHaveLength(0);
    expect(result.recent_activities).toHaveLength(0);
    expect(result.financial_summary.total_expenses).toBe(0);
    expect(result.financial_summary.expense_breakdown).toEqual({});
    expect(result.risk_alerts).toHaveLength(0);
  });

  it('should throw error when partnership not found', async () => {
    const nonExistentPartnerId = 999;

    expect(getPartnerDashboard(nonExistentPartnerId)).rejects.toThrow(/partnership not found/i);
  });

  it('should handle single farm plot correctly', async () => {
    // Create test user (partner)
    const users = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Partner',
        role: 'partner',
        is_verified: true,
        is_active: true,
      })
      .returning()
      .execute();

    const partnerId = users[0].id;

    // Create farmer user
    const farmers = await db.insert(usersTable)
      .values({
        email: 'farmer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Farmer',
        role: 'farmer',
        is_verified: true,
        is_active: true,
      })
      .returning()
      .execute();

    const farmerId = farmers[0].id;

    // Create partnership
    const partnerships = await db.insert(partnershipsTable)
      .values({
        partner_id: partnerId,
        investment_amount: '30000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '37500.00',
        current_progress: '25.00',
        current_phase: 'growing',
        status: 'active',
      })
      .returning()
      .execute();

    const partnershipId = partnerships[0].id;

    // Create single farm plot
    const farmPlots = await db.insert(farmPlotsTable)
      .values({
        partnership_id: partnershipId,
        plot_name: 'Main Field',
        location_coordinates: '{"lat": -1.2921, "lng": 36.8219}',
        area_hectares: '3.0000',
        soil_type: 'Fertile loam',
      })
      .returning()
      .execute();

    // Create activity for single plot
    await db.insert(farmActivitiesTable)
      .values({
        farm_plot_id: farmPlots[0].id,
        activity_type: 'watering',
        description: 'Irrigation system activated',
        activity_date: new Date('2024-03-01'),
        photos: null,
        videos: null,
        created_by: farmerId,
      })
      .execute();

    // Create risk alert for single plot
    await db.insert(riskAlertsTable)
      .values({
        farm_plot_id: farmPlots[0].id,
        risk_type: 'drought',
        severity_level: 4,
        title: 'Water Shortage Alert',
        description: 'Low water levels detected',
        alert_date: new Date('2024-03-01'),
        is_resolved: false,
      })
      .execute();

    const result = await getPartnerDashboard(partnerId);

    expect(result.farm_plots).toHaveLength(1);
    expect(result.farm_plots[0].plot_name).toBe('Main Field');
    expect(result.recent_activities).toHaveLength(1);
    expect(result.recent_activities[0].activity_type).toBe('watering');
    expect(result.risk_alerts).toHaveLength(1);
    expect(result.risk_alerts[0].risk_type).toBe('drought');
    expect(result.risk_alerts[0].severity_level).toBe(4);
  });
});
