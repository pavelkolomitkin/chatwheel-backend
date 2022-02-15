import {Controller, Get, UseGuards} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Country, CountryDocument} from "../schemas/country.schema";
import {Model} from "mongoose";
import {AuthGuard} from "@nestjs/passport";

@Controller('country')
export class CountryController
{
    constructor(
        @InjectModel(Country.name) private readonly model: Model<CountryDocument>
    ) {
    }

    @Get('list')
    async getList()
    {
        const list: CountryDocument[] = await this.model.find({}).sort( { 'name': 1 });

        return {
            // @ts-ignore
            list: list.map(item => item.serialize())
        }
    }
}