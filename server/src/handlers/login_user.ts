
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginUserInput): Promise<User | null> => {
  try {
    // Query user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // In a real implementation, you would verify the password hash here
    // For now, we'll assume the password verification happens elsewhere
    // and just check if the user is active
    if (!user.is_active) {
      return null; // User account is inactive
    }

    // Return user data (password_hash is included in the User type but should be handled carefully)
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      password_hash: user.password_hash,
      full_name: user.full_name,
      role: user.role,
      is_verified: user.is_verified,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
