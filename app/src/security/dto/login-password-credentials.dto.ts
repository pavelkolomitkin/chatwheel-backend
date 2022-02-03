import {IsEmail, IsNotEmpty} from 'class-validator';

export class LoginPasswordCredentialsDto
{
    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;
}