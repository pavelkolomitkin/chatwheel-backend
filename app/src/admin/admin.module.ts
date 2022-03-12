import { Module } from '@nestjs/common';
import {ClientUserController} from "./controllers/client-user.controller";

@Module({
    controllers: [
        ClientUserController
    ],
    providers: []
})
export class AdminModule {}
