import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectService } from './connect.service';
import { ConnectController } from './connect.controller';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [ConnectController],
    providers: [ConnectService],
})
export class ConnectModule { }
