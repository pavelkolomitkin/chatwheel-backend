import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ConversationDocument} from "./conversation.schema";
import {Document, Schema as MongooseSchema} from "mongoose";
import {ClientUserDocument} from "./client-user.schema";

export type UserTypingLogDocument = Document & UserTypingLog;

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
export class UserTypingLog
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    })
    conversation: ConversationDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    user: ClientUserDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    recipient: ClientUserDocument;
}

export const UserTypingLogSchema = SchemaFactory.createForClass(UserTypingLog);