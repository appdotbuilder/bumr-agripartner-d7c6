
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

const testInput: RegisterUserInput = {
  email: 'test@example.com',
  phone: '+1234567890',
  password: 'password123',
  full_name: 'Test User',
  role: 'partner',
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await registerUser(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.full_name).toEqual('Test User');
    expect(result.role).toEqual('partner');
    expect(result.is_verified).toEqual(false);
    expect(result.is_active).toEqual(true);
    expect(result.password_hash).toEqual('hashed_password123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await registerUser(testInput);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].role).toEqual('partner');
    expect(users[0].is_verified).toEqual(false);
    expect(users[0].is_active).toEqual(true);
  });

  it('should register user without phone number', async () => {
    const inputWithoutPhone: RegisterUserInput = {
      email: 'nophone@example.com',
      password: 'password123',
      full_name: 'No Phone User',
      role: 'farmer',
    };

    const result = await registerUser(inputWithoutPhone);

    expect(result.email).toEqual('nophone@example.com');
    expect(result.phone).toBeNull();
    expect(result.full_name).toEqual('No Phone User');
    expect(result.role).toEqual('farmer');
  });

  it('should throw error for duplicate email', async () => {
    await registerUser(testInput);

    const duplicateInput: RegisterUserInput = {
      email: 'test@example.com',
      password: 'different123',
      full_name: 'Different User',
      role: 'admin',
    };

    expect(registerUser(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should throw error for duplicate phone number', async () => {
    await registerUser(testInput);

    const duplicatePhoneInput: RegisterUserInput = {
      email: 'different@example.com',
      phone: '+1234567890',
      password: 'password123',
      full_name: 'Different User',
      role: 'management',
    };

    expect(registerUser(duplicatePhoneInput)).rejects.toThrow(/phone number already exists/i);
  });

  it('should allow duplicate phone if one is null', async () => {
    // Register user without phone
    const userWithoutPhone: RegisterUserInput = {
      email: 'user1@example.com',
      password: 'password123',
      full_name: 'User One',
      role: 'partner',
    };
    await registerUser(userWithoutPhone);

    // Register another user without phone
    const anotherUserWithoutPhone: RegisterUserInput = {
      email: 'user2@example.com',
      password: 'password123',
      full_name: 'User Two',
      role: 'farmer',
    };

    const result = await registerUser(anotherUserWithoutPhone);
    expect(result.email).toEqual('user2@example.com');
    expect(result.phone).toBeNull();
  });
});
