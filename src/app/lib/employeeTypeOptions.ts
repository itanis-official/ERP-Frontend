export const EMPLOYEE_TYPE_OPTIONS = [
  'Chef de projet',
  'Developpeur',
  'Agent commercial',
  'RH',
  'Designer',
  'QA',
  'DevOps',
  'Support',
  'Finance',
  'Marketing',
] as const;

export type EmployeeTypeOption = (typeof EMPLOYEE_TYPE_OPTIONS)[number];
