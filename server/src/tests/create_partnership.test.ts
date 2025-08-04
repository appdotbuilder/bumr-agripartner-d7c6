
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partnershipsTable, usersTable } from '../db/schema';
import { type CreatePartnershipInput } from '../schema';
import { createPartnership } from '../handlers/create_partnership';
import { eq } from 'drizzle-orm';

describe('createPartnership', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let partnerId: number;

  beforeEach(async () => {
    // Create a test partner user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'partner@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Partner',
        role: 'partner',
        is_verified: true,
        is_active: true
      })
      .returning()
      .execute();
    
    partnerId = userResult[0].id;
  });

  const testInput: CreatePartnershipInput = {
    partner_id: 0, // Will be set in each test
    investment_amount: 50000.00,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    estimated_return: 65000.00
  };

  it('should create a partnership', async () => {
    const input = { ...testInput, partner_id: partnerId };
    const result = await createPartnership(input);

    // Basic field validation
    expect(result.partner_id).toEqual(partnerId);
    expect(result.investment_amount).toEqual(50000.00);
    expect(typeof result.investment_amount).toBe('number');
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.estimated_return).toEqual(65000.00);
    expect(typeof result.estimated_return).toBe('number');
    expect(result.current_progress).toEqual(0);
    expect(typeof result.current_progress).toBe('number');
    expect(result.current_phase).toEqual('planning');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save partnership to database', async () => {
    const input = { ...testInput, partner_id: partnerId };
    const result = await createPartnership(input);

    // Query using proper drizzle syntax
    const partnerships = await db.select()
      .from(partnershipsTable)
      .where(eq(partnershipsTable.id, result.id))
      .execute();

    expect(partnerships).toHaveLength(1);
    expect(partnerships[0].partner_id).toEqual(partnerId);
    expect(parseFloat(partnerships[0].investment_amount)).toEqual(50000.00);
    expect(parseFloat(partnerships[0].estimated_return)).toEqual(65000.00);
    expect(parseFloat(partnerships[0].current_progress)).toEqual(0);
    expect(partnerships[0].current_phase).toEqual('planning');
    expect(partnerships[0].status).toEqual('pending');
    expect(partnerships[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent partner', async () => {
    const input = { ...testInput, partner_id: 999999 };
    
    expect(createPartnership(input)).rejects.toThrow(/partner not found/i);
  });

  it('should throw error for user with wrong role', async () => {
    // Create a user with 'farmer' role instead of 'partner'
    const farmerResult = await db.insert(usersTable)
      .values({
        email: 'farmer@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Farmer',
        role: 'farmer',
        is_verified: true,
        is_active: true
      })
      .returning()
      .execute();

    const input = { ...testInput, partner_id: farmerResult[0].id };
    
    expect(createPartnership(input)).rejects.toThrow(/user is not a partner/i);
  });
});
