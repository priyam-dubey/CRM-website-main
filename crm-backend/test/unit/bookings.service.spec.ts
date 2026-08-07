import { Test, TestingModule }   from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { BookingsService }       from '../../src/modules/bookings/bookings.service'
import { BookingsRepository }    from '../../src/modules/bookings/bookings.repository'
import { PrismaService }         from '../../src/database/prisma.service'
import { EventEmitter2 }         from '@nestjs/event-emitter'

const mockActor = {
  sub: 'user-1', companyId: 'company-1',
  role: 'ADMIN' as any, permissions: {}, iat: 0, exp: 0,
}

const mockBooking = {
  id: 'booking-1', companyId: 'company-1', reference: 'BK-2025-01001',
  pnr: 'ABCDEF', passengerName: 'John Smith', status: 'CONFIRMED' as any,
  grossAmount: 100000, netAmount: 100000, version: 0,
  travelDate: new Date(), createdAt: new Date(), updatedAt: new Date(),
}

describe('BookingsService', () => {
  let service: BookingsService
  let repo:    jest.Mocked<BookingsRepository>
  let prisma:  any
  let txClient: any

  beforeEach(async () => {
    txClient = {
      booking:            { create: jest.fn().mockResolvedValue(mockBooking) },
      revenue:            { create: jest.fn().mockResolvedValue({}) },
      bookingTransaction: { create: jest.fn().mockResolvedValue({}) },
      activityLog:        { create: jest.fn().mockResolvedValue({}) },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: BookingsRepository,
          useValue: {
            findMany:          jest.fn().mockResolvedValue([[mockBooking], 1]),
            findById:          jest.fn().mockResolvedValue(mockBooking),
            create:            jest.fn().mockResolvedValue(mockBooking),
            update:            jest.fn().mockResolvedValue(mockBooking),
            softDelete:        jest.fn().mockResolvedValue(undefined),
            bulkSoftDelete:    jest.fn().mockResolvedValue(3),
            bulkAssign:        jest.fn().mockResolvedValue(2),
            generateReference: jest.fn().mockResolvedValue('BK-2025-01001'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation(async (fn: any) =>
              typeof fn === 'function' ? fn(txClient) : Promise.all(fn)
            ),
            activityLog: { create: jest.fn().mockResolvedValue({}) },
          },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile()

    service = module.get<BookingsService>(BookingsService)
    repo    = module.get(BookingsRepository)
    prisma  = module.get(PrismaService)
  })

  describe('create', () => {
    const createDto = {
      passengerName: 'John Smith', pnr: 'ABCDEF', airlineId: 'a1', classId: 'c1',
      providerId: 'p1', cardProcessorId: 'cp1', currencyId: 'cur1',
      grossAmount: 100000, travelDate: new Date().toISOString(),
    } as any

    it('creates exactly one BookingTransaction (Transaction #1) alongside the booking', async () => {
      await service.create('company-1', createDto, mockActor)

      expect(txClient.bookingTransaction.create).toHaveBeenCalledTimes(1)
      const call = txClient.bookingTransaction.create.mock.calls[0][0]
      expect(call.data.transactionNumber).toBe(1)
      expect(call.data.booking.connect.id).toBe(mockBooking.id)
    })

    it('defaults the transaction type to NEW_BOOKING when the caller does not specify one', async () => {
      await service.create('company-1', createDto, mockActor)
      const call = txClient.bookingTransaction.create.mock.calls[0][0]
      expect(call.data.transactionType).toBe('NEW_BOOKING')
    })

    it('honours an explicit transactionType from the caller (e.g. the transaction-type wizard)', async () => {
      await service.create('company-1', { ...createDto, transactionType: 'EXCHANGE' }, mockActor)
      const call = txClient.bookingTransaction.create.mock.calls[0][0]
      expect(call.data.transactionType).toBe('EXCHANGE')
    })
  })

  describe('findAll', () => {
    it('returns paginated bookings with correct meta', async () => {
      const result = await service.findAll('company-1', { page: 1, per_page: 25, sort_dir: 'desc' })
      expect(result.data).toHaveLength(1)
      expect(result.meta.total_count).toBe(1)
      expect(result.meta.page).toBe(1)
      expect(repo.findMany).toHaveBeenCalledWith('company-1', expect.any(Object))
    })
  })

  describe('findById', () => {
    it('returns booking when found', async () => {
      const result = await service.findById('booking-1', 'company-1')
      expect(result.id).toBe('booking-1')
      expect(result.reference).toBe('BK-2025-01001')
    })

    it('throws NotFoundException when booking does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null)
      await expect(
        service.findById('nonexistent', 'company-1')
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('cancel', () => {
    it('throws BadRequestException if booking is already cancelled', async () => {
      repo.findById.mockResolvedValueOnce({ ...mockBooking, status: 'CANCELLED' } as any)
      await expect(
        service.cancel('booking-1', 'company-1', mockActor)
      ).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException if booking is already refunded', async () => {
      repo.findById.mockResolvedValueOnce({ ...mockBooking, status: 'REFUNDED' } as any)
      await expect(
        service.cancel('booking-1', 'company-1', mockActor)
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('bulkDelete', () => {
    it('returns count of deleted bookings', async () => {
      const result = await service.bulkDelete({ ids: ['b1','b2','b3'] }, 'company-1', mockActor)
      expect(result.deleted).toBe(3)
      expect(repo.bulkSoftDelete).toHaveBeenCalledWith(['b1','b2','b3'], 'company-1')
    })
  })

  describe('bulkAssign', () => {
    it('returns count of updated bookings', async () => {
      const result = await service.bulkAssign(
        { ids: ['b1','b2'], assignedToId: 'user-2' },
        'company-1', mockActor,
      )
      expect(result.updated).toBe(2)
    })
  })
})
