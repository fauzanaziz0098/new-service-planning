import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  client_id: string;

  @IsNotEmpty()
  part_name: string;

  @IsNotEmpty()
  part_number: string;

  @IsNotEmpty()
  cycle_time: number;

  status: boolean;

  @IsNotEmpty()
  unit: string;
}
