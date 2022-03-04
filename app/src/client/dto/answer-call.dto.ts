import {IsNotEmpty, Validate} from "class-validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {Call} from "../../core/schemas/call.schema";

export class AnswerCallDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [Call.name, 'id'], { message: 'The call is not found!' })
    callId: string;

    @IsNotEmpty()
    peerId: string;

    @IsNotEmpty()
    socketId: string;
}