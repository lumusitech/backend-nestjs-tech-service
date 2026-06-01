import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExpenseCategory } from '../enums/expense-category.enum';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  category!: ExpenseCategory;

  @Column({ name: 'is_recurring', default: false })
  isRecurring!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string;
}
