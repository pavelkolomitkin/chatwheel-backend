import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {Injectable} from "@nestjs/common";
import {ProfileService} from "../services/profile.service";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {ConversationMessage, ConversationMessageDocument} from "../../core/schemas/conversation-message.schema";

@Injectable()
@ValidatorConstraint({ name: 'IsUserMessageAuthorValidator', async: true })
export class IsUserMessageAuthorValidator implements ValidatorConstraintInterface
{
    constructor(
        private readonly profileService: ProfileService,
        @InjectModel(ConversationMessage.name) private readonly messageModel: Model<ConversationMessageDocument>
    ) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Message is not found!';
    }

    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {

        const user: ClientUserDocument = this.profileService.getCurrentUser();

        const message: ConversationMessageDocument = await this.messageModel.findOne(value)
            .populate('message')
            .populate('message.author');


        if (!message || !message.message)
        {
            return false;
        }

        if (message.message.author.id !== user.id)
        {
            return false;
        }


        return true
    }
}