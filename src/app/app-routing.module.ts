import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { NeedAuthGuard } from './needauth';
import { LoginComponent } from './login/login.component';
import { CategoryDetailComponent } from './category-detail/category-detail.component';
import { SoftwareDetailComponent } from './software-detail/software-detail.component';
import { NewSoftwareFormComponent } from './new-software-form/new-software-form.component';
import { NewVersionFormComponent } from './new-version-form/new-version-form.component';
import { NewReportFormComponent } from './new-report-form/new-report-form.component';
import { SearchResultsComponent } from './search-results/search-results.component';


const routes: Routes = [
  { path: 'search', component: SearchResultsComponent, canActivate: [NeedAuthGuard] },
  { path: 'category/:id', component: CategoryDetailComponent, canActivate: [NeedAuthGuard] },
  { path: 'software/:name', component: SoftwareDetailComponent, canActivate: [NeedAuthGuard] },
  { path: 'submit/software', component: NewSoftwareFormComponent, canActivate: [NeedAuthGuard] },
  { path: 'software/:name/submit/version', component: NewVersionFormComponent, canActivate: [NeedAuthGuard] },
  { path: 'software/:name/versions/:version/submit/report', component: NewReportFormComponent, canActivate: [NeedAuthGuard] },
  { path: '', component: HomepageComponent, canActivate: [NeedAuthGuard]},
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
