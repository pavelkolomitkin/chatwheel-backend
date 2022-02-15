import { Module } from '@nestjs/common';
import {ProfileController} from "./controllers/profile.controller";
import {UserInterestController} from "./controllers/user-interest.controller";
import {ProfileService} from "./services/profile.service";
import {UserInterestService} from "./services/user-interest.service";

@Module({
    controllers: [
        ProfileController,
        UserInterestController
    ],
    providers: [
        ProfileService,
        UserInterestService
    ]
})
export class ClientModule {}
