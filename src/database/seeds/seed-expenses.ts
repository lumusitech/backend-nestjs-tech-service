import { DataSource } from 'typeorm';
import { Expense } from '../../finances/entities/expense.entity';
import { ExpenseCategory } from '../../finances/enums/expense-category.enum';

interface ExpenseSeed {
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  isRecurring: boolean;
  notes: string;
}

const EXPENSES: ExpenseSeed[] = [
  {
    description: 'Alquiler del local - Junio 2026',
    amount: 180000,
    date: '2026-06-01',
    category: ExpenseCategory.RENT,
    isRecurring: true,
    notes: 'Alquiler mensual del local comercial en Av. Corrientes',
  },
  {
    description: 'Servicio de internet Fibertel 300Mbps',
    amount: 15000,
    date: '2026-06-05',
    category: ExpenseCategory.UTILITIES,
    isRecurring: true,
    notes: 'Internet empresarial para el taller',
  },
  {
    description: 'Electricidad - Edenor Mayo 2026',
    amount: 28000,
    date: '2026-06-03',
    category: ExpenseCategory.UTILITIES,
    isRecurring: true,
    notes: 'Factura de luz del período mayo',
  },
  {
    description: 'Combustible - Viajes a clientes Junio',
    amount: 22000,
    date: '2026-06-04',
    category: ExpenseCategory.TRANSPORT,
    isRecurring: false,
    notes: 'Nafta para visitas a domicilio de clientes',
  },
  {
    description: 'Publicidad en Google Ads',
    amount: 30000,
    date: '2026-06-01',
    category: ExpenseCategory.ADVERTISING,
    isRecurring: true,
    notes: 'Campaña mensual de Google Ads para captar clientes',
  },
  {
    description: 'Hosting y dominio web',
    amount: 8000,
    date: '2026-06-01',
    category: ExpenseCategory.HOSTING,
    isRecurring: true,
    notes: 'Hosting VPS + dominio .com.ar anual prorrateado',
  },
  {
    description: 'Sueldos personal técnico - Junio 2026',
    amount: 350000,
    date: '2026-06-05',
    category: ExpenseCategory.SALARIES,
    isRecurring: true,
    notes: 'Sueldos de 5 técnicos + aportes y contribuciones',
  },
  {
    description: 'Compra de insumos: cinta aisladora, termocontraíble, precintos',
    amount: 12000,
    date: '2026-05-28',
    category: ExpenseCategory.SUPPLIES,
    isRecurring: false,
    notes: 'Insumos generales para el taller',
  },
  {
    description: 'Mantenimiento aires acondicionados',
    amount: 25000,
    date: '2026-05-10',
    category: ExpenseCategory.MAINTENANCE,
    isRecurring: false,
    notes: 'Limpieza y recarga de gas de 2 splits',
  },
  {
    description: 'Seguro del local comercial',
    amount: 18000,
    date: '2026-06-01',
    category: ExpenseCategory.OTHER,
    isRecurring: true,
    notes: 'Seguro contra incendio y robo mensual',
  },
];

export async function seedExpenses(dataSource: DataSource) {
  const expenseRepo = dataSource.getRepository(Expense);

  for (const exp of EXPENSES) {
    const existing = await expenseRepo.findOne({
      where: {
        description: exp.description,
        date: exp.date,
      },
    });

    if (existing) {
      console.log('  Expense already exists:', exp.description);
      continue;
    }

    const expense = expenseRepo.create({
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      category: exp.category,
      isRecurring: exp.isRecurring,
      notes: exp.notes,
    });

    await expenseRepo.save(expense);
    console.log('  Expense created:', exp.description, '-', exp.amount, 'ARS');
  }
}
