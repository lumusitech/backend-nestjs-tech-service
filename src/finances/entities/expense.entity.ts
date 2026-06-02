import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { ExpenseCategory } from '../enums/expense-category.enum';

@Entity('expenses')
export class Expense extends BaseEntity {
  @ApiProperty({ example: 'Office rent payment' })
  @Column()
  description!: string;

  @ApiProperty({ example: 25000.0 })
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: number;

  @ApiProperty({ example: '2026-06-01' })
  @Column({ type: 'date' })
  date!: string;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.RENT })
  @Column({ type: 'enum', enum: ExpenseCategory })
  category!: ExpenseCategory;

  @ApiProperty({ example: false })
  @Column({ name: 'is_recurring', default: false })
  isRecurring!: boolean;

  @ApiPropertyOptional({ example: 'Monthly rent for office space' })
  @Column({ type: 'text', nullable: true })
  notes!: string;
}
