import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from 'class-validator';
import {Injectable} from '@nestjs/common';
import {InjectConnection} from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
@ValidatorConstraint({ name: 'EntityExistsValidator', async: true })
export class EntityExistsValidator implements ValidatorConstraintInterface
{
    constructor(@InjectConnection() private readonly connection: Connection) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'This does not exist!';
    }

    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {

        let [ modelName, fieldName ] = validationArguments.constraints;

        const model = this.connection.model(modelName);

        if (fieldName === 'id')
        {
            fieldName = '_id';
        }

        const query = {};
        query[fieldName] = value;

        const entity = await model.findOne(query);

        return !!entity;
    }
}