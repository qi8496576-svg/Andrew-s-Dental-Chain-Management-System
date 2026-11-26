import data from '../../backend/src/test/resources/fixtures/adc-fictional.json' with { type: 'json' }

/** Each test gets its own copy. This never authenticates a user or seeds a remote API. */
export function fictionalData() {
  if (data.fixture_only !== true) throw new Error('Only fictional test fixtures are allowed')
  return structuredClone(data)
}

export interface AcceptanceEvidence {
  acceptance_id: string
  task_id: string
  given: string
  when: string
  then: string
  steps: string[]
  expected: string
  actual: string
  result: 'PASS' | 'FAIL' | 'NOT_RUN' | 'BLOCKED'
  environment: string
  versions: Record<string, string>
  fixture_sha256: string
  verified_by: string
  executed_at: string | null
  artifacts: string[]
}
