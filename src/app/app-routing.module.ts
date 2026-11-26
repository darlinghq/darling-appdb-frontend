import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { NeedAuthGuard } from './needauth';
import { LoginComponent } from './login/login.component';
import { CategoryDetailComponent } from './category-detail/category-detail.component';
import { SoftwareDetailComponent } from './software-detail/software-detail.component';
import { SubmitWizardComponent } from './submit-wizard/submit-wizard.component';
import { VersionDetailComponent } from './version-detail/version-detail.component';
import { StatusLevelsComponent } from './status-levels/status-levels.component';
import { CpuArchitecturesComponent } from './cpu-architectures/cpu-architectures.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { WishlistListComponent } from './wishlist-list/wishlist-list.component';
import { WishlistNewComponent } from './wishlist-new/wishlist-new.component';
import { WishlistDetailComponent } from './wishlist-detail/wishlist-detail.component';


const routes: Routes = [
  // Browsing the database is public; only submitting/editing requires login
  // (enforced for real by the backend's checkAccess(c, true) on each write
  // endpoint -- these guards just keep logged-out users from reaching a form
  // that would fail anyway).
  { path: 'status-levels', component: StatusLevelsComponent },
  { path: 'cpu-architectures', component: CpuArchitecturesComponent },
  { path: 'search', component: SearchResultsComponent },
  { path: 'category/:id', component: CategoryDetailComponent },
  { path: 'software/:name', component: SoftwareDetailComponent },
  { path: 'software/:name/versions/:version', component: VersionDetailComponent },
  // One wizard, several entry points: new software, or from a software page
  // (new version / report on its existing version). Everything filled in
  // becomes ONE pull request.
  { path: 'submit', component: SubmitWizardComponent, canActivate: [NeedAuthGuard] },
  { path: 'submit/software', component: SubmitWizardComponent, canActivate: [NeedAuthGuard] },
  { path: 'software/:name/submit/version', component: SubmitWizardComponent, canActivate: [NeedAuthGuard], data: { versionMode: 'new' } },
  { path: 'software/:name/versions/:version/submit/report', component: SubmitWizardComponent, canActivate: [NeedAuthGuard] },
  // 'wishlist/new' must stay before 'wishlist/:slug', or "new" is read as a slug.
  { path: 'wishlist', component: WishlistListComponent },
  { path: 'wishlist/new', component: WishlistNewComponent, canActivate: [NeedAuthGuard] },
  { path: 'wishlist/:slug', component: WishlistDetailComponent },
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
