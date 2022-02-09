import * as mongoose from 'mongoose';
import {ArgumentMetadata, Inject, Injectable, NotFoundException, PipeTransform} from '@nestjs/common';
import {InjectConnection} from "@nestjs/mongoose";
import {Connection} from "mongoose";

@Injectable()
export class ParameterConverterPipe implements PipeTransform
{
    constructor(@InjectConnection() private readonly connection: Connection) {
    }
    //constructor(private modelName: string, private fieldName: string) {}

    async transform(value: string, metadata: ArgumentMetadata): Promise<any>
    {
        debugger

        /*
        if (this.fieldName == 'id')
        {
            this.fieldName = '_id';
        }

        const query = {};
        query[this.fieldName] = value;

        let result = null;
        try {
            result = await mongoose.model(this.modelName).findOne(query);
        }
        catch (e) {
            debugger
        }

        if (!result) {
            throw new NotFoundException(`'${this.modelName}' with ${this.fieldName} = ${value} was not found!`);
        }

        return result;*/

        return value;
    }

}
