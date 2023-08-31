export class CreatePlanningProductionReportDto {
  client_id: string;

  time_start?: any;

  time_end?: any;

  shift: string;

  product_part_name: string;

  product_part_number: string;

  product_cycle_time: number;

  machine_name: string;

  machine_number: number;

  qty_planning: number;

  planning_date_time_in?: Date;

  planning_date_time_out?: Date;

  planning_total: number;

  // production_qty_actual: number;
}
