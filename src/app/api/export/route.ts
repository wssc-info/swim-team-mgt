import { NextRequest, NextResponse } from 'next/server';
import { generateMeetManagerFile } from '@/lib/meetmanager';
import { getMeets } from '@/lib/swimmers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetId } = body;
    
    let selectedMeet = null;
    if (meetId) {
      const meets = await getMeets();
      selectedMeet = meets.find(m => m.id === meetId);
      if (!selectedMeet) {
        return NextResponse.json({ error: 'Meet not found' }, { status: 404 });
      }
    }
    
    const content = await generateMeetManagerFile(selectedMeet || undefined);
    const fileName = selectedMeet 
      ? `${selectedMeet.name.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedMeet.date.replace(/-/g, '')}.sd3`
      : `swim-meet-entries-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.sd3`;
    
    return NextResponse.json({ 
      success: true, 
      content,
      fileName 
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
