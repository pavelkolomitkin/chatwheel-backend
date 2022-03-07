import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {BaseSchema} from "./base.schema";
import {ClientUser, ClientUserDocument} from "./client-user.schema";
import {Document, Schema as MongooseSchema} from 'mongoose';
import {Exclude, Expose, Type} from 'class-transformer';
import {createSerializer} from "../serializer/serializer";
import {CoreException} from "../exceptions/core.exception";

export type ChatRouletteUserActivityDocument = Document & ChatRouletteUserActivity;

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
export class ChatRouletteUserActivity extends BaseSchema
{
    @Type(() => ClientUser)
    @Expose()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    user: ClientUserDocument;

    @Expose()
    @Prop({
        type: {},
        required: true
    })
    lastCapturedPicture: {};

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        default: false
    })
    isBusy: boolean;
}

const ChatRouletteUserActivitySchema = SchemaFactory.createForClass(ChatRouletteUserActivity);

ChatRouletteUserActivitySchema.methods.setPicture = function(file)
{
    if (!file)
    {
        throw new CoreException('The chat roulette activity must have a picture!');
    }

    this.lastCapturedPicture = {
        encoding: file.encoding,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
        filename: file.filename
    };
}

ChatRouletteUserActivitySchema.methods.serialize = createSerializer([ChatRouletteUserActivity]);

export { ChatRouletteUserActivitySchema };