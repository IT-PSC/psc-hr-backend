import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

/** Metadata key read by JwtAuthGuard. Do not rename. */
export const IS_PUBLIC_KEY = 'isPublic';

/** Skip JWT auth. Also marks the operation as public in the OpenAPI document. */
export const Public = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    ApiExtension('x-public', true),
  );
