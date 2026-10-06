import { BadRequestException, Controller, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { FitImportService, MultiActivityFitData } from './fit-import.service'

/** Une séance d'une heure avec cardio pèse quelques centaines de Ko ; même un marathon GPS reste sous 5 Mo. */
export const FIT_MAX_FILE_SIZE = 5 * 1024 * 1024
export const FIT_MAX_FILES = 10

const fitFileFilter = (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
  if (!file.originalname.toLowerCase().endsWith('.fit')) {
    return cb(new BadRequestException('Seuls les fichiers .fit sont acceptés'), false)
  }
  cb(null, true)
}

@Controller('fit-import')
@UseGuards(JwtAuthGuard)
// Chaque envoi charge les fichiers en mémoire et les analyse : quota plus strict que le défaut (60/min)
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class FitImportController {
  constructor(private readonly fitImportService: FitImportService) {}

  @Post('parse-multiple')
  @UseInterceptors(
    FilesInterceptor('files', FIT_MAX_FILES, { limits: { fileSize: FIT_MAX_FILE_SIZE }, fileFilter: fitFileFilter })
  )
  async parseMultipleFit(@UploadedFiles() files: Express.Multer.File[]): Promise<MultiActivityFitData> {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni')
    }
    return this.fitImportService.parseMultipleFitFiles(files.map(f => f.buffer))
  }
}
