
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, farmPlotsTable, financialRecordsTable } from '../db/schema';
import { getFinancialSummary } from '../handlers/get_financial_summary';

describe('getFinancialSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary for partnership with no expenses', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userResult[0].id,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '75000.00'
      })
      .returning()
      .execute();

    const result = await getFinancialSummary(partnershipResult[0].id);

    expect(result.total_expenses).toEqual(0);
    expect(result.expense_breakdown).toEqual({});
    expect(result.estimated_yield).toEqual(5);
    expect(result.current_market_price).toEqual(12000);
    expect(result.projected_revenue).toEqual(0); // No farm plots, so no revenue
  });

  it('should calculate total expenses and breakdown correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userResult[0].id,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '75000.00'
      })
      .returning()
      .execute();

    // Create financial records
    await db.insert(financialRecordsTable)
      .values([
        {
          partnership_id: partnershipResult[0].id,
          expense_type: 'seeds',
          amount: '5000.00',
          description: 'Seeds purchase',
          transaction_date: new Date('2024-01-15')
        },
        {
          partnership_id: partnershipResult[0].id,
          expense_type: 'fertilizer',
          amount: '3000.00',
          description: 'Fertilizer purchase',
          transaction_date: new Date('2024-02-01')
        },
        {
          partnership_id: partnershipResult[0].id,
          expense_type: 'seeds',
          amount: '2000.00',
          description: 'Additional seeds',
          transaction_date: new Date('2024-02-15')
        }
      ])
      .execute();

    const result = await getFinancialSummary(partnershipResult[0].id);

    expect(result.total_expenses).toEqual(10000);
    expect(result.expense_breakdown).toEqual({
      seeds: 7000,
      fertilizer: 3000
    });
    expect(result.estimated_yield).toEqual(5);
    expect(result.current_market_price).toEqual(12000);
  });

  it('should calculate projected revenue based on farm plot area', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userResult[0].id,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '75000.00'
      })
      .returning()
      .execute();

    // Create farm plots
    await db.insert(farmPlotsTable)
      .values([
        {
          partnership_id: partnershipResult[0].id,
          plot_name: 'Plot A',
          location_coordinates: '{"lat": 1.0, "lng": 2.0}',
          area_hectares: '2.5000'
        },
        {
          partnership_id: partnershipResult[0].id,
          plot_name: 'Plot B',
          location_coordinates: '{"lat": 1.1, "lng": 2.1}',
          area_hectares: '1.5000'
        }
      ])
      .execute();

    const result = await getFinancialSummary(partnershipResult[0].id);

    // Total area: 2.5 + 1.5 = 4 hectares
    // Projected revenue: 4 * 5 tons/hectare * 12000 per ton = 240000
    expect(result.projected_revenue).toEqual(240000);
    expect(result.estimated_yield).toEqual(5);
    expect(result.current_market_price).toEqual(12000);
  });

  it('should handle partnership with both expenses and farm plots', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner'
      })
      .returning()
      .execute();

    // Create test partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userResult[0].id,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '75000.00'
      })
      .returning()
      .execute();

    // Create farm plot
    await db.insert(farmPlotsTable)
      .values({
        partnership_id: partnershipResult[0].id,
        plot_name: 'Main Plot',
        location_coordinates: '{"lat": 1.0, "lng": 2.0}',
        area_hectares: '3.0000'
      })
      .execute();

    // Create financial records
    await db.insert(financialRecordsTable)
      .values([
        {
          partnership_id: partnershipResult[0].id,
          expense_type: 'equipment',
          amount: '15000.00',
          description: 'Tractor rental',
          transaction_date: new Date('2024-01-10')
        },
        {
          partnership_id: partnershipResult[0].id,
          expense_type: 'labor',
          amount: '8000.00',
          description: 'Farm workers',
          transaction_date: new Date('2024-01-20')
        }
      ])
      .execute();

    const result = await getFinancialSummary(partnershipResult[0].id);

    expect(result.total_expenses).toEqual(23000);
    expect(result.expense_breakdown).toEqual({
      equipment: 15000,
      labor: 8000
    });
    expect(result.projected_revenue).toEqual(180000); // 3 * 5 * 12000
    expect(result.estimated_yield).toEqual(5);
    expect(result.current_market_price).toEqual(12000);
  });
});
