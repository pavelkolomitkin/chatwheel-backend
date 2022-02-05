import {Injectable} from '@nestjs/common';
import {ClientUserDocument} from '../../core/schemas/client-user.schema';
import {InjectModel} from '@nestjs/mongoose';
import {RestoreUserPasswordKey} from '../schemas/restore-user-password-key.schema';
import {Model} from 'mongoose';
import * as sha256 from 'crypto-js/sha256';
import {ConfigService} from '@nestjs/config';
import {RestorePasswordKeyExpirationException} from '../exceptions/restore-password-key-expiration.exception';

@Injectable()
export class RestorePasswordKeyService
{
    constructor(
        @InjectModel(RestoreUserPasswordKey.name) private readonly model: Model<RestoreUserPasswordKey>,
        private readonly config: ConfigService
    ) {
    }

    async isKeyValid(key: string): Promise<boolean>
    {
        const keyEntity: RestoreUserPasswordKey = await this.model.findOne({ key });
        if (!keyEntity)
        {
            return false;
        }

        if (!this.isKeyExpired(keyEntity))
        {
            return true;
        }

        return false;
    }

    async create(user: ClientUserDocument): Promise<RestoreUserPasswordKey>
    {
        let result: RestoreUserPasswordKey = await this.model.findOne({ user });
        if (result)
        {
            await this.handleKeyUpdatePeriod(result);

            result.key = this.generateKeyValue();
            await result.save();
        }
        else
        {
            const key: string = this.generateKeyValue();

            result = new this.model({
                key,
                user
            });

            await result.save();
        }

        return result;
    }

    async handleKeyUpdatePeriod(key: RestoreUserPasswordKey): Promise<void>
    {
        const timeLeftTillUpdate: number = this.getKeyUpdateTime(key);

        if (!this.isKeyExpired(key))
        {
            throw new RestorePasswordKeyExpirationException(timeLeftTillUpdate);
        }
    }

    isKeyExpired(key: RestoreUserPasswordKey): boolean
    {
        const timeLeftTillUpdate: number = this.getKeyUpdateTime(key);

        return (timeLeftTillUpdate < 0);
    }

    /**
     * How much time in seconds left for the next time
     * @param key
     */
    getKeyUpdateTime(key: RestoreUserPasswordKey): number
    {
        const periodSeconds: number = +this.config.get('RESTORE_PASSWORD_REQUEST_INTERVAL');

        // @ts-ignore
        const keyUpdatedAt: Date = new Date(key.updatedAt);
        const now: Date = new Date();

        const nowDifference = Math.round((now.getTime() - keyUpdatedAt.getTime()) / 1000);

        return periodSeconds - nowDifference;
    }

    generateKeyValue(): string
    {
        return sha256((+new Date()) + '' + Math.random());
    }
}