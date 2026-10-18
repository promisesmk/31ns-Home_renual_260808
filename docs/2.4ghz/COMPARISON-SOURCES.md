# 2.4GHz 페이지 — 벤더별 대표 칩 비교 근거

- 확인일: 2026-10-15 (모든 값은 이 날짜에 제조사 공식 제품 페이지 · 데이터시트에서 확인)
- 적용: `2.4ghz.html`, `en/2.4ghz.html`의 `#vendor-matrix` 벤더 카드 → “비교하기” 패널(`vp-<벤더>`). 한 · 영은 같은 데이터에서 생성되어 모델 · 수치 · 링크가 같습니다.
- 구성 원칙: 벤더마다 SoC 4~5종(모듈 제외), 메모리 · 패키지 변형만으로 개수를 채우지 않음, 벤더 간 혼합 표 없음.
- 제외: 가격 · 재고 · 납기 · 소비전류. 확인하지 못한 값은 “공식 자료 확인 필요”로 표기.
- 공급 상태는 제조사가 명시한 표현만 옮김. 표기가 없으면 “제품 페이지에 공급 상태 표기 없음”. 데이터시트 존재만으로 양산이라 쓰지 않음(Espressif는 문서 정책상 v1.0 이상 = 양산 제품용 공식 문서).

## 이전 구성에서 바뀐 점

- 벤더 카드 아래의 타사 혼합 “대표 칩 · 모듈 비교” 표(5종)와 관련 주석을 삭제하고, 벤더별 패널로 대체.
- 이전 표의 모듈(ESP32-C6-WROOM-1, BGM220PC22HNA)은 SoC 비교 원칙에 따라 제외.

## Nordic Semiconductor

- 패널 주석: 프로토콜별 지원은 nRF Connect SDK 버전에서 확인하세요. nRF54H20 · nRF5340 · nRF52840은 제품 페이지에 공급 상태가 표기되지 않아 구매 전 제조사 확인이 필요합니다.

| 모델 | MCU / 클록 | 메모리 | 최대 송신 출력 | 패키지 | 상태 | 출처 |
|---|---|---|---|---|---|---|
| nRF54LM20A | Arm Cortex-M33 128MHz + RISC-V 코프로세서 128MHz | NVM 2MB · RAM 512KB (칩 내장) | +8 dBm (CSP) · +7 dBm (QFN) | CSP98 3.67 × 3.85mm · CSP61 3.02 × 2.43mm · QFN52 6 × 6mm | CSP98 양산 · CSP61 · QFN52 초기 샘플 (Nordic 표기) | [제품 페이지](https://www.nordicsemi.com/Products/nRF54LM20A) |
| nRF54L15 | Arm Cortex-M33 128MHz + RISC-V 코프로세서 128MHz | NVM 1.5MB · RAM 256KB (칩 내장) | +8 dBm (CSP) · +7 dBm (QFN) | CSP47 2.45 × 2.25mm · QFN52 · QFN48 6 × 6mm · QFN40 5 × 5mm | CSP47 · QFN52 · QFN48 양산 · QFN40 초기 샘플 (Nordic 표기) | [제품 페이지](https://www.nordicsemi.com/Products/nRF54L15) |
| nRF54H20 | Arm Cortex-M33 복수(최대 320MHz) + RISC-V 코프로세서 | NVM 2MB · RAM 1MB (칩 내장) | +10 dBm | 공식 자료 확인 필요 | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.nordicsemi.com/Products/nRF54H20) |
| nRF5340 | 애플리케이션 Cortex-M33 128 / 64MHz + 네트워크 Cortex-M33 64MHz | 플래시 1MB + 256KB · RAM 512KB + 64KB (코어별, 칩 내장) | +3 dBm (설정 범위 +3 ~ −20 dBm) | aQFN94 7 × 7mm · WLCSP95 4.4 × 4.0mm | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.nordicsemi.com/Products/nRF5340) · [제품 브리프 v2.2](https://www.nordicsemi.com/-/media/Software-and-other-downloads/Product-Briefs/nRF5340-SoC-PB.pdf) |
| nRF52840 | Arm Cortex-M4F 64MHz | 플래시 1MB · RAM 256KB (칩 내장) | +8 dBm | aQFN73 7 × 7mm · QFN48 6 × 6mm · WLCSP 3.5 × 3.6mm | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.nordicsemi.com/Products/nRF52840) |

## Texas Instruments (TI)

- 패널 주석: Zigbee · Thread는 TI SDK(SimpleLink Low Power F3 SDK · TI OpenThread 등)별 지원 조건을 확인하세요.

| 모델 | MCU / 클록 | 메모리 | 최대 송신 출력 | 패키지 | 상태 | 출처 |
|---|---|---|---|---|---|---|
| CC2340R5 | Arm Cortex-M0+ 48MHz | 플래시 512KB · SRAM 36KB(R52) / 64KB(R53) | +8 dBm | QFN24 4 × 4mm · QFN40 5 × 5mm · WCSP 2.2 × 2.6mm(R53) | ACTIVE (TI 표기) | [제품 페이지](https://www.ti.com/product/CC2340R5) · [데이터시트 SWRS272F](https://www.ti.com/lit/ds/symlink/cc2340r5.pdf) |
| CC2745R10-Q1 | Arm Cortex-M33 96MHz + 알고리즘 처리 장치(APU) 96MHz | 플래시 최대 1MB · SRAM 최대 162KB | +10 dBm (R 변형) · P 변형은 +20 dBm | QFN40 6 × 6mm (wettable flank) | ACTIVE (TI 표기) | [제품 페이지](https://www.ti.com/product/CC2745R10-Q1) · [데이터시트 SWRS304D](https://www.ti.com/lit/ds/symlink/cc2745r10-q1.pdf) |
| CC2674R10 | Arm Cortex-M33 48MHz | 플래시 1024KB · SRAM 256KB (+ 캐시 8KB) | +5 dBm (데이터시트 최대 출력) | VQFN48 7 × 7mm · VQFN64 8 × 8mm | ACTIVE (TI 표기) | [제품 페이지](https://www.ti.com/product/CC2674R10) · [데이터시트 SWRS268B](https://www.ti.com/lit/ds/symlink/cc2674r10.pdf) |
| CC2652P7 | Arm Cortex-M4F 48MHz | 플래시 704KB · SRAM 144KB (+ 캐시 8KB) | +20 dBm (PA 내장) | VQFN48 7 × 7mm | ACTIVE (TI 표기) | [제품 페이지](https://www.ti.com/product/CC2652P7) |

## Silicon Labs

- 패널 주석: 메모리 · 송신 출력은 부품 번호(OPN)별로 다르고, 프로토콜 지원은 Silicon Labs SDK 버전에서 확인하세요.

| 모델 | MCU / 클록 | 메모리 | 최대 송신 출력 | 패키지 | 상태 | 출처 |
|---|---|---|---|---|---|---|
| EFR32BG22 | Arm Cortex-M33 76.8MHz | 플래시 최대 512KB · RAM 최대 32KB | +6 dBm | QFN40 5 × 5mm · QFN32 4 × 4mm · TQFN32 4 × 4 × 0.3mm | 제품 페이지에 별도 공급 상태 표기 없음 | [제품 페이지](https://www.silabs.com/wireless/bluetooth/efr32bg22-series-2-socs) |
| EFR32BG27 | Arm Cortex-M33 76.8MHz | 플래시 최대 768KB · RAM 최대 64KB | +8 dBm | WLCSP39 2.3 × 2.6mm · QFN32 4 × 4mm · QFN40 5 × 5mm | 제품 페이지에 별도 공급 상태 표기 없음 | [제품 페이지](https://www.silabs.com/wireless/bluetooth/efr32bg27-series-2-socs) |
| EFR32MG21 | Arm Cortex-M33 80MHz | 플래시 512 ~ 1024KB · RAM 64 ~ 96KB (부품 번호별) | +20 dBm 또는 +10 dBm (부품 번호별) | QFN32 4 × 4mm | 제품 페이지에 별도 공급 상태 표기 없음 | [제품 페이지](https://www.silabs.com/wireless/zigbee/efr32mg21-series-2-socs) |
| EFR32MG24 | Arm Cortex-M33 78MHz | 플래시 1024 / 1536KB · RAM 128 ~ 256KB (부품 번호별) | +19.5 dBm 또는 +10 dBm (부품 번호별) · Channel Sounding은 +10 dBm | QFN40 5 × 5mm · QFN48 6 × 6mm | 제품 페이지에 별도 공급 상태 표기 없음 | [데이터시트 Rev 1.2](https://www.silabs.com/documents/public/data-sheets/efr32mg24-datasheet.pdf) |
| EFR32MG26 | Arm Cortex-M33 78MHz | 플래시 최대 3200KB · RAM 최대 512KB | +19.5 dBm | QFN48 6 × 6mm · QFN68 8 × 8mm · BGA136 7 × 7mm | 제품 페이지에 별도 공급 상태 표기 없음 | [제품 페이지](https://www.silabs.com/wireless/zigbee/efr32mg26-series-2-socs) |

## Espressif Systems

- 패널 주석: 칩(SoC) 기준이며 모듈 사양과 다릅니다. Wi-Fi 출력은 802.11b 1Mbps 대표값, BLE · 802.15.4는 송신 출력 설정 범위의 최댓값입니다. 프로토콜 지원은 ESP-IDF 버전에서 확인하세요.

| 모델 | MCU / 클록 | 메모리 | 최대 송신 출력 | 패키지 | 상태 | 출처 |
|---|---|---|---|---|---|---|
| ESP32-C6 | RISC-V HP 160MHz + LP 20MHz | HP SRAM 512KB + LP SRAM 16KB · 플래시: 패키지 내장 4 / 8MB(QFN32) 또는 외장 | Wi-Fi 21 dBm(대표값) · BLE · 802.15.4 최대 +20 dBm | QFN40 5 × 5mm · QFN32 5 × 5mm | 데이터시트 v1.5 정식판 (Espressif 기준: 양산 제품 문서) | [데이터시트 v1.5](https://documentation.espressif.com/esp32-c6_datasheet_en.pdf) |
| ESP32-H2 | RISC-V 96MHz | SRAM 320KB · 패키지 내장 플래시 2 / 4MB | BLE · 802.15.4 최대 +20 dBm | QFN32 4 × 4mm | 데이터시트 v1.3 정식판 (Espressif 기준: 양산 제품 문서) | [데이터시트 v1.3](https://documentation.espressif.com/esp32-h2_datasheet_en.pdf) |
| ESP32-C5 | RISC-V HP 240MHz + LP 48MHz | HP SRAM 384KB + LP SRAM 16KB · 플래시 · PSRAM: 패키지 내장 변형 또는 외장 | Wi-Fi 2.4GHz 20 dBm(대표값) · BLE · 802.15.4 최대 +20 dBm | QFN48 6 × 6mm · LGA48 6 × 6mm | 데이터시트 v1.5 정식판 (Espressif 기준: 양산 제품 문서) | [데이터시트 v1.5](https://documentation.espressif.com/esp32-c5_datasheet_en.pdf) |
| ESP32-C3 | RISC-V 160MHz | SRAM 400KB(캐시 16KB 포함) · 플래시: 패키지 내장 4 / 8MB 변형 또는 외장 | Wi-Fi 21 dBm(대표값) · BLE 최대 +20 dBm | QFN32 5 × 5mm | 데이터시트 v2.4 정식판 · ESP32-C3FN4 단종(EOL) · ESP32-C3FH4AZ 신규 설계 비권장(NRND) | [데이터시트 v2.4](https://documentation.espressif.com/esp32-c3_datasheet_en.pdf) |
| ESP32-S3 | Xtensa LX7 듀얼코어 240MHz | SRAM 512KB · 플래시 · PSRAM: 패키지 내장 변형 또는 외장 | Wi-Fi 21 dBm(대표값) · BLE 최대 +20 dBm | QFN56 7 × 7mm | 데이터시트 v2.2 정식판 · ESP32-S3R8V · ESP32-S3R2 단종(EOL) | [데이터시트 v2.2](https://documentation.espressif.com/esp32-s3_datasheet_en.pdf) |

## NXP Semiconductors

- 패널 주석: 무선부(라디오 코어) 전용 메모리는 애플리케이션 메모리와 별도로 표기했습니다. 프로토콜 지원은 MCUXpresso SDK 버전에서 확인하세요.

| 모델 | MCU / 클록 | 메모리 | 최대 송신 출력 | 패키지 | 상태 | 출처 |
|---|---|---|---|---|---|---|
| KW45 | Arm Cortex-M33 96MHz + 무선 전용 Cortex-M3 | 플래시 1MB · SRAM 128KB (무선부 별도 플래시 256KB · SRAM 88KB) | +10 dBm | HVQFN40 6 × 6mm · HVQFN48 7 × 7mm (wettable flank) | Active (NXP 표기) | [제품 페이지](https://www.nxp.com/products/KW45) |
| KW47 | Arm Cortex-M33 96MHz + 무선 전용 Cortex-M33 64MHz | 플래시 최대 2MB · SRAM 264KB (무선부 별도 플래시 512KB · SRAM 171KB) | +10 dBm | HVQFN48 7 × 7mm (wettable flank) | Active (NXP 표기) | [제품 페이지](https://www.nxp.com/products/KW47) |
| MCX W71 | Arm Cortex-M33 96MHz + 무선 전용 Cortex-M3 | 플래시 1MB · SRAM 128KB (무선부 별도 플래시 256KB · SRAM 88KB) | +10 dBm | QFN48 7 × 7mm · QFN40 6 × 6mm | Active (NXP 표기) | [제품 페이지](https://www.nxp.com/products/MCX-W71X) |
| MCX W72 | Arm Cortex-M33 96MHz + 무선 전용 Cortex-M33 | 플래시 2MB · SRAM 264KB | +10 dBm | QFN48 7 × 7mm | Active (NXP 표기) | [제품 페이지](https://www.nxp.com/products/MCX-W72X) |
| RW612 | Arm Cortex-M33 260MHz | SRAM 1.2MB(칩 내장) · 플래시 외장(FlexSPI, 최대 128MB) | Wi-Fi 최대 +21 dBm(제품 페이지) / +23 dBm(데이터시트 Rev 9.0) · BLE · 802.15.4 최대 +15 dBm | RW61x 계열: HVQFN116 9 × 9mm · TFBGA145 8 × 8mm (부품 번호별) | Active (NXP 표기, A2 부품 번호) | [제품 페이지](https://www.nxp.com/products/RW612) · [데이터시트 Rev 9.0](https://www.nxp.com/docs/en/data-sheet/RW612.pdf) · [팩트시트](https://www.nxp.com/docs/en/fact-sheet/RW61XFS.pdf) |

## Telink Semiconductor

- 패널 주석: 클록 · 최대 송신 출력 · 공급 상태는 Telink 제품 페이지에 표기되지 않아 데이터시트 · 제조사 확인이 필요합니다. 무선 방식은 시리즈 소개 기준이며 SDK별 지원을 확인하세요.

| 모델 | MCU / 클록 | 메모리 | 최대 송신 출력 | 패키지 | 상태 | 출처 |
|---|---|---|---|---|---|---|
| TL7218 | RISC-V 32-bit · 클록은 공식 자료 확인 필요 | 플래시 2MB · SRAM 512KB | 공식 자료 확인 필요 | QFN68 8 × 8mm · QFN38 4 × 4mm · BGA94 4 × 6mm · BGA56 3.4 × 3mm | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.telink-semi.com/products/bluetooth-le/tl721x) |
| TL3218 | RISC-V 32-bit · 클록은 공식 자료 확인 필요 | 플래시 1MB · SRAM 128KB | 공식 자료 확인 필요 | QFN52 6 × 6mm · LGA42 2.7 × 2.5mm · QFN32 4 × 4mm · QFN28 3.5 × 3.5mm | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.telink-semi.com/products/bluetooth-le/tl321x) |
| TLSR9218A | RISC-V 32-bit · 클록은 공식 자료 확인 필요 | 플래시 1MB · SRAM 256KB | 공식 자료 확인 필요 | QFN48 6 × 6mm | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.telink-semi.com/products/bluetooth-le/tlsr921x) |
| TLSR8278 | T-MCU 32-bit · 클록은 공식 자료 확인 필요 | 플래시 1MB · SRAM 64KB | 공식 자료 확인 필요 | QFN48 7 × 7mm (TLSR8278F1KET48) | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.telink-semi.com/products/bluetooth-le/tlsr827x) |
| TLSR8258 | T-MCU 32-bit · 클록은 공식 자료 확인 필요 | 플래시 512KB / 1MB · SRAM 64KB (부품 번호별) | 공식 자료 확인 필요 | QFN32 5 × 5mm · TQFN48 · QFN48 7 × 7mm | 제품 페이지에 공급 상태 표기 없음 | [제품 페이지](https://www.telink-semi.com/products/bluetooth-le/tlsr825x) |

## 확인 메모

- Nordic: nRF54L15 · nRF54LM20A의 패키지별 상태는 제품 페이지 nRF54L 시리즈 표(“Mass production / Early sampling”). nRF54H20 패키지 치수와 nRF54H20 · nRF5340 · nRF52840 상태는 제품 페이지에 없음. nRF5340 송신 출력은 제품 브리프 v2.2.
- TI: 상태는 제품 페이지 “ACTIVE”. CC2674R10 최대 출력 5 dBm은 데이터시트 SWRS268B 표(제품 페이지에는 표기 없음). CC2745R10-Q1 데이터시트 SWRS304D(2025-11 개정).
- Silicon Labs: 자동 요청 차단이 있어 일반 브라우저로 시리즈 페이지 확인. 제품 페이지에 수명 주기 표기가 없음. EFR32MG24는 데이터시트 Rev 1.2(2024-10) 주문 정보 표 기준.
- Espressif: 칩 데이터시트 기준(모듈 아님). 송신 출력 설정 범위의 최솟값은 문서 추출 과정에서 부호가 손상될 수 있어 최댓값만 표기. ESP32-C3 · S3의 EOL · NRND 변형은 데이터시트 표지 표기.
- NXP: 상태는 제품 페이지 “Active”. RW612 Wi-Fi 출력은 제품 페이지(+21 dBm)와 데이터시트 Rev 9.0(+23 dBm)이 달라 둘 다 표기. 패키지는 RW61x 팩트시트(계열 기준). RW612HN/A0 · A1 주문 코드는 생산 중단 표시, A2 Active.
- Telink: 제품 페이지 선택 표(블루투스 버전 · MCU · SRAM · 플래시 · 패키지)만 사용. 클록 · 송신 출력 · 상태는 제품 페이지에 없고, 데이터시트 위키(wiki.telink-semi.cn)는 확인 당시 보안 인증서가 만료되어 열지 않음 → “공식 자료 확인 필요”. TL321x의 Bluetooth 버전은 영문 제품 페이지와 중문 제품 페이지(Zigbee · 저전력 블루투스 분류 모두)가 같은 부품 번호(TL3218BE10T52R 등)에 대해 6.1로 표기함을 2026-10-15에 직접 확인(이전 보고의 “중문 5.4”는 검색 요약에서 온 확인되지 않은 정보였음).

## 다시 확인할 때

- 모델 · 값을 바꾸면 한 · 영 페이지를 함께 수정하고 이 문서와 패널의 확인일을 갱신합니다.
