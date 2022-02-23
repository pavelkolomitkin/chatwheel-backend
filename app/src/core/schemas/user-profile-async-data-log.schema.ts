import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ClientUserDocument} from "./client-user.schema";
import {Document, Schema as MongooseSchema} from "mongoose";

export type UserProfileAsyncDataLogDocument = Document & UserProfileAsyncDataLog;

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
export class UserProfileAsyncDataLog
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    })
    user: ClientUserDocument;

    @Prop({
        type: MongooseSchema.Types.Date,
        default: new Date()
    })
    messageNumberChanged: Date;
}

export const UserProfileAsyncDataLogSchema = SchemaFactory.createForClass(UserProfileAsyncDataLog);