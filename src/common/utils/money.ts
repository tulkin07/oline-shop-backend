import { Decimal } from '@prisma/client/runtime/library';

export type DecimalLike = Decimal | number | string;

export function toNumber(value: DecimalLike): number {
  return Number(value);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
