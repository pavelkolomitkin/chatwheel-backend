import { Module } from '@nestjs/common';
import {ProfileController} from "./controllers/profile.controller";
import {UserInterestController} from "./controllers/user-interest.controller";
import {ProfileService} from "./services/profile.service";
import {UserInterestService} from "./services/user-interest.service";
import {ConversationMessageController} from "./controllers/conversation-message.controller";
import {UserConversationController} from "./controllers/user-conversation.controller";
import {ConversationService} from "./services/conversation.service";
import {ConversationMessageListService} from "./services/conversation-message-list.service";
import {UserConversationService} from "./services/user-conversation.service";
import {ConversationMessageService} from "./services/conversation-message.service";
import {IsUserBannedByAddresseeValidator} from "./validators/is-user-banned-by-addressee.validator";
import {IsUserConversationMemberValidator} from "./validators/is-user-conversation-member.validator";
import {IsUserMessageAuthorValidator} from "./validators/is-user-message-author.validator";
import {UserProfileController} from "./controllers/user-profile.controller";
import {UserProfileService} from "./services/user-profile.service";

@Module({
    controllers: [
        ProfileController,
        UserProfileController,
        UserInterestController,
        ConversationMessageController,
        UserConversationController
    ],
    providers: [
        ProfileService,
        ConversationService,
        ConversationMessageListService,
        UserConversationService,
        ConversationMessageService,
        UserInterestService,
        UserProfileService,

        IsUserBannedByAddresseeValidator,
        IsUserConversationMemberValidator,
        IsUserMessageAuthorValidator
    ]
})
export class ClientModule {}
