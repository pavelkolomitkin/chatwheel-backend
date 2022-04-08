import {Command, Console} from "nestjs-console";
import {InjectModel} from "@nestjs/mongoose";
import {ClientUser, ClientUserDocument} from "../../schemas/client-user.schema";
import {Model} from "mongoose";
import {UserService} from "../../../security/services/user.service";
import {LoginPasswordService} from "../../../security/services/login-password.service";
import * as commander from 'commander';
import {PipeReaderCli} from "./helper/pipe-reader.cli";
import {UserInterest, UserInterestDocument} from "../../schemas/user-interest.schema";
import {Country, CountryDocument} from "../../schemas/country.schema";
import {CoreException} from "../../exceptions/core.exception";
const csv = require('csvtojson');

@Console()
export class ClientUserCli
{
    constructor(
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,
        @InjectModel(Country.name) private readonly countryModel: Model<CountryDocument>,
        @InjectModel(UserInterest.name) private readonly userInterestModel: Model<UserInterestDocument>,
        private readonly userService: UserService,
        private readonly loginService: LoginPasswordService,
        private readonly pipeReader: PipeReaderCli,

    ) {
    }

    @Command({
        command: 'create-users-csv <password>',
        description: 'Create a range of client users by a csv file read from the std input'
    })
    async createFromCSV(password: string, command: commander.Command): Promise<void>
    {
        console.log('Creating client users from the CSV file...');

        const passwordHash: string = await this.loginService.getHashedPassword(password);
        const content: string = await this.pipeReader.getContent();

        await csv({
            trim: true,
            delimiter: "\t",
            noheader: false,
            output: "csv"
        })
            .fromString(content)
            .then(async (data: any[]) => {

                for (let item of data)
                {
                    try {
                        const user: ClientUserDocument = await this.createUser(item, passwordHash);
                        console.log('USER CREATED...');
                        console.log(user.email);
                    }
                    catch (error)
                    {
                        console.log(`ERROR: ${error.message}`);
                    }
                }
            })
        ;
    }

    async createUser(data: any, passwordHash: string)
    {
        const email: string = data[0]
        const fullName: string = data[1];
        const about: string = data[2];
        const interests: string[] = !!data[3] ? data[3].split(',').map(interest => interest.trim()) : [];
        const latitude: number = parseFloat(data[4]);
        const longitude: number = parseFloat(data[5]);
        const residenceCountryCode: string = data[6];
        const searchCountryCode: string = data[7];

        const user: ClientUserDocument = await this.userModel.findOne({email: email});
        if (user)
        {
            throw new CoreException(`The user ${email} already exists!`);
        }

        const interestEntities: UserInterestDocument[] = [];
        for (let interestName of interests)
        {
            const interest: UserInterestDocument = await this.getUserInterest(interestName);
            interestEntities.push(interest);
        }

        const residenceCountry: CountryDocument = await this.countryModel.findOne({code: residenceCountryCode});
        const searchCountry: CountryDocument = await this.countryModel.findOne({code: searchCountryCode});

        const result: ClientUserDocument = new this.userModel({
            email: email,
            password: passwordHash,
            fullName: fullName,
            isActivated: true,
            residenceCountry: residenceCountry,
            searchCountry: searchCountry,
            geoLocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            about: about,
            interests: interestEntities.map(interest => interest._id),
        });

        await result.save();
        return result;
    }

    async getUserInterest(interestName: string): Promise<UserInterestDocument>
    {
        const name: string = interestName.trim();

        let result: UserInterestDocument = await this.userInterestModel.findOne({ name: name });
        if (!result)
        {
            result = new this.userInterestModel({
                name: name
            });

            await result.save();
        }

        return result;
    }
}