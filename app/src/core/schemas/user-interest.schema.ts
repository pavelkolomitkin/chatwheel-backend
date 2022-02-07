import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {BaseSchema} from "./base.schema";
import {createSerializer} from "../serializer/serializer";

export type UserInterestDocument = UserInterest & Document;

@Schema({
    timestamps: true,
    id: true
})
export class UserInterest extends BaseSchema
{
    @Prop()
    name: string;
}

const UserInterestSchema = SchemaFactory.createForClass(UserInterest);

UserInterestSchema.methods.serialize = createSerializer([UserInterest]);

export { UserInterestSchema };