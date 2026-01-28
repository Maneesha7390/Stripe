import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto } from './modules/users/dto/create-user.dto';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  @Post('users')
  @ApiOperation({ summary: 'Create a test user' })
  async createUser(@Body() dto: CreateUserDto) {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }
}
