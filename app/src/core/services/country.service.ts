import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Country, CountryDocument} from "../schemas/country.schema";
import {Model} from "mongoose";
import {GeoLocation} from "../models/geo/geo-location.model";
import {HttpService} from "@nestjs/axios";
import {CoreException} from "../exceptions/core.exception";

@Injectable()
export class CountryService
{
    constructor(
        @InjectModel(Country.name) private readonly model: Model<CountryDocument>,
        private readonly http: HttpService,
    ) {
    }

    async getCountryByGeoLocation(location: GeoLocation)
    {
        const { country_code, country } = await this.getAddress(location);

        let result: CountryDocument = null;
        if (!!country_code)
        {
            result = await this.model.findOne({
                code: country_code.toUpperCase()
            });

            if (result)
            {
                return result;
            }
        }

        if (!!country)
        {
            result = await this.model.findOne({
                name: country
            });

            if (result)
            {
                return result;
            }
        }

        throw new CoreException('Cannot identify the country!');
    }

    async getAddress(location: GeoLocation): Promise<any>
    {
        const url = this.getCountryInfoUrl(location);


        try {
            const data: any = await this.http.get(url).toPromise();
            if (typeof data.data.address === 'undefined')
            {
                throw new Error();
            }

            return data.data.address;
        }
        catch (error)
        {
            throw new CoreException('Cannot fetch country info!');
        }
    }

    getCountryInfoUrl(location: GeoLocation)
    {
        return `https://nominatim.openstreetmap.org/reverse?format=json&namedetails=1&accept-language=en&lat=${location.latitude}&lon=${location.longitude}`;
    }
}