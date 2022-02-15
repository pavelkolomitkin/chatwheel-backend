import {Transform} from "class-transformer";
import {IsNotEmpty} from "class-validator";

export class UserInterestDto
{
    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    name?: string;
}