
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, financialRecordsTable } from '../db/schema';
import { type CreateFinancialRecordInput } from '../schema';
import { createFinancialRecord } from '../handlers/create_financial_record';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'partner@test.com',
  phone: '1234567890',
  password_hash: 'hashed_password',
  full_name: 'Test Partner',
  role: 'partner' as const,
};

// Test partnership data
const testPartnership = {
  investment_amount: '10000.00',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  estimated_return: '15000.00',
  current_progress: '25.50',
  current_phase: 'planting',
  status: 'active' as const,
};

// Test financial record input
const testInput: CreateFinancialRecordInput = {
  partnership_id: 1,
  expense_type: 'equipment',
  amount: 500.75,
  description: 'Purchase of farming tools',
  transaction_date: new Date('2024-03-15'),
  receipt_url: 'https://example.com/receipt.pdf',
};

describe('createFinancialRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a financial record', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create prerequisite partnership
    await db.insert(partnershipsTable)
      .values({
        ...testPartnership,
        partner_id: userResult[0].id,
      })
      .returning()
      .execute();

    const result = await createFinancialRecord(testInput);

    // Basic field validation
    expect(result.partnership_id).toEqual(1);
    expect(result.expense_type).toEqual('equipment');
    expect(result.amount).toEqual(500.75);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Purchase of farming tools');
    expect(result.transaction_date).toEqual(new Date('2024-03-15'));
    expect(result.receipt_url).toEqual('https://example.com/receipt.pdf');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save financial record to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create prerequisite partnership
    await db.insert(partnershipsTable)
      .values({
        ...testPartnership,
        partner_id: userResult[0].id,
      })
      .returning()
      .execute();

    const result = await createFinancialRecord(testInput);

    // Query using proper drizzle syntax
    const records = await db.select()
      .from(financialRecordsTable)
      .where(eq(financialRecordsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].partnership_id).toEqual(1);
    expect(records[0].expense_type).toEqual('equipment');
    expect(parseFloat(records[0].amount)).toEqual(500.75);
    expect(records[0].description).toEqual('Purchase of farming tools');
    expect(records[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle optional receipt_url', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create prerequisite partnership
    await db.insert(partnershipsTable)
      .values({
        ...testPartnership,
        partner_id: userResult[0].id,
      })
      .returning()
      .execute();

    const inputWithoutReceipt = {
      ...testInput,
      receipt_url: undefined,
    };

    const result = await createFinancialRecord(inputWithoutReceipt);

    expect(result.receipt_url).toBeNull();
  });

  it('should throw error when partnership does not exist', async () => {
    const inputWithInvalidPartnership = {
      ...testInput,
      partnership_id: 999,
    };

    expect(createFinancialRecord(inputWithInvalidPartnership))
      .rejects.toThrow(/Partnership with id 999 does not exist/i);
  });

  it('should handle different expense types', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create prerequisite partnership
    await db.insert(partnershipsTable)
      .values({
        ...testPartnership,
        partner_id: userResult[0].id,
      })
      .returning()
      .execute();

    const inputWithDifferentType = {
      ...testInput,
      expense_type: 'fertilizer' as const,
      description: 'Organic fertilizer purchase',
    };

    const result = await createFinancialRecord(inputWithDifferentType);

    expect(result.expense_type).toEqual('fertilizer');
    expect(result.description).toEqual('Organic fertilizer purchase');
  });
});
