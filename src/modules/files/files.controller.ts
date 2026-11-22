import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/roles/types';
import { FileListQueryDto, UploadFileMetaDto } from './dto/file.dto';
import { FilesService, type UploadedMulterFile } from './files.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get()
  @RequirePermission('documents', 'view')
  @ApiOperation({ summary: 'List stored files (scoped)' })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: FileListQueryDto,
  ) {
    return this.files.list(user, query.employeeId);
  }

  @Post('upload')
  @RequirePermission('documents', 'view')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        employeeId: { type: 'string' },
        docType: { type: 'string' },
        visibility: { type: 'string' },
        expiryDate: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a document' })
  upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedMulterFile,
    @Body() meta: UploadFileMetaDto,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.files.upload(user, file, meta);
  }

  @Get(':id/download')
  @RequirePermission('documents', 'view')
  @ApiOperation({ summary: 'Download file bytes' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { stream, mimeType, fileName } = await this.files.openDownload(
      id,
      user,
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    stream.pipe(res);
  }

  @Get(':id')
  @RequirePermission('documents', 'view')
  @ApiOperation({ summary: 'Get file metadata' })
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.files.getOne(id, user);
  }

  @Delete(':id')
  @RequirePermission('documents', 'edit')
  @ApiOperation({ summary: 'Soft-delete a file' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.files.softDelete(id, user);
  }
}
