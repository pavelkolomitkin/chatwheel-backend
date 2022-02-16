import {Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Put, Query} from "@nestjs/common";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {DateTimePipe} from "../../core/pipes/date-time.pipe";
import {ConversationMessageService} from "../services/conversation-message.service";
import {Conversation, ConversationDocument} from "../../core/schemas/conversation.schema";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";
import {SentMessageUserDto} from "../dto/sent-message-user.dto";
import {SentMessageConversationDto} from "../dto/sent-message-conversation.dto";
import {EditMessageDto} from "../dto/edit-message.dto";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";
import {RemoveMessageDto} from "../dto/remove-message.dto";

@Controller('message')
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
        @Query('lastDate', DateTimePipe) lastDate: Date,
        @Query('excludedId') excludedId: string
    )
    {
        const list: ConversationMessageDocument[] = await this.service.getList(messageList, { lastDate, excludedId })

        return {
            // @ts-ignore
            list: list.map(item => item.serialize())
        };
    }

    @Post('/send-user')
    @HttpCode(HttpStatus.OK)
    async sendToUser(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) addressee: ClientUserDocument,
        @Body() data: SentMessageUserDto
    )
    {
        const message: ConversationMessageDocument = await this.service.sendToUser(data, user, addressee);

        return {
            // @ts-ignore
            message: message.serialize(),
            // @ts-ignore
            conversation: message.messageList.serialize()
        };
    }

    @Post('/send-conversation')
    @HttpCode(HttpStatus.OK)
    async sendToConversation(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: Conversation.name,
            field: 'id',
            paramName: 'conversationId',
            sourceType: ParameterConverterSourceType.BODY
        }, ParameterConverterPipe) conversation: ConversationDocument,
        @Body() data: SentMessageConversationDto
    )
    {
        const message: ConversationMessageDocument = await this.service.sendToConversation(data, user, conversation);

        return {
            // @ts-ignore
            message: message.serialize(),
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
        }) message: ConversationMessageDocument,
        @Body() data: EditMessageDto
    )
    {
        const editedMessage: ConversationMessageDocument = await this.service.editMessage(data, message);

        return {
            // @ts-ignore
            message: editedMessage.serialize()
        };
    }

    @Delete('delete')
    @HttpCode(HttpStatus.OK)
    async remove(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessage.name,
            field: 'id',
            paramName: 'messageId',
            sourceType: ParameterConverterSourceType.BODY
        }) message: ConversationMessageDocument,
        @Body() data: RemoveMessageDto
    )
    {
        await this.service.removeMessage(data, message, user);
    }
}