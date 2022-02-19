import {Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Query, UseGuards} from '@nestjs/common';
import {CurrentUser} from '../../core/decorators/user.decorator';
import {ClientUser, ClientUserDocument} from '../../core/schemas/client-user.schema';
import {UserConversationService} from '../services/user-conversation.service';
import {ParameterConverter, ParameterConverterSourceType} from '../../core/decorators/parameter-converter.decorator';
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from '../../core/schemas/conversation-message-list.schema';
import {ParameterConverterPipe} from '../../core/pipes/parameter-converter.pipe';
import {DateTimePipe} from '../../core/pipes/date-time.pipe';
import {AuthGuard} from "@nestjs/passport";

@Controller('conversation')
@UseGuards(AuthGuard('jwt'))
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
        @Query('lastDate', DateTimePipe) lastDate: Date = null,
        @Query('latestId') latestId: string = null
    )
    {
        const list: ConversationMessageListDocument[] = await this
            .conversationService
            .getConversations(user, { latestId, lastDate });

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

        await conversationList.populate('conversation.members.member');

        const members: any[] = conversationList.conversation.members;
        const membersData: any[] = members.map(item => {
            item.member = item.member.serialize();
            return item;
        });

        return {
            // @ts-ignore
            messageList: conversationList.serialize(),
            members: membersData
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


    @Get('/individual/:addresseeId')
    @HttpCode(HttpStatus.OK)
    async getIndividual(
        @CurrentUser() user: ClientUserDocument,
        @ParameterConverter({
            model: ClientUser.name,
            field: 'id',
            paramName: 'addresseeId',
            sourceType: ParameterConverterSourceType.PARAM
        }, ParameterConverterPipe) addressee: ClientUserDocument
    )
    {
        const list: ConversationMessageListDocument = await this
            .conversationService
            .getIndividualConversationMessageList(user, addressee);

        return {
            // @ts-ignore
            list: list.serialize()
        };
    }
}