import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { NeedAuthGuard } from './needauth';
import { LoginComponent } from './login/login.component';
import { CategoryDetailComponent } from './category-detail/category-detail.component';
import { SoftwareDetailComponent } from './software-detail/software-detail.component';


const routes: Routes = [
  { path: 'category/:id', component: CategoryDetailComponent, canActivate: [NeedAuthGuard] },
  { path: 'software/:name', component: SoftwareDetailComponent, canActivate: [NeedAuthGuard] },
  { path: '', component: HomepageComponent, canActivate: [NeedAuthGuard]},
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
