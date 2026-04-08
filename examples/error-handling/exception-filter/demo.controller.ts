import { Controller, Get, Logger } from '@nestjs/common';
import { DemoService } from './demo.service.js';

@Controller('demo')
export class DemoController {
  private readonly logger = new Logger(DemoController.name);

  constructor(private readonly demoService: DemoService) {}

  @Get('send')
  async sendCommand(): Promise<{ result: unknown }> {
    this.logger.log('Sending command via HTTP endpoint...');
    const result = await this.demoService.sendCommand();
    return { result };
  }
}
