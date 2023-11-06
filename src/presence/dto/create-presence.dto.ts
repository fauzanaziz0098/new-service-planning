import { IsNotEmpty } from "class-validator";

export class CreatePresenceDto {
    @IsNotEmpty()
    user_id: number;

    @IsNotEmpty()
    planning_id: number;

    @IsNotEmpty()
    shift_id: number;

    check_in_at: Date

    check_out_at: Date

    @IsNotEmpty()
    card_number: boolean
}
