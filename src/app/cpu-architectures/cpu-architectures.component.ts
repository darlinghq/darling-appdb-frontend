import { Component, ChangeDetectionStrategy } from '@angular/core';

export interface CpuArchitectureInfo {
  /** Value stored in the database (see CPU_ARCHITECTURES); also the page anchor. */
  arch: string;
  /** Full name of the architecture. */
  name: string;
  /** Other names the architecture goes by (Mach-O / `lipo` / `file` output). */
  aliases: string[];
  /** The Macs and macOS releases that used it. */
  history: string;
  /** What it means for running the app under Darling. */
  darling: string;
}

/**
 * Every CPU architecture a macOS app may be built for. Keys must match
 * CPU_ARCHITECTURES, in the same order.
 */
export const CPU_ARCHITECTURE_INFO: CpuArchitectureInfo[] = [
  {
    arch: 'x86-64',
    name: '64-bit Intel',
    aliases: ['x86_64', 'x86_64h', 'amd64'],
    history: 'Used by Intel Macs from 2006 until the switch to Apple silicon. Since macOS 10.15 Catalina, this (or arm64) is the only architecture Intel Macs can run.',
    darling: 'The native architecture of Darling. Most reports are for x86-64 apps.'
  },
  {
    arch: 'i386',
    name: '32-bit Intel',
    aliases: ['i386', 'x86', 'IA-32'],
    history: 'Used by the first Intel Macs (2006) and by many apps up to macOS 10.14 Mojave, the last release that runs 32-bit apps.',
    darling: 'Supported. Darling needs vm.mmap_min_addr set to 4096 or lower to run 32-bit apps (sudo sysctl vm.mmap_min_addr=4096).'
  },
  {
    arch: 'arm64',
    name: 'Apple silicon (64-bit ARM)',
    aliases: ['arm64', 'arm64e', 'AArch64'],
    history: 'Used by Apple silicon Macs (M1 and later) since 2020, starting with macOS 11 Big Sur.',
    darling: 'An app built only for arm64 needs an ARM host. Universal apps that also contain x86-64 code run as x86-64.'
  },
  {
    arch: 'ppc',
    name: 'PowerPC',
    aliases: ['ppc', 'ppc7400', 'ppc64'],
    history: 'Used by Macs before the switch to Intel in 2006, up to Mac OS X 10.5 Leopard. Intel Macs ran PowerPC apps through Rosetta until Mac OS X 10.6 Snow Leopard.',
    darling: 'Darling can\'t run PowerPC code. Listed so that the database can record which apps are PowerPC-only.'
  },
];

@Component({
  selector: 'app-cpu-architectures',
  templateUrl: './cpu-architectures.component.html',
  styleUrls: ['./cpu-architectures.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class CpuArchitecturesComponent {
  readonly architectures = CPU_ARCHITECTURE_INFO;
}
