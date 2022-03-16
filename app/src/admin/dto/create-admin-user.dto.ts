import {Transform} from "class-transformer";
import {IsEmail, IsNotEmpty, MaxLength, MinLength, Validate} from "class-validator";
import {UniqueUserEmailValidator} from "../../security/validators/unique-user-email.validator";
import {UserPasswordsEqualValidator} from "../../security/validators/user-passwords-equal.validator";

export class CreateAdminUserDto
{
    @Transform(({value}) => value.trim())
    @IsEmail()
    @Validate(UniqueUserEmailValidator)
    email: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(255,)
    fullName: string;

    @Transform(({value}) => value.trim())
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    @Validate(UserPasswordsEqualValidator)
    password: string;

    @Transform(({value}) => value.trim())
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    passwordRepeat: string;

}