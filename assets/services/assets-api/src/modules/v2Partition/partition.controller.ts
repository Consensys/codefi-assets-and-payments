import { AppToHttpFilter } from '@consensys/error-handler';
import { Controller, UseFilters } from '@nestjs/common';

@Controller('v2/essentials/partition')
@UseFilters(new AppToHttpFilter()) // Used to preserve error codes coming from packages (Ex: 401 from auth package). Otherwise, coming from packages are turned into 500.
export class PartitionController {}
