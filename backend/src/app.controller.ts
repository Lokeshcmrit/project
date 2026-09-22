import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'online',
      service: 'RailSync AI Backend Service',
      version: '1.0.0',
      database: 'Connected (Neon Cloud PostgreSQL)',
      timestamp: new Date().toISOString(),
    };
  }
}
