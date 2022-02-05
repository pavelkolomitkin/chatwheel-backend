import {IsEmail, Validate} from "class-validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {Transform} from "class-transformer";
import {ClientUser} from "../../core/schemas/client-user.schema";

export class RestorePasswordRequestDto
{
    @Transform(({value}) => value.trim())
    @IsEmail()
    @Validate(EntityExistsValidator,
        [ClientUser.name, 'email'],
        { message: 'There is no account with this email!' }
    )
    email: string;
}