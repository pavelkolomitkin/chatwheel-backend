import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {BaseSchema} from "./base.schema";
import {ClientUser, ClientUserDocument} from "./client-user.schema";
import {Document, Schema as MongooseSchema} from 'mongoose';
import {Exclude, Expose, Type} from 'class-transformer';
import {createSerializer} from "../serializer/serializer";

export enum ChatRouletteOfferType {
    SEARCH_PARTNER_FOUND = 'found',
    SEARCH_PARTNER_OFFERED = 'offered',
    SEARCH_PARTNER_ACCEPTED = 'accepted',
}

export type ChatRouletteOfferDocument = Document & ChatRouletteOffer;

@Exclude()
@Schema({
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
    id: true
})
export class ChatRouletteOffer extends BaseSchema
{
    @Type(() => ClientUser)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    user: ClientUserDocument;

    @Type(() => ClientUser)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    addressee: ClientUserDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        default: false
    })
    accepted: boolean;
}

const ChatRouletteOfferSchema = SchemaFactory.createForClass(ChatRouletteOffer);

ChatRouletteOfferSchema.methods.serialize = createSerializer([ChatRouletteOffer]);

export { ChatRouletteOfferSchema };