import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateConditionMachineDto {
  @IsNotEmpty()
  name: string;
}
