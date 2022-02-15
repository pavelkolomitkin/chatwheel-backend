import {IsNotEmpty, MinLength, Validate} from 'class-validator';
import {RestorePasswordKeyValidator} from '../validators/restore-password-key.validator';
import {UserPasswordsEqualValidator} from '../validators/user-passwords-equal.validator';
import {Transform} from 'class-transformer';

export class RestorePasswordDto
{
    @Validate(RestorePasswordKeyValidator)
    key: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    @Validate(UserPasswordsEqualValidator)
    password: string;

    @Transform(({value}) => value.trim())
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    passwordRepeat: string;
}