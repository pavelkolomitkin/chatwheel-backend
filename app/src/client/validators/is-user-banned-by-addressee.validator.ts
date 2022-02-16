import {Injectable, InternalServerErrorException} from "@nestjs/common";
import {ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface} from "class-validator";
import {ConversationService} from "../services/conversation.service";
import {ProfileService} from "../services/profile.service";
import {ClientUser, ClientUserDocument} from "../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {ConversationDocument} from "../../core/schemas/conversation.schema";

@Injectable()
@ValidatorConstraint({ name: 'IsUserBannedByAddresseeValidator', async: true })
export class IsUserBannedByAddresseeValidator implements ValidatorConstraintInterface
{
    static ADDRESSEE_CONTEXT = 'addressee';
    static CONVERSATION_CONTEXT = 'conversation';

    private defaultContext: string = IsUserBannedByAddresseeValidator.ADDRESSEE_CONTEXT;

    constructor(
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,
        private readonly conversationService: ConversationService,
        private readonly profileService: ProfileService,
    ) {
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        return "You've been banned by the user!";
    }

    async validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> {

        // @ts-ignore
        const user: ClientUserDocument = this.profileService.getCurrentUser();

        let paramContext = this.defaultContext;

        const contextConstraint = validationArguments.constraints.find(item => !!item.context);
        if (!!contextConstraint)
        {
            paramContext = contextConstraint.context;
        }

        if (paramContext === IsUserBannedByAddresseeValidator.ADDRESSEE_CONTEXT)
        {
            const addressee = await this.userModel.findOne(value);
            return await this.profileService.isAddresseeBanned(addressee, user);
        }
        else if (paramContext === IsUserBannedByAddresseeValidator.CONVERSATION_CONTEXT)
        {
            // value => conversationId
            const conversation: ConversationDocument = await this.conversationService.get(value);
            if (!conversation)
            {
                return false;
            }

            // for group conversations it doesn't matter
            if (!conversation.isIndividual)
            {
                return true;
            }

            const addressee: ClientUserDocument = await this.conversationService.getAddressee(conversation, user);
            return !await this.profileService.isAddresseeBanned(addressee, user);
        }

        throw new InternalServerErrorException('The context of validation has not been set up');
    }
}