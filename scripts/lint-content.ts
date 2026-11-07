import { getAllCaseEntries, loadCase, manifest, outcomeCatalog } from '../src/domain/load'
import { lintCase, summarizeLint } from '../src/domain/linter'
import type { LintIssue } from '../src/domain/types'

const args = process.argv.slice(2)
const forcePublish = args.includes('--publish')

let failed = false

function printIssues(issues: LintIssue[], prefix: string): void {
  for (const issue of issues) {
    const marker =
      issue.severity === 'error' ? 'ERROR  ' : issue.severity === 'warning' ? 'WARN   ' : 'INFO   '
    console.log(`${prefix}${marker}[${issue.code}] ${issue.message}`)
  }
}

console.log(`Thám tử Hình sự — content lint`)
console.log(`App ${manifest.app.version} · schema ${manifest.app.schemaVersion} · ${manifest.cases.length} case`)

const outcomeIds = new Set<string>()
for (const outcome of outcomeCatalog.outcomes) {
  if (outcomeIds.has(outcome.id)) {
    console.error(`ERROR [catalog_duplicate] Outcome "${outcome.id}" bị trùng trong catalog.`)
    failed = true
  }
  outcomeIds.add(outcome.id)
}

for (const entry of getAllCaseEntries()) {
  const loaded = loadCase(entry.id)
  if (!loaded.ok) {
    console.error(`\n[${entry.id}@${entry.version}] LOAD FAILED`)
    for (const error of loaded.errors) {
      console.error(`  ERROR  [load] ${error}`)
    }
    failed = true
    continue
  }

  if (!entry.playable) {
    console.log(`\n[${entry.id}@${entry.version}] bỏ qua: playable=false`)
    continue
  }

  const mode = forcePublish || entry.publishable ? 'publish' : 'draft'
  const issues = lintCase(loaded.caseFile, outcomeCatalog, { mode })
  const summary = summarizeLint(issues)

  console.log(
    `\n[${entry.id}@${entry.version}] mode=${mode} — ${summary.errors} error, ${summary.warnings} warning, ${summary.infos} info`,
  )
  printIssues(issues, '  ')

  if (summary.errors > 0) failed = true

  if (entry.publishable && mode === 'publish' && summary.errors > 0) {
    console.error(`  ERROR  [manifest] Case "${entry.id}" được đánh dấu publishable nhưng chưa qua publish gate.`)
    failed = true
  }

  if (!entry.publishable && loaded.caseFile.metadata.status === 'published') {
    console.error(
      `  ERROR  [manifest] Case "${entry.id}" có metadata.status=published nhưng manifest chặn publish.`,
    )
    failed = true
  }

  if (entry.version !== loaded.caseFile.metadata.version) {
    console.error(`  ERROR  [manifest] Version manifest không khớp metadata.version.`)
    failed = true
  }
}

if (forcePublish) {
  console.log('\nĐang chạy ở chế độ --publish: mọi publish blocker được tính là lỗi.')
}

if (failed) {
  console.error('\nContent lint thất bại.')
  process.exit(1)
}

console.log('\nContent lint đạt: không có lỗi cấu trúc. Chạy với --publish để kiểm tra release gate.')
