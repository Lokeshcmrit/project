import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RBAC RolesGuard Security Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole: Role, allowedRoles?: Role[]): ExecutionContext {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(allowedRoles);

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-123',
            role: userRole,
            employeeId: 'EMP-001',
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  it('should allow ADMIN to access admin-restricted scheduling endpoint', () => {
    const context = createMockContext(Role.ADMIN, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow DEPARTMENT to access department-restricted submit endpoint', () => {
    const context = createMockContext(Role.DEPARTMENT, [Role.DEPARTMENT, Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('PROVABLY BLOCKS (403 Forbidden) USER_PILOT from accessing scheduling endpoint', () => {
    const context = createMockContext(Role.USER_PILOT, [Role.ADMIN]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('PROVABLY BLOCKS (403 Forbidden) USER_PILOT from submitting maintenance requests', () => {
    const context = createMockContext(Role.USER_PILOT, [Role.DEPARTMENT, Role.ADMIN]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
