import {BaseSchema} from "./base.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ClientUserDocument} from "./client-user.schema";
import {Document, Schema as MongooseSchema} from "mongoose";

export type BannedUserDocument = Document & BannedUser;

@Schema({
    timestamps: true,
})
export class BannedUser extends BaseSchema
{
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
    })
    applicant: ClientUserDocument;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
    })
    banned: ClientUserDocument;
}

export const BannedUserSchema = SchemaFactory.createForClass(BannedUser);