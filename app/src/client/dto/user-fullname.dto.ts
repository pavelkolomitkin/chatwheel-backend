import {Transform} from "class-transformer";
import {IsNotEmpty, MaxLength} from "class-validator";

export class UserFullnameDto
{
    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(255)
    fullName: string;
}