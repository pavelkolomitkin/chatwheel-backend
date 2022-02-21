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
import {ConversationMessage} from "../../core/schemas/conversation-message.schema";
import {Message} from "../../core/schemas/message.schema";

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
        @Query('lastDate') lastDate: Date = null,
        @Query('latestId') latestId: string = null
    )
    {
        const list: ConversationMessageListDocument[] = await this
            .conversationService
            .getConversations(user, { latestId, lastDate });

        const newMessageNumbers = await this.conversationService.getConversationsNewMessages(list);

        const result = list.map(item => {

            const result = {
                // @ts-ignore
                ...item.serialize(),
                // @ts-ignore
                members: item.conversation.members.map(memberItem => {
                    return {
                        // @ts-ignore
                        member: memberItem.member.serialize(),
                        // @ts-ignore
                        joinTime: memberItem.joinTime
                    };
                }),
                newMessageNumber: newMessageNumbers[item._id.toString()]
            }

            const { lastMessage } = item;
            if (!!lastMessage)
            {
                result.lastMessage = {
                    id: lastMessage.id,
                    isRead: lastMessage.isRead,
                    // @ts-ignore
                    message:{
                        // @ts-ignore
                      ...lastMessage.message.serialize(),
                        // @ts-ignore
                      author: lastMessage.message.author.serialize()
                    }
                };
            }

            return result;
        });

        return {
            // @ts-ignore
            list: result
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
        }, ParameterConverterPipe) messageList: ConversationMessageListDocument
    )
    {
        await messageList.populate('owner');
        if (user.id !== messageList.owner.id)
        {
            throw new NotFoundException();
        }

        //await conversationList.populate('conversation.members.member');
        await messageList.populate({
            path: 'conversation',
            populate: {
                path: 'members',
                populate: {
                    path: 'member',
                    model: ClientUser.name,
                    populate: {
                        path: 'interests'
                    }
                }
            }
        });

        await messageList.populate({
            path: 'lastMessage',
            model: ConversationMessage.name,
            populate: {
                path: 'message',
                model: Message.name,
                populate: {
                    path: 'author',
                    model: ClientUser.name
                }
            },
        });

        //debugger

        return {
            // @ts-ignore
            ...messageList.serialize(),
            // @ts-ignore
            members: messageList.conversation.members.map(memberItem => {
                return {
                    // @ts-ignore
                    member: memberItem.member.serialize(),
                    // @ts-ignore
                    joinTime: memberItem.joinTime
                };
            }),
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