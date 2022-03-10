import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {
    ChatRouletteUserActivity,
    ChatRouletteUserActivityDocument
} from "../../../core/schemas/chat-roulette-user-activity.schema";
import {Model} from "mongoose";
import {ClientUserDocument} from "../../../core/schemas/client-user.schema";
import {ChatRoulettePictureService} from "./chat-roulette-picture.service";

@Injectable()
export class ChatRouletteUserActivityService
{
    constructor(
        @InjectModel(ChatRouletteUserActivity.name) private readonly model: Model<ChatRouletteUserActivityDocument>,
        private readonly pictureService: ChatRoulettePictureService
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
        const activity: ChatRouletteUserActivityDocument = await this.model.findOne({
            user: user
        });

        if (!activity)
        {
            return;
        }

        if (!!activity.lastCapturedPicture)
        {
            try {
                await this.pictureService.removePicture(activity);
            }
            catch (error) {}
        }

        await activity.delete();

        return activity;
    }
}