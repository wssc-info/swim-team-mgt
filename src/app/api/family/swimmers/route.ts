import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'family') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get swimmers associated with this family user
    const query = `
      SELECT s.* 
      FROM swimmers s
      INNER JOIN family_swimmer_associations fsa ON s.id = fsa.swimmer_id
      WHERE fsa.user_id = ?
      ORDER BY s.first_name, s.last_name
    `;

    const swimmers = await db.all(query, [decoded.userId]);

    return NextResponse.json(swimmers);
  } catch (error) {
    console.error('Error fetching family swimmers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
