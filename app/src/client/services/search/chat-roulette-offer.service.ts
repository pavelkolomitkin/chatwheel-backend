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

    async getActualOffer(addressee: ClientUserDocument)
    {
        const awaitSeconds = +this.config.get('CHAT_ROULETTE_OFFER_AWAIT_TIME');

        const timeAgo: Date = new Date();
        timeAgo.setTime(timeAgo.getTime() - awaitSeconds);

        const searchResults = await this.model.aggregate([
            {
                $match: {
                    addressee: addressee,
                    createdAt: {
                        $gte: timeAgo
                    },
                    accepted: false
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

    async validateRelationship(offer: ChatRouletteOfferDocument, addressee: ClientUserDocument)
    {
        await offer.populate('addressee');
        if (offer.addressee.id !== addressee.id)
        {
            throw new BadRequestException('The offer is not found!');
        }
    }
}