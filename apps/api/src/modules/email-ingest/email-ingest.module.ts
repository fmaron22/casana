import { Module } from '@nestjs/common';
import { EmailIngestService } from './email-ingest.service';
import { EmailIngestController } from './email-ingest.controller';

@Module({
  controllers: [EmailIngestController],
  providers: [EmailIngestService],
  exports: [EmailIngestService],
})
export class EmailIngestModule {}
