import { Module } from '@nestjs/common'
import { FitImportController } from './fit-import.controller'
import { FitImportService } from './fit-import.service'

@Module({
  controllers: [FitImportController],
  providers: [FitImportService],
})
export class FitImportModule {}
