export class CreatePlanningProductionReportDto {
  time_start?: string;

  time_end?: string;

  product_part_name: string;

  product_part_number: string;

  product_cycle_time: number;

  machine_name: string;

  qty_planning: number;

  planning_date_time_in?: Date;

  planning_date_time_out?: Date;

  planning_total: number;

  production_qty_actual: number;
}
