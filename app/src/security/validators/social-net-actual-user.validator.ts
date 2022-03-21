import {BadRequestException, Injectable} from "@nestjs/common";
import {ValidationArguments, ValidatorConstraintInterface} from "class-validator";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";

@Injectable()
export class SocialNetActualUserValidator implements ValidatorConstraintInterface
{
    private message: string;

    constructor(
        @InjectModel(ClientUser.name) private readonly model: Model<ClientUserDocument>
    ) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {

        return this.message;
    }

    async validate(socialNetUserId: string, validationArguments?: ValidationArguments): Promise<boolean> {

        const [ socialNetType ] = validationArguments.constraints;

        const user: ClientUserDocument = await this.model.findOne({
            socialMediaType: socialNetType,
            socialMediaUserId: socialNetUserId
        });

        // TODO In this particular case we give user a chance to authenticate over the social net
        if (!user)
        {
            return true;
        }

        if (user.isBlocked)
        {
            this.message = `Your account has been blocked!`;
            return false;
        }

        if (user.deleted)
        {
            this.message = `The account is not found!`;
            return false;
        }

        return true;
    }

}