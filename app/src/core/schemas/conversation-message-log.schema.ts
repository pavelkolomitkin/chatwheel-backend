import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {MessageDocument} from "./message.schema";
import {Document, Schema as MongooseSchema} from "mongoose";
import {ClientUserDocument} from "./client-user.schema";

export type ConversationMessageLogDocument = Document & ConversationMessageLog;

export enum ConversationMessageLogType {
    ADD,
    EDIT,
    REMOVE
}

@Schema({
    id: true,
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
})
export class ConversationMessageLog
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Message',
        required: true
    })
    message: MessageDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    recipient: ClientUserDocument;

    @Prop({
        type: MongooseSchema.Types.Number,
        enum: ConversationMessageLogType
    })
    type: number;
}

export const ConversationMessageLogSchema = SchemaFactory.createForClass(ConversationMessageLog);