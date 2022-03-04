import {IsNotEmpty, Validate} from "class-validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {CallMemberLink} from "../../core/schemas/call-member-link.schema";

export class ConnectCallDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [CallMemberLink.name, 'id'], { message: 'The connection is not found!' })
    linkId: string;

    @IsNotEmpty()
    peerId: string;
}