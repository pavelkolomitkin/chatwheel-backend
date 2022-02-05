import { Module } from '@nestjs/common';
import {LoginPasswordController} from './controllers/login-password.controller';
import {UniqueUserEmailValidator} from './validators/unique-user-email.validator';
import {MongooseModule} from '@nestjs/mongoose';
import {
    ConfirmationUserAccountKey,
    ConfirmationUserAccountKeySchema
} from './schemas/confirmation-user-account-key.schema';
import {ConfirmationAccountKeyService} from './services/confirmation-account-key.service';
import {MailService} from './services/mail.service';
import {LoginPasswordService} from './services/login-password.service';
import {UserRegisterConfirmationKeyValidator} from './validators/user-register-confirmation-key.validator';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtStrategy} from './services/jwt.strategy';
import {SecurityTokenService} from "./services/security-token.service";
import {RestoreUserPasswordKey, RestoreUserPasswordKeySchema} from "./schemas/restore-user-password-key.schema";
import {RestorePasswordKeyService} from "./services/restore-password-key.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: ConfirmationUserAccountKey.name,
                schema: ConfirmationUserAccountKeySchema
            },
            {
                name: RestoreUserPasswordKey.name,
                schema: RestoreUserPasswordKeySchema
            }
        ]),

        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                return {
                    secret: config.get('APP_SECRET')
                }
            }
        }),
    ],
    controllers: [
        LoginPasswordController
    ],
    providers: [
        JwtStrategy,
        SecurityTokenService,
        UniqueUserEmailValidator,
        ConfirmationAccountKeyService,
        UserRegisterConfirmationKeyValidator,
        MailService,
        LoginPasswordService,
        RestorePasswordKeyService
    ],
    exports: [
        MongooseModule,
        PassportModule,
        JwtModule,
    ]
})
export class SecurityModule {}
