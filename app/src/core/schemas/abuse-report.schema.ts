import {BaseSchema} from "./base.schema";
import {ClientUser, ClientUserDocument} from "./client-user.schema";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {AbuseReportType, AbuseReportTypeDocument} from "./abuse-report-type.schema";
import {Exclude, Expose, Type} from "class-transformer";
import {createSerializer} from "../serializer/serializer";

export type AbuseReportDocument = AbuseReport & Document;


@Exclude()
@Schema({
    id: true,
    timestamps: true,
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    },
})
export class AbuseReport extends BaseSchema
{
    @Expose()
    @Type(() => AbuseReportType)
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'AbuseReportType',
        required: true
    })
    type: AbuseReportTypeDocument;

    @Expose()
    @Type(() => ClientUser)
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
    })
    applicant: ClientUserDocument;

    @Expose()
    @Type(() => ClientUser)
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'ClientUser',
    })
    respondent: ClientUserDocument;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        required: false,
        maxlength: 1000,
        default: null
    })
    description: string;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.Boolean,
        default: false
    })
    new: boolean;
}



const AbuseReportSchema = SchemaFactory.createForClass(AbuseReport);

AbuseReportSchema.methods.serialize = function(groups: string[] = [])
{
    const result = {
        id: this.id,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        new: this.new,
        type: this.type.serialize(groups),
        applicant: this.applicant.serialize(groups),
        respondent: this.respondent.serialize(groups),
        description: this.description
    };

    return result;
}

export { AbuseReportSchema };