import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/transaction.entity';
import { OnboardingAnswer } from '../../entities/onboarding-answer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction, OnboardingAnswer])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
