import {Transform} from "class-transformer";
import {MinLength, Validate} from "class-validator";
import {UserPasswordsEqualValidator} from "../../security/validators/user-passwords-equal.validator";

export class ResetAdminPasswordDto
{
    @Transform(({value}) => value.trim())
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    @Validate(UserPasswordsEqualValidator)
    password: string;

    @Transform(({value}) => value.trim())
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    passwordRepeat: string;
}