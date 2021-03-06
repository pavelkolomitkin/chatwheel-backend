import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ChatRouletteOffer, ChatRouletteOfferDocument} from '../../../core/schemas/chat-roulette-offer.schema';
import {Model} from 'mongoose';
import {ClientUserDocument} from '../../../core/schemas/client-user.schema';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class ChatRouletteOfferService
{
    constructor(
        @InjectModel(ChatRouletteOffer.name) private readonly model: Model<ChatRouletteOfferDocument>,
        private readonly config: ConfigService
    ) {
    }

    getModel()
    {
        return this.model;
    }

    async getUserOffer(user: ClientUserDocument)
    {
        return this.model.findOne({
            user: user
        });
    }

    async getActualOffer(addressee: ClientUserDocument)
    {
        const searchResults = await this.model.aggregate([
            {
                $match: {
                    addressee: addressee._id,
                    accepted: false
                }
            },
            {
                $lookup: {
                    from: 'bannedusers',
                    let: { user: '$user' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: [ '$applicant', '$$user' ], },
                                                { $eq: [ '$banned', addressee._id] },
                                                { $eq: [ '$isDeleted', false] }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: [ '$applicant', addressee._id ], },
                                                { $eq: [ '$banned', '$$user' ] },
                                                { $eq: [ '$isDeleted', false] }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'banStatus'
                }
            },
            {
                $match: {
                    'banStatus': {
                        $size: 0
                    }
                }
            },
            {
                $sample: { size: 1 }
            },
            {
                $project: { _id: 1 }
            }
        ]);

        if (searchResults.length === 0)
        {
            return null;
        }

        return this.model.findById(searchResults[0]._id);
    }

    async create(user: ClientUserDocument, addressee: ClientUserDocument)
    {
        const result: ChatRouletteOfferDocument = new this.model({
            user,
            addressee
        });

        await result.save();

        return result;
    }

    async removeUserOffers(user: ClientUserDocument)
    {
        this.model.deleteMany({
            user: user
        });
    }

    async removeAddressedToUser(user: ClientUserDocument)
    {
        this.model.deleteMany({
            addressee: user
        });
    }

    async validateRelationship(offer: ChatRouletteOfferDocument, addressee: ClientUserDocument)
    {
        await offer.populate('addressee');
        if (offer.addressee.id !== addressee.id)
        {
            throw new BadRequestException('The offer is not found!');
        }
    }
}