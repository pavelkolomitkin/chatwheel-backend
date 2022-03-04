import {Transform} from 'class-transformer';
import {IsNotEmpty, MaxLength, Validate} from 'class-validator';
import {EntityExistsValidator} from '../../core/validators/entity-exists.validator';
import {ClientUser} from '../../core/schemas/client-user.schema';

export class SentMessageUserDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [ClientUser.name, 'id'], { message: 'The user is not found!' })
    addresseeId: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(1000)
    text: string
}