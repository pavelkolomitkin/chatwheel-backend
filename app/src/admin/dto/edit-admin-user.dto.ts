import {Transform} from "class-transformer";
import {IsEmail, IsNotEmpty, MaxLength, Validate} from "class-validator";
import {EditedEmailValidator} from "../validators/edited-email.validator";

export class EditAdminUserDto
{
    @IsNotEmpty()
    id: string;

    @Transform(({value}) => value.trim())
    @IsEmail()
    @Validate(EditedEmailValidator)
    email: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(255)
    fullName: string;
}