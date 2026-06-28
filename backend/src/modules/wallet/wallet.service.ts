import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Transaction, TransactionType } from '../../entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Transaction)
    private transactionsRepo: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return Number(user.credits);
  }

  async getTransactions(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.transactionsRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    referenceId?: string,
    description?: string,
  ): Promise<Transaction> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const balanceAfter = Number(user.credits) + Number(amount);
      user.credits = balanceAfter;
      await queryRunner.manager.save(User, user);

      const transaction = queryRunner.manager.create(Transaction, {
        userId,
        type,
        amount,
        balanceAfter,
        referenceId,
        description,
      });
      const savedTx = await queryRunner.manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return savedTx;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deductCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    referenceId?: string,
    description?: string,
  ): Promise<Transaction> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      if (Number(user.credits) < Number(amount)) {
        throw new BadRequestException('Insufficient credits');
      }

      const balanceAfter = Number(user.credits) - Number(amount);
      user.credits = balanceAfter;
      await queryRunner.manager.save(User, user);

      const transaction = queryRunner.manager.create(Transaction, {
        userId,
        type,
        amount: -amount,
        balanceAfter,
        referenceId,
        description,
      });
      const savedTx = await queryRunner.manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return savedTx;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async depositDemo(userId: string, amount = 1000): Promise<Transaction> {
    return this.addCredits(userId, amount, TransactionType.DEPOSIT, null, 'Demo credits deposit');
  }
}
