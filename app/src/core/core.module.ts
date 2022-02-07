import {ClassSerializerInterceptor, Global, Module} from '@nestjs/common';
import {APP_FILTER, APP_INTERCEPTOR, APP_PIPE} from '@nestjs/core';
import {BadRequestFilter} from './fiters/bad-request.filter';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {GlobalExceptionFilter} from './fiters/global-exception.filter';
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "./schemas/user.schema";
import {ClientUser, ClientUserSchema} from "./schemas/client-user.schema";
import {AdminUser, AdminUserSchema} from "./schemas/admin-user.schema";
import {EntityExistsValidator} from "./validators/entity-exists.validator";
import { provider as EmailServiceProvider } from './providers/email-service.provider';
import {GeoPoint, GeoPointSchema} from "./schemas/geo/geo-point.schema";
import {AbuseReport, AbuseReportSchema} from "./schemas/abuse-report.schema";
import {BannedUser} from "./schemas/banned-user.schema";
import {Country, CountrySchema} from "./schemas/country.schema";
import {Currency, CurrencySchema} from "./schemas/currency.schema";
import {Language, LanguageSchema} from "./schemas/language.schema";
import {Region, RegionSchema} from "./schemas/region.schema";
import {UserInterest, UserInterestSchema} from "./schemas/user-interest.schema";

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true
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
            }
        ])

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
        EntityExistsValidator
    ],
    exports: [
        MongooseModule,
        EmailServiceProvider,
        EntityExistsValidator
    ]
})
export class CoreModule {}
