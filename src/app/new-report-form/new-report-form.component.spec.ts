import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';

import { NewReportFormComponent } from './new-report-form.component';
import { MaterialModule } from '../material.module';
import { MAX_SCREENSHOTS } from '../screenshot-resize';
import { ScreenshotResizeService } from '../screenshot-resize.service';

describe('NewReportFormComponent', () => {
  let fixture: ComponentFixture<NewReportFormComponent>;
  let component: NewReportFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ReactiveFormsModule, MaterialModule],
      declarations: [NewReportFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ name: 'pearcalc', version: '1.0' }) } }
        },
        {
          provide: ScreenshotResizeService,
          useValue: { resize: vi.fn((file: File) => Promise.resolve(`data:image/jpeg;base64,FAKE-${file.name}`)) }
        }
      ]
    });

    fixture = TestBed.createComponent(NewReportFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fileListEvent(files: File[]): Event {
    return { target: { files, value: '' } } as unknown as Event;
  }

  it('adds a resized screenshot to the signal', async () => {
    await component.onFilesSelected(fileListEvent([new File(['x'], 'a.png')]));

    expect(component.screenshots()).toEqual(['data:image/jpeg;base64,FAKE-a.png']);
    expect(component.screenshotError()).toBeNull();
  });

  it('rejects more than the maximum number of screenshots', async () => {
    const files = Array.from({ length: MAX_SCREENSHOTS + 1 }, (_, i) => new File(['x'], `shot-${i}.png`));

    await component.onFilesSelected(fileListEvent(files));

    expect(component.screenshots().length).toBe(MAX_SCREENSHOTS);
    expect(component.screenshotError()).toContain(`${MAX_SCREENSHOTS}`);
  });

  it('removeScreenshot removes the screenshot at that index', async () => {
    await component.onFilesSelected(fileListEvent([new File(['x'], 'a.png'), new File(['x'], 'b.png')]));

    component.removeScreenshot(0);

    expect(component.screenshots()).toEqual(['data:image/jpeg;base64,FAKE-b.png']);
  });
});
