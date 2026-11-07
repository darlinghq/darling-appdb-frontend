import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginComponent } from './login/login.component';
import { CategoryDetailComponent } from './category-detail/category-detail.component';
import { SoftwareDetailComponent } from './software-detail/software-detail.component';
import { NewSoftwareFormComponent } from './new-software-form/new-software-form.component';
import { NeedAuthGuard } from './needauth';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';

@NgModule({ declarations: [
        AppComponent,
        HomepageComponent,
        LoginComponent,
        CategoryDetailComponent,
        SoftwareDetailComponent,
        NewSoftwareFormComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        MaterialModule], providers: [NeedAuthGuard, provideHttpClient(withXhr(), withInterceptorsFromDi())] })
export class AppModule { }
