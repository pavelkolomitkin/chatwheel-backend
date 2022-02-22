import {IsNotEmpty, MaxLength, Validate} from "class-validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {ClientUser} from "../../core/schemas/client-user.schema";
import {AbuseReportType} from "../../core/schemas/abuse-report-type.schema";
import {Transform} from "class-transformer";

export class AbuseReportDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [ClientUser.name, 'id'], { message: 'The user is not found!' })
    recipientId: string;

    @IsNotEmpty()
    @Validate(EntityExistsValidator, [AbuseReportType.name, 'id'], { message: 'The abuse type is not found!' })
    typeId: string;

    @Transform(({value}) => ((value !== null) && (value.constructor === String)) ? value.trim() : '')
    @MaxLength(1000)
    comment?: string
}