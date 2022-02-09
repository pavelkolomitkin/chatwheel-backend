import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {Expose} from "class-transformer";

export type GeoPointDocument = GeoPoint & Document;

@Expose()
@Schema({
    id: false,
})
export class GeoPoint
{
    @Prop({
        type: MongooseSchema.Types.String,
        enum: ['Point'],
        required: true
    })
    type: string;

    @Prop({
        type: [{ type: MongooseSchema.Types.Number, required: true }]
    })
    coordinates: Number[];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);