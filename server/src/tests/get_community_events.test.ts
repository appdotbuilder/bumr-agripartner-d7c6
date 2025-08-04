
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { communityEventsTable, usersTable } from '../db/schema';
import { getCommunityEvents } from '../handlers/get_community_events';

describe('getCommunityEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no events exist', async () => {
    const result = await getCommunityEvents();
    expect(result).toEqual([]);
  });

  it('should return all active community events', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create first test event
    await db.insert(communityEventsTable)
      .values({
        title: 'Farm Visit Event',
        description: 'Visit to the organic farm',
        event_type: 'farm_visit',
        event_date: new Date('2024-02-15'),
        location: 'Farm Location A',
        fee: '25.50',
        max_participants: 20,
        current_participants: 5,
        is_active: true,
        created_by: userId
      })
      .execute();

    // Create second test event
    await db.insert(communityEventsTable)
      .values({
        title: 'Workshop on Sustainability',
        description: 'Learn about sustainable farming',
        event_type: 'workshop',
        event_date: new Date('2024-01-10'),
        location: 'Community Center',
        fee: '0.00',
        current_participants: 12,
        is_active: true,
        created_by: userId
      })
      .execute();

    const result = await getCommunityEvents();

    expect(result).toHaveLength(2);
    
    // Should be ordered by event_date desc (newer first)
    expect(result[0].title).toEqual('Farm Visit Event');
    expect(result[0].event_date).toEqual(new Date('2024-02-15'));
    expect(result[0].fee).toEqual(25.50); // Numeric conversion
    expect(typeof result[0].fee).toBe('number');
    
    expect(result[1].title).toEqual('Workshop on Sustainability');
    expect(result[1].event_date).toEqual(new Date('2024-01-10'));
    expect(result[1].fee).toEqual(0); // Numeric conversion
    expect(typeof result[1].fee).toBe('number');
  });

  it('should only return active events', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create active event
    await db.insert(communityEventsTable)
      .values({
        title: 'Active Event',
        description: 'This event is active',
        event_type: 'meeting',
        event_date: new Date('2024-03-01'),
        location: 'Meeting Room',
        fee: '10.00',
        current_participants: 3,
        is_active: true,
        created_by: userId
      })
      .execute();

    // Create inactive event
    await db.insert(communityEventsTable)
      .values({
        title: 'Inactive Event',
        description: 'This event is inactive',
        event_type: 'other',
        event_date: new Date('2024-03-02'),
        location: 'Old Location',
        fee: '15.00',
        current_participants: 0,
        is_active: false,
        created_by: userId
      })
      .execute();

    const result = await getCommunityEvents();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Active Event');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle events with null max_participants', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create event with null max_participants
    await db.insert(communityEventsTable)
      .values({
        title: 'Unlimited Event',
        description: 'Event with no participant limit',
        event_type: 'harvest_celebration',
        event_date: new Date('2024-04-01'),
        location: 'Open Field',
        fee: '5.75',
        current_participants: 8,
        is_active: true,
        created_by: userId
      })
      .execute();

    const result = await getCommunityEvents();

    expect(result).toHaveLength(1);
    expect(result[0].max_participants).toBeNull();
    expect(result[0].current_participants).toEqual(8);
    expect(result[0].fee).toEqual(5.75);
  });
});
