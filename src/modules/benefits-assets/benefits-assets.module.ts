import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { BenefitsAssetsService } from './benefits-assets.service';
import { BenefitsController } from './benefits.controller';

@Module({
  controllers: [BenefitsController, AssetsController],
  providers: [BenefitsAssetsService],
})
export class BenefitsAssetsModule {}
