import { NextRequest, NextResponse } from "next/server";
import DatabaseConnection from "@/lib/db-connection";
import { initializeDatabase } from "@/lib/models";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.DB_SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initializeDatabase();
    await DatabaseConnection.getInstance().syncModels();
    return NextResponse.json({ message: 'Database synced successfully' });
  } catch (error) {
    console.error('Error syncing database:', error);
    return NextResponse.json({ error: 'Failed to sync database' }, { status: 500 });
  }
}