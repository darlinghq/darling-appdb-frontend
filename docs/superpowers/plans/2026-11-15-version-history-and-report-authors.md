# Version History and Report Authors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users browse every version and report of a piece of software and see, for each report, who submitted it (linked to GitHub when the login is known).

**Architecture:** The backend indexes git history of the database clone into a bbolt file (report path -> author name, login, date), updated incrementally after each sync. The API gains additive fields and one endpoint. The frontend adds a byline component, a version-history list on the detail page and a read-only per-version page.

**Tech Stack:** Go 1.26 + echo + go-git v5 + bbolt (backend, `../darling-appdb-backend`, `go test ./...`); Angular (frontend, this repo, `ng test` via Vitest).

**Spec:** `docs/superpowers/specs/2026-11-15-version-history-and-report-authors-design.md`

Tasks 1-6 run in the **backend** repo (`../darling-appdb-backend`, make a branch off its current HEAD); tasks 7-10 in the **frontend** repo (branch `feat/status-levels-page` is current; use a new branch off master if that is merged). Each repo gets its own commits. Deploy backend first.

## Global Constraints

- No change to the database repo's file formats or report ID scheme.
- Backend builds with `CGO_ENABLED=0` (distroless/static): no cgo dependencies. Use bbolt, not SQLite.
- API changes are additions only; the current frontend must keep working against the new backend.
- No GitHub API calls for author lookup.
- Author = commit *author* (not committer) of the commit that first **added** the report file; merge commits are skipped.
- Login pattern: noreply email `^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$`. Unknown login => show name unlinked. A wrong link is worse than none.
- Index failure must never break serving: log, and serve reports without submitter.
- Index file: `data/report-authors.db`, bucket `reports`, meta key `meta/lastCommit` (store it in a separate bucket `meta`, key `lastCommit`).
- Report ordering: indexed date desc; undated after dated, by name descending using the existing numeric collation. Versions keep numeric-collation order.
- Hide the "Version history" section when there is only one version.

## Review Focus

- Version URL param like `..%2F..%2Fx` or `nope` on `GET /api/software/:name/versions/:version` -> 404, never reads outside the software dir (Task 6).
- Upstream history rewritten (force-push): index rebuilds, no stale/wrong authors survive (Task 3).
- Noreply email with junk (`a/../b@users.noreply.github.com`, empty local part): no login (Task 1), and the frontend refuses to link a login not matching the GitHub pattern (Task 8).
- Index file corrupt, unwritable or missing: server starts and serves reports without submitter (Task 4).
- Software with versions but zero reports, and a version whose reports are all legacy/undated: summary and version page render without status/date (Tasks 6, 10).
- A commit authored by someone with a real (non-noreply) email: name shown, no link (Tasks 1, 8).

---

### Task 1: Login derivation and report-path matching

**Files:**
- Create: `../darling-appdb-backend/report_authors.go`
- Test: `../darling-appdb-backend/report_authors_test.go`

**Interfaces:**
- Produces: `func loginFromEmail(email string) string` (empty if not derivable); `func isReportFile(repoPath string) bool` (true for `data/software/<a>/<b>/<name>/versions/<v>/reports/<id>.json`, forward slashes, any depth-valid segment, `.json` only, not inside a screenshot subdirectory); `type ReportAuthor struct { Name string \`json:"name"\`; Login string \`json:"login"\`; Date time.Time \`json:"date"\` }`.

- [ ] **Step 1: Write failing tests** in `report_authors_test.go`: table test `TestLoginFromEmail` — `"12345+octocat@users.noreply.github.com"`->`"octocat"`; `"octocat@users.noreply.github.com"`->`"octocat"`; `"Octo-Cat@USERS.NOREPLY.GITHUB.COM"`->`"Octo-Cat"` (host case-insensitive); `"a/../b@users.noreply.github.com"`, `"@users.noreply.github.com"`, `"1+@users.noreply.github.com"`, `"x@example.com"`, `""` -> `""`. Table test `TestIsReportFile` — true for `data/software/p/pe/pearcalc/versions/1.0/reports/a1b2c3d4.json`; false for `.../reports/a1b2c3d4/screenshot-0.jpg`, `.../versions/1.0/index.json`, `.../reports/a1b2c3d4.png`, `README.md`.
- [ ] **Step 2: Run** `go test -run 'TestLoginFromEmail|TestIsReportFile' ./...` — expect FAIL (undefined).
- [ ] **Step 3: Implement** both functions and the `ReportAuthor` type in `report_authors.go` (compiled regexp for the email; `isReportFile` via `path.Match`-style segment checks or a regexp).
- [ ] **Step 4: Run** the same command — expect PASS.
- [ ] **Step 5: Commit** `git add report_authors.go report_authors_test.go && git commit -m "feat: derive GitHub login from noreply emails and match report files"`

### Task 2: Index store and full history walk

**Files:**
- Modify: `../darling-appdb-backend/report_authors.go`
- Test: `../darling-appdb-backend/report_authors_test.go`

**Interfaces:**
- Consumes: `loginFromEmail`, `isReportFile`, `ReportAuthor` (Task 1).
- Produces: `type reportIndex struct{ db *bbolt.DB }`; `func openReportIndex(path string) (*reportIndex, error)`; `func (x *reportIndex) Close() error`; `func (x *reportIndex) Lookup(repoPath string) (ReportAuthor, bool)` (nil-receiver safe: returns `false`); `func (x *reportIndex) Update(repo *git.Repository) error`.

- [ ] **Step 1: Write failing test** `TestIndexUpdateRecordsFirstAdder`. Helper `newHistoryRepo(t)` returns a temp repo plus `commitFiles(author, email string, when time.Time, files map[string]string)` (follow `newUpstream` in `database_sync_test.go`). Scenario: commit A by `("Alice","1+alice@users.noreply.github.com")` adds `data/software/p/pe/pe/versions/1/reports/r1.json`; commit B by `("Bob","bob@example.com")` adds `.../reports/r2.json` and *modifies* r1.json. Open index in `t.TempDir()`, `Update(repo)`. Assert `Lookup(r1)` -> `{Name:"Alice", Login:"alice", Date: A's time}` (modification by Bob does not steal it); `Lookup(r2)` -> `{Name:"Bob", Login:""}`; `Lookup("nope")` -> false; `(*reportIndex)(nil).Lookup(...)` -> false.
- [ ] **Step 2: Run** `go test -run TestIndexUpdateRecordsFirstAdder ./...` — expect FAIL.
- [ ] **Step 3: Implement** store (buckets `reports`, `meta`; `bbolt.Open` with 5s timeout like `tokenstore_bolt.go`) and `Update` full walk: iterate commits oldest -> newest (collect via `repo.Log`, reverse), skip commits with >1 parent, diff parent tree (empty tree for root) against commit tree with `object.DiffTree`, for each change whose action is Insert and `isReportFile(change.To.Name)`, `Put` only if key absent. Value is JSON of `ReportAuthor` from `commit.Author`. After the walk store HEAD hash in `meta/lastCommit`. Single bbolt `Update` transaction per run.
- [ ] **Step 4: Run** the test — expect PASS.
- [ ] **Step 5: Commit** `feat: index report authors from git history`

### Task 3: Incremental updates, merge skipping, history rewrite

**Files:**
- Modify: `../darling-appdb-backend/report_authors.go`
- Test: `../darling-appdb-backend/report_authors_test.go`

**Interfaces:**
- Consumes: `reportIndex.Update` (Task 2). Behaviour change only; same signature.

- [ ] **Step 1: Write failing tests:**
  - `TestIndexUpdateIsIncremental`: Update; add commit C (new report r3 by Carol); Update again; `Lookup(r3)` is Carol and earlier entries unchanged. Also assert the second run did not re-walk old commits: record count via an unexported package var `reportIndexWalked int` incremented per diffed commit; after run 2 it equals 1 for that run (reset between runs).
  - `TestIndexSkipsMergeCommits`: branch commit adds r4 by Dana, merge commit by Maintainer (two parents) onto the default branch; `Lookup(r4).Name == "Dana"`.
  - `TestIndexRebuildsAfterHistoryRewrite`: Update; then recreate the repo history so `lastCommit` is no longer an ancestor of HEAD (reset `master` to the first commit and commit r5 by Eve); Update; `Lookup(r5)` is Eve and the entry that only existed in the discarded history is gone.
- [ ] **Step 2: Run** `go test -run 'TestIndex' ./...` — expect the three new tests FAIL.
- [ ] **Step 3: Implement** in `Update`: read `meta/lastCommit`. If absent or not an ancestor of HEAD (`Commit.IsAncestor`), clear bucket `reports` and walk everything. Otherwise compute the set of commit hashes reachable from `lastCommit` (hash traversal only, no diffing) and walk only HEAD's commits not in that set, oldest first. If HEAD == lastCommit return early.
- [ ] **Step 4: Run** `go test ./...` — expect PASS (including Task 2's test).
- [ ] **Step 5: Commit** `feat: update report author index incrementally`

### Task 4: Wire the index into startup and sync

**Files:**
- Modify: `../darling-appdb-backend/database.go` (`initDatabase`, `apiPushNotify`), `../darling-appdb-backend/report_authors.go`
- Test: `../darling-appdb-backend/report_authors_test.go`

**Interfaces:**
- Consumes: `openReportIndex`, `Update`, `Lookup` (Tasks 2-3).
- Produces: `var reportAuthors *reportIndex` (package global, may be nil); `const ReportIndexFile = "data/report-authors.db"`; `func refreshReportIndex()` — opens the index if `reportAuthors == nil`, runs `Update` on `git.PlainOpen("./db")`, logs and leaves `reportAuthors` nil/stale on any error, never panics or returns an error; `func reportAuthorFor(dataPath string) (ReportAuthor, bool)` — converts a path under `./db/` (e.g. `db/data/software/.../r1.json`) to the repo-relative slash path and looks it up (false if `reportAuthors` is nil).

- [ ] **Step 1: Write failing tests:** `TestReportAuthorForStripsDBPrefix` (set `reportAuthors` to an index populated from a temp repo; `reportAuthorFor("db/"+r1)` and `"./db/"+r1` both resolve); `TestRefreshReportIndexSurvivesBadIndexFile` (point the index path var at a directory / garbage file; call `refreshReportIndex()`; no panic, `reportAuthorFor(...)` returns false). Make the file path an overridable package var `reportIndexPath = ReportIndexFile`.
- [ ] **Step 2: Run** `go test -run 'TestReportAuthorFor|TestRefreshReportIndex' ./...` — expect FAIL.
- [ ] **Step 3: Implement** the three symbols; call `refreshReportIndex()` in `initDatabase` after the database update attempt (before `reloadCategories`) and in `apiPushNotify` when `changed` is true (before `reloadCategories`).
- [ ] **Step 4: Run** `go test ./...` — expect PASS.
- [ ] **Step 5: Commit** `feat: refresh report author index on startup and webhook sync`

### Task 5: Report and version listing in newest-first order

**Files:**
- Modify: `../darling-appdb-backend/database.go` (`Report` struct, `loadReport`, `lastReport`, `highestNumericInDir`)
- Test: `../darling-appdb-backend/database_reports_test.go` (new)

**Interfaces:**
- Consumes: `reportAuthorFor` (Task 4).
- Produces: `Report` gains unexported `author *ReportAuthor`, set by `loadReport`; `func listReports(version *Version) []*Report` (newest first per Global Constraints ordering); `func listVersions(swDirPath string) []*Version` (numeric collation, newest first; skips unloadable); `lastReport(version)` now returns `listReports(version)[0]` or nil; `highestNumericInDir` keeps its signature but is built on a new `sortedNumericDir(dir string, wantDirs bool) []string` (ascending).

- [ ] **Step 1: Write failing tests** with a fixture directory built under `t.TempDir()` mirroring `<root>/data/software/p/pe/pe/versions/{1.0,1.10,1.9}/…` (set `reportAuthors` to a stub index or temporarily override via a package var used by `reportAuthorFor`; simplest: test seam `var lookupReportAuthor = reportAuthorFor`):
  - `TestListVersionsNumericNewestFirst`: `1.10, 1.9, 1.0`.
  - `TestListReportsNewestByDate`: reports `zz.json` (dated 2026-01-01), `aa.json` (dated 2026-06-01) -> `aa, zz` despite names; `lastReport` returns `aa`.
  - `TestListReportsUndatedAfterDatedByNameDesc`: dated `m`, undated `a1`, `a10` -> `m, a10, a1`.
  - `TestListReportsMalformedJSONSkipped`.
- [ ] **Step 2: Run** `go test -run 'TestListVersions|TestListReports' ./...` — expect FAIL.
- [ ] **Step 3: Implement** per the interface block; keep `lastReport` callers (`makeSoftwareOverview` etc.) compiling.
- [ ] **Step 4: Run** `go test ./...` — expect PASS (existing category/software tests must still pass).
- [ ] **Step 5: Commit** `feat: order reports by submission date and list all versions`

### Task 6: API additions

**Files:**
- Modify: `../darling-appdb-backend/api_software.go`
- Test: `../darling-appdb-backend/api_software_test.go` (new; use `httptest` + echo like `api_category_test.go`, with `SoftwarePath` overridden to a temp fixture if it is a var, otherwise change `const` to `var` for tests)

**Interfaces:**
- Consumes: `listReports`, `listVersions`, `lastReport` (Task 5).
- Produces (JSON shape from the spec): `type SubmitterData struct{ Name string \`json:"name"\`; Login string \`json:"login,omitempty"\` }`; `ReportData` gains `ID string \`json:"id"\``, `SubmittedAt *time.Time \`json:"submittedAt,omitempty"\``, `Submitter *SubmitterData \`json:"submitter,omitempty"\``; `type VersionSummary struct{ Version string \`json:"version"\`; ReportCount int \`json:"reportCount"\`; Status string \`json:"status,omitempty"\`; SubmittedAt *time.Time \`json:"submittedAt,omitempty"\` }`; `SoftwareData` gains `Versions []VersionSummary \`json:"versions"\`` (always an array, newest first); `type VersionDetail struct{ Version string; Download string; Issues []int; Reports []ReportData }` with lowercase JSON keys `version, download, issues, reports`; `func reportDataFor(swName string, v *Version, r *Report) ReportData`; route `GET /api/software/:name/versions/:version`.

- [ ] **Step 1: Write failing tests:**
  - `TestGetSoftwareIncludesVersionsAndSubmitter`: fixture with versions `1.0` (no reports) and `2.0` (reports `a` newest by Alice/login `alice`, `b` older by Bob no login). Response `lastVersion.version=="2.0"`, `lastVersion.lastReport.id=="a"`, `.submitter=={name:"Alice",login:"alice"}`, `.submittedAt` set; `versions` = `[{2.0, reportCount 2, status of a, submittedAt}, {1.0, reportCount 0}]` with no `status` key for 1.0.
  - `TestGetVersionReturnsAllReportsNewestFirst`: `/api/software/pe/versions/2.0` -> reports `[a, b]`, screenshots URLs as today; Bob has no `login` key.
  - `TestGetVersionUnknownIs404`: `nope`, `3.0`, and `..%2F..%2Fx` all -> 404.
  - `TestGetSoftwareWithoutVersionsHasEmptyVersionsArray`: `versions == []` and `lastVersion == null`.
- [ ] **Step 2: Run** `go test -run 'TestGetSoftware|TestGetVersion' ./...` — expect FAIL.
- [ ] **Step 3: Implement.** The version handler must resolve `:version` by matching it against `listVersions` entries (exact string equality), never by joining it into a path first. Reuse `reportDataFor` for `lastReport`, `reports` and summaries.
- [ ] **Step 4: Run** `go test ./...` — expect PASS.
- [ ] **Step 5: Commit** `feat: expose version history and report submitters in the API`

### Task 7: Frontend service types

**Files:**
- Modify: `src/app/software.service.ts`
- Test: `src/app/software.service.spec.ts` (new)

**Interfaces:**
- Produces: `interface Submitter { name: string; login?: string }`; `ReportData` gains `id?: string`, `submittedAt?: string`, `submitter?: Submitter`; `interface VersionSummary { version: string; reportCount: number; status?: string; submittedAt?: string }`; `SoftwareDetail.versions?: VersionSummary[]`; `interface VersionDetail { version: string; download: string; issues: number[]; reports: ReportData[] }`; `SoftwareService.getVersion(name: string, version: string): Observable<VersionDetail>` -> `GET /api/software/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`.

- [ ] **Step 1: Write failing test** `getVersion requests the encoded version URL`: with `provideHttpClientTesting`, call `getVersion('my app','1.0/b')`, `http.expectOne('/api/software/my%20app/versions/1.0%2Fb')` exists and flushes a `VersionDetail`.
- [ ] **Step 2: Run** `npx ng test --include src/app/software.service.spec.ts` — expect FAIL.
- [ ] **Step 3: Implement** the types and `getVersion`. (Leave `getSoftware` unchanged.)
- [ ] **Step 4: Run** the same command — expect PASS.
- [ ] **Step 5: Commit** `feat: add version detail types and endpoint to SoftwareService`

### Task 8: Report byline component

**Files:**
- Create: `src/app/report-byline/report-byline.component.{ts,html,css,spec.ts}`
- Modify: `src/app/app.module.ts` (declare it)

**Interfaces:**
- Consumes: `Submitter` (Task 7).
- Produces: `<app-report-byline [submitter]="..." [submittedAt]="...">`; `standalone: false`, `OnPush`, signal inputs `submitter = input<Submitter | undefined>()`, `submittedAt = input<string | undefined>()`; exported const `GITHUB_LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/`.

- [ ] **Step 1: Write failing tests** (declare in TestBed; set inputs with `fixture.componentRef.setInput`): login `octocat` + name `Octo` -> one `<a>` with `href="https://github.com/octocat"`, `target="_blank"`, `rel` containing `noopener`, text containing `Octo` or `@octocat` (pick `@octocat`); name only (`Bob`, no login) -> text `Bob`, no `<a>`; login `../evil` or `a b` -> no `<a>`, shows name; date `2026-06-01T10:00:00Z` -> text contains `2026`; neither submitter nor date -> empty element text.
- [ ] **Step 2: Run** `npx ng test --include src/app/report-byline/report-byline.component.spec.ts` — expect FAIL.
- [ ] **Step 3: Implement.** Text form "Reported by <link-or-name> · <date>" with the date via `DatePipe` (`mediumDate`); omit the parts that are missing; render nothing when both are missing. Small muted styling (follow `.version-pill` sizing conventions in `software-detail.component.css`).
- [ ] **Step 4: Run** the same command — expect PASS.
- [ ] **Step 5: Commit** `feat: add report byline component`

### Task 9: Byline and version history on the detail page

**Files:**
- Modify: `src/app/software-detail/software-detail.component.{html,css,ts}`
- Test: `src/app/software-detail/software-detail.component.spec.ts` (add cases; add `ReportBylineComponent` to the TestBed declarations)

**Interfaces:**
- Consumes: `app-report-byline` (Task 8), `VersionSummary` and `SoftwareDetail.versions` (Task 7); route `/software/:name/versions/:version` (Task 10); `app-status-badge`.

- [ ] **Step 1: Write failing tests** (reuse the `load()` helper): report with `submitter {name:'Alice', login:'alice'}` -> link to `https://github.com/alice` inside `.report`; `versions` with 2 entries `[{version:'2.0',reportCount:2,status:'gold'},{version:'1.0',reportCount:0}]` -> a `.version-history` section with 2 rows, each row's link `href` ends with `/software/app/versions/2.0` and `/versions/1.0`, the first row has a status badge, the second none and shows `0 reports`; with exactly one version or `versions` undefined -> no `.version-history`.
- [ ] **Step 2: Run** `npx ng test --include src/app/software-detail/software-detail.component.spec.ts` — expect new cases FAIL.
- [ ] **Step 3: Implement** the byline under the report description and the "Version history" section below `.report`, as a list with `routerLink="['/software', softwareName, 'versions', v.version]"`; label rows `N report(s)`; add the CSS.
- [ ] **Step 4: Run** the same command — expect PASS (existing link tests included).
- [ ] **Step 5: Commit** `feat: show report submitter and version history on the software page`

### Task 10: Read-only version page

**Files:**
- Create: `src/app/version-detail/version-detail.component.{ts,html,css,spec.ts}`
- Modify: `src/app/app-routing.module.ts`, `src/app/app.module.ts`

**Interfaces:**
- Consumes: `SoftwareService.getVersion`, `VersionDetail` (Task 7); `app-report-byline` (Task 8); `MarkdownPipe`, `app-status-badge`, `ScreenshotLightboxComponent` (existing, same usage as `software-detail`).
- Produces: route `{ path: 'software/:name/versions/:version', component: VersionDetailComponent }` (public, no guard).

- [ ] **Step 1: Write failing tests** (pattern: `software-detail.component.spec.ts`; provide `ActivatedRoute` params `name=app`, `version=2.0`): request `/api/software/app/versions/2.0`; with two reports the first is rendered expanded (its description visible), the second is a collapsed `mat-expansion-panel` whose header shows its status badge and byline; Download link shown only when `download` is non-empty; a "Report compatibility" link points to `/software/app/versions/2.0/submit/report`; zero reports -> `No compatibility reports yet for this version.`; HTTP 404 -> `Version "2.0" of "app" was not found.`.
- [ ] **Step 2: Run** `npx ng test --include src/app/version-detail/version-detail.component.spec.ts` — expect FAIL.
- [ ] **Step 3: Implement** the component (`standalone: false`, `OnPush`, signals like `SoftwareDetailComponent`), declare it in `app.module.ts`, add the route to `app-routing.module.ts` next to the other `software/:name` routes, and a "Back to <name>" link to `/software/<name>`.
- [ ] **Step 4: Run** `npx ng test` (whole suite) and `npx ng build` — expect all tests PASS and the build to succeed.
- [ ] **Step 5: Commit** `feat: add read-only version page listing all reports`

### Task 11: End-to-end check against a real database clone

**Files:** none (verification only; fix defects in the owning task's files).

- [ ] **Step 1:** Backend: `go build ./... && go test ./...` — expect PASS.
- [ ] **Step 2:** Run the backend against a real clone of the database repo (`DEVELOPMENT=1`, the usual env from `docs/superpowers/specs/2026-11-13-appdb-deployment-design.md`), then `curl localhost:8484/api/software/<a software with several versions>`; expect `versions[]` newest first and `submitter`/`submittedAt` on reports. Note startup time of the first (full-history) index run and of a second start (should be near-instant); record both in the PR description.
- [ ] **Step 3:** Run the frontend with `npx ng serve` (proxy to the backend); in the browser check `/software/<name>` (byline, history list, link to GitHub opens the right profile) and a version page; check a legacy report shows no byline link.
- [ ] **Step 4:** Report any defect found by fixing it in the owning task's files with a test, then re-run Steps 1-3.
