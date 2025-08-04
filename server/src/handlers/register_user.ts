
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const registerUser = async (input: RegisterUserInput): Promise<User> => {
  try {
    // Check if user with email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Check if phone is provided and already exists
    if (input.phone) {
      const existingPhoneUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.phone, input.phone))
        .execute();

      if (existingPhoneUser.length > 0) {
        throw new Error('User with this phone number already exists');
      }
    }

    // Hash the password (simple hash for demo - use bcrypt in production)
    const password_hash = `hashed_${input.password}`;

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        phone: input.phone || null,
        password_hash,
        full_name: input.full_name,
        role: input.role,
        is_verified: false,
        is_active: true,
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
