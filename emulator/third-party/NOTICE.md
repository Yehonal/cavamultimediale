# Third-party runtime notices

This directory accompanies the browser emulator runtime. The firmware and emulator are distributed separately from any guest operating system or application disk.

## Components in the distributed files

| Component | Distributed file | Version and source | License files |
|---|---|---|---|
| v86 | `libv86.mjs`, `v86.wasm`, `v86-fallback.wasm` | npm `v86@0.5.476`; package version `0.5.476+g9457e7a`; source commit `9457e7a2f6890f3133bb6ac0f749e588f63c4c36` | `licenses/LICENSE-v86-BSD-2-Clause.txt` |
| QEMU-derived floppy controller code | Included in `libv86.mjs` | `src/floppy.js` in the same v86 commit | `licenses/LICENSE-QEMU-floppy-MIT.txt`, together with the v86 BSD license |
| Berkeley SoftFloat | Included in both WASM files | Release 3e, by John R. Hauser; exact amalgamation in v86 `lib/softfloat/softfloat.c` | `licenses/LICENSE-SoftFloat-3e-BSD-3-Clause.txt` |
| Zstandard, including embedded FSE/HUF and xxHash code | Included in both WASM files | Zstandard 1.4.5; exact amalgamation in v86 `lib/zstd/zstddeclib.c` | `licenses/LICENSE-zstd-BSD-3-Clause.txt`, `licenses/NOTICE-zstd-FSE-HUF-xxHash.txt` |
| SeaBIOS | `seabios.bin` | `rel-1.16.2`, commit `ea1b7a0733906b8425d948ae94fba63c32b1d425` | `licenses/LICENSE-SeaBIOS-LGPL-3.0.txt` and `licenses/LICENSE-SeaBIOS-GPL-3.0.txt` |
| SeaVGABIOS | `vgabios.bin` | SeaBIOS subproject, same release and source commit; Bochs VGA configuration | The same SeaBIOS license files, plus `licenses/NOTICE-SeaVGABIOS-and-fonts.txt` |

The BSD license alternative is selected for Zstandard and its embedded FSE/HUF/xxHash sources. Their original copyright and license notices are retained. SoftFloat's original distinct notice blocks are retained without changing their terms; repeated identical blocks were removed and line endings normalized. SeaVGABIOS's source identifies its embedded individual fonts as public domain; that original notice is retained.

## Pinned source and license URLs

- [v86 source](https://github.com/copy/v86/tree/9457e7a2f6890f3133bb6ac0f749e588f63c4c36), [source archive](https://github.com/copy/v86/archive/9457e7a2f6890f3133bb6ac0f749e588f63c4c36.tar.gz), [npm runtime tarball](https://registry.npmjs.org/v86/-/v86-0.5.476.tgz).
- [v86 BSD license](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/LICENSE).
- [QEMU floppy MIT license](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/LICENSE.MIT).
- [SoftFloat original notices and source](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/lib/softfloat/softfloat.c).
- [Exact Zstandard amalgamation and embedded notices](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/lib/zstd/zstddeclib.c).
- [Zstandard 1.4.5 BSD license](https://raw.githubusercontent.com/meta/zstd/b706286adbba780006a47ef92df0ad7a785666b6/LICENSE). The `v1.4.5` release resolves to `b706286adbba780006a47ef92df0ad7a785666b6`; the repository previously used the `facebook/zstd` name.
- [SeaBIOS and SeaVGABIOS source](https://github.com/coreboot/seabios/tree/ea1b7a0733906b8425d948ae94fba63c32b1d425), [complete source archive](https://github.com/coreboot/seabios/archive/ea1b7a0733906b8425d948ae94fba63c32b1d425.tar.gz).
- [SeaBIOS LGPLv3](https://raw.githubusercontent.com/coreboot/seabios/ea1b7a0733906b8425d948ae94fba63c32b1d425/COPYING.LESSER) and [GPLv3 incorporated by LGPLv3](https://raw.githubusercontent.com/coreboot/seabios/ea1b7a0733906b8425d948ae94fba63c32b1d425/COPYING).
- [Original firmware build script](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/bios/fetch-and-build-seabios.sh), [firmware build configuration](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/bios/seabios.config), [debug configuration referenced by that script](https://raw.githubusercontent.com/copy/v86/9457e7a2f6890f3133bb6ac0f749e588f63c4c36/bios/seabios-debug.config).

## Firmware source access and replacement

The complete corresponding firmware source is available from the SeaBIOS archive linked above. Its v86 build configuration and original build script are included in `licenses/SeaBIOS-build-config.txt` and `licenses/SeaBIOS-build-script.sh`; the debug configuration referenced by the original script is included as `licenses/SeaBIOS-debug-build-config.txt`. The ordinary firmware build uses `seabios.config` as the SeaBIOS `.config`, then `make`; its outputs are `out/bios.bin` and `out/vgabios.bin`.

For distribution, retain both GPL and LGPL texts and this clear source-access information beside the firmware downloads. The firmware is loaded as separate files and may be replaced with compatible modified builds. The license texts govern redistribution; this notice does not replace their conditions.

## Firmware provenance

Both binaries are copied unchanged from the pinned v86 `bios/` directory. `seabios.bin` contains the version string `rel-1.16.2-0-gea1b7a0`, matching the source pin and build script.

| File | Bytes | SHA-256 |
|---|---:|---|
| `seabios.bin` | 131072 | `73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98` |
| `vgabios.bin` | 36352 | `a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880` |

## Packaging

Copy this `NOTICE.md` to `dist/vendor/NOTICE.md` and the whole `licenses/` directory to `dist/vendor/licenses/`, preserving the relative links. Keep a visible credits/source link to this notice from the emulator page. The original texts were fetched from the pinned sources above; `licenses/SHA256SUMS.txt` records the supplied notice-file hashes.

Applicability was checked against the npm package and the pinned v86 Makefile: the browser bundle includes the floppy implementation, and both WASM variants link SoftFloat and Zstandard. The v86 test suites and their separate licenses are not part of these runtime artifacts.
