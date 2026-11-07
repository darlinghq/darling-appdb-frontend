import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginComponent } from './login/login.component';
import { CategoryDetailComponent } from './category-detail/category-detail.component';
import { SoftwareDetailComponent } from './software-detail/software-detail.component';
import { NewSoftwareFormComponent } from './new-software-form/new-software-form.component';
import { NewVersionFormComponent } from './new-version-form/new-version-form.component';
import { NewReportFormComponent } from './new-report-form/new-report-form.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { NeedAuthGuard } from './needauth';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

@NgModule({ declarations: [
        AppComponent,
        HomepageComponent,
        LoginComponent,
        CategoryDetailComponent,
        SoftwareDetailComponent,
        NewSoftwareFormComponent,
        NewVersionFormComponent,
        NewReportFormComponent,
        SearchResultsComponent,
        StatusBadgeComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        MaterialModule],
    providers: [
        NeedAuthGuard,
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        // These used to be passed as bootstrapModule(AppModule, { applicationProviders: [...] })
        // in main.ts -- that's not a real option on an NgModule bootstrap (its second
        // argument is CompilerOptions, which has no such field), so it was silently a
        // no-op. Environment providers for an NgModule-based app belong here instead.
        provideZoneChangeDetection(),
        provideAnimationsAsync(),
    ] })
export class AppModule { }
