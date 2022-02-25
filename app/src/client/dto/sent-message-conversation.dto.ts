import {Transform} from 'class-transformer';
import {IsNotEmpty, MaxLength, Validate} from 'class-validator';
import {EntityExistsValidator} from '../../core/validators/entity-exists.validator';
import {ConversationMessageList} from '../../core/schemas/conversation-message-list.schema';

export class SentMessageConversationDto
{
    @IsNotEmpty()
    @Validate(EntityExistsValidator, [ConversationMessageList.name, 'id'], { message: 'Conversation is not found!' })
    conversationId: string;

    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    @MaxLength(1000)
    text: string
}