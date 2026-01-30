import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stripeId: string; // PaymentIntent ID

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  subscriptionPlanId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ nullable: true })
  metadata: string; // JSON string

  @CreateDateColumn()
  createdAt: Date;
}
