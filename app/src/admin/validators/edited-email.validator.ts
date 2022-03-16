import {Injectable} from "@nestjs/common";
import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {InjectModel} from "@nestjs/mongoose";
import {User, UserDocument} from "../../core/schemas/user.schema";
import {Model} from "mongoose";

@Injectable()
@ValidatorConstraint({ name: 'EditedEmailValidator'})
export class EditedEmailValidator implements ValidatorConstraintInterface
{
    constructor(
        @InjectModel(User.name) private readonly model: Model<UserDocument>
    ) {
    }

    message: string = '';

    defaultMessage(validationArguments?: ValidationArguments): string {
        return this.message;
    }

    async validate(value: string, validationArguments?: ValidationArguments): Promise<boolean> {

        const userId: string = validationArguments.object['id'];
        if (!!userId)
        {
            this.message = 'The user id is missing!';
            return false;
        }

        const user: User = await this.model.findById(userId);
        if (!user)
        {
            this.message = `The user with id=${userId} was not found!`;
            return false;
        }

        if (value === user.email)
        {
            return true;
        }

        const existingUser: User = await this.model.findOne({ email: value });
        if (existingUser)
        {
            this.message = `This email is already used!`;
            return false;
        }

        return true;
    }

}