import {syncModels} from "@/lib/models";
import {NextResponse} from "next/server";

export async function GET() {
  try {
    await syncModels();

    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}