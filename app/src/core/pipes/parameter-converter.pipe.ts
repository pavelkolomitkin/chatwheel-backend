import {ArgumentMetadata, Inject, Injectable, NotFoundException, PipeTransform} from '@nestjs/common';
import {InjectConnection} from "@nestjs/mongoose";
import {Connection} from "mongoose";
import {ParameterConverterData} from "../decorators/parameter-converter.decorator";
import * as Mongoose from "mongoose";

@Injectable()
export class ParameterConverterPipe implements PipeTransform
{
    constructor(@InjectConnection() private readonly connection: Connection) {
    }

    async transform(value: ParameterConverterData, metadata: ArgumentMetadata): Promise<any>
    {

        let paramValue = value.value;
        let { model, field, required } = value;

        if (field == 'id')
        {
            field = '_id';
            paramValue = new Mongoose.Types.ObjectId(paramValue);
        }

        const query = {};
        query[field] = paramValue;

        let result = null;
        try {
            result = await this.connection.model(model).findOne(query);
        }
        catch (e) {
            //debugger
        }

        if (required)
        {
            if (!result) {
                throw new NotFoundException(`'${model}' with ${field} = ${paramValue} was not found!`);
            }
        }

        return result;
    }

}
