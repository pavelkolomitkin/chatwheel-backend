import {Injectable} from "@nestjs/common";
import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {ConversationService} from "../services/conversation.service";
import {ProfileService} from "../services/profile.service";
import {ClientUserDocument} from "../../core/schemas/client-user.schema";
import {ConversationDocument} from "../../core/schemas/conversation.schema";

@Injectable()
@ValidatorConstraint({ name: 'IsUserConversationMemberValidator', async: true })
export class IsUserConversationMemberValidator implements ValidatorConstraintInterface
{
    constructor(
        private readonly conversationService: ConversationService,
        private readonly profileService: ProfileService
    ) {
    }


    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'Conversation is not found!';
    }

    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {

        //debugger
        const user: ClientUserDocument = this.profileService.getCurrentUser()

        const conversation: ConversationDocument = await this.conversationService.get(value);
        return await this.conversationService.isUserMember(user, conversation);
    }

}