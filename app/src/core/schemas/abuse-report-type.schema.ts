import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {Exclude, Expose} from "class-transformer";

export type AbuseReportTypeDocument = Document & AbuseReportType;

@Exclude()
@Schema({
    toObject: {
        virtuals: true,
    },
    toJSON: {
        virtuals: true,
    },
    id: true
})
export class AbuseReportType
{
    @Expose({ name: 'id' })
    id: any;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String
    })
    title: string;

    @Expose()
    @Prop({
        type: MongooseSchema.Types.String,
        maxlength: 20
    })
    code: string;
}

export const AbuseReportTypeSchema = SchemaFactory.createForClass(AbuseReportType);