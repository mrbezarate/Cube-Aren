import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/transaction.entity';
import { OnboardingAnswer } from '../../entities/onboarding-answer.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Transaction)
    private transactionsRepo: Repository<Transaction>,
    @InjectRepository(OnboardingAnswer)
    private onboardingRepo: Repository<OnboardingAnswer>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.usersRepo.update(id, dto);
    return this.findById(id);
  }

  async getWallet(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const transactions = await this.transactionsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      credits: user.credits,
      transactions,
    };
  }

  async completeOnboarding(userId: string, dto: OnboardingDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Save or update onboarding answers
    let answer = await this.onboardingRepo.findOne({ where: { userId } });
    if (!answer) {
      answer = this.onboardingRepo.create({ userId, ...dto });
    } else {
      Object.assign(answer, dto);
    }
    await this.onboardingRepo.save(answer);

    // Mark onboarding as completed
    await this.usersRepo.update(userId, { onboardingCompleted: true });
    return this.findById(userId);
  }
}
