// import { NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from '@/lib/auth';
// // import { db } from '@/lib/db';
//
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await params;
//     const token = request.headers.get('authorization')?.replace('Bearer ', '');
//
//     if (!token) {
//       return NextResponse.json({ error: 'No token provided' }, { status: 401 });
//     }
//
//     const decoded = verifyToken(token);
//     if (!decoded) {
//       return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
//     }
//
//     // For family users, verify they have access to this swimmer
//     if (decoded.role === 'family') {
//       const associationQuery = `
//         SELECT 1 FROM family_swimmer_associations
//         WHERE user_id = ? AND swimmer_id = ?
//       `;
//       const association = null; //await db.get(associationQuery, [decoded.userId, id]);
//
//       if (!association) {
//         return NextResponse.json({ error: 'Access denied' }, { status: 403 });
//       }
//     }
//
//     // Get time records for the swimmer
//     const query = `
//       SELECT * FROM time_records
//       WHERE swimmer_id = ?
//       ORDER BY meet_date DESC, created_at DESC
//     `;
//
//     const timeRecords = await db.all(query, [id]);
//
//     // Convert snake_case to camelCase for the frontend
//     const formattedRecords = timeRecords.map((record: any) => ({
//       id: record.id,
//       swimmerId: record.swimmer_id,
//       eventId: record.event_id,
//       time: record.time,
//       meetName: record.meet_name,
//       meetDate: record.meet_date,
//       isPersonalBest: Boolean(record.is_personal_best),
//       createdAt: record.created_at,
//     }));
//
//     return NextResponse.json(formattedRecords);
//   } catch (error) {
//     console.error('Error fetching swimmer times:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }
