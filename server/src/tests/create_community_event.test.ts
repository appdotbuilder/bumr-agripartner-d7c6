
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { communityEventsTable, usersTable } from '../db/schema';
import { type CreateCommunityEventInput } from '../schema';
import { createCommunityEvent } from '../handlers/create_community_event';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'organizer@example.com',
  phone: '+1234567890',
  password_hash: 'hashed_password',
  full_name: 'Event Organizer',
  role: 'management' as const,
};

// Test event input
const testInput: CreateCommunityEventInput = {
  title: 'Farm Visit Day',
  description: 'Come visit our organic farm and learn about sustainable farming practices',
  event_type: 'farm_visit',
  event_date: new Date('2024-12-15T10:00:00Z'),
  location: 'Green Valley Farm, Plot 123',
  fee: 25.50,
  max_participants: 30,
  created_by: 1 // Will be set after user creation
};

describe('createCommunityEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a community event', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input = { ...testInput, created_by: userId };

    const result = await createCommunityEvent(input);

    // Basic field validation
    expect(result.title).toEqual('Farm Visit Day');
    expect(result.description).toEqual(testInput.description);
    expect(result.event_type).toEqual('farm_visit');
    expect(result.event_date).toEqual(testInput.event_date);
    expect(result.location).toEqual(testInput.location);
    expect(result.fee).toEqual(25.50);
    expect(typeof result.fee).toBe('number');
    expect(result.max_participants).toEqual(30);
    expect(result.current_participants).toEqual(0);
    expect(result.is_active).toBe(true);
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save event to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input = { ...testInput, created_by: userId };

    const result = await createCommunityEvent(input);

    // Query database to verify event was saved
    const events = await db.select()
      .from(communityEventsTable)
      .where(eq(communityEventsTable.id, result.id))
      .execute();

    expect(events).toHaveLength(1);
    expect(events[0].title).toEqual('Farm Visit Day');
    expect(events[0].description).toEqual(testInput.description);
    expect(events[0].event_type).toEqual('farm_visit');
    expect(events[0].event_date).toEqual(testInput.event_date);
    expect(events[0].location).toEqual(testInput.location);
    expect(parseFloat(events[0].fee)).toEqual(25.50);
    expect(events[0].max_participants).toEqual(30);
    expect(events[0].current_participants).toEqual(0);
    expect(events[0].is_active).toBe(true);
    expect(events[0].created_by).toEqual(userId);
    expect(events[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle event with no fee', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input = { 
      ...testInput, 
      created_by: userId,
      fee: 0
    };

    const result = await createCommunityEvent(input);

    expect(result.fee).toEqual(0);
    expect(typeof result.fee).toBe('number');
  });

  it('should handle event with no max participants limit', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = userResult[0].id;
    const input: CreateCommunityEventInput = {
      title: 'Open Workshop',
      description: 'Workshop open to all interested participants',
      event_type: 'workshop',
      event_date: new Date('2024-12-20T14:00:00Z'),
      location: 'Community Center',
      fee: 0,
      created_by: userId
    };

    const result = await createCommunityEvent(input);

    expect(result.max_participants).toBeNull();
    expect(result.current_participants).toEqual(0);
  });

  it('should throw error when creator does not exist', async () => {
    const input = { ...testInput, created_by: 999 }; // Non-existent user ID

    await expect(createCommunityEvent(input)).rejects.toThrow(/creator user not found/i);
  });
});
