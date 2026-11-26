import type { components, operations } from '../src/generated'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false
type RequireTrue<T extends true> = T
export type IdStaysString = RequireTrue<Equal<components['schemas']['Id'], string>>
export type MoneyStaysString = RequireTrue<Equal<components['schemas']['Money'], string>>
export type UnitsStayString = RequireTrue<Equal<components['schemas']['Units'], string>>
export type PriceStaysString = RequireTrue<Equal<components['schemas']['UnitPrice'], string>>
export type RequestKey = RequireTrue<Equal<operations['createAppointment']['parameters']['header']['Idempotency-Key'], string>>
