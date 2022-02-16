import {IsBoolean, IsNotEmpty, IsOptional, Validate} from "class-validator";
import {EntityExistsValidator} from "../../core/validators/entity-exists.validator";
import {ConversationMessage} from "../../core/schemas/conversation-message.schema";

export class RemoveMessageDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [ConversationMessage.name, 'id'], { message: 'Message is not found!' })
    messageId: string;

    @IsBoolean()
    @IsOptional()
    removeFromOthers?: boolean;
}