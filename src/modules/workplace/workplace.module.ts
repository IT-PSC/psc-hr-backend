import { Module, forwardRef } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { LettersController } from './letters.controller';
import { RecognitionController } from './recognition.controller';
import { SuggestionsController } from './suggestions.controller';
import { SurveysController } from './surveys.controller';
import { WorkplaceService } from './workplace.service';

@Module({
  imports: [forwardRef(() => ApprovalsModule)],
  controllers: [
    LettersController,
    RecognitionController,
    SurveysController,
    SuggestionsController,
  ],
  providers: [WorkplaceService],
  exports: [WorkplaceService],
})
export class WorkplaceModule {}
