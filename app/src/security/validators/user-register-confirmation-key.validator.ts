import {ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments} from 'class-validator';
import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {ConfirmationUserAccountKey} from "../schemas/confirmation-user-account-key.schema";
import { Model } from 'mongoose';

@Injectable()
@ValidatorConstraint({ name: 'UserRegisterConfirmationKeyValidator', async: true })
export class UserRegisterConfirmationKeyValidator implements ValidatorConstraintInterface
{
    constructor(@InjectModel(ConfirmationUserAccountKey.name) private readonly model: Model<ConfirmationUserAccountKey>) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'The key is not valid!';
    }

    async validate(value: string, validationArguments?: ValidationArguments): Promise<boolean> {

        const key = await this.model.findOne({ key: value });

        return !!key;
    }
}
