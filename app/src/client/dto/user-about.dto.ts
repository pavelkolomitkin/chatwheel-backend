import {Transform} from "class-transformer";
import {MaxLength} from "class-validator";

export class UserAboutDto
{
    @Transform(({value}) => value.trim())
    @MaxLength(1000)
    about: string;
}