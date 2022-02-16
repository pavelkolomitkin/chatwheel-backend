import {BaseSchema} from "./base.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {Exclude, Expose} from "class-transformer";

export type ConversationDocument = Conversation & Document;

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
export class Conversation extends BaseSchema
{
    @Expose()
    @Prop({
        type: [{
            member: {
                type: MongooseSchema.Types.ObjectId,
                ref: 'User'
            },
            joinTime: {
                type: MongooseSchema.Types.Date
            }
        }],
        select: false
    })
    members: Object[];

    /**
     * Indicates whether it's a between two users and no one as the third has been added yet
     */
    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        default: true
    })
    isIndividual: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);