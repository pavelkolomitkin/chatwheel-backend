import {IsBoolean, IsNotEmpty, Validate} from 'class-validator';
import {EntityExistsValidator} from '../../core/validators/entity-exists.validator';
import {ClientUser} from '../../core/schemas/client-user.schema';

export class InitiateCallDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [ClientUser.name, 'id'], { message: 'The user is not found!' })
    addresseeId: string;

    @IsNotEmpty()
    @IsBoolean()
    isDirect: boolean = false;

    @IsNotEmpty()
    socketId: string;
}