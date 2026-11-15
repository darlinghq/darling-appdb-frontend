# Version history and report authors — design

Spans two repos: `darling-appdb-backend` (Go, serves the API from a git clone of the
database repo in `./db`) and `darling-appdb-frontend` (Angular).

## Intent

The software page shows only the latest version and that version's latest report; older
versions and other reports exist on disk but are unreachable. Make the latest version and
report stay the most prominent thing, make older data browsable, and show who submitted
each report, linked to their GitHub profile when we can tell who that is.

## Goals

- Latest version + latest report remain the top of `/software/:name`, as today.
- Every version is reachable; every report of a version is viewable, newest first.
- Each report shows "Reported by <name>", linked to `https://github.com/<login>` when the
  login is known, and the submission date.
- "Latest report" becomes genuinely the newest one (it is currently the highest file name,
  which is random for reports made through the website: `uuid[:8]` in `bundle.go`).

## Non-goals / anti-goals

- No change to the database repo's file formats or report ID scheme.
- No GitHub API calls for author lookup (rate limits, new failure mode). May be added later
  without an API change.
- No backfill of old data; no editing/deleting reports; no pagination.
- A wrong link is worse than no link: when the login cannot be derived, show the name
  unlinked.

## Constraints

- Backend builds with `CGO_ENABLED=0` into distroless/static; no cgo dependencies.
- State already lives in `data/` (bbolt token store); `./db` is a go-git clone that is
  pulled on webhook and may be rewritten (force-push).
- Existing API consumers (current frontend) must keep working: additions only.

## Approaches considered

1. **History index at sync time, login from noreply email only** (chosen). One walk of git
   history builds report path -> {author name, login?, date}; no network calls.
2. Same plus GitHub API lookup of `author.login` for non-noreply emails. Better link
   coverage, but depends on rate limits (60/h anonymous). Deferred.
3. `git log` on the report file per request. Simplest but slow on long histories and
   repeated on every page view. Rejected.

Cache store: user suggested a local SQLite cache. **My call:** use bbolt instead — already a
dependency (`tokenstore_bolt.go`), pure Go, and the index is a plain key/value map. SQLite
in Go means either cgo or a large pure-Go driver, for no query power we need.

## Backend design

### Author index (`report_authors.go`, new)

- bbolt file `data/report-authors.db`, bucket `reports`: key = report file path relative to
  the repo root (`data/software/.../reports/<id>.json`), value = JSON
  `{name, login, date}`. Key `meta/lastCommit` = last indexed HEAD hash.
- `updateReportIndex(repo)` runs after every successful sync (clone/pull) and at startup:
  - If `lastCommit` is an ancestor of HEAD: walk only commits `lastCommit..HEAD`.
    Otherwise (first run, force-push, missing): clear and walk everything.
  - Oldest -> newest, skip merge commits, diff each commit against its first parent; for
    each *added* file matching `.../reports/<id>.json`, record the author (not committer)
    name, email-derived login, and author date, only if the key is absent (first add wins).
  - Login derivation: email `^(?:\d+\+)?([A-Za-z0-9-]+)@users\.noreply\.github\.com$`
    gives the login; anything else gives no login.
  - Squash merges (author = PR author) and rebase merges are covered the same way;
    merge commits are skipped so the maintainer who merged is never credited.
- Index failure must not break serving: log it, serve reports without submitter, order by
  name as today.

### Report ordering

Reports of a version are sorted by indexed date, newest first; reports not in the index
sort after those that are, by name descending (current behaviour). `lastReport` uses this
order. Versions keep the existing numeric-collation order (`highestNumericInDir`).

### API (additions only)

- `ReportData` gains `id` (file name minus `.json`), `submittedAt` (RFC 3339, omitted if
  unknown) and `submitter: {name, login?}` (omitted if unknown).
- `GET /api/software/:name` keeps `lastVersion`; gains `versions: VersionSummary[]`, newest
  first: `{version, reportCount, status?, submittedAt?}` where `status` is that version's
  newest report's status.
- New `GET /api/software/:name/versions/:version` -> `{version, download, issues, reports:
  ReportData[]}` (newest first, screenshots resolved as today); 404 if unknown.

## Frontend design

- `software.service.ts`: extend `ReportData` (`id`, `submittedAt?`, `submitter?`), add
  `VersionSummary`, `SoftwareDetail.versions?`, and `VersionDetail` +
  `getVersion(name, version)`.
- Detail page (`/software/:name`): unchanged header and report; the report gets a byline
  "Reported by [@login | name] · date". New "Version history" section below the report
  listing `versions` (version, status badge, report count, date) as links; hidden when
  there is only one version.
- New route and component `/software/:name/versions/:version` (read-only): version pill,
  Download button, status of newest report, then all reports newest first (newest
  expanded, others collapsed with status + byline as the summary), each with description,
  screenshots and byline. "Report compatibility" button for this version. Not found state
  like the detail page.
- Shared byline rendering goes in a small component (`report-byline`) used by both pages.
- Link markup: `target="_blank" rel="noopener noreferrer"`; login is escaped by Angular
  and only ever used as a path segment after validation against the login pattern.
- The existing "Report compatibility" button keeps targeting the latest version.

## Left to the builder

- Exact visual styling (follow existing pill/badge CSS), collapsed-report widget
  (`mat-expansion-panel` is fine), date format.
- Test fixtures: build a throwaway git repo in tests (see `database_sync_test.go` for the
  pattern) covering: normal add, squash-style author, noreply vs real email, force-push
  rebuild, incremental update, merge commit skipped.
- Rollout: backend first (additive API), then frontend. The first startup after deploy
  walks full history once; later syncs are incremental.

## Calls I made (flag if you disagree)

- bbolt instead of SQLite.
- Author/date from the commit that first *added* the report file, merges skipped.
- Unknown login -> unlinked name; no GitHub API.
- Hide "Version history" when there is a single version.
