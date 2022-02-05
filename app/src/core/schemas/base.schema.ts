import {Document} from "mongoose";
import {Exclude, Expose, Type} from "class-transformer";

@Exclude()
export class BaseSchema
{
    @Expose({ name: 'id' })
    id: any;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}