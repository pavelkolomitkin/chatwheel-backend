import {IsEmail, IsNotEmpty, Length, MinLength, Validate} from "class-validator";
import {UniqueUserEmailValidator} from "../validators/unique-user-email.validator";

export class LoginPasswordRegisterDto
{
    @IsEmail()
    @Validate(UniqueUserEmailValidator)
    email: string;

    @IsNotEmpty()
    fullName: string;

    @IsNotEmpty()
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    password: string;

    @IsNotEmpty()
    @MinLength(6, { message: 'Minimum 6 symbols!' })
    passwordRepeat: string;
}