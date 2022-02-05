import {Provider} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import {ProdEmailService} from "../services/mail/prod-email-service.service";
import {DevEmailService} from "../services/mail/dev-email-service.service";

export const provider: Provider = {

    provide: 'EmailService',
    inject: [ConfigService],
    useFactory: async (config: ConfigService) => {

        return config.get('NODE_ENV') === 'production' ?
            new ProdEmailService(config):
            new DevEmailService()
    }
}