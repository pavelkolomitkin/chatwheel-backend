import {Module} from '@nestjs/common';
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
import {SecurityTokenService} from './services/security-token.service';
import {RestoreUserPasswordKey, RestoreUserPasswordKeySchema} from './schemas/restore-user-password-key.schema';
import {RestorePasswordKeyService} from './services/restore-password-key.service';
import {RestorePasswordKeyValidator} from './validators/restore-password-key.validator';
import {ProfileController} from "./controllers/profile.controller";
import {UserService} from "./services/user.service";
import {WsJwtGuard} from "./guards/ws-jwt.guard";
import {JwtAuthService} from "./services/jwt-auth.service";
import {HttpModule} from "@nestjs/axios";
import {VkAuthService} from "./services/vk-auth.service";
import {VkAuthController} from "./controllers/vk-auth.controller";

@Module({
    imports: [
        HttpModule,
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
        LoginPasswordController,
        ProfileController,
        VkAuthController
    ],
    providers: [
        JwtStrategy,
        SecurityTokenService,
        UserService,
        MailService,
        LoginPasswordService,
        RestorePasswordKeyService,
        ConfirmationAccountKeyService,
        VkAuthService,

        UniqueUserEmailValidator,
        UserRegisterConfirmationKeyValidator,
        RestorePasswordKeyValidator,
        JwtAuthService,
        WsJwtGuard,
    ],
    exports: [
        MongooseModule,
        PassportModule,
        JwtModule,
        WsJwtGuard
    ]
})
export class SecurityModule {}
