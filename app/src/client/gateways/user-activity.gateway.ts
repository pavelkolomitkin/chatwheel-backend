import {Injectable} from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit, SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { Socket, Server } from 'socket.io';
import {WsJwtGuard} from "../../security/guards/ws-jwt.guard";
import {InjectModel} from "@nestjs/mongoose";
import {UserTypingLog, UserTypingLogDocument} from "../../core/schemas/user-typing-log.schema";
import {Model, Types} from "mongoose";
import {
    ConversationMessageList,
    ConversationMessageListDocument
} from "../../core/schemas/conversation-message-list.schema";
import {Conversation, ConversationDocument} from "../../core/schemas/conversation.schema";
import {BannedUser, BannedUserDocument} from "../../core/schemas/banned-user.schema";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";

@Injectable()
@WebSocketGateway({
    namespace: 'user_activity'
})
export class UserActivityGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    static USER_IS_TYPING_EVENT = 'user_is_typing_event';

    static USER_HAS_BANNED_ME = 'user_has_banned_me';
    static USER_HAS_UNBANNED_ME = 'user_has_unbanned_me';

    @WebSocketServer()
    server: Server;

    constructor(
        @InjectModel(UserTypingLog.name) private readonly model: Model<UserTypingLogDocument>,
        @InjectModel(ConversationMessageList.name) private readonly messageListModel: Model<ConversationMessageListDocument>,
        @InjectModel(BannedUser.name) private readonly bannedUserModel: Model<BannedUserDocument>,
        @InjectModel(ClientUser.name) private readonly clientUserModel: Model<ClientUser>,

        private readonly guard: WsJwtGuard
    ) {
    }

    afterInit(server: any): any {
        this.guard.authorize(server);
    }

    handleConnection(client: Socket, ...args: any[]): any {

        // @ts-ignore
        const { user } = client;

        // @ts-ignore
        client.typingStream = this.model.watch([
            { $match: {
                    'fullDocument.recipient': new Types.ObjectId(user.id)
                }
            }
        ],
            { fullDocument: 'updateLookup' }
        );

        // @ts-ignore
        client.typingStream.on('change', async (data) => {

            const { fullDocument } = data;

            const list: ConversationMessageListDocument = await this.messageListModel.findOne(
                {
                    conversation: fullDocument.conversation,
                    owner: user
                }
            );

            if (!list)
            {
                return;
            }

            //await this.clientUserModel.populate(fullDocument.user);
            const typingUser: ClientUserDocument = await this.clientUserModel.findById(fullDocument.user);

            const payload = {
                messageList: list.id,
                user: {
                    id: typingUser.id,
                    fullName: typingUser.fullName
                }
            };

            client.emit(UserActivityGateway.USER_IS_TYPING_EVENT, payload);
        });


        // @ts-ignore
        client.banStream = this.bannedUserModel.watch([
            {
                $match: {
                    'operationType': {
                        $in: ['insert', 'delete']
                    },
                    'fullDocument.banned': new Types.ObjectId(user.id)
                }
            }
        ]);

        // @ts-ignore
        client.banStream.on('change', async (data) => {

            const { fullDocument, operationType } = data;

            const eventName = (operationType === 'insert') ? UserActivityGateway.USER_HAS_BANNED_ME :
                UserActivityGateway.USER_HAS_UNBANNED_ME;

            client.emit(eventName, {
                user: fullDocument.user.id
            });
        });
    }

    handleDisconnect(client: Socket): any {

        // @ts-ignore
        client.typingStream.close();
        // @ts-ignore
        client.typingStream = null;

        // @ts-ignore
        client.banStream.close();
        // @ts-ignore
        client.banStream = null;

        // @ts-ignore
        client.conn.close();
        // @ts-ignore
        client.removeAllListeners();
        // @ts-ignore
        client.disconnect(true);
    }


    @SubscribeMessage('typing')
    async typingEventSubscriber(client: Socket, data: { messageList: string })
    {
        // @ts-ignore
        const { user } = client;
        const { messageList } = data;

        const conversationMessageList: ConversationMessageListDocument = await this
            .messageListModel
            .findOne({ _id: messageList })
            .populate({
                path: 'conversation',
                model: Conversation.name
            });

        if (!conversationMessageList)
        {
            return;
        }

        // @ts-ignore
        for (let memberItem of conversationMessageList.conversation.members)
        {
            // @ts-ignore
            const { member } = memberItem;
            if (member.toString() === user.id)
            {
                continue;
            }

            await this.model.updateOne(
                {
                    conversation: conversationMessageList.conversation,
                    user: user,
                    recipient: member
                },
                {
                    conversation: conversationMessageList.conversation,
                    user: user,
                    recipient: member
                },
                {
                    upsert: true,
                    'new': true
                }
            )
        }
    }

}