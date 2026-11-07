import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomepageComponent } from './homepage/homepage.component';
import { LoginComponent } from './login/login.component';
import { NeedAuthGuard } from './needauth';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { MaterialModule } from './material.module';

@NgModule({ declarations: [
        AppComponent,
        HomepageComponent,
        LoginComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        MaterialModule], providers: [NeedAuthGuard, provideHttpClient(withXhr(), withInterceptorsFromDi())] })
export class AppModule { }
