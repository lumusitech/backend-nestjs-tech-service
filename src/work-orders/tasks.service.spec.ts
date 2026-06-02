import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderNote } from './entities/work-order-note.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('WorkOrdersService - Tasks', () => {
  let service: WorkOrdersService;
  let taskRepository: ReturnType<typeof createMockRepository>;
  let workOrderRepository: ReturnType<typeof createMockRepository>;
  let noteRepository: ReturnType<typeof createMockRepository>;
  let materialRepository: ReturnType<typeof createMockRepository>;
  let userRepository: ReturnType<typeof createMockRepository>;
  let eventEmitter: { emit: jest.Mock };

  const mockWorkOrder: WorkOrder = Object.assign(new WorkOrder(), {
    id: 'wo-1',
    trackingCode: 'TS-A1B2C',
    status: 'in_progress',
    priority: 'high',
    technicians: [{ id: 'tech-1' }],
  });

  const mockTask: Task = Object.assign(new Task(), {
    id: 'task-1',
    title: 'Replace capacitor',
    description: 'Replace faulty capacitor on board',
    isCompleted: false,
    completedAt: null,
    workOrderId: 'wo-1',
    assignedToId: 'tech-1',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });

  beforeEach(async () => {
    taskRepository = createMockRepository();
    workOrderRepository = createMockRepository();
    noteRepository = createMockRepository();
    materialRepository = createMockRepository();
    userRepository = createMockRepository();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: workOrderRepository,
        },
        {
          provide: getRepositoryToken(WorkOrderNote),
          useValue: noteRepository,
        },
        {
          provide: getRepositoryToken(WorkOrderMaterial),
          useValue: materialRepository,
        },
        { provide: getRepositoryToken(Task), useValue: taskRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    it('should create a task for an existing work order', async () => {
      const dto = { title: 'Replace capacitor', description: 'Fix board' };
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      taskRepository.create.mockReturnValue({ ...mockTask, ...dto });
      taskRepository.save.mockResolvedValue(mockTask);

      const result = await service.createTask('wo-1', dto);

      expect(workOrderRepository.findOne).toHaveBeenCalled();
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...dto,
        workOrderId: 'wo-1',
      });
      expect(taskRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should emit task.created event after creation', async () => {
      const dto = { title: 'Replace capacitor' };
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      await service.createTask('wo-1', dto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.created',
        expect.objectContaining({
          taskId: 'task-1',
          taskTitle: 'Replace capacitor',
          workOrderId: 'wo-1',
          trackingCode: 'TS-A1B2C',
        }),
      );
    });

    it('should throw NotFoundException when work order does not exist', async () => {
      workOrderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createTask('nonexistent', { title: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTasks', () => {
    it('should return all tasks for a work order', async () => {
      const tasks = [mockTask];
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findTasks('wo-1');

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { workOrderId: 'wo-1' },
        relations: { assignedTo: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(tasks);
    });

    it('should return empty array when work order has no tasks', async () => {
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);
      taskRepository.find.mockResolvedValue([]);

      const result = await service.findTasks('wo-1');

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when work order does not exist', async () => {
      workOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findTasks('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTask', () => {
    it('should update task fields', async () => {
      const dto = { title: 'Updated title' };
      taskRepository.findOne.mockResolvedValue({ ...mockTask });
      taskRepository.save.mockResolvedValue({ ...mockTask, ...dto });

      const result = await service.updateTask('wo-1', 'task-1', dto);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', workOrderId: 'wo-1' },
      });
      expect(result.title).toBe('Updated title');
    });

    it('should set completedAt when marking task as completed', async () => {
      const dto = { isCompleted: true };
      const incompleteTask = {
        ...mockTask,
        isCompleted: false,
        completedAt: null,
      };
      taskRepository.findOne.mockResolvedValue(incompleteTask);
      taskRepository.save.mockImplementation((t: Task) => Promise.resolve(t));
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);

      const result = await service.updateTask('wo-1', 'task-1', dto);

      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should clear completedAt when marking task as not completed', async () => {
      const dto = { isCompleted: false };
      const completedTask = {
        ...mockTask,
        isCompleted: true,
        completedAt: new Date(),
      };
      taskRepository.findOne.mockResolvedValue(completedTask);
      taskRepository.save.mockImplementation((t: Task) => Promise.resolve(t));

      const result = await service.updateTask('wo-1', 'task-1', dto);

      expect(result.completedAt).toBeNull();
    });

    it('should emit task.completed event when task transitions to completed', async () => {
      const dto = { isCompleted: true };
      const incompleteTask = { ...mockTask, isCompleted: false };
      taskRepository.findOne.mockResolvedValue(incompleteTask);
      taskRepository.save.mockImplementation((t: Task) => Promise.resolve(t));
      workOrderRepository.findOne.mockResolvedValue(mockWorkOrder);

      await service.updateTask('wo-1', 'task-1', dto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.completed',
        expect.objectContaining({
          taskId: 'task-1',
          taskTitle: 'Replace capacitor',
          workOrderId: 'wo-1',
          trackingCode: 'TS-A1B2C',
        }),
      );
    });

    it('should not emit task.completed event when task was already completed', async () => {
      const dto = { title: 'Updated title' };
      const completedTask = {
        ...mockTask,
        isCompleted: true,
        completedAt: new Date(),
      };
      taskRepository.findOne.mockResolvedValue(completedTask);
      taskRepository.save.mockImplementation((t: Task) => Promise.resolve(t));

      await service.updateTask('wo-1', 'task-1', dto);

      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'task.completed',
        expect.anything(),
      );
    });

    it('should not emit task.completed event when isCompleted is false', async () => {
      const dto = { isCompleted: false };
      const incompleteTask = { ...mockTask, isCompleted: false };
      taskRepository.findOne.mockResolvedValue(incompleteTask);
      taskRepository.save.mockImplementation((t: Task) => Promise.resolve(t));

      await service.updateTask('wo-1', 'task-1', dto);

      expect(eventEmitter.emit).not.toHaveBeenCalledWith(
        'task.completed',
        expect.anything(),
      );
    });

    it('should throw NotFoundException when task does not exist in work order', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTask('wo-1', 'nonexistent', { title: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateTask('wo-1', 'nonexistent', { title: 'Test' } as any),
      ).rejects.toThrow('Task #nonexistent not found in work order #wo-1');
    });
  });

  describe('removeTask', () => {
    it('should soft remove a task', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      await service.removeTask('wo-1', 'task-1');

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1', workOrderId: 'wo-1' },
      });
      expect(taskRepository.softRemove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.removeTask('wo-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeTask('wo-1', 'nonexistent')).rejects.toThrow(
        'Task #nonexistent not found in work order #wo-1',
      );
    });
  });
});
