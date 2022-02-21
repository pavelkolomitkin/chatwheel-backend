import {Transform} from "class-transformer";
import {IsNotEmpty, MaxLength, Validate} from "class-validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {ConversationMessage} from "../../core/schemas/conversation-message.schema";

export class EditMessageDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [ConversationMessage.name, 'id'], { message: 'Message is not found!' })
    messageId: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(1000)
    text: string
}