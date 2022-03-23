import {ClassSerializerInterceptor, Global, Module} from '@nestjs/common';
import {APP_FILTER, APP_INTERCEPTOR, APP_GUARD, APP_PIPE} from '@nestjs/core';
import {BadRequestFilter} from './fiters/bad-request.filter';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {GlobalExceptionFilter} from './fiters/global-exception.filter';
import {MongooseModule} from '@nestjs/mongoose';
import {User, UserSchema} from './schemas/user.schema';
import {ClientUser, ClientUserSchema} from './schemas/client-user.schema';
import {AdminUser, AdminUserSchema} from './schemas/admin-user.schema';
import {EntityExistsValidator} from './validators/entity-exists.validator';
import { provider as EmailServiceProvider } from './providers/email-service.provider';
import {GeoPoint, GeoPointSchema} from './schemas/geo/geo-point.schema';
import {AbuseReport, AbuseReportSchema} from './schemas/abuse-report.schema';
import {BannedUser, BannedUserSchema} from './schemas/banned-user.schema';
import {Country, CountrySchema} from './schemas/country.schema';
import {Currency, CurrencySchema} from './schemas/currency.schema';
import {Language, LanguageSchema} from './schemas/language.schema';
import {Region, RegionSchema} from './schemas/region.schema';
import {UserInterest, UserInterestSchema} from './schemas/user-interest.schema';
import {MulterModule} from '@nestjs/platform-express';
import customConfig from './config/index';
import {CountryController} from './controllers/country.controller';
import {AvatarController} from './controllers/avatar.controller';
import {ImageThumbService} from './services/image-thumb.service';
import {UploadManagerService} from './services/upload-manager.service';
import {Conversation, ConversationSchema} from './schemas/conversation.schema';
import {ConversationMessage, ConversationMessageSchema} from './schemas/conversation-message.schema';
import {ConversationMessageList, ConversationMessageListSchema} from './schemas/conversation-message-list.schema';
import {Message, MessageSchema} from './schemas/message.schema';
import {AbuseReportTypeController} from "./controllers/abuse-report-type.controller";
import {AbuseReportType, AbuseReportTypeSchema} from "./schemas/abuse-report-type.schema";
import {ConversationMessageLog, ConversationMessageLogSchema} from "./schemas/conversation-message-log.schema";
import {UserProfileAsyncDataLog, UserProfileAsyncDataLogSchema} from "./schemas/user-profile-async-data-log.schema";
import {UserTypingLog, UserTypingLogSchema} from "./schemas/user-typing-log.schema";
import {SecurityModule} from "../security/security.module";
import {Call, CallSchema} from "./schemas/call.schema";
import {CallMember, CallMemberSchema} from "./schemas/call-member.schema";
import {CallMemberLink, CallMemberLinkSchema} from "./schemas/call-member-link.schema";
import {ChatRouletteOffer, ChatRouletteOfferSchema} from "./schemas/chat-roulette-offer.schema";
import {ChatRouletteUserActivity, ChatRouletteUserActivitySchema} from "./schemas/chat-roulette-user-activity.schema";
import {ConsoleModule} from "nestjs-console";
import {AdminUserCli} from "./services/console/admin-user.cli";
import {RoleBasedGuard} from "./guards/role-based.guard";
import {CountryService} from "./services/country.service";
import {HttpModule} from "@nestjs/axios";

@Global()
@Module({
    imports: [
        HttpModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [customConfig]
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get('MONGO_CONNECTION_STRING'),
                useNewUrlParser: true,
                autoIndex: false,
            }),
        }),
        MongooseModule.forFeature([
            {
                name: User.name,
                schema: UserSchema,
                discriminators: [
                    { name: ClientUser.name, schema: ClientUserSchema},
                    { name: AdminUser.name, schema: AdminUserSchema}
                ]
            },
            {
                name: GeoPoint.name,
                schema: GeoPointSchema
            },
            {
                name: AbuseReport.name,
                schema: AbuseReportSchema
            },
            {
                name: BannedUser.name,
                schema: AbuseReportSchema
            },
            {
                name: Country.name,
                schema: CountrySchema
            },
            {
                name: Currency.name,
                schema: CurrencySchema
            },
            {
                name: Language.name,
                schema: LanguageSchema
            },
            {
                name: Region.name,
                schema: RegionSchema
            },
            {
                name: UserInterest.name,
                schema: UserInterestSchema
            },
            {
                name: Conversation.name,
                schema: ConversationSchema
            },
            {
                name: ConversationMessage.name,
                schema: ConversationMessageSchema
            },
            {
                name: ConversationMessageList.name,
                schema: ConversationMessageListSchema
            },
            {
                name: Message.name,
                schema: MessageSchema
            },
            {
                name: BannedUser.name,
                schema: BannedUserSchema
            },
            {
                name: AbuseReportType.name,
                schema: AbuseReportTypeSchema
            },
            {
                name: ConversationMessageLog.name,
                schema: ConversationMessageLogSchema
            },
            {
                name: UserProfileAsyncDataLog.name,
                schema: UserProfileAsyncDataLogSchema
            },
            {
                name: UserTypingLog.name,
                schema: UserTypingLogSchema
            },
            {
                name: Call.name,
                schema: CallSchema
            },
            {
                name: CallMember.name,
                schema: CallMemberSchema
            },
            {
                name: CallMemberLink.name,
                schema: CallMemberLinkSchema
            },
            {
                name: ChatRouletteOffer.name,
                schema: ChatRouletteOfferSchema
            },
            {
                name: ChatRouletteUserActivity.name,
                schema: ChatRouletteUserActivitySchema
            }
        ]),

        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                return {
                    dest: config.get('UPLOAD_DIRECTORY'),
                    limits: {
                        fileSize: +config.get('MAX_UPLOAD_FILE_SIZE'),
                    }
                }
            }
        }),
        SecurityModule,
        ConsoleModule
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: BadRequestFilter,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ClassSerializerInterceptor
        },
        EmailServiceProvider,
        EntityExistsValidator,
        ImageThumbService,
        UploadManagerService,
        AdminUserCli,
        CountryService
    ],
    controllers: [
        CountryController,
        AvatarController,
        AbuseReportTypeController
    ],
    exports: [
        MongooseModule,
        EmailServiceProvider,
        EntityExistsValidator,
        SecurityModule,
        MulterModule,
        UploadManagerService,
        CountryService,
        ImageThumbService
    ]
})
export class CoreModule {}
