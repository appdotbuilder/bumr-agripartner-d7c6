
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  phone: '+1234567890',
  password_hash: 'hashed_password_123',
  full_name: 'Test User',
  role: 'partner' as const,
  is_verified: true,
  is_active: true,
};

const loginInput: LoginUserInput = {
  email: 'test@example.com',
  password: 'password123',
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user data for valid email', async () => {
    // Create test user
    const createdUsers = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.full_name).toEqual('Test User');
    expect(result!.role).toEqual('partner');
    expect(result!.is_verified).toBe(true);
    expect(result!.is_active).toBe(true);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.password_hash).toEqual('hashed_password_123');
  });

  it('should return null for non-existent email', async () => {
    const nonExistentInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    const result = await loginUser(nonExistentInput);

    expect(result).toBeNull();
  });

  it('should return null for inactive user', async () => {
    // Create inactive user
    const inactiveUser = {
      ...testUser,
      is_active: false,
    };

    await db.insert(usersTable)
      .values(inactiveUser)
      .returning()
      .execute();

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return user data for unverified but active user', async () => {
    // Create unverified but active user
    const unverifiedUser = {
      ...testUser,
      is_verified: false,
    };

    await db.insert(usersTable)
      .values(unverifiedUser)
      .returning()
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.is_verified).toBe(false);
    expect(result!.is_active).toBe(true);
  });

  it('should handle different user roles', async () => {
    // Test with admin role
    const adminUser = {
      ...testUser,
      email: 'admin@example.com',
      role: 'admin' as const,
    };

    await db.insert(usersTable)
      .values(adminUser)
      .returning()
      .execute();

    const adminLoginInput: LoginUserInput = {
      email: 'admin@example.com',
      password: 'password123',
    };

    const result = await loginUser(adminLoginInput);

    expect(result).not.toBeNull();
    expect(result!.role).toEqual('admin');
  });

  it('should return user with phone number when provided', async () => {
    await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.phone).toEqual('+1234567890');
  });

  it('should return user with null phone when not provided', async () => {
    // Create user without phone
    const userWithoutPhone = {
      ...testUser,
      phone: null,
    };

    await db.insert(usersTable)
      .values(userWithoutPhone)
      .returning()
      .execute();

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.phone).toBeNull();
  });
});
