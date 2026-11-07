# PR Submission Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the AppDB frontend a real visual design (Angular Material, themed from the Darling
logo) and the write-side UI the backend plan adds: forms to submit a new software entry, a new
version, and a compatibility report, each ending in a link to the GitHub PR it created.

**Architecture:** Bootstrap/ng-bootstrap are removed entirely in favor of Angular Material + CDK,
themed with a custom M3 palette seeded from the logo's colors. Two small browsing pages are added
(`category/:id`, `software/:name`) — not in the original 3-forms scope, but necessary plumbing:
the backend already exposes `GET /api/category/:cat` and `GET /api/software/:name`, but the
frontend never consumed either, so there was previously no page from which "add a version" or
"add a report" would make sense to launch from. The three submission forms are reached from
those pages and end in a confirmation showing the created PR.

**Tech Stack:** Angular 22, Angular Material + CDK, reactive forms (`ReactiveFormsModule`), rxjs.

**Backend contract this plan depends on** (from `darling-appdb-backend`'s
`feature/pr-submission-backend` branch — same API shapes either way since they're fixed by the
shared design spec, so this frontend work doesn't need to wait for that branch to merge):
- `POST /api/software` — body `{name, links, cpu, free, categories}` → `200 {prUrl, prNumber}` or
  `400 <field>: <message>` map.
- `POST /api/software/:name/versions` — body `{version, download}` → same response shapes.
- `POST /api/software/:name/versions/:version/reports` — body `{status, description}` → same.
- `GET /api/category/:cat` — existing, returns `[{name, lastVersion?, status?}, ...]`.
- `GET /api/software/:name` — existing, returns
  `{name, links, cpu, free, categories, lastVersion: {version, download, issues, lastReport: {status, description} | null} | null}`.

---

All paths below are relative to `/home/lubos/Projects/darling-appdb-frontend/.worktrees/pr-submission-ui`.

### Task 1: Remove Bootstrap, install Angular Material

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `src/styles.css` → renamed `src/styles.scss`
- Modify: `angular.json`
- Modify: `src/app/app.module.ts`
- Modify: `src/index.html`

- [ ] **Step 1: Remove Bootstrap/ng-bootstrap/fontawesome**

Run:
```bash
npm uninstall @ng-bootstrap/ng-bootstrap bootstrap bootstrap-social @fortawesome/fontawesome-free
```

- [ ] **Step 2: Add Angular Material**

Run:
```bash
ng add @angular/material --theme custom --typography true --animations enabled --skip-confirmation
```
Expected: adds `@angular/material` and `@angular/cdk` to `package.json`, adds
`provideAnimationsAsync()` (or similar) to `src/main.ts`'s providers, and creates/updates a
theme file referenced from `src/styles.scss` (the schematic renames `styles.css` to
`styles.scss` itself if it wasn't already SCSS — if it doesn't, rename it yourself:
`git mv src/styles.css src/styles.scss` and update the `styles` entry in `angular.json`'s build
options from `src/styles.css` to `src/styles.scss`).

- [ ] **Step 3: Strip the old Bootstrap/fontawesome imports from the stylesheet**

In `src/styles.scss`, delete these three lines (now-uninstalled packages):
```scss
@import 'bootstrap/dist/css/bootstrap.css';
@import 'bootstrap-social/bootstrap-social.css';
@import 'font-awesome/css/font-awesome.min.css';
```
(The `font-awesome` one was never an explicit dependency — it only worked because
`bootstrap-social`/`ng-bootstrap` pulled it in transitively. Removing it here is required, not
optional, since that transitive copy disappears once Step 1's uninstalls run.)

Leave the rest of the file's custom CSS in place for now — later tasks replace or remove
individual rules as they rebuild each component, but don't do a wholesale deletion here.

- [ ] **Step 4: Remove the fontawesome `<link>` from `index.html`**

In `src/index.html`, delete this line (the CDN-hosted Font Awesome stylesheet, now unused):
```html
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossorigin="anonymous" async defer>
```

- [ ] **Step 5: Remove `NgbModule` from `app.module.ts`**

Change:
```ts
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
```
and remove `NgbModule` from the `imports: [...]` array. (Don't add Material modules here yet —
Task 2 introduces a dedicated `MaterialModule` for that, keeping this change a pure removal.)

- [ ] **Step 6: Build**

Run: `ng build`
Expected: `PASS`. If any remaining template still references an `ngb*` component (none were
found when this plan was written — confirmed via `grep -rn "ngb" src/app/**/*.html` returning
nothing — but re-check in case something changed since), fix or remove that usage; there should
be none.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove Bootstrap/ng-bootstrap/fontawesome, add Angular Material"
```

### Task 2: Brand theme from the logo

**Files:**
- Modify: `src/styles.scss`
- Create: the theme file `ng generate @angular/material:m3-theme` emits — Step 1 runs the
  command and has you read its own output for the real path, rather than this plan guessing it

Generate a Material 3 theme seeded from the logo's actual colors (approved during design):
primary `#1a1a7e` (navy, the terminal screen), tertiary `#f7941e` (amber, the hands).

- [ ] **Step 1: Generate the theme**

Run:
```bash
ng generate @angular/material:m3-theme --primary-color=#1a1a7e --tertiary-color=#f7941e --defaults
```
(Corrected from an earlier draft of this plan that guessed camelCase flag names and a
`--themeTypes` option — neither exists on this schematic version; the real flags are kebab-case
and `--defaults` skips the interactive prompts instead.)

Expected: generates a theme file (check the command's own output for the exact path/filename —
commonly something like `src/styles/_theme-colors.scss` or similar; use whatever it actually
created). Run `git status --short` right after to see exactly what file(s) appeared.

- [ ] **Step 2: Wire the generated theme into `src/styles.scss`**

Open the generated file and `src/styles.scss`. If `ng add @angular/material` (Task 1) already
put a `@include mat.theme(...)` block in `styles.scss`, replace its `color:` value with a
reference to the generated theme (the generated file's own top comment usually shows the
`@use`/variable name to reference — follow that). If Task 1 left no theme block at all, add one
following the generated file's instructions, roughly:
```scss
@use '@angular/material' as mat;
@use './<generated-theme-file-name-without-extension>' as my-theme;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: my-theme.$light-theme, // or whatever variable name the generated file actually exports — check it
    typography: Roboto,
    density: 0
  ));
}
```
This step's exact mixin/variable names depend on what the schematic generated — don't guess
blindly if the names above don't match the real file; open the generated file, see what it
actually exports, and reference that.

- [ ] **Step 3: Build and visually sanity-check the color variables exist**

Run: `ng build`
Expected: `PASS`. Then run:
```bash
grep -r "mat-sys-primary" dist/darling-appdb/browser/*.css | head -1
```
Expected: non-empty output — confirms the Material system CSS custom properties (which
components read their colors from) were actually emitted into the built CSS, i.e. the theme is
really wired in rather than silently falling back to Material's default purple.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add brand theme (navy/amber) generated from the Darling logo"
```

### Task 3: Shared Material module

**Files:**
- Create: `src/app/material.module.ts`
- Modify: `src/app/app.module.ts`

One place listing every Material component module the app uses, re-exported, so feature modules
just import `MaterialModule` instead of a dozen individual Material imports each.

- [ ] **Step 1: Write `material.module.ts`**

```ts
import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const MATERIAL_MODULES = [
  MatToolbarModule,
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatChipsModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
];

@NgModule({
  imports: MATERIAL_MODULES,
  exports: MATERIAL_MODULES,
})
export class MaterialModule {}
```

- [ ] **Step 2: Import it into `app.module.ts`**

Add `import { MaterialModule } from './material.module';` and add `MaterialModule` to the
`imports: [...]` array (alongside `BrowserModule`, `AppRoutingModule`).

- [ ] **Step 3: Add Material Symbols font for `mat-icon` ligatures**

In `src/index.html`, add this stylesheet link (replacing the fontawesome one removed in Task 1):
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
```

- [ ] **Step 4: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared MaterialModule and Material Symbols font"
```

### Task 4: Redesign the header

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.css`
- Modify: `src/styles.scss`

Replace the plain `<header>`/`<nav>` markup with a `mat-toolbar`, put the logo image in it next
to the title (per the approved design), and move the external links (Docs/Blog/GitHub/Discord)
into the toolbar as text buttons.

- [ ] **Step 1: Confirm the logo asset is in place**

Run: `ls src/assets/img/darling250.png`
Expected: file exists (it's the project's existing logo asset — nothing to create here).

- [ ] **Step 2: Rewrite `app.component.html`**

```html
<mat-toolbar color="primary">
  <img src="assets/img/darling250.png" alt="Darling" class="logo-img" />
  <span class="title">Darling AppDB</span>
  <span class="spacer"></span>
  <a mat-button href="http://docs.darlinghq.org">Docs</a>
  <a mat-button href="http://blog.darlinghq.org/">Blog</a>
  <a mat-button href="https://github.com/darlinghq/darling">GitHub</a>
  <a mat-button href="https://discord.gg/XRD3mQA">Discord</a>
</mat-toolbar>
<div class="container">
  <router-outlet></router-outlet>
</div>
```

- [ ] **Step 3: Add the layout CSS**

In `src/app/app.component.css`:
```css
.logo-img {
  height: 36px;
  width: 36px;
  margin-right: 12px;
}

.title {
  font-size: 18px;
  font-weight: 500;
}

.spacer {
  flex: 1 1 auto;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
}
```

- [ ] **Step 4: Remove the now-dead global header/nav CSS from `src/styles.scss`**

Delete these rule blocks (superseded by Step 3's component-scoped CSS and `mat-toolbar`):
`header { ... }`, `#logo-row { ... }`, `.logo { ... }`, `header .desc { ... }`, `.container {
... }`, `nav ul { ... }`, `nav ul li { ... }`, `nav ul li a { ... }`, `nav ul li:hover a { ...
}`, and the `@media (max-width: 780px) { ... }` block that targets `header`/`nav` (the whole
media query block — it has nothing else in it).

- [ ] **Step 5: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: redesign header as a Material toolbar with the Darling logo"
```

### Task 5: Browse services — category contents and software detail

**Files:**
- Modify: `src/app/category.service.ts`
- Create: `src/app/software.service.ts`

The backend already has `GET /api/category/:cat` and `GET /api/software/:name` — add the
Angular service methods to call them (the existing `category.service.ts` only has
`getCategories()`, never `getCategoryContents()`).

- [ ] **Step 1: Add `getCategoryContents` to `category.service.ts`**

Add this method and type to the existing `CategoryService`/file (keep `getCategories` and
`Category` exactly as they are):
```ts
public getCategoryContents(id: string): Observable<SoftwareOverview[]> {
  return this.httpClient.get<SoftwareOverview[]>('/api/category/' + id);
}
```
And add this exported interface alongside the existing `Category` class in the same file:
```ts
export interface SoftwareOverview {
  name: string;
  lastVersion?: string;
  status?: string;
}
```

- [ ] **Step 2: Write `software.service.ts`**

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SoftwareService {

  constructor(private httpClient: HttpClient) { }

  public getSoftware(name: string): Observable<SoftwareDetail> {
    return this.httpClient.get<SoftwareDetail>('/api/software/' + name);
  }
}

export interface ReportData {
  status: string;
  description: string;
}

export interface VersionData {
  version: string;
  download: string;
  issues: number[];
  lastReport: ReportData | null;
}

export interface SoftwareDetail {
  name: string;
  links: { [key: string]: string };
  cpu: string[];
  free: boolean;
  categories: string[];
  lastVersion: VersionData | null;
}
```

- [ ] **Step 3: Build**

Run: `ng build`
Expected: `PASS` (nothing consumes these yet — Tasks 6-7 do).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add category-contents and software-detail HTTP service methods"
```

### Task 6: Category detail page

**Files:**
- Create: `src/app/category-detail/category-detail.component.ts`
- Create: `src/app/category-detail/category-detail.component.html`
- Create: `src/app/category-detail/category-detail.component.css`
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app-routing.module.ts`
- Modify: `src/app/homepage/homepage.component.html`

A new page listing the software in one category (using Task 5's `getCategoryContents`), each
entry linking to its software-detail page (Task 7). The homepage's category links currently
point at `/category/<id>` already (see `category.service.ts`'s existing `link` field) but no
route or component exists for it yet — this task adds both.

- [ ] **Step 1: Write the component**

```ts
// category-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService, SoftwareOverview } from '../category.service';

@Component({
  selector: 'app-category-detail',
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.css'],
  standalone: false
})
export class CategoryDetailComponent implements OnInit {
  categoryId: string = '';
  software: SoftwareOverview[] | null = null;

  constructor(private route: ActivatedRoute, private categoryService: CategoryService) { }

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id') ?? '';
    this.categoryService.getCategoryContents(this.categoryId).subscribe(v => {
      this.software = v;
    });
  }
}
```

```html
<!-- category-detail.component.html -->
<h1>{{ categoryId }}</h1>

@if (software !== null) {
  <div class="software-grid">
    @for (sw of software; track sw.name) {
      <mat-card [routerLink]="['/software', sw.name]" class="software-card">
        <mat-card-header>
          <mat-card-title>{{ sw.name }}</mat-card-title>
          @if (sw.lastVersion) {
            <mat-card-subtitle>{{ sw.lastVersion }}</mat-card-subtitle>
          }
        </mat-card-header>
        @if (sw.status) {
          <mat-card-content>
            <mat-chip-set>
              <mat-chip>{{ sw.status }}</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        }
      </mat-card>
    }
  </div>
}
```

```css
/* category-detail.component.css */
.software-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.software-card {
  cursor: pointer;
}
```

- [ ] **Step 2: Declare it and add `RouterModule`'s `routerLink` support**

In `app.module.ts`: import `CategoryDetailComponent` from `./category-detail/category-detail.component` and add it to `declarations`. `RouterModule` is already imported transitively via `AppRoutingModule`, which already exports it, so `routerLink` is available without further changes.

- [ ] **Step 3: Add the route**

In `app-routing.module.ts`, add to the `routes` array (before the existing routes, order doesn't
matter here since paths don't overlap):
```ts
{ path: 'category/:id', component: CategoryDetailComponent, canActivate: [NeedAuthGuard] },
```
Add the import: `import { CategoryDetailComponent } from './category-detail/category-detail.component';`

- [ ] **Step 4: Update the homepage template to use `routerLink` instead of a plain `href`**

In `homepage.component.html`, change:
```html
<li><a href="{{ cat.link }}">{{ cat.name }}</a></li>
```
to:
```html
<li><a [routerLink]="cat.link">{{ cat.name }}</a></li>
```
(`cat.link` is already `/category/<id>` per `category.service.ts` — this just makes it a proper
Angular route navigation instead of a full page reload.)

- [ ] **Step 5: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add category detail page listing its software"
```

### Task 7: Software detail page

**Files:**
- Create: `src/app/software-detail/software-detail.component.ts`
- Create: `src/app/software-detail/software-detail.component.html`
- Create: `src/app/software-detail/software-detail.component.css`
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app-routing.module.ts`

Shows one software's metadata and latest version/report (using Task 5's `getSoftware`), with
buttons to add a new version or report a compatibility result — the entry points into Tasks 9-10's
forms.

- [ ] **Step 1: Write the component**

```ts
// software-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SoftwareService, SoftwareDetail } from '../software.service';

@Component({
  selector: 'app-software-detail',
  templateUrl: './software-detail.component.html',
  styleUrls: ['./software-detail.component.css'],
  standalone: false
})
export class SoftwareDetailComponent implements OnInit {
  softwareName: string = '';
  software: SoftwareDetail | null = null;

  constructor(private route: ActivatedRoute, private softwareService: SoftwareService) { }

  ngOnInit() {
    this.softwareName = this.route.snapshot.paramMap.get('name') ?? '';
    this.softwareService.getSoftware(this.softwareName).subscribe(v => {
      this.software = v;
    });
  }
}
```

```html
<!-- software-detail.component.html -->
@if (software !== null) {
  <mat-card>
    <mat-card-header>
      <mat-card-title>{{ software.name }}</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <mat-chip-set>
        @for (cat of software.categories; track cat) {
          <mat-chip>{{ cat }}</mat-chip>
        }
      </mat-chip-set>

      @if (software.lastVersion) {
        <p>Latest version: <strong>{{ software.lastVersion.version }}</strong></p>
        @if (software.lastVersion.lastReport) {
          <p>Status: <strong>{{ software.lastVersion.lastReport.status }}</strong></p>
          <p>{{ software.lastVersion.lastReport.description }}</p>
        } @else {
          <p>No compatibility report yet for this version.</p>
        }
      } @else {
        <p>No versions recorded yet.</p>
      }
    </mat-card-content>
    <mat-card-actions>
      <a mat-raised-button color="primary" [routerLink]="['/software', softwareName, 'submit', 'version']">
        Add version
      </a>
      @if (software.lastVersion) {
        <a mat-raised-button [routerLink]="['/software', softwareName, 'versions', software.lastVersion.version, 'submit', 'report']">
          Report compatibility
        </a>
      }
    </mat-card-actions>
  </mat-card>
}
```

```css
/* software-detail.component.css */
mat-card-actions {
  display: flex;
  gap: 8px;
}
```

- [ ] **Step 2: Declare and route it**

In `app.module.ts`: import and declare `SoftwareDetailComponent`.

In `app-routing.module.ts`, add:
```ts
{ path: 'software/:name', component: SoftwareDetailComponent, canActivate: [NeedAuthGuard] },
```
with its import.

- [ ] **Step 3: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add software detail page with add-version/report-compatibility actions"
```

### Task 8: Submission service

**Files:**
- Create: `src/app/submission.service.ts`

A thin wrapper around the three POST endpoints, shared by the three form components in Tasks
9-11.

- [ ] **Step 1: Write the service**

```ts
// submission.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {

  constructor(private httpClient: HttpClient) { }

  public submitNewSoftware(payload: NewSoftwarePayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>('/api/software', payload);
  }

  public submitNewVersion(softwareName: string, payload: NewVersionPayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>('/api/software/' + softwareName + '/versions', payload);
  }

  public submitNewReport(softwareName: string, versionId: string, payload: NewReportPayload): Observable<SubmissionResult> {
    return this.httpClient.post<SubmissionResult>(
      '/api/software/' + softwareName + '/versions/' + versionId + '/reports', payload
    );
  }
}

export interface SubmissionResult {
  prUrl: string;
  prNumber: number;
}

export interface NewSoftwarePayload {
  name: string;
  links: { [key: string]: string };
  cpu: string[];
  free: boolean;
  categories: string[];
}

export interface NewVersionPayload {
  version: string;
  download: string;
}

export interface NewReportPayload {
  status: string;
  description: string;
}

/** Field-name -> message, as returned by the backend on a 400 validation failure. */
export type ValidationErrors = { [field: string]: string };
```

- [ ] **Step 2: Build**

Run: `ng build`
Expected: `PASS` (unused until Tasks 9-11 wire it in).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add SubmissionService wrapping the three submission endpoints"
```

### Task 9: New-software form

**Files:**
- Create: `src/app/new-software-form/new-software-form.component.ts`
- Create: `src/app/new-software-form/new-software-form.component.html`
- Create: `src/app/new-software-form/new-software-form.component.css`
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app-routing.module.ts`
- Modify: `src/app/app.component.html`

A reactive form for submitting a brand-new software entry. On success, shows the created PR link
inline (not just a snackbar, since the user needs to click through to it) and a snackbar
confirmation; on a 400, maps field errors onto the matching form controls; on any other error,
shows a snackbar with the message.

- [ ] **Step 1: Write the component**

```ts
// new-software-form.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';

@Component({
  selector: 'app-new-software-form',
  templateUrl: './new-software-form.component.html',
  styleUrls: ['./new-software-form.component.css'],
  standalone: false
})
export class NewSoftwareFormComponent {
  form: FormGroup;
  submitting = false;
  result: SubmissionResult | null = null;
  serverErrors: ValidationErrors = {};

  constructor(private fb: FormBuilder, private submissionService: SubmissionService, private snackBar: MatSnackBar) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      productLink: ['', Validators.required],
      categories: ['', Validators.required],
      cpu: ['x86-64', Validators.required],
      free: [true],
    });
  }

  submit() {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.serverErrors = {};

    const value = this.form.value;
    this.submissionService.submitNewSoftware({
      name: value.name,
      links: { product: value.productLink },
      cpu: [value.cpu],
      free: value.free,
      categories: value.categories.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0),
    }).subscribe({
      next: (result) => {
        this.submitting = false;
        this.result = result;
        this.snackBar.open('Submitted! Opened PR #' + result.prNumber, 'Dismiss', { duration: 5000 });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          this.serverErrors = err.error;
        } else {
          this.snackBar.open(err.error?.message || 'Submission failed', 'Dismiss', { duration: 5000 });
        }
      }
    });
  }
}
```

- [ ] **Step 2: Write the template**

```html
<!-- new-software-form.component.html -->
@if (result === null) {
  <mat-card>
    <mat-card-header>
      <mat-card-title>Add software</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          @if (serverErrors['name']) {
            <mat-error>{{ serverErrors['name'] }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Product page URL</mat-label>
          <input matInput formControlName="productLink" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categories (comma-separated)</mat-label>
          <input matInput formControlName="categories" />
          @if (serverErrors['categories']) {
            <mat-error>{{ serverErrors['categories'] }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CPU architecture</mat-label>
          <mat-select formControlName="cpu">
            <mat-option value="x86-64">x86-64</mat-option>
            <mat-option value="arm64">arm64</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-checkbox formControlName="free">Free software</mat-checkbox>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting">
            @if (submitting) {
              <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
            } @else {
              Submit
            }
          </button>
        </div>
      </form>
    </mat-card-content>
  </mat-card>
} @else {
  <mat-card>
    <mat-card-content>
      <p>Your submission opened <a [href]="result.prUrl" target="_blank" rel="noopener">pull request #{{ result.prNumber }}</a>.</p>
      <p>A maintainer needs to review and merge it before it's live.</p>
    </mat-card-content>
  </mat-card>
}
```

- [ ] **Step 3: Add layout CSS**

```css
/* new-software-form.component.css */
mat-form-field {
  display: block;
  margin-bottom: 8px;
}

.actions {
  margin-top: 16px;
}
```

- [ ] **Step 4: Declare, route, and add a nav entry point**

In `app.module.ts`: import `ReactiveFormsModule` from `@angular/forms` and add it to `imports`
(it isn't imported yet anywhere in the app). Import and declare `NewSoftwareFormComponent`.

In `app-routing.module.ts`, add:
```ts
{ path: 'submit/software', component: NewSoftwareFormComponent, canActivate: [NeedAuthGuard] },
```
with its import.

In `app.component.html`, add a toolbar button before the spacer so it's reachable from
anywhere:
```html
<a mat-button routerLink="/submit/software">+ Add software</a>
```
(placed right after the `<span class="title">` line, before `<span class="spacer"></span>`).

- [ ] **Step 5: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add new-software submission form"
```

### Task 10: New-version form

**Files:**
- Create: `src/app/new-version-form/new-version-form.component.ts`
- Create: `src/app/new-version-form/new-version-form.component.html`
- Create: `src/app/new-version-form/new-version-form.component.css`
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app-routing.module.ts`

Same shape as Task 9's form, scoped to one software (from the route param), submitting via
`SubmissionService.submitNewVersion`.

- [ ] **Step 1: Write the component**

```ts
// new-version-form.component.ts
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';

@Component({
  selector: 'app-new-version-form',
  templateUrl: './new-version-form.component.html',
  styleUrls: ['./new-version-form.component.css'],
  standalone: false
})
export class NewVersionFormComponent {
  softwareName: string;
  form: FormGroup;
  submitting = false;
  result: SubmissionResult | null = null;
  serverErrors: ValidationErrors = {};

  constructor(
    route: ActivatedRoute,
    private fb: FormBuilder,
    private submissionService: SubmissionService,
    private snackBar: MatSnackBar
  ) {
    this.softwareName = route.snapshot.paramMap.get('name') ?? '';
    this.form = this.fb.group({
      version: ['', Validators.required],
      download: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.serverErrors = {};

    this.submissionService.submitNewVersion(this.softwareName, this.form.value).subscribe({
      next: (result) => {
        this.submitting = false;
        this.result = result;
        this.snackBar.open('Submitted! Opened PR #' + result.prNumber, 'Dismiss', { duration: 5000 });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          this.serverErrors = err.error;
        } else {
          this.snackBar.open(err.error?.message || 'Submission failed', 'Dismiss', { duration: 5000 });
        }
      }
    });
  }
}
```

- [ ] **Step 2: Write the template**

```html
<!-- new-version-form.component.html -->
@if (result === null) {
  <mat-card>
    <mat-card-header>
      <mat-card-title>Add version of {{ softwareName }}</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Version</mat-label>
          <input matInput formControlName="version" />
          @if (serverErrors['version']) {
            <mat-error>{{ serverErrors['version'] }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Download URL</mat-label>
          <input matInput formControlName="download" />
          @if (serverErrors['download']) {
            <mat-error>{{ serverErrors['download'] }}</mat-error>
          }
        </mat-form-field>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting">
            @if (submitting) {
              <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
            } @else {
              Submit
            }
          </button>
        </div>
      </form>
    </mat-card-content>
  </mat-card>
} @else {
  <mat-card>
    <mat-card-content>
      <p>Your submission opened <a [href]="result.prUrl" target="_blank" rel="noopener">pull request #{{ result.prNumber }}</a>.</p>
      <p>A maintainer needs to review and merge it before it's live.</p>
    </mat-card-content>
  </mat-card>
}
```

- [ ] **Step 3: Add layout CSS**

```css
/* new-version-form.component.css */
mat-form-field {
  display: block;
  margin-bottom: 8px;
}

.actions {
  margin-top: 16px;
}
```

- [ ] **Step 4: Declare and route it**

In `app.module.ts`: import and declare `NewVersionFormComponent`.

In `app-routing.module.ts`, add:
```ts
{ path: 'software/:name/submit/version', component: NewVersionFormComponent, canActivate: [NeedAuthGuard] },
```
with its import. (Task 7's software-detail page already links here.)

- [ ] **Step 5: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add new-version submission form"
```

### Task 11: New-report form

**Files:**
- Create: `src/app/new-report-form/new-report-form.component.ts`
- Create: `src/app/new-report-form/new-report-form.component.html`
- Create: `src/app/new-report-form/new-report-form.component.css`
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app-routing.module.ts`

Same shape again, scoped to one software+version (both from route params), with a status
dropdown matching the backend's closed enum (`platinum/gold/silver/bronze/garbage`).

- [ ] **Step 1: Write the component**

```ts
// new-report-form.component.ts
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubmissionService, SubmissionResult, ValidationErrors } from '../submission.service';

@Component({
  selector: 'app-new-report-form',
  templateUrl: './new-report-form.component.html',
  styleUrls: ['./new-report-form.component.css'],
  standalone: false
})
export class NewReportFormComponent {
  softwareName: string;
  versionId: string;
  form: FormGroup;
  submitting = false;
  result: SubmissionResult | null = null;
  serverErrors: ValidationErrors = {};

  statuses = ['platinum', 'gold', 'silver', 'bronze', 'garbage'];

  constructor(
    route: ActivatedRoute,
    private fb: FormBuilder,
    private submissionService: SubmissionService,
    private snackBar: MatSnackBar
  ) {
    this.softwareName = route.snapshot.paramMap.get('name') ?? '';
    this.versionId = route.snapshot.paramMap.get('version') ?? '';
    this.form = this.fb.group({
      status: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid || this.submitting) {
      return;
    }

    this.submitting = true;
    this.serverErrors = {};

    this.submissionService.submitNewReport(this.softwareName, this.versionId, this.form.value).subscribe({
      next: (result) => {
        this.submitting = false;
        this.result = result;
        this.snackBar.open('Submitted! Opened PR #' + result.prNumber, 'Dismiss', { duration: 5000 });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (err.status === 400 && err.error && typeof err.error === 'object') {
          this.serverErrors = err.error;
        } else {
          this.snackBar.open(err.error?.message || 'Submission failed', 'Dismiss', { duration: 5000 });
        }
      }
    });
  }
}
```

- [ ] **Step 2: Write the template**

```html
<!-- new-report-form.component.html -->
@if (result === null) {
  <mat-card>
    <mat-card-header>
      <mat-card-title>Report compatibility for {{ softwareName }} {{ versionId }}</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
          @if (serverErrors['status']) {
            <mat-error>{{ serverErrors['status'] }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4"></textarea>
          @if (serverErrors['description']) {
            <mat-error>{{ serverErrors['description'] }}</mat-error>
          }
        </mat-form-field>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting">
            @if (submitting) {
              <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
            } @else {
              Submit
            }
          </button>
        </div>
      </form>
    </mat-card-content>
  </mat-card>
} @else {
  <mat-card>
    <mat-card-content>
      <p>Your submission opened <a [href]="result.prUrl" target="_blank" rel="noopener">pull request #{{ result.prNumber }}</a>.</p>
      <p>A maintainer needs to review and merge it before it's live.</p>
    </mat-card-content>
  </mat-card>
}
```

- [ ] **Step 3: Add layout CSS**

```css
/* new-report-form.component.css */
mat-form-field {
  display: block;
  margin-bottom: 8px;
}

.actions {
  margin-top: 16px;
}
```

- [ ] **Step 4: Declare and route it**

In `app.module.ts`: import and declare `NewReportFormComponent`.

In `app-routing.module.ts`, add:
```ts
{ path: 'software/:name/versions/:version/submit/report', component: NewReportFormComponent, canActivate: [NeedAuthGuard] },
```
with its import. (Task 7's software-detail page already links here.)

- [ ] **Step 5: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add compatibility-report submission form"
```

### Task 12: Redesign the login page

**Files:**
- Modify: `src/app/login/login.component.html`
- Modify: `src/app/login/login.component.css`

Replace the Bootstrap-styled login card with a `mat-card`, and the fontawesome GitHub icon with
an inline SVG (no extra icon dependency needed for one brand mark).

- [ ] **Step 1: Rewrite the template**

```html
<!-- login.component.html -->
<div class="login-wrapper">
  <mat-card>
    <mat-card-header>
      <mat-card-title>Sign in</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <p>Only Darling team members are currently allowed to log in.</p>
      <a mat-raised-button color="primary" href="/oauth/github/login">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom; margin-right: 6px;">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        Sign in with GitHub
      </a>
    </mat-card-content>
  </mat-card>
</div>
```

- [ ] **Step 2: Add layout CSS**

```css
/* login.component.css */
.login-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

mat-card {
  max-width: 400px;
}
```

- [ ] **Step 3: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: redesign login page as a Material card"
```

### Task 13: Redesign the homepage

**Files:**
- Modify: `src/app/homepage/homepage.component.html`
- Modify: `src/app/homepage/homepage.component.css`

Turn the plain `<li>` category list into a Material card grid, matching Task 6's category-detail
page's visual language.

- [ ] **Step 1: Rewrite the template**

```html
<!-- homepage.component.html -->
@if (categories !== null) {
  <div class="categories-grid">
    @for (cat of categories; track cat) {
      <mat-card [routerLink]="cat.link" class="category-card">
        <mat-card-content>{{ cat.name }}</mat-card-content>
      </mat-card>
    }
  </div>
}
```

- [ ] **Step 2: Add layout CSS**

```css
/* homepage.component.css */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.category-card {
  cursor: pointer;
  text-align: center;
  font-weight: 500;
}
```

- [ ] **Step 3: Build**

Run: `ng build`
Expected: `PASS`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: redesign homepage category list as a Material card grid"
```

### Task 14: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test run**

Run: `ng test --watch=false`
Expected: `PASS`. The 5 existing specs (`app.component`, `auth.service`, `category.service`,
`homepage.component`, `login.component`) should still pass — none of their underlying public
APIs changed shape, only templates/styling (`category.service.spec.ts` may need its `TestBed`
providers checked if `HttpClientTestingModule` setup needs `MaterialModule` imported for the
homepage spec specifically — if `homepage.component.spec.ts` fails because `mat-card` isn't a
known element in the test module, add `MaterialModule` to that spec's `TestBed.configureTestingModule`
imports array; this is the one plausible test breakage from this plan's changes and is
straightforward to fix if it happens).

- [ ] **Step 2: Production build**

Run: `ng build --configuration production`
Expected: `PASS`, bundle emitted under `dist/darling-appdb`.

- [ ] **Step 3: Manual review of the full route tree**

Confirm every route added across this plan is reachable and uses `NeedAuthGuard` consistently
(all routes except `/login` should):
```bash
grep -n "path:" src/app/app-routing.module.ts
```
Expected: `''` (homepage), `'login'`, `'category/:id'`, `'software/:name'`,
`'submit/software'`, `'software/:name/submit/version'`,
`'software/:name/versions/:version/submit/report'` — seven routes total, matching what Tasks
6-7 and 9-11 added.

- [ ] **Step 4: Commit**

Nothing to commit in this task if all checks pass (fixing the possible spec breakage in Step 1,
if it happened, should already have been committed as part of Step 1 — don't leave it
uncommitted).
