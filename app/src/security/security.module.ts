import { Module } from '@nestjs/common';
import {LoginPasswordController} from "./controllers/login-password.controller";
import {UniqueUserEmailValidator} from "./validators/unique-user-email.validator";
import {MongooseModule} from "@nestjs/mongoose";
import {
    ConfirmationUserAccountKey,
    ConfirmationUserAccountKeySchema
} from "./schemas/confirmation-user-account-key.schema";
import {ConfirmationAccountKeyService} from "./services/confirmation-account-key.service";
import {MailService} from "./services/mail.service";
import {LoginPasswordService} from "./services/login-password.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: ConfirmationUserAccountKey.name,
                schema: ConfirmationUserAccountKeySchema
            }
        ])

    ],
    controllers: [
        LoginPasswordController
    ],
    providers: [
        UniqueUserEmailValidator,
        ConfirmationAccountKeyService,
        MailService,
        LoginPasswordService
    ],
    exports: [
        MongooseModule
    ]
})
export class SecurityModule {}
