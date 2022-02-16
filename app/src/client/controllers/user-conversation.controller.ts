import {Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Post, Query} from "@nestjs/common";
import {CurrentUser} from "../../core/decorators/user.decorator";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {DateTimePipe} from "../../core/pipes/date-time.pipe";
import {UserConversationService} from "../services/user-conversation.service";
import {ParameterConverter, ParameterConverterSourceType} from "../../core/decorators/parameter-converter.decorator";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {ParameterConverterPipe} from "../../core/pipes/parameter-converter.pipe";

@Controller('conversation')
export class UserConversationController
{
    constructor(
        private conversationService: UserConversationService
    ) {
    }

    @Get('/list')
    @HttpCode(HttpStatus.OK)
    async getList(
        @CurrentUser() user: ClientUserDocument,
        @Query('lastDate', DateTimePipe) lastDate: Date,
        @Query('excludedId') excludedId: string
    )
    {
        const list: ConversationMessageListDocument[] = await this
            .conversationService
            .getConversations(user, { lastDate, excludedId });

        return {
            // @ts-ignore
            list: list.map(item => item.serialize())
        };
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    async get(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessageList.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) conversationList: ConversationMessageListDocument
    )
    {
        await conversationList.populate('owner');

        if (user.id !== conversationList.owner.id)
        {
            throw new NotFoundException();
        }

        return {
            // @ts-ignore
            conversationList: conversationList.serialize()
        };
    }

    @Delete('/remove-conversation-list/:id')
    @HttpCode(HttpStatus.OK)
    async removeConversation(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ConversationMessageList.name,
            field: 'id',
            paramName: 'id',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) conversationList: ConversationMessageListDocument
    )
    {
        await conversationList.delete();
    }
}