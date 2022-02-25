import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {
    ConversationMessageLog,
    ConversationMessageLogDocument, ConversationMessageLogType
} from '../../core/schemas/conversation-message-log.schema';
import {Model} from 'mongoose';
import {MessageDocument} from '../../core/schemas/message.schema';
import {ClientUser} from '../../core/schemas/client-user.schema';
import {Conversation} from '../../core/schemas/conversation.schema';
import {
    UserProfileAsyncDataLog,
    UserProfileAsyncDataLogDocument
} from '../../core/schemas/user-profile-async-data-log.schema';

@Injectable()
export class ConversationMessageLogService
{
    constructor(
        @InjectModel(ConversationMessageLog.name) private readonly model: Model<ConversationMessageLogDocument>,
        @InjectModel(UserProfileAsyncDataLog.name) private readonly userProfileAsyncDataModel: Model<UserProfileAsyncDataLogDocument>
    ) {}

    async log(message: MessageDocument, type: ConversationMessageLogType)
    {
        await message.populate({
            path: 'conversation',
            model: Conversation.name,
            populate: {
                path: 'members',
                populate: {
                    path: 'member',
                    model: ClientUser.name
                }
            }
        });

        for (let memberItem of message.conversation.members)
        {
            // @ts-ignore
            const { member } = memberItem;

            await this.model.updateOne(
                {
                    recipient: member,
                },
                {
                    recipient: member,
                    message: message,
                    type: type
                },
                {
                    upsert: true,
                    'new': true
                }
            );
        }
    }

    async logMessageNumberChanged(users: ClientUser[])
    {
        for (let user of users)
        {
            await this.userProfileAsyncDataModel.updateOne(
                {
                    user: user,
                },
                {
                    $set: {
                        user: user,
                        messageNumberChanged: new Date()
                    }
                }
                ,
                {
                    upsert: true,
                    'new': true
                });
        }
    }
}