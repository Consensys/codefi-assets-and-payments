import { ApiProperty } from "@nestjs/swagger";
import { PaginatedResponse } from "../common/PaginatedResponse";

export class BalanceHistoryQuotes {
  @ApiProperty({
    description: "Total amount of tokens (decimal)",
  })
  v: string;
  @ApiProperty({
    description: "Date associated with amount of tokens",
  })
  t: string;
}

export class BalanceHistoryResponse extends PaginatedResponse {
  @ApiProperty({
    description: "List of date and amount of tokens",
  })
  items: BalanceHistoryQuotes[];
}
