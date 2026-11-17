import { Component } from '@angular/core';

/**
 * Stands in for a software card's screenshot when it has none: a soft gray
 * panel with the Darling logo, desaturated and tilted to one side.
 */
@Component({
  selector: 'app-screenshot-placeholder',
  template: '<img src="assets/img/darling-logo.svg" alt="" class="logo" />',
  styleUrls: ['./screenshot-placeholder.component.css'],
  host: { 'aria-hidden': 'true' },
  standalone: false
})
export class ScreenshotPlaceholderComponent {}
