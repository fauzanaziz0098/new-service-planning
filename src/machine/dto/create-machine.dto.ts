import { IsNotEmpty } from 'class-validator';
export class CreateMachineDto {
  client_id: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  number: number;
}
