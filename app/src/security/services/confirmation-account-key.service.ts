import * as sha256 from 'crypto-js/sha256';
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {ConfirmationUserAccountKey} from "../schemas/confirmation-user-account-key.schema";
import { Model } from 'mongoose';
import {ClientUser} from "../../core/schemas/client-user.schema";

@Injectable()
export class ConfirmationAccountKeyService
{
    constructor(@InjectModel(ConfirmationUserAccountKey.name) private readonly keyModel: Model<ConfirmationUserAccountKey>) {
    }

    async create(user: ClientUser): Promise<ConfirmationUserAccountKey>
    {
        const keyString: string = this.generateKeyValue();

        const result: ConfirmationUserAccountKey = new this.keyModel({
            key: keyString,
            user: user
            }
        );

        await result.save();

        return result;
    }

    private generateKeyValue(): string
    {
        return sha256((+new Date()) + '' + Math.random());
    }
}