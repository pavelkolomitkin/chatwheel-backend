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

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: ConfirmationUserAccountKey.name,
                schema: ConfirmationUserAccountKeySchema
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
        // JwtModule.register({
        //     secret: process.env.APP_SECRET,
        // }),

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
        LoginPasswordService
    ],
    exports: [
        MongooseModule,
        PassportModule,
        JwtModule,
    ]
})
export class SecurityModule {}
