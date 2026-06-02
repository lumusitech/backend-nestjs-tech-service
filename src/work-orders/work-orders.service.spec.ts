import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderNote } from './entities/work-order-note.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { WorkOrderStatus } from '../common/enums/work-order-status.enum';
import { Priority } from '../common/enums/priority.enum';
import { NoteType } from './enums/note-type.enum';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let workOrderRepo: ReturnType<typeof createMockRepository>;
  let noteRepo: ReturnType<typeof createMockRepository>;
  let materialRepo: ReturnType<typeof createMockRepository>;
  let taskRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let userRepoFindBy: jest.Mock;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    workOrderRepo = createMockRepository();
    noteRepo = createMockRepository();
    materialRepo = createMockRepository();
    taskRepo = createMockRepository();
    userRepoFindBy = jest.fn().mockResolvedValue([]);
    userRepo = createMockRepository({ findBy: userRepoFindBy });
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: getRepositoryToken(WorkOrder), useValue: workOrderRepo },
        { provide: getRepositoryToken(WorkOrderNote), useValue: noteRepo },
        {
          provide: getRepositoryToken(WorkOrderMaterial),
          useValue: materialRepo,
        },
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      clientId: 'client-1',
      serviceTypeId: 'service-1',
      priority: Priority.HIGH,
    };

    it('should create a work order with a tracking code', async () => {
      workOrderRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'wo-1',
        trackingCode: 'TS-ABCDE',
        ...dto,
        status: WorkOrderStatus.PENDING,
        client: { id: 'client-1', name: 'Client' },
        serviceType: { id: 'service-1', name: 'Service' },
        technicians: [],
      });

      const result = await service.create(dto);

      expect(workOrderRepo.create).toHaveBeenCalled();
      expect(workOrderRepo.save).toHaveBeenCalled();
      expect(result.trackingCode).toMatch(/^TS-[A-Z0-9]{5}$/);
    });

    it('should assign technicians when technicianIds provided', async () => {
      const techs = [{ id: 'tech-1' }, { id: 'tech-2' }];
      userRepoFindBy.mockResolvedValue(techs);
      workOrderRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'wo-1',
        trackingCode: 'TS-ABCDE',
        ...dto,
        technicianIds: ['tech-1', 'tech-2'],
        status: WorkOrderStatus.PENDING,
        client: { id: 'client-1', name: 'Client' },
        serviceType: { id: 'service-1', name: 'Service' },
        technicians: techs,
      });

      await service.create({ ...dto, technicianIds: ['tech-1', 'tech-2'] });

      expect(userRepoFindBy).toHaveBeenCalledWith({
        id: In(['tech-1', 'tech-2']),
      });
    });

    it('should emit workorder.created event', async () => {
      workOrderRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'wo-1',
        trackingCode: 'TS-ABCDE',
        ...dto,
        status: WorkOrderStatus.PENDING,
        priority: Priority.HIGH,
        client: { id: 'client-1', name: 'Client' },
        serviceType: { id: 'service-1', name: 'Service' },
        technicians: [],
      });
      workOrderRepo.save.mockResolvedValue({
        id: 'wo-1',
        trackingCode: 'TS-ABCDE',
        ...dto,
        status: WorkOrderStatus.PENDING,
      });

      await service.create(dto);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'workorder.created',
        expect.objectContaining({
          workOrderId: 'wo-1',
          trackingCode: 'TS-ABCDE',
        }),
      );
    });

    it('should generate a unique tracking code if first one exists', async () => {
      workOrderRepo.findOne
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'wo-1',
          trackingCode: 'TS-FGHIJ',
          ...dto,
          status: WorkOrderStatus.PENDING,
          client: { id: 'client-1', name: 'Client' },
          serviceType: { id: 'service-1', name: 'Service' },
          technicians: [],
        });

      const result = await service.create(dto);

      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a work order with relations', async () => {
      const workOrder = {
        id: 'wo-1',
        trackingCode: 'TS-ABCDE',
        status: WorkOrderStatus.PENDING,
      };
      workOrderRepo.findOne.mockResolvedValue(workOrder);

      const result = await service.findOne('wo-1');

      expect(result).toEqual(workOrder);
      expect(workOrderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'wo-1' },
        relations: {
          client: true,
          serviceType: true,
          technicians: true,
          notes: true,
          materials: { supplier: true },
        },
      });
    });

    it('should throw NotFoundException when work order not found', async () => {
      workOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingOrder = {
      id: 'wo-1',
      trackingCode: 'TS-ABCDE',
      status: WorkOrderStatus.PENDING,
      technicians: [{ id: 'tech-1' }],
    };

    it('should update a work order', async () => {
      workOrderRepo.findOne.mockResolvedValue({ ...existingOrder });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('wo-1', {
        diagnosis: 'Broken screen',
      });

      expect(workOrderRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should validate status transitions', async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...existingOrder,
        status: WorkOrderStatus.PENDING,
      });

      await expect(
        service.update('wo-1', { status: WorkOrderStatus.COMPLETED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow valid status transition from PENDING to ASSIGNED', async () => {
      workOrderRepo.findOne.mockResolvedValue({ ...existingOrder });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('wo-1', {
        status: WorkOrderStatus.ASSIGNED,
      });

      expect(result.status).toBe(WorkOrderStatus.ASSIGNED);
    });

    it('should allow valid status transition from ASSIGNED to IN_PROGRESS', async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...existingOrder,
        status: WorkOrderStatus.ASSIGNED,
      });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('wo-1', {
        status: WorkOrderStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
    });

    it('should set completedAt when transitioning to COMPLETED', async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...existingOrder,
        status: WorkOrderStatus.IN_PROGRESS,
      });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('wo-1', {
        status: WorkOrderStatus.COMPLETED,
      });

      expect(result.completedAt).toBeDefined();
    });

    it('should block transition from DELIVERED to any status', async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...existingOrder,
        status: WorkOrderStatus.DELIVERED,
      });

      await expect(
        service.update('wo-1', { status: WorkOrderStatus.CANCELLED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should block transition from CANCELLED to any status', async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...existingOrder,
        status: WorkOrderStatus.CANCELLED,
      });

      await expect(
        service.update('wo-1', { status: WorkOrderStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should emit workorder.status_changed event on status change', async () => {
      workOrderRepo.findOne.mockResolvedValue({ ...existingOrder });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.update('wo-1', { status: WorkOrderStatus.ASSIGNED });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'workorder.status_changed',
        expect.objectContaining({
          workOrderId: 'wo-1',
          oldStatus: WorkOrderStatus.PENDING,
          newStatus: WorkOrderStatus.ASSIGNED,
        }),
      );
    });

    it('should not emit status_changed event when status is unchanged', async () => {
      workOrderRepo.findOne.mockResolvedValue({ ...existingOrder });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.update('wo-1', { diagnosis: 'Updated diagnosis' });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should replace technicians when technicianIds provided', async () => {
      const newTechs = [{ id: 'tech-2' }];
      userRepoFindBy.mockResolvedValue(newTechs);
      workOrderRepo.findOne.mockResolvedValue({ ...existingOrder });
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await service.update('wo-1', { technicianIds: ['tech-2'] });

      expect(userRepoFindBy).toHaveBeenCalledWith({
        id: In(['tech-2']),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'workorder.technician_assigned',
        expect.objectContaining({
          workOrderId: 'wo-1',
          technicianIds: ['tech-2'],
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft remove a work order', async () => {
      const workOrder = { id: 'wo-1' };
      workOrderRepo.findOne.mockResolvedValue(workOrder);

      await service.remove('wo-1');

      expect(workOrderRepo.softRemove).toHaveBeenCalledWith(workOrder);
    });

    it('should throw NotFoundException if work order not found', async () => {
      workOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardRemove', () => {
    it('should permanently remove a work order', async () => {
      const workOrder = { id: 'wo-1' };
      workOrderRepo.findOne.mockResolvedValue(workOrder);

      await service.hardRemove('wo-1');

      expect(workOrderRepo.remove).toHaveBeenCalledWith(workOrder);
    });
  });

  describe('replaceTechnicians', () => {
    it('should replace all technicians and emit event', async () => {
      const workOrder = {
        id: 'wo-1',
        trackingCode: 'TS-ABCDE',
        technicians: [],
      };
      const newTechs = [{ id: 'tech-3' }];
      workOrderRepo.findOne.mockResolvedValue(workOrder);
      userRepoFindBy.mockResolvedValue(newTechs);
      workOrderRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.replaceTechnicians('wo-1', ['tech-3']);

      expect(userRepoFindBy).toHaveBeenCalledWith({
        id: In(['tech-3']),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'workorder.technician_assigned',
        expect.objectContaining({
          workOrderId: 'wo-1',
          technicianIds: ['tech-3'],
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('notes', () => {
    describe('createNote', () => {
      it('should create a note for a work order', async () => {
        workOrderRepo.findOne.mockResolvedValue({ id: 'wo-1' });
        noteRepo.create.mockReturnValue({
          type: NoteType.DIAGNOSIS,
          content: 'Screen broken',
          workOrderId: 'wo-1',
        });
        noteRepo.save.mockResolvedValue({
          id: 'note-1',
          type: NoteType.DIAGNOSIS,
          content: 'Screen broken',
          workOrderId: 'wo-1',
        });

        const result = await service.createNote('wo-1', {
          type: NoteType.DIAGNOSIS,
          content: 'Screen broken',
        });

        expect(noteRepo.create).toHaveBeenCalled();
        expect(noteRepo.save).toHaveBeenCalled();
        expect(result.id).toBe('note-1');
      });

      it('should throw NotFoundException if work order not found', async () => {
        workOrderRepo.findOne.mockResolvedValue(null);

        await expect(
          service.createNote('nonexistent', {
            type: NoteType.DIAGNOSIS,
            content: 'test',
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findNotes', () => {
      it('should return notes for a work order', async () => {
        const notes = [
          { id: 'note-1', content: 'Note 1' },
          { id: 'note-2', content: 'Note 2' },
        ];
        workOrderRepo.findOne.mockResolvedValue({ id: 'wo-1' });
        noteRepo.find.mockResolvedValue(notes);

        const result = await service.findNotes('wo-1');

        expect(result).toEqual(notes);
        expect(noteRepo.find).toHaveBeenCalledWith({
          where: { workOrderId: 'wo-1' },
          order: { createdAt: 'DESC' },
        });
      });
    });
  });

  describe('materials', () => {
    describe('createMaterial', () => {
      it('should create a material for a work order', async () => {
        workOrderRepo.findOne.mockResolvedValue({ id: 'wo-1' });
        materialRepo.create.mockReturnValue({
          description: 'LCD Screen',
          quantity: 1,
          unitCost: 5000,
          workOrderId: 'wo-1',
        });
        materialRepo.save.mockResolvedValue({
          id: 'mat-1',
          description: 'LCD Screen',
          quantity: 1,
          unitCost: 5000,
          workOrderId: 'wo-1',
        });

        const result = await service.createMaterial('wo-1', {
          description: 'LCD Screen',
          quantity: 1,
          unitCost: 5000,
        });

        expect(materialRepo.create).toHaveBeenCalled();
        expect(materialRepo.save).toHaveBeenCalled();
        expect(result.id).toBe('mat-1');
      });

      it('should throw NotFoundException if work order not found', async () => {
        workOrderRepo.findOne.mockResolvedValue(null);

        await expect(
          service.createMaterial('nonexistent', {
            description: 'LCD Screen',
            quantity: 1,
            unitCost: 5000,
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findMaterials', () => {
      it('should return materials for a work order', async () => {
        const materials = [
          { id: 'mat-1', description: 'LCD Screen' },
          { id: 'mat-2', description: 'Battery' },
        ];
        workOrderRepo.findOne.mockResolvedValue({ id: 'wo-1' });
        materialRepo.find.mockResolvedValue(materials);

        const result = await service.findMaterials('wo-1');

        expect(result).toEqual(materials);
        expect(materialRepo.find).toHaveBeenCalledWith({
          where: { workOrderId: 'wo-1' },
          relations: { supplier: true },
          order: { createdAt: 'DESC' },
        });
      });
    });

    describe('removeMaterial', () => {
      it('should soft remove a material', async () => {
        const material = { id: 'mat-1', workOrderId: 'wo-1' };
        materialRepo.findOne.mockResolvedValue(material);

        await service.removeMaterial('wo-1', 'mat-1');

        expect(materialRepo.softRemove).toHaveBeenCalledWith(material);
      });

      it('should throw NotFoundException if material not found', async () => {
        materialRepo.findOne.mockResolvedValue(null);

        await expect(
          service.removeMaterial('wo-1', 'nonexistent'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('tasks', () => {
    describe('createTask', () => {
      it('should create a task and emit event', async () => {
        const workOrder = {
          id: 'wo-1',
          trackingCode: 'TS-ABCDE',
          technicians: [{ id: 'tech-1' }],
        };
        workOrderRepo.findOne.mockResolvedValue(workOrder);
        taskRepo.create.mockReturnValue({
          title: 'Replace screen',
          workOrderId: 'wo-1',
        });
        taskRepo.save.mockResolvedValue({
          id: 'task-1',
          title: 'Replace screen',
          workOrderId: 'wo-1',
          assignedToId: null,
        });

        const result = await service.createTask('wo-1', {
          title: 'Replace screen',
        });

        expect(taskRepo.create).toHaveBeenCalled();
        expect(taskRepo.save).toHaveBeenCalled();
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'task.created',
          expect.objectContaining({
            taskId: 'task-1',
            taskTitle: 'Replace screen',
            workOrderId: 'wo-1',
            trackingCode: 'TS-ABCDE',
          }),
        );
        expect(result.id).toBe('task-1');
      });

      it('should throw NotFoundException if work order not found', async () => {
        workOrderRepo.findOne.mockResolvedValue(null);

        await expect(
          service.createTask('nonexistent', { title: 'Test' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findTasks', () => {
      it('should return tasks for a work order', async () => {
        const tasks = [
          { id: 'task-1', title: 'Task 1' },
          { id: 'task-2', title: 'Task 2' },
        ];
        workOrderRepo.findOne.mockResolvedValue({ id: 'wo-1' });
        taskRepo.find.mockResolvedValue(tasks);

        const result = await service.findTasks('wo-1');

        expect(result).toEqual(tasks);
        expect(taskRepo.find).toHaveBeenCalledWith({
          where: { workOrderId: 'wo-1' },
          relations: { assignedTo: true },
          order: { createdAt: 'DESC' },
        });
      });
    });

    describe('updateTask', () => {
      it('should update a task', async () => {
        const task = {
          id: 'task-1',
          title: 'Replace screen',
          isCompleted: false,
          workOrderId: 'wo-1',
          completedAt: null,
        };
        taskRepo.findOne.mockResolvedValue(task);
        taskRepo.save.mockImplementation((entity) => Promise.resolve(entity));

        const result = await service.updateTask('wo-1', 'task-1', {
          title: 'Replace LCD screen',
        });

        expect(taskRepo.save).toHaveBeenCalled();
        expect(result).toBeDefined();
      });

      it('should throw NotFoundException if task not found', async () => {
        taskRepo.findOne.mockResolvedValue(null);

        await expect(
          service.updateTask('wo-1', 'nonexistent', { title: 'Test' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should set completedAt when marking task as completed', async () => {
        const task = {
          id: 'task-1',
          title: 'Replace screen',
          isCompleted: false,
          workOrderId: 'wo-1',
          completedAt: null,
        };
        taskRepo.findOne.mockResolvedValue(task);
        taskRepo.save.mockImplementation((entity) => Promise.resolve(entity));
        workOrderRepo.findOne.mockResolvedValue({
          id: 'wo-1',
          trackingCode: 'TS-ABCDE',
          technicians: [{ id: 'tech-1' }],
        });

        const result = await service.updateTask('wo-1', 'task-1', {
          isCompleted: true,
        });

        expect(result.completedAt).toBeDefined();
      });

      it('should emit task.completed event when task is newly completed', async () => {
        const task = {
          id: 'task-1',
          title: 'Replace screen',
          isCompleted: false,
          workOrderId: 'wo-1',
          completedAt: null,
        };
        taskRepo.findOne.mockResolvedValue(task);
        taskRepo.save.mockImplementation((entity) => Promise.resolve(entity));
        workOrderRepo.findOne.mockResolvedValue({
          id: 'wo-1',
          trackingCode: 'TS-ABCDE',
          technicians: [{ id: 'tech-1' }],
        });

        await service.updateTask('wo-1', 'task-1', { isCompleted: true });

        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'task.completed',
          expect.objectContaining({
            taskId: 'task-1',
            taskTitle: 'Replace screen',
            workOrderId: 'wo-1',
            trackingCode: 'TS-ABCDE',
          }),
        );
      });

      it('should not emit task.completed when task was already completed', async () => {
        const task = {
          id: 'task-1',
          title: 'Replace screen',
          isCompleted: true,
          workOrderId: 'wo-1',
          completedAt: new Date(),
        };
        taskRepo.findOne.mockResolvedValue(task);
        taskRepo.save.mockImplementation((entity) => Promise.resolve(entity));

        await service.updateTask('wo-1', 'task-1', { isCompleted: true });

        expect(eventEmitter.emit).not.toHaveBeenCalled();
      });

      it('should clear completedAt when marking task as not completed', async () => {
        const task = {
          id: 'task-1',
          title: 'Replace screen',
          isCompleted: true,
          workOrderId: 'wo-1',
          completedAt: new Date(),
        };
        taskRepo.findOne.mockResolvedValue(task);
        taskRepo.save.mockImplementation((entity) => Promise.resolve(entity));

        const result = await service.updateTask('wo-1', 'task-1', {
          isCompleted: false,
        });

        expect(result.completedAt).toBeNull();
      });
    });

    describe('removeTask', () => {
      it('should soft remove a task', async () => {
        const task = { id: 'task-1', workOrderId: 'wo-1' };
        taskRepo.findOne.mockResolvedValue(task);

        await service.removeTask('wo-1', 'task-1');

        expect(taskRepo.softRemove).toHaveBeenCalledWith(task);
      });

      it('should throw NotFoundException if task not found', async () => {
        taskRepo.findOne.mockResolvedValue(null);

        await expect(service.removeTask('wo-1', 'nonexistent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
