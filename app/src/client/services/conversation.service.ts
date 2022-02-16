import {Injectable} from "@nestjs/common";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";
import {Conversation, ConversationDocument} from "../../core/schemas/conversation.schema";
import {MessageDocument} from "../../core/schemas/message.schema";

@Injectable()
export class ConversationService
{
    constructor(
        @InjectModel(Conversation.name) private readonly model: Model<ConversationDocument>
    ) {
    }

    async getIndividual(user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationDocument | null>
    {
        return this.model.findOne({
            $and: [
                {
                    members: {
                        $all: [
                            { $elemMatch: { member: new Types.ObjectId(user.id) }},
                            { $elemMatch: { member: new Types.ObjectId(addressee.id) }}
                        ]
                    }
                },
                {
                    members: {
                        $size: 2
                    }
                }
            ]
        });
    }

    async createIndividual(user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationDocument>
    {
        const result = new this.model({
                    members: [
                        {
                            member: user,
                            joinTime: new Date()
                        },
                        {
                            member: addressee,
                            joinTime: new Date()
                        },
                    ]
                });

        await result.save();

        return result;
    }

    async isUserMember(user: ClientUserDocument, conversation: ConversationDocument)
    {
        return !!await this.model.findOne({'members.member': user, conversation: conversation});
    }

    async get(id: string)
    {
        return this.model.findById(id);
    }

    async getAddressee(individualConversation: ConversationDocument, user: ClientUserDocument): Promise<ClientUserDocument>
    {
        await individualConversation.populate('members.member');

        let result: ClientUserDocument = null;
        for (let memberItem of individualConversation.members)
        {
            // @ts-ignore
            if (memberItem.member.id !== user.id)
            {
                // @ts-ignore
                result = memberItem.member;
                break;
            }
        }

        return result;
    }
}