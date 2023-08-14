import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
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
