import {MaxLength} from "class-validator";

export class BlockUserDto
{
    @MaxLength(1000)
    reason: string;
}