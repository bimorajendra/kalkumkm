export type CalcErrorCode =
  | 'MARGIN_TOO_HIGH'
  | 'UNIT_MISMATCH'
  | 'UNIT_UNDEFINED'
  | 'MISSING_REF'
  | 'INVALID_YIELD'
  | 'INVALID_INPUT'
  | 'INVALID_ROUNDING_STEP'
  | 'CYCLE'
  | 'DEPENDENCY_FAILED';

export class CalcError extends Error {
  readonly code: CalcErrorCode;
  readonly details: Readonly<Record<string, unknown>> | undefined;

  constructor(
    code: CalcErrorCode,
    message: string = code,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CalcError';
    this.code = code;
    this.details = details;
  }
}
