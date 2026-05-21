import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { FitImportService } from './fit-import.service'

@Controller('fit-import')
@UseGuards(JwtAuthGuard)
export class FitImportController {
  constructor(private readonly fitImportService: FitImportService) {}

  @Post('parse')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.toLowerCase().endsWith('.fit')) {
          return cb(new BadRequestException('Seuls les fichiers .fit sont acceptés'), false)
        }
        cb(null, true)
      },
    }),
  )
  async parseFit(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni')
    }
    return this.fitImportService.parseFitFile(file.buffer)
  }
}
