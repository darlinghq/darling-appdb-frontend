import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CpuArchitecturesComponent, CPU_ARCHITECTURE_INFO } from './cpu-architectures.component';
import { CPU_ARCHITECTURES } from '../category.service';
import { MaterialModule } from '../material.module';

describe('CpuArchitecturesComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule, MaterialModule],
    declarations: [CpuArchitecturesComponent]
  }));

  it('explains every selectable architecture, including ppc', () => {
    expect(CPU_ARCHITECTURE_INFO.map(a => a.arch)).toEqual(CPU_ARCHITECTURES);
    expect(CPU_ARCHITECTURES).toContain('ppc');
  });

  it('renders one anchor-able row per architecture', () => {
    const fixture = TestBed.createComponent(CpuArchitecturesComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    for (const a of CPU_ARCHITECTURES) {
      expect(el.querySelector('[id="' + a + '"]')).toBeTruthy();
    }
  });
});
