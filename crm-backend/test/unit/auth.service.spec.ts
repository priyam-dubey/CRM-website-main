import { Test, TestingModule }    from '@nestjs/testing'
import { JwtService }             from '@nestjs/jwt'
import { ConfigService }          from '@nestjs/config'
import { UnauthorizedException }  from '@nestjs/common'
import { AuthService }            from '../../src/modules/auth/auth.service'
import { PrismaService }          from '../../src/database/prisma.service'
import * as hashUtil              from '../../src/shared/utils/hash.util'

describe('AuthService', () => {
  let authService: AuthService
  let prisma: jest.Mocked<PrismaService>
  let jwt: jest.Mocked<JwtService>

  const mockUser = {
    id: 'user-uuid-1',
    companyId: 'company-uuid-1',
    email: 'admin@demo.com',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user:        { findFirst: jest.fn(), update: jest.fn() },
            session:     { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
            securityLog: { create: jest.fn() },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('7d') },
        },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    prisma      = module.get(PrismaService)
    jwt         = module.get(JwtService)
  })

  describe('login', () => {
    it('returns accessToken and user on valid credentials', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-1' });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.securityLog.create as jest.Mock).mockResolvedValue({});
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(hashUtil, 'hashToken').mockResolvedValue('hashed-refresh-token')

      const result = await authService.login(
        { email: 'admin@demo.com', password: 'password' },
        '192.168.1.1',
        'Mozilla/5.0',
      )

      expect(result.accessToken).toBe('mock.jwt.token')
      expect(result.user.email).toBe('admin@demo.com')
      expect(result.user).not.toHaveProperty('passwordHash')
      expect(prisma.session.create).toHaveBeenCalled() 
    })

    it('throws UnauthorizedException on wrong password', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);
      (prisma.securityLog.create as jest.Mock).mockResolvedValue({})

      await expect(
        authService.login({ email: 'admin@demo.com', password: 'wrong' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when user not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false)

      await expect(
        authService.login({ email: 'nobody@demo.com', password: 'x' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('forgotPassword', () => {
    it('always resolves without throwing — prevents email enumeration', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      await expect(authService.forgotPassword('nobody@demo.com')).resolves.toBeUndefined()
    })
  })
})
