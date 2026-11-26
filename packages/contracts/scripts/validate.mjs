import { writeFile } from 'node:fs/promises'
import { loadContract } from './contract.mjs'

const contract = await loadContract()
const coverage = [...contract.table].map(([id, entry]) => ({
  operation_id: id, method: entry.method.toUpperCase(), path: entry.path,
  requirements: entry.op['x-requirements'], acceptance: entry.op['x-acceptance'],
  request_schema_compiled: Boolean(entry.request), response_statuses_checked: Object.keys(entry.response),
  headers: (entry.op.parameters ?? []).filter(x => x.in === 'header').map(x => ({ name:x.name, required:x.required ?? false })),
}))
const report = { openapi: contract.api.openapi, source_sha256: contract.sha256, operation_count: coverage.length, component_schemas_compiled: Object.keys(contract.schemas).length, standard_validation: 'PASS', payload_schema_compilation: 'PASS', business_runtime_verified: false, documented_error_statuses: Object.fromEntries(contract.errorStatuses), operations: coverage }
await writeFile(new URL('../../../docs/verification/t005-contract-coverage.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
console.log(`OpenAPI ${report.openapi}: ${coverage.length} operations, ${report.component_schemas_compiled} component schemas validated; approved fingerprints verified.`)
