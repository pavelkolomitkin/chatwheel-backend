import {IsEmail, IsNotEmpty} from 'class-validator';
import {Transform} from 'class-transformer';

export class LoginPasswordCredentialsDto
{
    @Transform(({value}) => value.trim())
    @IsEmail()
    email: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    password: string;
}