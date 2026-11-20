import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import {
  FamilySwimmerAssociationModel,
  SwimmerModel,
  initializeDatabase,
} from '@/lib/models';
import { AuthService } from '@/lib/services/auth-service';
import { calculateAgeGroup } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const user = await AuthService.getInstance().getUser(request);
    if (!user || user.role !== 'family') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, dateOfBirth, gender } = await request.json();

    if (!firstName || !lastName || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: 'First name, last name, date of birth, and gender are required' },
        { status: 400 }
      );
    }

    // Check if family already has a pending or approved association for this swimmer
    const existingSwimmer = await SwimmerModel.findOne({
      where: {
        firstName: { [Op.like]: firstName },
        lastName: { [Op.like]: lastName },
        dateOfBirth,
        gender,
      },
    });

    let swimmer = existingSwimmer;
    let matched = false;

    if (existingSwimmer) {
      // Check if this family already has an association (any status)
      const existingAssoc = await FamilySwimmerAssociationModel.findOne({
        where: { userId: user.id, swimmerId: existingSwimmer.id },
      });
      if (existingAssoc) {
        return NextResponse.json(
          { error: 'You already have a connection to this swimmer', status: existingAssoc.status },
          { status: 409 }
        );
      }
      matched = true;
    } else {
      // No match — create a new swimmer record assigned to the family's club
      swimmer = await SwimmerModel.create({
        id: uuidv4(),
        firstName,
        lastName,
        middleInitial: '',
        dateOfBirth,
        gender,
        ageGroup: calculateAgeGroup(dateOfBirth),
        active: false,
        clubId: user.clubId || undefined,
      });
    }

    const association = await FamilySwimmerAssociationModel.create({
      id: uuidv4(),
      userId: user.id,
      swimmerId: swimmer!.id,
      status: 'pending',
    });

    return NextResponse.json({
      matched,
      swimmer: { id: swimmer!.id, firstName: swimmer!.firstName, lastName: swimmer!.lastName },
      associationId: association.id,
    });
  } catch (error) {
    console.error('Error claiming swimmer:', error);
    return NextResponse.json({ error: 'Failed to claim swimmer' }, { status: 500 });
  }
}
