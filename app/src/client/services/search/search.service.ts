import {BadRequestException, Injectable} from "@nestjs/common";
import {MapSearchDto} from "../../dto/search/map-search.dto";
import {ClientUser, ClientUserDocument} from "../../../core/schemas/client-user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {MapViewBox} from "../../../core/models/geo/map-view-box.model";
import {ConfigService} from "@nestjs/config";
import {getPageLimitOffset} from "../../../core/utils";

@Injectable()
export class SearchService
{
    constructor(
        @InjectModel(ClientUser.name) private readonly userModel: Model<ClientUserDocument>,

        private readonly configService: ConfigService
    ) {
    }

    validateRequestViewBox(box: MapViewBox)
    {
        // TODO
        // The box shouldn't exceed in size
    }

    validateUserLocation(user: ClientUserDocument)
    {
        if (!user.geoLocation)
        {
            throw new BadRequestException('You should update your location first!');
        }
    }

    getViewBoxPath(box: MapViewBox)
    {
        const { topLeft, bottomRight } = box;

        const result = [
            // bottom left coordinates
            [topLeft.longitude, bottomRight.latitude],
            // top right coordinates
            [bottomRight.longitude, topLeft.latitude]
        ];

        return result;
    }

    async getWithInBox(params: MapSearchDto): Promise<ClientUserDocument[]>
    {
        const { box } = params;

        this.validateRequestViewBox(box);

        const boundaries = this.getViewBoxPath(box);

        const result: ClientUserDocument[] = await this.userModel.find({
                geoLocation: {
                    $geoWithin: {
                        $box: boundaries
                    }
                },
                deleted: { $ne: true },
                isActivated: true
            },
        );

        return result;
    }

    async getNearBy(user: ClientUserDocument, page: number = 1): Promise<any>
    {
        this.validateUserLocation(user);
        const maxDistance: number = +this.configService.get('USER_NEARBY_SEARCH_MAX_RADIUS_M');

        const { limit, offset } = getPageLimitOffset(page, 20);

        const result = await this.userModel.find({
            geoLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: user.geoLocation.coordinates
                    },
                    $maxDistance: <Number>maxDistance
                },
            },
            _id: { $ne: user._id },
            deleted: { $ne: true },
            isActivated: true
        })
            .populate(ClientUser.COMMON_POPULATED_FIELDS.join(' '))
            .skip(offset)
            .limit(limit);


        return result;
    }
}