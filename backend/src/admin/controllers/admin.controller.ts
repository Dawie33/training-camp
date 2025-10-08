import { Controller, Get } from '@nestjs/common'
import { AdminService } from '../services/admin.service'

@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) { }

  @Get('stats')
  async getStats() {
    return this.service.getStats()
  }
}
