import {BadRequestException, Injectable} from "@nestjs/common";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Conversation, ConversationDocument} from "../../core/schemas/conversation.schema";

@Injectable()
export class ConversationService
{
    constructor(
        @InjectModel(Conversation.name) private readonly model: Model<ConversationDocument>
    ) {
    }

    async getIndividual(user: ClientUserDocument, addressee: ClientUserDocument): Promise<ConversationDocument | null>
    {
        const conversationItems = await this.model.aggregate([
            {
                $match: {
                    $and: [
                        {
                            members: {
                                $all: [
                                    { $elemMatch: {member: user._id} },
                                    { $elemMatch: {member: addressee._id} }
                                ]
                            }
                        },
                        {
                            members: {
                                $size: 2
                            }
                        },
                        {
                            isIndividual: true
                        }
                    ]
                },
            },
            { $project: { _id: 1 } }
        ])
            .limit(1);

        if (conversationItems.length === 0)
        {
            return null;
        }


        return this.model.findById(conversationItems[0]._id);
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
                    ],
                    isIndividual: true
                });

        await result.save();

        return result;
    }

    async isUserMember(user: ClientUserDocument, conversation: ConversationDocument)
    {
        return !!await this.model.findOne({'members.member': user, _id: conversation.id});
    }

    async get(id: string)
    {
        return this.model.findById(id);
    }

    async getMembers(conversation: ConversationDocument): Promise<ClientUserDocument[]>
    {
        await conversation.populate('members.member');

        // @ts-ignore
        return conversation.members.map(item => item.member).filter(member => member.deleted !== true);
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

    async validateMembership(
        conversation: ConversationDocument,
        user: ClientUserDocument,
        errorMessage: string = 'Conversation is not found!'
    )
    {
        const isMember: boolean = await this.isUserMember(user, conversation);
        if (!isMember)
        {
            throw new BadRequestException(errorMessage);
        }
    }
}