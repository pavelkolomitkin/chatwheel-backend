import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {Document, Schema as MongooseSchema} from "mongoose";
import {Expose} from "class-transformer";

export type GeoPointDocument = GeoPoint & Document;

@Expose()
@Schema({
    toObject: {
        transform: (doc, ret) => {

            const [longitude, latitude] = ret.coordinates;

            return {longitude, latitude};
        }
    }
})
export class GeoPoint
{
    @Prop({
        type: MongooseSchema.Types.String,
        default: 'Point'
    })
    type: string;

    @Prop({
        type: [{ type: MongooseSchema.Types.Number, required: true }]
    })
    coordinates: Number[];
}

const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

//GeoPointSchema.methods.serialize = createSerializer([GeoPoint]);


export { GeoPointSchema };