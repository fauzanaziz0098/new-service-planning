import { IsNotEmpty } from 'class-validator';
export class CreateMachineDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  number: number;
}
