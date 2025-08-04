
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, partnershipsTable, insurancePoliciesTable } from '../db/schema';
import { type CreateInsurancePolicyInput } from '../schema';
import { createInsurancePolicy } from '../handlers/create_insurance_policy';
import { eq } from 'drizzle-orm';

describe('createInsurancePolicy', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let partnershipId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'partner@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Partner',
        role: 'partner',
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create prerequisite partnership
    const partnershipResult = await db.insert(partnershipsTable)
      .values({
        partner_id: userId,
        investment_amount: '50000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        estimated_return: '65000.00',
      })
      .returning()
      .execute();
    partnershipId = partnershipResult[0].id;
  });

  const testInput: CreateInsurancePolicyInput = {
    partnership_id: 0, // Will be set in tests
    policy_number: 'POL-2024-001',
    coverage_amount: 75000.50,
    premium_amount: 2500.25,
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-12-15'),
    coverage_details: 'Comprehensive farm insurance coverage including crop loss, equipment damage, and liability protection',
  };

  it('should create an insurance policy', async () => {
    const input = { ...testInput, partnership_id: partnershipId };
    const result = await createInsurancePolicy(input);

    // Basic field validation
    expect(result.partnership_id).toEqual(partnershipId);
    expect(result.policy_number).toEqual('POL-2024-001');
    expect(result.coverage_amount).toEqual(75000.50);
    expect(typeof result.coverage_amount).toBe('number');
    expect(result.premium_amount).toEqual(2500.25);
    expect(typeof result.premium_amount).toBe('number');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.coverage_details).toEqual(testInput.coverage_details);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save insurance policy to database', async () => {
    const input = { ...testInput, partnership_id: partnershipId };
    const result = await createInsurancePolicy(input);

    // Query using proper drizzle syntax
    const policies = await db.select()
      .from(insurancePoliciesTable)
      .where(eq(insurancePoliciesTable.id, result.id))
      .execute();

    expect(policies).toHaveLength(1);
    expect(policies[0].partnership_id).toEqual(partnershipId);
    expect(policies[0].policy_number).toEqual('POL-2024-001');
    expect(parseFloat(policies[0].coverage_amount)).toEqual(75000.50);
    expect(parseFloat(policies[0].premium_amount)).toEqual(2500.25);
    expect(policies[0].coverage_details).toEqual(testInput.coverage_details);
    expect(policies[0].is_active).toBe(true);
    expect(policies[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent partnership', async () => {
    const input = { ...testInput, partnership_id: 99999 };

    await expect(createInsurancePolicy(input)).rejects.toThrow(/partnership.*not found/i);
  });

  it('should throw error for duplicate policy number', async () => {
    const input = { ...testInput, partnership_id: partnershipId };
    
    // Create first policy
    await createInsurancePolicy(input);

    // Try to create second policy with same policy number
    await expect(createInsurancePolicy(input)).rejects.toThrow();
  });
});
