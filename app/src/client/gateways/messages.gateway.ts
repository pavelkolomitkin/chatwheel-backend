import {Injectable} from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { Socket, Server } from 'socket.io';
import {WsJwtGuard} from "../../security/guards/ws-jwt.guard";
import {InjectModel} from "@nestjs/mongoose";
import {
    ConversationMessageLog,
    ConversationMessageLogDocument, ConversationMessageLogType
} from "../../core/schemas/conversation-message-log.schema";
import {Model} from "mongoose";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";
import {Message, MessageDocument} from "../../core/schemas/message.schema";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {UserConversationService} from "../services/user-conversation.service";
import {Conversation} from "../../core/schemas/conversation.schema";
import {ConversationMessageService} from "../services/conversation-message.service";
import {
    UserProfileAsyncDataLog,
    UserProfileAsyncDataLogDocument
} from "../../core/schemas/user-profile-async-data-log.schema";


@Injectable()
@WebSocketGateway({
    namespace: 'messages'
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    static MESSAGE_ADDED_EVENT = 'message_added_event';
    static MESSAGE_EDITED_EVENT = 'message_edited_event';
    static MESSAGE_REMOVED_EVENT = 'message_removed_event';

    static MESSAGE_NUMBER_CHANGED_EVENT = 'message_number_changed_event';

    @WebSocketServer()
    server: Server;

    constructor(
        @InjectModel(ConversationMessageLog.name) private readonly messageLogModel: Model<ConversationMessageLogDocument>,
        @InjectModel(UserProfileAsyncDataLog.name) private readonly userAsyncDataModel: Model<UserProfileAsyncDataLogDocument>,

        private readonly conversationService: UserConversationService,
        private readonly conversationMessageService: ConversationMessageService,
        private readonly guard: WsJwtGuard
    ) {}


    afterInit(server: any): any {
        this.guard.authorize(server);
    }

    handleConnection(client: Socket, ...args: any[]): any {

        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.messageStream = this
            .messageLogModel
            .watch([
                { $match: {
                    'fullDocument.recipient': user._id
                    }
                }
            ],
                { fullDocument: 'updateLookup' }
            );

        // @ts-ignore
        client.messageStream.on('change', async (data) => {

            const { fullDocument } = data;

            if (fullDocument.type === ConversationMessageLogType.REMOVE)
            {
                await this.handleRemovedMessage(fullDocument, user, client);
                return;
            }

            const conversationMessage: ConversationMessageDocument = await this
                .getConversationMessageFromLog(fullDocument, user);

            if (!conversationMessage)
            {
                return;
            }

            if (fullDocument.type === ConversationMessageLogType.ADD)
            {
                await this.handleAddedMessage(conversationMessage, user, client);
                return;
            }


            if (fullDocument.type === ConversationMessageLogType.EDIT)
            {
                await this.handleEditedMessage(conversationMessage, user, client);
                return;
            }

        });

        // @ts-ignore
        client.messageNumberChangedStream = this.userAsyncDataModel.watch([
            {
                $match: {
                    "updateDescription.updatedFields.messageNumberChanged": { $exists: true },
                    operationType: 'update'
                }
            }
        ]);

        // @ts-ignore
        client.messageNumberChangedStream.on('change', async (data) => {

            const newMessageNumber: Number = await this.conversationMessageService.getNewMessageNumber(user);

            client.emit(MessagesGateway.MESSAGE_NUMBER_CHANGED_EVENT, {
                newMessageNumber
            });
        });

    }

    handleDisconnect(client: Socket): any {

        // @ts-ignore
        client.messageStream.close();
        // @ts-ignore
        client.messageStream = null;

        // @ts-ignore
        client.messageNumberChangedStream.close();
        // @ts-ignore
        client.messageNumberChangedStream = null;

        // @ts-ignore
        client.conn.close();
        // @ts-ignore
        client.removeAllListeners();
        // @ts-ignore
        client.disconnect(true);

    }

    async getConversationMessageFromLog(fullDocument: ConversationMessageLogDocument, user: ClientUserDocument)
    {
        // find the corresponding conversation message related to user's conversation message list
        //const messageItems = await this.conversationMessageModel.aggregate([
        const messageItems = await this.conversationMessageService.getConversationMessageModel().aggregate([
            { $match: { message: fullDocument.message } },
            { $lookup: {
                    from: 'conversationmessagelists',
                    localField: 'messageList',
                    foreignField: '_id',
                    as: 'messageList'
                } },
            { $match: { 'messageList.owner': user._id } },
            { $project: { _id: 1 } }
        ]);

        if (messageItems.length === 0)
        {
            return null;
        }

        const result: ConversationMessageDocument = await this
            .conversationMessageService.getConversationMessageModel()
            .findOne({ _id: messageItems[0]._id })
            .populate({
                path: 'message',
                model: Message.name
            });

        return result;
    }

    async handleAddedMessage(conversationMessage: ConversationMessageDocument, user: ClientUserDocument, client: Socket)
    {
        await conversationMessage.message.populate('author');

        await conversationMessage.populate({
            path: 'messageList',
            model: ConversationMessageList.name,
            populate: {
                path: 'conversation',
                model: Conversation.name,
                populate: {
                    path: 'members',
                    populate: {
                        path: 'member',
                        model: ClientUser.name
                    }
                }
            }
        });

        const messageNumber = await this
            .conversationService
            .getConversationsNewMessages([conversationMessage.messageList]);

        const payload = {

            message: {
                id: conversationMessage.id,
                isRead: conversationMessage.isRead,
                message: {
                    // @ts-ignore
                    ...conversationMessage.message.serialize(),
                    // @ts-ignore
                    author: conversationMessage.message.author.serialize()
                },
            },
            // @ts-ignore
            messageList: {
                // @ts-ignore
                ...conversationMessage.messageList.serialize(),
                members: conversationMessage.messageList.conversation.members.map(
                    (memberItem) => {
                        return {
                            // @ts-ignore
                            member: memberItem.serialize(),
                            // @ts-ignore
                            joinTime: memberItem.joinTime
                        };
                    }),
                newMessageNumber: messageNumber[conversationMessage.messageList.id],
            },
        }

        // return the conversation message as a payload to the client
        client.emit(MessagesGateway.MESSAGE_ADDED_EVENT, payload);
    }

    async handleEditedMessage(conversationMessage: ConversationMessageDocument, user: ClientUserDocument, client: Socket)
    {
        const payload = {
            id: conversationMessage.id,
            isRead: conversationMessage.isRead,
            messageList: conversationMessage.messageList.toString(),
            // @ts-ignore
            message: conversationMessage.message.serialize()
        };

        client.emit(MessagesGateway.MESSAGE_EDITED_EVENT, payload);
    }


    async handleRemovedMessage(fullDocument: ConversationMessageLogDocument, user: ClientUserDocument, client: Socket)
    {
        const message: MessageDocument = await this
            .conversationMessageService.getMessageModel()
            // @ts-ignore
            .findOneDeleted({ _id: fullDocument.message });

        const messageList: ConversationMessageListDocument = await this
            .conversationService.getConversationMessageListModel()
            .findOne({
                owner: user,
                conversation: message.conversation
            });

        const messageNumber = await this
            .conversationService
            .getConversationsNewMessages([messageList]);

        const payload = {
            message: message.id,
            messageList: {
                id: messageList.id,
                newMessageNumber: messageNumber[messageList.id]
            }

        };

        client.emit(MessagesGateway.MESSAGE_REMOVED_EVENT, payload);
    }
}