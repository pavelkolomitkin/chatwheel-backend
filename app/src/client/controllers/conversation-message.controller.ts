import {
    Body,
    Controller, DefaultValuePipe,
    Delete,
    Get,
    HttpCode,
    HttpStatus, ParseBoolPipe,
    Post,
    Put,
    Query,
    UseGuards
} from '@nestjs/common';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import {ParameterConverter, ParameterConverterSourceType} from '../../core/decorators/parameter-converter.decorator';
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from '../../core/schemas/conversation-message-list.schema';
import {ConversationMessageService} from '../services/conversation-message.service';
import {ParameterConverterPipe} from '../../core/pipes/parameter-converter.pipe';
import {SentMessageUserDto} from '../dto/sent-message-user.dto';
import {SentMessageConversationDto} from '../dto/sent-message-conversation.dto';
import {EditMessageDto} from '../dto/edit-message.dto';
import {ConversationMessage, ConversationMessageDocument} from '../../core/schemas/conversation-message.schema';
import {AuthGuard} from '@nestjs/passport';
import {Message} from '../../core/schemas/message.schema';
import {ValidateUserPipe} from "../../core/pipes/validate-user.pipe";
import {Roles} from "../../core/decorators/role.decorator";
import {ROLE_CLIENT_USER} from "../../core/schemas/user.schema";
import {RoleBasedGuard} from "../../core/guards/role-based.guard";

@Controller('message')
@Roles(ROLE_CLIENT_USER)
@UseGuards(AuthGuard('jwt'), RoleBasedGuard)
export class ConversationMessageController
{
    constructor(
        private service: ConversationMessageService
    ) {
    }

    @Get('/list/:listId')
    @HttpCode(HttpStatus.OK)
    async getList(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessageList.name,
            field: 'id',
            paramName: 'listId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) messageList: ConversationMessageListDocument,
        @Query('lastDate') lastDate: Date,
        @Query('latestId') latestId: string
    )
    {
        const list = await this.service.getList(user, messageList, { lastDate, latestId });

        return {
            // @ts-ignore
            list
        };
    }

    @Post('/send-user')
    @HttpCode(HttpStatus.CREATED)
    async sendToUser(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe, ValidateUserPipe) addressee: ClientUserDocument,
        @Body() data: SentMessageUserDto
    )
    {
        const message: ConversationMessageDocument = await this.service.sendTextToUser(data, user, addressee);

        const result: any = {
            message: {
                id: message.id,
                isRead: message.isRead,
                // @ts-ignore
                message: message.message.serialize()
            }
        };

        // // @ts-ignore
        // result.message.message.author = message.message.author.serialize();
        // @ts-ignore
        result.conversation = message.messageList.serialize();

        return result;
    }

    @Post('/send-conversation')
    @HttpCode(HttpStatus.CREATED)
    async sendToConversation(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessageList.name,
            field: 'id',
            paramName: 'conversationId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) messageList: ConversationMessageListDocument,
        @Body() data: SentMessageConversationDto
    )
    {
        const message: ConversationMessageDocument = await this.service.sendTextToConversation(data, user, messageList);

        return {
            // @ts-ignore
            message: {
                id: message.id,
                isRead: message.isRead,
                // @ts-ignore
                message: message.message.serialize(),
            }
        };
    }

    @Put('edit')
    @HttpCode(HttpStatus.OK)
    async edit(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessage.name,
            field: 'id',
            paramName: 'messageId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) message: ConversationMessageDocument,
        @Body() data: EditMessageDto
    )
    {
        const editedMessage: ConversationMessageDocument = await this.service.editMessage(data, message, user);

        await editedMessage.populate(
            {
                path: 'message',
                model: Message.name,
                populate: {
                    path: 'author',
                    model: ClientUser.name
                }
            }
        );

        return {
            // @ts-ignore
            message: {
                id: editedMessage.id,
                isRead: editedMessage.isRead,
                // @ts-ignore
                message: editedMessage.message.serialize(),
            }
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessage.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) message: ConversationMessageDocument,
        @Query('removeFromOthers', new DefaultValuePipe(false), ParseBoolPipe) removeFromOthers: boolean
    )
    {
        await this.service.removeMessage(message, user, removeFromOthers);
    }

    @Put('read-last/:listId')
    @HttpCode(HttpStatus.OK)
    async readLast(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessageList.name,
            field: 'id',
            paramName: 'listId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) messageList: ConversationMessageListDocument,
    )
    {
        await this.service.readLast(messageList, user);
    }
}