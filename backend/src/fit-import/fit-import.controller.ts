import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { FitImportService, MultiActivityFitData } from './fit-import.service'

const fitFileFilter = (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
  if (!file.originalname.toLowerCase().endsWith('.fit')) {
    return cb(new BadRequestException('Seuls les fichiers .fit sont acceptés'), false)
  }
  cb(null, true)
}

@Controller('fit-import')
@UseGuards(JwtAuthGuard)
export class FitImportController {
  constructor(private readonly fitImportService: FitImportService) {}

  @Post('parse')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: fitFileFilter }))
  async parseFit(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni')
    }
    return this.fitImportService.parseFitFile(file.buffer)
  }

  @Post('parse-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: fitFileFilter }))
  async parseMultipleFit(@UploadedFiles() files: Express.Multer.File[]): Promise<MultiActivityFitData> {
    if (!files?.length) {
      throw new BadRequestException('Aucun fichier fourni')
    }
    return this.fitImportService.parseMultipleFitFiles(files.map(f => f.buffer))
  }
}
