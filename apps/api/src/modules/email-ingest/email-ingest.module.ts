import { Module } from '@nestjs/common';
import { EmailIngestService } from './email-ingest.service';
import { EmailIngestController } from './email-ingest.controller';
import { PostmarkInboundController } from './postmark/postmark-inbound.controller';
import { PostmarkAuthGuard } from './postmark/postmark-auth.guard';

@Module({
  controllers: [EmailIngestController, PostmarkInboundController],
  providers: [EmailIngestService, PostmarkAuthGuard],
  exports: [EmailIngestService],
})
export class EmailIngestModule {}
