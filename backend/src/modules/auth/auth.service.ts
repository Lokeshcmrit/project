import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DepartmentType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmployee = await this.prisma.user.findUnique({
      where: { employeeId: dto.employeeId },
    });
    if (existingEmployee) {
      throw new ConflictException(`Employee ID '${dto.employeeId}' is already registered in Railway Operations.`);
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException(`Email address '${dto.email}' is already registered.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        employeeId: dto.employeeId,
        email: dto.email.toLowerCase(),
        mobileNumber: dto.mobileNumber,
        passwordHash,
        role: dto.role,
        department: dto.department || null,
      },
    });

    const token = this.generateToken(user);

    return {
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.usernameOrEmployeeId.trim().toLowerCase();

    // Check if user entered email or employeeId
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { employeeId: dto.usernameOrEmployeeId.trim() },
        ],
      },
    });

    // Demo accounts restriction: Demo accounts are blocked from logging in. Only registered accounts can log in.
    const DEMO_IDENTIFIERS = [
      'admin@railsync.ir',
      'engg@railsync.ir',
      'td@railsync.ir',
      'sandt@railsync.ir',
      'pilot@railsync.ir',
      'emp-adm-001',
      'emp-eng-101',
      'emp-td-201',
      'emp-snt-301',
      'emp-plt-501',
    ];

    if (
      DEMO_IDENTIFIERS.includes(identifier) ||
      DEMO_IDENTIFIERS.includes(user.email.toLowerCase()) ||
      DEMO_IDENTIFIERS.includes(user.employeeId.toLowerCase())
    ) {
      throw new UnauthorizedException(
        'Demo accounts are disabled. Please register your own personnel account to log in.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid Employee ID / Email or Password');
    }

    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedTrainId: user.assignedTrainId,
      },
    };
  }

  async setDepartment(userId: string, department: DepartmentType) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { department },
    });

    const token = this.generateToken(updated);
    return {
      message: 'Department assigned successfully',
      token,
      user: {
        id: updated.id,
        fullName: updated.fullName,
        employeeId: updated.employeeId,
        email: updated.email,
        role: updated.role,
        department: updated.department,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        email: true,
        mobileNumber: true,
        role: true,
        department: true,
        assignedTrainId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private generateToken(user: { id: string; employeeId: string; role: string; department?: DepartmentType | null }) {
    return this.jwtService.sign({
      sub: user.id,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
    });
  }
}
