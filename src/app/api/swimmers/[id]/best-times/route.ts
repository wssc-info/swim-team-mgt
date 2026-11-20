import {NextRequest, NextResponse} from 'next/server';
import {TimeRecordService} from '@/lib/services/time-record-service';
import {AuthService} from '@/lib/services/auth-service';

export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const user = await AuthService.getInstance().getUser(request);
        if (!user) {
            return NextResponse.json({error: 'Must be logged in.'}, {status: 401});
        }

        const {id} = await params;
        const timeRecordService = TimeRecordService.getInstance();
        const bestTimes = await timeRecordService.getBestTimesForSwimmer(id);
        return NextResponse.json(bestTimes);
    } catch (error) {
        console.error('Error fetching best times:', error);
        return NextResponse.json({error: 'Failed to fetch best times'}, {status: 500});
    }
}
