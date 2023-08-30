export interface VariablePlanningProduction {
  mc_run: boolean[];
  mc_idle: boolean[];
  mc_stop: boolean[];
  CauseLS: number[];
  OperatorId: string[];
  clientId: string[];
  ShiftName: string[];
  qty_actual: number[];
  qty_hour: number[];
}
