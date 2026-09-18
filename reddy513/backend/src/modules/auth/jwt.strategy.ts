import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'railsync_super_secure_jwt_secret_key_2026_sih',
    });
  }

  async validate(payload: { sub: string; employeeId: string; role: string; department?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      department: user.department,
      assignedTrainId: user.assignedTrainId,
    };
  }
}
