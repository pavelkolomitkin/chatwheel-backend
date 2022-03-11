import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {User} from "../../core/schemas/user.schema";
import { Model } from 'mongoose';

@Injectable()
@ValidatorConstraint({ name: 'UniqueUserEmailValidator', async: true })
export class UniqueUserEmailValidator implements ValidatorConstraintInterface
{
    constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {

        return 'This email already exists!';
    }

    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {

        // @ts-ignore
        const user: User = await this.userModel.findOne({ email: value });

        return !user;
    }
}