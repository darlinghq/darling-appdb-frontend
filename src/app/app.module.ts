import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginComponent } from './login/login.component';
import { CategoryDetailComponent } from './category-detail/category-detail.component';
import { SoftwareDetailComponent } from './software-detail/software-detail.component';
import { SubmitWizardComponent } from './submit-wizard/submit-wizard.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { ScreenshotPlaceholderComponent } from './screenshot-placeholder/screenshot-placeholder.component';
import { ScreenshotLightboxComponent } from './screenshot-lightbox/screenshot-lightbox.component';
import { MarkdownPipe } from './markdown/markdown.pipe';
import { ReportBylineComponent } from './report-byline/report-byline.component';
import { VersionDetailComponent } from './version-detail/version-detail.component';
import { StatusLevelsComponent } from './status-levels/status-levels.component';
import { CpuArchitecturesComponent } from './cpu-architectures/cpu-architectures.component';
import { StarButtonComponent } from './star-button/star-button.component';
import { WishlistListComponent } from './wishlist-list/wishlist-list.component';
import { WishlistDetailComponent } from './wishlist-detail/wishlist-detail.component';
import { WishlistNewComponent } from './wishlist-new/wishlist-new.component';
import { RecentSubmissionsComponent } from './recent-submissions/recent-submissions.component';
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
        SubmitWizardComponent,
        SearchResultsComponent,
        StatusBadgeComponent,
        ScreenshotPlaceholderComponent,
        ScreenshotLightboxComponent,
        MarkdownPipe,
        StatusLevelsComponent,
        CpuArchitecturesComponent,
        ReportBylineComponent,
        VersionDetailComponent,
        StarButtonComponent,
        WishlistListComponent,
        WishlistDetailComponent,
        WishlistNewComponent,
        RecentSubmissionsComponent
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
