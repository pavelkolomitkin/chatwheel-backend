import {Transform} from "class-transformer";

export class UserInterestDto
{
    id?: string;

    @Transform(({value}) => value.trim())
    name?: string;
}