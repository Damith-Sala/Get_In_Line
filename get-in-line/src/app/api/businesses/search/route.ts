import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { businesses } from '@/lib/drizzle/schema';
import { ilike, or, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ businesses: [] });
    }

    // Search businesses by name or business type
    const results = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        description: businesses.description,
        businessType: businesses.businessType,
        isActive: businesses.isActive,
      })
      .from(businesses)
      .where(
        or(
          ilike(businesses.name, `%${query}%`),
          ilike(businesses.businessType, `%${query}%`)
        )
      )
      .limit(10);

    // Only return active businesses
    const activeBusinesses = results.filter(b => b.isActive);

    return NextResponse.json({ businesses: activeBusinesses });
  } catch (error) {
    console.error('Business search error:', error);
    return NextResponse.json(
      { error: 'Failed to search businesses' },
      { status: 500 }
    );
  }
}

