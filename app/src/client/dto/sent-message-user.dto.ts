import {Transform} from "class-transformer";
import {IsNotEmpty, MaxLength, Validate} from "class-validator";
import {IsUserBannedByAddresseeValidator} from "../validators/is-user-banned-by-addressee.validator";

export class SentMessageUserDto
{
    @IsNotEmpty()
    @Validate(IsUserBannedByAddresseeValidator, [{ context: IsUserBannedByAddresseeValidator.ADDRESSEE_CONTEXT }])
    addresseeId: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(1000)
    text: string
}