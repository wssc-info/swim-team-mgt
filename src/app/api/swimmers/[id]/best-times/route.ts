import {NextRequest, NextResponse} from 'next/server';
import {TimeRecordService} from '@/lib/services/time-record-service';

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const timeRecordService = TimeRecordService.getInstance();
        const bestTimes = await timeRecordService.getBestTimesForSwimmer(id);
        return NextResponse.json(bestTimes);
    } catch (error) {
        console.error('Error fetching best times:', error);
        return NextResponse.json({error: 'Failed to fetch best times'}, {status: 500});
    }
}
