import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {
    ChatRouletteUserActivity,
    ChatRouletteUserActivityDocument
} from "../../../core/schemas/chat-roulette-user-activity.schema";
import {Model} from "mongoose";
import {ClientUserDocument} from "../../../core/schemas/client-user.schema";

@Injectable()
export class ChatRouletteUserActivityService
{
    constructor(
        @InjectModel(ChatRouletteUserActivity.name) private readonly model: Model<ChatRouletteUserActivityDocument>
    ) {
    }

    getModel()
    {
        return this.model;
    }

    async get(user: ClientUserDocument)
    {
        return this.model.findOne({
            user: user
        });
    }

    async create(user: ClientUserDocument)
    {
        const result: ChatRouletteUserActivityDocument = new this.model({
            user: user
        });

        return result;
    }

    async remove(user: ClientUserDocument)
    {
        await this.model.deleteOne({
            user: user
        });
    }
}