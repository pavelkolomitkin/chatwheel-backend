import {BaseSchema} from "./base.schema";
import {ClientUserDocument} from "./client-user.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";

export type AbuseReportDocument = AbuseReport & Document;


@Schema({
    id: true,
    timestamps: true
})
export class AbuseReport extends BaseSchema
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
    respondent: ClientUserDocument;

    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        maxlength: 255,
        default: null
    })
    description: string;
}

export const AbuseReportSchema = SchemaFactory.createForClass(AbuseReport);