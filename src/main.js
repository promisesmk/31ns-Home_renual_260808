// ═════════════════════════════════════════════════════════════════
// SPINX DIGITAL ULTRA-LUXE INTERACTIVE JS FOR 31NS-TECH HARDWARE LAB
// ═════════════════════════════════════════════════════════════════

import { ThreeRobot } from './components/ThreeRobot.js';

// 50 RF Engineering Q&A Database (KO & EN)

const rfFaqData = [
  {
    "q_ko": "2.4GHz 대역에서 와이파이와 블루투스 혼선(Coexistence)을 방지하려면 어떻게 하드웨어를 설계해야 하나요?",
    "q_en": "How should the hardware be designed to prevent coexistence interference between Wi-Fi and Bluetooth in the 2.4GHz band?",
    "a_ko": "대역 통과 필터(BPF)를 적용하여 대역 외 노이즈를 차단하고, 두 안테나 간의 물리적 이격 거리를 최대한 확보하며 안테나의 편파(Polarization)를 직교로 배치하는 것이 유리합니다.",
    "a_en": "Apply a Band Pass Filter (BPF) to block out-of-band noise, maximize the physical separation distance between the two antennas, and arrange the antenna polarizations orthogonally to achieve maximum isolation."
  },
  {
    "q_ko": "공간이 극도로 협소한 초소형 센서 보드에서 안테나 이득(Gain)을 최대한 높이는 방법은 무엇인가요?",
    "q_en": "How can antenna gain be maximized in an extremely space-constrained micro sensor board?",
    "a_ko": "칩 안테나 사용 시 데이터시트의 권장 클리어런스(Clearance) 영역을 반드시 엄수하고, PCB 공간이 부족할 경우 기구물 내벽의 입체적인 형태를 활용한 FPCB 커스텀 안테나 설계를 적용합니다.",
    "a_en": "When using a chip antenna, strictly adhere to the manufacturer's recommended keep-out/clearance area. If PCB space is insufficient, implement a custom FPCB antenna design mapped to the 3D inner walls of the enclosure."
  },
  {
    "q_ko": "PCB 패턴 안테나 설계 시 50옴(Ohm) 임피던스 매칭은 어떤 절차로 진행하나요?",
    "q_en": "What is the procedure for 50-ohm impedance matching when designing a PCB pattern antenna?",
    "a_ko": "VNA(벡터 네트워크 분석기)를 통해 안테나 단의 스미스 차트를 분석하고, 파이(Pi) 또는 티(T) 형태의 매칭 네트워크에 적절한 인덕터와 커패시터 값을 대입하여 50옴에 수렴하도록 튜닝합니다.",
    "a_en": "Analyze the antenna terminal's reflection coefficient (S11) on a Smith chart using a Vector Network Analyzer (VNA). Then, calculate and tune the inductor and capacitor values in a Pi or T matching network to converge on 50 ohms."
  },
  {
    "q_ko": "메탈(금속) 케이스 내부에 2.4GHz 안테나를 배치할 때 통신 거리를 확보하는 방법이 있나요?",
    "q_en": "Is there a way to secure wireless communication range when placing a 2.4GHz antenna inside a metallic enclosure?",
    "a_ko": "완전 밀폐된 금속 케이스는 전파를 차단하므로 케이스 자체를 슬롯 안테나로 활용하도록 설계하거나, RF 신호가 투과할 수 있는 비금속 소재의 윈도우(RF Window) 구조를 반드시 기구에 반영해야 합니다.",
    "a_en": "Since a fully sealed metal case acts as a Faraday cage blocking RF signals, you must either design slots into the enclosure to act as a slot antenna, or integrate a non-metallic 'RF Window' material into the mechanical structure."
  },
  {
    "q_ko": "전원부(SMPS) 스위칭 노이즈가 2.4GHz RF 수신 감도(RSSI)에 미치는 영향을 최소화하는 레이아웃 팁은?",
    "q_en": "What layout tips minimize SMPS switching noise interference on 2.4GHz RF receiver sensitivity (RSSI)?",
    "a_ko": "RF 단과 전원 단의 GND 영역을 분할한 뒤 페라이트 비드를 통해 한 점에서 연결하고, 디커플링 커패시터를 RF IC 전원 핀에 최대한 가깝게 배치하여 고주파 노이즈 유입을 차단합니다.",
    "a_en": "Isolate the RF ground plane from the power supply ground plane, connecting them at a single point via a ferrite bead. Place decoupling capacitors as close to the RF IC power pins as possible to filter high-frequency switching ripples."
  },
  {
    "q_ko": "GND(그라운드) 면적이 부족한 초소형 PCB에서 RF 접지 성능을 끌어올리는 방법은 무엇인가요?",
    "q_en": "How can RF grounding performance be improved on a compact PCB with limited ground area?",
    "a_ko": "4층 이상의 멀티 레이어 기판을 사용하여 내층 전체를 솔리드 그라운드(Solid Ground)로 할당하고, 신호선 주변에 수많은 비아(Via Shielding)를 뚫어 그라운드 임피던스를 극도로 낮춰야 합니다.",
    "a_en": "Use a 4+ layer PCB design, allocating an entire inner layer as a solid ground plane. Implement dense stitch vias (via shielding) along high-frequency trace margins to minimize ground loop impedance."
  },
  {
    "q_ko": "2.4GHz 무선 제품 테스트 시 실제 사용 환경과 무반사실(Anechoic Chamber) 측정값 차이를 줄이려면 어떻게 해야 하나요?",
    "q_en": "How do you reconcile differences between anechoic chamber measurements and real-world environment RF performance?",
    "a_ko": "제품이 인체에 부착되거나 특정 기구물에 매립되는 경우 해당 물체의 유전율을 고려해야 하므로, 실제 환경과 유사한 팬텀(Phantom)이나 조립 지그를 결합한 상태에서 최종 RF 튜닝을 진행합니다.",
    "a_en": "To account for the permittivity of adjacent objects (such as the human body or specific casings), perform the final RF tuning with a simulated phantom or assembly fixture mimicking the actual deployment environment."
  },
  {
    "q_ko": "안테나 주변의 플라스틱 기구물이 2.4GHz 주파수 공진점(Resonance Frequency) 변경에 미치는 영향은 무엇인가요?",
    "q_en": "What effect does a plastic casing near the antenna have on the 2.4GHz resonant frequency?",
    "a_ko": "플라스틱의 유전율로 인해 전파 속도가 느려져 안테나의 공진 주파수가 보통 낮은 대역(Low Shift)으로 이동하므로, 초기 베어보드 상태 튜닝 시 주파수를 타겟보다 살짝 높게 설정해야 합니다.",
    "a_en": "The dielectric permittivity of plastic reduces propagation velocity, shifting the antenna's resonant frequency lower (Low Shift). Compensate for this during bare-board tuning by offsetting the frequency target slightly higher."
  },
  {
    "q_ko": "초소형 폼팩터 기기에서는 Chip 안테나와 FPCB 안테나 중 어떤 것이 설계에 유리한가요?",
    "q_en": "For a micro form-factor device, is a ceramic chip antenna or an FPCB antenna more advantageous?",
    "a_ko": "PCB 상의 클리어런스 확보조차 어렵다면 유연하게 기구물 내벽에 부착할 수 있는 FPCB 안테나가 통신 거리 확보에 유리하며, 조립 공정의 단일화와 단가를 중시한다면 칩 안테나가 적합합니다.",
    "a_en": "If PCB clearance space is severely restricted, a flexible FPCB antenna adhered to the enclosure's inner walls offers superior range. If automated SMT assembly and bill-of-materials unit cost are prioritized, a chip antenna is ideal."
  },
  {
    "q_ko": "2.4GHz RF 회로에 실드캔(Shield Can)을 씌울 때 수신 감도에 미치는 득과 실은 무엇인가요?",
    "q_en": "What are the pros and cons of using an RF shield can on transceiver sensitivity?",
    "a_ko": "외부 노이즈 차단 및 EMI 방사 억제에는 탁월하지만, 실드캔 내부의 금속면과 발생하는 기생 커패시턴스로 인해 매칭값이 틀어질 수 있으므로 반드시 캔을 덮은 최종 상태에서 재튜닝해야 합니다.",
    "a_en": "Pros include blocking external electromagnetic interference (EMI) and reducing radiation leakage. The con is parasitic capacitance introduced between the shield can metal walls and circuit components. Always perform final antenna matching with the shield can attached."
  },
  {
    "q_ko": "Nordic nRF52 시리즈를 활용한 커스텀 보드 설계 시 반드시 확인해야 할 하드웨어 체크리스트는 무엇인가요?",
    "q_en": "What hardware design checklist must be verified when designing custom PCBs with the Nordic nRF52 series?",
    "a_ko": "Nordic 데이터시트의 레퍼런스 라우팅 준수 여부, 32MHz 및 32.768kHz 크리스탈 주변의 기생 커패시턴스, 그리고 DC-DC 변환용 인덕터 배치를 최우선으로 점검합니다.",
    "a_en": "Verify adherence to Nordic's reference layout routing, match load capacitors to crystal specifications (32MHz and 32.768kHz) accounting for trace parasitics, and ensure correct placement/isolation of DC-DC converter inductors."
  },
  {
    "q_ko": "BLE 기기 간 연결 끊김(Connection Drop)이 잦을 때 RF 하드웨어 단에서 먼저 의심해야 할 부분은?",
    "q_en": "When BLE connection drops are frequent, what RF hardware parameters should be investigated first?",
    "a_ko": "32.768kHz RTC 크리스탈의 허용 오차(ppm) 틀어짐으로 인한 통신 타이밍 불일치를 점검하고, 안테나 매칭 불량으로 인한 수신 감도 한계점 도달 여부를 확인해야 합니다.",
    "a_en": "Inspect the frequency tolerance (ppm) of the 32.768kHz RTC crystal to prevent sleep-wake timing drifts, and verify if antenna return loss is causing the signal strength to dip below the link-budget threshold."
  },
  {
    "q_ko": "Nordic 칩셋이 저전력 모드(Sleep Mode)에 진입했는데도 배터리 소모량이 예상보다 높은 원인은 무엇인가요?",
    "q_en": "Why is the sleep mode current consumption of a Nordic SoC higher than specified in the datasheet?",
    "a_ko": "사용하지 않는 GPIO 핀이 플로팅(Floating) 상태로 방치되어 누설 전류가 발생했거나, 내부 DC-DC 컨버터 대신 효율이 낮은 LDO 모드가 활성화되어 있는지 펌웨어 레지스터를 확인합니다.",
    "a_en": "Unused GPIO pins left in a floating state cause leakage current. Additionally, check firmware configuration to ensure the internal DC-DC converter is enabled rather than defaulting to the less efficient LDO mode."
  },
  {
    "q_ko": "BLE 통신 거리(Range)를 기존 대비 2배 이상 연장하기 위한 하드웨어 튜닝 기법은 무엇이 있나요?",
    "q_en": "What hardware and firmware tuning techniques extend BLE communication range by 2x or more?",
    "a_ko": "정밀한 RF 매칭 회로 최적화를 기본으로, 하드웨어에 별도의 FEM(PA/LNA 증폭기) 칩을 추가하거나 Nordic 칩셋이 지원하는 Coded PHY(Long Range) 모드를 소프트웨어적으로 활성화합니다.",
    "a_en": "Alongside precise impedance matching, integrate a Front-End Module (FEM) containing a Power Amplifier (PA) and Low Noise Amplifier (LNA), or configure the SoC to use BLE Long Range (Coded PHY) mode."
  },
  {
    "q_ko": "nRF52840을 사용한 무선 센서 보드에서 데이터 처리량(Throughput)을 최대화하는 설정법은?",
    "q_en": "How do you maximize data throughput on a wireless sensor board using the nRF52840?",
    "a_ko": "MTU(Maximum Transmission Unit) 페이로드 크기를 늘리고, Connection Interval을 최소 허용치로 단축하며, DLE(Data Length Extension) 기능을 켜서 패킷 전송 효율을 극대화합니다.",
    "a_en": "Maximize the ATT MTU (Maximum Transmission Unit) payload, minimize the connection interval within peripheral tolerance, and enable Data Length Extension (DLE) to minimize packet overhead."
  },
  {
    "q_ko": "노르딕 칩셋 내장 DC-DC 컨버터 사용 시 발생하는 노이즈가 RF 송수신에 미치는 영향은?",
    "q_en": "What impact does noise from the Nordic SoC's internal DC-DC converter have on RF performance?",
    "a_ko": "인덕터 주변의 스위칭 노이즈가 안테나나 RF 입력단으로 유입되면 수신 감도가 급락하므로, 노이즈가 적은 권장 규격의 인덕터 사용 및 RF 트레이스와의 이격 배치가 매우 중요합니다.",
    "a_en": "Electromagnetic switching noise radiating from the DC-DC inductors can couple into the RF track or antenna feed, degrading receiver sensitivity. Use high-Q shielded inductors and maintain physical layout isolation from RF routing."
  },
  {
    "q_ko": "다수의 BLE 센서가 동시에 통신하는 밀집 환경에서 패킷 충돌을 피하는 하드웨어 및 펌웨어 설계 방법은?",
    "q_en": "How do you avoid packet collisions in high-density environments where multiple BLE sensors broadcast simultaneously?",
    "a_ko": "Advertising 간격(Interval)에 무작위성(Random Delay)을 부여하여 송신 시점을 분산시키고, 스캐닝 윈도우를 최적화하여 다중 기기 환경에서 패킷 충돌 확률을 낮춥니다.",
    "a_en": "Introduce a random delay factor into the advertising interval to distribute transmission start times. Optimize scanner windows and connection spacing to minimize statistical packet collisions."
  },
  {
    "q_ko": "BLE Advertising 주기가 배터리 수명과 RF 안테나 발열에 미치는 상관관계는 무엇인가요?",
    "q_en": "How does the BLE advertising interval correlate with battery life and RF circuitry thermal dissipation?",
    "a_ko": "주기가 짧을수록 연결 응답성은 좋아지나 순간적인 송신 전류(Peak Current) 발생 빈도가 급증하여 배터리 수명을 크게 단축시키며, 초소형 기기에서는 미세한 발열의 원인이 될 수 있습니다.",
    "a_en": "A shorter interval improves connection responsiveness but increases the duty cycle of peak transmission currents, accelerating battery depletion. In ultra-compact enclosures, high-rate duty cycles can also cause localized thermal dissipation."
  },
  {
    "q_ko": "외부 32.768kHz 크리스탈(RTC)의 주파수 편차(ppm)가 BLE 연결 안정성에 미치는 영향은?",
    "q_en": "How does external 32.768kHz RTC crystal clock drift (ppm) impact BLE connection stability?",
    "a_ko": "주파수 편차가 크면 저전력 모드에서 깨어날 때 마스터와 슬레이브 간의 통신 타이밍 윈도우가 어긋나게 되어 패킷 손실률이 급증하고 잦은 연결 끊김 현상이 발생합니다.",
    "a_en": "High clock drift causes timing window offset deviations when the peripheral wakes from sleep. This clock mismatch leads to packet misses, latency spikes, and eventual connection timeouts."
  },
  {
    "q_ko": "기존 메인 MCU에 Nordic BLE 통신 모듈을 통합(Integration)할 때 발생하는 통신 병목 현상을 해결하려면?",
    "q_en": "How do you resolve interface serial communication bottlenecks when integrating a Nordic BLE module with a host MCU?",
    "a_ko": "메인 MCU와 BLE 모듈 간 통신(UART/SPI 등)의 보드레이트(Baudrate) 및 하드웨어 흐름 제어(Flow Control)를 최적화하고, 링 버퍼(Ring Buffer) 사이즈를 늘려 데이터 유실을 방지합니다.",
    "a_en": "Optimize the baudrate, enable hardware flow control (RTS/CTS) to prevent buffer overflows, and implement larger software ring buffers on both ends to absorb transient transmission bursts."
  },
  {
    "q_ko": "주요 대기업 납품을 위한 무선 센서 보드의 환경 신뢰성(온습도 사이클) 테스트 통과 기준은 무엇인가요?",
    "q_en": "What are the environmental reliability standards (temperature/humidity cycling) required for enterprise B2B wireless boards?",
    "a_ko": "통상적으로 -40℃~85℃의 가혹한 온도 사이클 및 고온 다습 환경을 견뎌야 하며, 이 환경 조건에서도 무선 송수신 감도(Sensitivity) 및 최대 출력이 스펙 범위 내에서 변동 없이 유지되어야 합격합니다.",
    "a_en": "The board must survive thermal cycling from -40°C to 85°C and high-humidity chambers (e.g., 85% RH / 85°C). Critical RF performance specs (Tx output, Rx sensitivity) must remain stable within datasheet limits across this envelope."
  },
  {
    "q_ko": "고온 환경에서 2.4GHz 무선 칩셋의 성능 저하(Thermal Derating)를 방지하는 방열 설계 노하우는?",
    "q_en": "What PCB design strategies prevent RF transmitter thermal derating in high-temperature environments?",
    "a_ko": "초소형 보드에서는 PCB 내 구리(Copper) 면적을 최대한 넓혀 방열판 역할을 하도록 설계하고 발열이 심한 전원 IC와 무선 칩셋을 물리적으로 이격시키며, 다량의 써멀 비아(Thermal Via)를 배치합니다.",
    "a_en": "Maximize copper pour areas to act as heatsinks, place thermal stitching vias directly beneath the chip expose pads to transfer heat to inner planes, and physically segregate hot power components from the RF IC."
  },
  {
    "q_ko": "진동이 심한 환경에 설치되는 무선 센서 보드의 크리스탈(Oscillator) 파손 방지 대책은 무엇인가요?",
    "q_en": "What measures prevent quartz crystal oscillator failure in high-vibration environments?",
    "a_ko": "기계적 진동에 취약한 크리스탈 부품 주변 및 하단에 댐핑용 에폭시 수지(Underfill)를 도포하거나, 내진동성이 압도적으로 뛰어난 소형 패키지 또는 MEMS 오실레이터로 부품을 대체 설계합니다.",
    "a_en": "Apply underfill or structural epoxy adhesive around the crystal body for vibration damping, or replace quartz crystals with silicon MEMS oscillators which offer superior mechanical shock resistance."
  },
  {
    "q_ko": "정전기(ESD) 인가 시 2.4GHz RF 칩셋이 리셋되거나 회로가 파괴되는 현상을 막는 보호 회로 설계법은?",
    "q_en": "How do you protect a 2.4GHz RF transceiver from ESD damage without degrading signal insertion loss?",
    "a_ko": "안테나 입력단과 외부 노출 포트에 초저용량(Low Capacitance) TVS 다이오드를 배치하여, RF 고주파 신호 손실은 방지하면서 정전기 에너지만 그라운드로 즉각 우회(Bypass)시킵니다.",
    "a_en": "Place an ultra-low capacitance TVS diode (&lt; 0.5pF) on the antenna line near the entry port. This channels high-voltage ESD pulses to ground while maintaining low insertion loss for the 2.4GHz high-frequency signal."
  },
  {
    "q_ko": "24시간 장기 연속 구동 시 간헐적으로 발생하는 BLE 모듈의 하드웨어 멈춤 현상 디버깅 방법은?",
    "q_en": "How do you debug intermittent hardware freeze issues on a BLE device running continuously 24/7?",
    "a_ko": "전원부의 미세한 리플 노이즈 누적이나 하드웨어 워치독(Watchdog) 타이머 설정 오류를 1차로 점검하고, JTAG 장기 로깅을 통해 메모리 누수나 하드웨어 인터럽트 충돌 지점을 특정합니다.",
    "a_en": "Analyze power rail ripple noise accumulated over time and verify hardware watchdog configurations. Use long-term JTAG logging to trace stack overflows, memory leaks, or interrupt service routine (ISR) race conditions."
  },
  {
    "q_ko": "엔터프라이즈급 통신 장비에 요구되는 전자파 내성(EMS) 테스트 통과를 위한 PCB 레이아웃 가이드는?",
    "q_en": "What are the PCB layout guidelines to pass Electromagnetic Susceptibility (EMS) testing for enterprise hardware?",
    "a_ko": "외부 전자파 공격에 견디기 위해 민감한 RF 및 아날로그 트레이스를 내층으로 라우팅하고, 그 주변을 촘촘한 비아로 쉴딩(Via Shielding)하여 루프 안테나 역할을 원천 차단합니다.",
    "a_en": "Route sensitive analog and high-frequency RF traces on inner layers sandwiched between solid ground planes. Surround critical nets with a dense guard ring of ground vias (via shielding) to eliminate crosstalk coupling loops."
  },
  {
    "q_ko": "초소형 보드에서 부품 간격 밀집으로 발생한 크로스토크(Crosstalk)가 무선 송수신에 미치는 악영향은?",
    "q_en": "How does digital crosstalk in high-density PCBs affect RF transceiver sensitivity?",
    "a_ko": "고속 디지털 신호선(SPI, I2C 등)이 RF 라인에 인접할 경우 노이즈가 커플링되어 수신 감도를 훼손하므로, 직교 라우팅을 적용하거나 두 신호선 사이에 GND 가드 트레이스를 배치해야 합니다.",
    "a_en": "High-speed digital traces (SPI, I2C, UART) running near the RF trace can inductively or capacitively couple switching noise, degrading receiver sensitivity. Implement orthogonal routing between layers and route ground guard traces between coplanar nets."
  },
  {
    "q_ko": "센서 데이터 수집 시 간헐적으로 발생하는 통신 지연(Latency)의 하드웨어적 원인은 어떻게 찾나요?",
    "q_en": "How do you identify the hardware cause of intermittent packet latency during sensor data transmission?",
    "a_ko": "오실로스코프를 이용해 통신 시점의 전원 전압 강하(Drop) 파형이나 메인 MCU와의 인터페이스 통신 파형을 분석하여, 전원 불안정이나 하드웨어 인터럽트 병목 구간을 탐색합니다.",
    "a_en": "Monitor power rails using an oscilloscope during active transmission bursts to detect voltage drop transient spikes. Analyze interface lines to pinpoint CPU brown-out bottlenecks or interrupt timing conflicts."
  },
  {
    "q_ko": "배터리 잔량 부족으로 인한 전압 강하(Voltage Drop)가 2.4GHz 최대 송신 출력(Tx Power)에 미치는 영향은?",
    "q_en": "How does battery voltage drop affect the maximum RF transmit power (Tx Power) in a 2.4GHz link?",
    "a_ko": "배터리 전압이 칩셋 내부 PA(전력 증폭기)의 권장 동작 전압 이하로 떨어지면 최대 송신 출력이 급감하여 통신 거리가 줄어들므로, 벅-부스트(Buck-Boost) 컨버터 등을 통해 안정적인 전압을 공급해야 합니다.",
    "a_en": "When battery voltage drops below the threshold required by the internal Power Amplifier (PA), the transmit output drops, shortening range. Incorporate a buck-boost converter to maintain a stabilized voltage rail regardless of battery discharge state."
  },
  {
    "q_ko": "무선 보드의 수명(MTBF)을 예측하고 가혹 조건에서 신뢰성을 검증하는 가속 수명 테스트 방법은?",
    "q_en": "How do you perform highly accelerated life testing (HALT) to predict MTBF on wireless PCBs?",
    "a_ko": "HALT(고가속 수명 시험) 장비를 이용해 고온, 고습, 강한 진동 등 극한 환경 스트레스를 복합적으로 가하여 초소형 제품의 하드웨어 취약 지점을 조기에 발견하고 개선합니다.",
    "a_en": "Subject the device to a combination of thermal shocks, relative humidity cycling, and multi-axis random vibration in a HALT chamber. This exposes physical weakness points early, allowing design modifications to achieve high MTBF."
  },
  {
    "q_ko": "2.4GHz 무선 기기 KC 인증 진행 시 가장 빈번하게 발생하는 불합격(Fail) 사유와 예방법은 무엇인가요?",
    "q_en": "What is the most common cause of failure in 2.4GHz device KC certification, and how is it prevented?",
    "a_ko": "가장 흔한 원인은 불필요한 방사 노이즈(Spurious Emission) 기준치 초과이며, 설계 초기 단계부터 정밀한 안테나 매칭, 실드캔 적용, 전원부 노이즈 필터링 설계를 반영해야 합니다.",
    "a_en": "The most frequent cause is exceeding the limit for radiated spurious emissions. Prevent this by optimizing antenna impedance matching, employing Low-Pass Filters (LPF), isolating switching rails, and shielding critical RF blocks."
  },
  {
    "q_ko": "BLE 기기의 방사 스퓨리어스(Radiated Spurious Emission) 기준 초과 시 하드웨어 디버깅 절차는?",
    "q_en": "What is the hardware debugging procedure when a BLE device fails radiated spurious emissions?",
    "a_ko": "스펙트럼 분석기로 초과되는 하모닉(고조파) 주파수 대역을 정확히 확인한 후, RF 매칭단에 Low Pass Filter(LPF) 소자를 추가하여 불요파를 감쇄시킵니다.",
    "a_en": "Identify the failing harmonic frequencies (e.g. 4.8GHz, 7.2GHz) using a spectrum analyzer. Then, insert or recalculate a Low Pass Filter (LPF) network in the RF path to suppress the targeted harmonics."
  },
  {
    "q_ko": "보드 크기가 너무 작아 테스트 핀(Test Point)을 뽑기 어려울 때, 무선 인증용 펌웨어 제어 환경은 어떻게 구축하나요?",
    "q_en": "How do you set up DTM firmware control for RF compliance testing on PCBs too small for normal test points?",
    "a_ko": "설계 단계에서 보드 바닥면에 초소형 Pogo Pin용 테스트 패드(Tx, Rx, GND 등)를 배치하고, 인증 시에만 맞춤형 테스트 지그를 결합하여 DTM(Direct Test Mode) 명령을 인가합니다.",
    "a_en": "Incorporate miniature pogo-pin landing pads (Tx, Rx, GND) on the bottom layer of the PCB. During testing, dock the board into a custom pogo-pin test fixture to run Direct Test Mode (DTM) commands."
  },
  {
    "q_ko": "이미 인증받은 2.4GHz 완제품 모듈을 사용해도 세트(Set) 단위에서 추가적인 전자파 인증이 필요한 경우는 언제인가요?",
    "q_en": "When using a pre-certified RF module, is additional set-level electromagnetic compatibility (EMC) certification still required?",
    "a_ko": "모듈 자체의 무선 인증(RF)은 면제받을 수 있으나, 최종 조립된 제품 상태에서 전원 노이즈나 기타 부품에 의한 전자파 간섭을 확인하기 위해 전자파 적합성(EMC/EMI) 인증은 별도로 받아야 합니다.",
    "a_en": "Yes. While the module's intentional radiator (RF) certification is inherited, the final product must undergo unintentional radiator testing (EMC/EMI) to verify that peripheral circuits do not emit noise exceeding limits."
  },
  {
    "q_ko": "안테나 위치나 케이스 재질이 변경되었을 때 기존 KC 인증에서 파생 모델로 처리할 수 있는 허용 범위는?",
    "q_en": "What changes in antenna placement or case material qualify for KC permissive changes (derivative models)?",
    "a_ko": "동일한 RF 칩과 발진 회로를 사용하고 단지 케이스 재질이 바뀌거나 안테나의 이득(Gain)이 기존 인증품보다 낮아지는 변경이라면 파생 모델이나 동일성 선언으로 절차를 간소화할 수 있습니다.",
    "a_en": "If the RF chipset, crystal oscillator, and PCB routing remain identical, changes such as alternative enclosure plastic materials or switching to an antenna with equal or lower gain can be registered as derivative models, bypassing full re-testing."
  },
  {
    "q_ko": "FCC(미국), CE(유럽) 인증 진행 시 국내 KC 인증 측정 결과(Test Report)를 어디까지 활용할 수 있나요?",
    "q_en": "Can domestic KC test reports be reused when applying for FCC (US) or CE (EU) certifications?",
    "a_ko": "국가별로 규격(Limit)과 시험 방법이 달라 성적서의 직접적인 재사용은 어렵지만, 설계 디버깅을 위한 사전 검증 데이터로 활용하여 해외 인증 비용과 재시험 기간을 획기적으로 줄이는 지표가 됩니다.",
    "a_en": "Direct reuse is typically not accepted due to variations in limits and test procedures. However, the raw data serves as valuable pre-compliance verification, significantly reducing debug risk, test lab duration, and costs."
  },
  {
    "q_ko": "2.4GHz 대역폭 내에서 채널별 송신 출력(Tx Power) 편차가 심할 때 인증 통과에 미치는 영향은?",
    "q_en": "How does channel-to-channel transmit power variation affect RF compliance tests, and how is it fixed?",
    "a_ko": "채널별 출력 편차가 커서 특정 채널이 규격 한계치를 초과하거나 미달하면 인증 통과가 불가능하므로, 펌웨어 단에서 채널별 보정 값(Calibration)을 적용하여 출력을 평탄하게 맞추어야 합니다.",
    "a_en": "If power flatness varies significantly, high-band channels might exceed regulatory limits while low-band channels drop below link budget needs. Fix this by implementing channel-specific firmware power calibration tables."
  },
  {
    "q_ko": "무선 충전 기능이 포함된 2.4GHz 초소형 센서 기기의 전자파 적합성(EMC) 복합 인증 절차는 어떻게 되나요?",
    "q_en": "What is the combined EMC testing process for compact BLE sensors integrated with wireless charging coils?",
    "a_ko": "2.4GHz 무선 통신 기기 규격과 무선 충전(WPT) 장치 규격 인증을 동시에 진행해야 하며, 특히 무선 충전 시 발생하는 스위칭 노이즈가 무선 통신에 미치는 상호 간섭 여부를 엄격히 평가받습니다.",
    "a_en": "You must certify under both intentional radiator (BLE) and wireless power transfer (WPT) standards. Expect strict evaluation of magnetic switching noise coupling from the charging coil into the RF receive path during charging states."
  },
  {
    "q_ko": "인증용 샘플 보드 제작 시 양산 보드와 동일한 RF 성능을 보장하기 위해 어떤 점을 중점 관리해야 하나요?",
    "q_en": "When manufacturing sample boards for RF certification, what key factors must be managed to ensure identical performance with the final production boards?",
    "a_ko": "양산 시 사용할 정확히 동일한 부품명세서(BOM)와 동일한 PCB 제조사를 통해 샘플을 제작해야 하며, 펌웨어 역시 양산 버전을 기반으로 테스트 모드만 추가한 형태로 준비해야 합니다.",
    "a_en": "Manufacture the samples using the exact same Bill of Materials (BOM) and the same PCB manufacturer as final production. Additionally, base the test firmware on the production version, adding only the required test modes (DTM) to maintain operational parity."
  },
  {
    "q_ko": "블루투스 로고를 사용하기 위한 Bluetooth SIG 인증과 국가별 전파 인증(KC/FCC)의 진행 순서 및 차이점은?",
    "q_en": "What is the sequence and difference between Bluetooth SIG Qualification and national RF certifications (KC/FCC)?",
    "a_ko": "Bluetooth SIG는 블루투스 통신 규약 준수 및 로고 사용을 위한 글로벌 민간 인증이며, KC/FCC는 해당 국가의 전파법 준수를 위한 강제 법정 인증이므로 각각 독립적으로 병행 진행됩니다.",
    "a_en": "Bluetooth SIG is a private organization governing compliance to the Bluetooth protocol for logo usage. KC and FCC are mandatory national legal requirements. These are independent pathways that can be pursued concurrently."
  },
  {
    "q_ko": "2.4GHz 무선 보드 대량 양산 시 RF 성능 편차로 인한 통신 불량률을 획기적으로 낮추는 공정 관리 방법은?",
    "q_en": "How do you minimize RF performance variance and defect rates during mass SMT production?",
    "a_ko": "초소형 보드일수록 SMT 공정의 부품 실장 오차에 민감하므로, RF 부품과 매칭 소자 주변의 솔더 크림 두께(스텐실 마스크 두께)와 리플로우 온도 프로파일을 최적화하는 것이 핵심입니다.",
    "a_en": "Miniature RF matching components are highly sensitive to assembly deviations. Control Solder Paste Inspection (SPI) parameters closely, optimize stencil aperture thickness near RF lines, and stabilize the reflow oven temperature profile."
  },
  {
    "q_ko": "SMT 양산 라인에서 BLE 보드의 RF 수신 감도(Rx Sensitivity)를 빠르게 전수 검사하는 테스트 지그(Jig) 구축법은?",
    "q_en": "How do you build a SMT production-line test fixture to quickly screen BLE receiver sensitivity (RSSI)?",
    "a_ko": "Pogo Pin 지그에 Golden Sample(성능 기준 보드) 또는 전용 블루투스 테스터 장비를 내장하여, 양산 라인에서 빠르고 자동으로 RSSI를 측정하고 합격/불합격을 판정하는 자동화 스크립트를 구축합니다.",
    "a_en": "Design a pogo-pin test jig integrating a calibrated Golden Sample or a Bluetooth communication tester. Automate testing with scripts that run quick connection handshakes and read back RSSI limits in under 5 seconds."
  },
  {
    "q_ko": "글로벌 반도체 수급 이슈 발생 시 Nordic 칩셋 등 주요 2.4GHz RF IC의 핀투핀(Pin-to-Pin) 대체품 선정 기준은?",
    "q_en": "What are the criteria for selecting pin-to-pin replacements for Nordic nRF52 series RF SoCs during semiconductor shortages?",
    "a_ko": "대체하려는 칩셋이 기존과 완벽히 동일한 풋프린트(Footprint)를 가지는지 하드웨어적으로 확인하고, 펌웨어 이식성(Porting) 및 내부 플래시 메모리 용량을 종합적으로 검토해야 합니다.",
    "a_en": "Confirm physical footprint equivalence, matching pad layouts, and electrical specs (VCC, GPIO logic levels). Evaluate software porting effort, RAM/Flash sizes, and internal power management routing compatibility (LDO vs. DC-DC)."
  },
  {
    "q_ko": "초소형 무선 보드 설계부터 양산까지 턴키(Turn-key) 외주 진행 시 개발사 선정 체크리스트는 무엇인가요?",
    "q_en": "What is the vendor checklist when outsourcing micro wireless board design to production on a turnkey basis?",
    "a_ko": "제한된 공간에서의 고밀도 레이아웃 설계 역량, 엔터프라이즈급 기업 납품을 성공시킨 포트폴리오, 까다로운 무선 인증 디버깅 경험, 그리고 양산 수율 관리 능력을 반드시 확인해야 합니다.",
    "a_en": "Assess their portfolio in high-density multi-layer layout design, B2B production track record, in-house RF tuning equipment (VNA, chambers), certification troubleshooting capability, and SMT yield management processes."
  },
  {
    "q_ko": "2.4GHz 칩셋 직접 실장(SoC) 방식과 인증 완료된 모듈 사용 방식 중 우리 프로젝트에 유리한 단가/일정 비교 기준은?",
    "q_en": "How do you evaluate the cost/timeline trade-off between direct SoC chip-on-board design and using pre-certified modules?",
    "a_ko": "생산 수량이 적고 빠른 출시(인증 비용 절감)가 필요하다면 모듈이 유리하며, 극도로 작은 초소형 폼팩터가 필수이고 대량 양산을 통한 부품 단가 절감이 목적이라면 SoC 직접 실장이 압도적으로 유리합니다.",
    "a_en": "Pre-certified modules are optimal for low production volumes and rapid time-to-market (minimizing compliance cost). Direct SoC layout is preferred when enclosure space is restricted, or when production volumes warrant offsetting certification costs through lower BOM costs."
  },
  {
    "q_ko": "양산 후 시장에 배포된 무선 제품의 펌웨어를 원격 업데이트(OTA)할 때 전원 차단 등으로 인한 하드웨어 벽돌(Brick) 현상 방지 방안은?",
    "q_en": "How do you prevent device bricking during OTA firmware updates if power is lost mid-transmission?",
    "a_ko": "듀얼 뱅크(Dual Bank) 플래시 메모리 구조를 적용하여, 새로운 펌웨어 다운로드가 100% 완료되고 무결성이 검증된 후에만 기존 부팅 이미지를 교체하도록 Fail-safe 안전장치를 설계합니다.",
    "a_en": "Implement a dual-bank flash memory partition structure. Write the incoming firmware image into the secondary bank, verify its CRC checksum, and only trigger the bootloader switch once validation succeeds."
  },
  {
    "q_ko": "PCB 레이어(Layer) 수를 줄여 양산 단가를 절감하면서도 RF 안테나 성능을 유지하는 설계 노하우는?",
    "q_en": "What is the design process for reducing PCB layers from 6L to 4L to save costs while preserving RF performance?",
    "a_ko": "6층 기판을 4층으로 줄일 경우 RF 임피던스 매칭을 위한 선폭(Trace Width)과 층간 두께(Prepreg)를 재계산하고, 부품 배치를 밀도 있게 최적화하여 필수적인 그라운드 쉴딩 영역을 사수합니다.",
    "a_en": "Recalculate trace widths based on the new dielectrical thickness (prepreg stackup) to maintain 50-ohm impedance. Carefully locate critical return paths and dedicate a solid inner layer for the RF ground reference."
  },
  {
    "q_ko": "자동화 테스트 지그(Test Jig) 제작 시 2.4GHz 안테나 성능 및 연결 테스트까지 한 번에 자동화하는 방법은?",
    "q_en": "How do you automate RF antenna validation inside a functional SMT testing fixture?",
    "a_ko": "테스트 지그 내부에 외부 노이즈를 차단하는 미니 RF 쉴드 박스 공간을 마련하고, 계측 장비와 PC를 연동하여 DTM 통신 제어 및 RSSI 판독을 원클릭으로 자동화합니다.",
    "a_en": "Enclose the test interface inside a miniature RF shielding box integrated within the fixture. Use an external controller to cycle the device through DTM modes and measure RSSI values isolated from factory Wi-Fi noise."
  },
  {
    "q_ko": "잦은 하드웨어 리비전(Revision)으로 인한 개발 지연을 막기 위해 기획 단계부터 전문 RF 컨설팅을 받아야 하는 이유는?",
    "q_en": "Why does involving RF consultants during early design stages prevent hardware revisions?",
    "a_ko": "초소형 폼팩터 하드웨어는 기구물과 RF의 상관관계가 극도로 높아, 초기 설계부터 전문가의 개입이 있어야 금형 재수정이나 인증 재시험 같은 치명적인 시간 및 비용 낭비를 막을 수 있습니다.",
    "a_en": "Compact enclosures introduce severe coupling interactions between surrounding mechanical housings and the antenna. Early RF simulation avoids mold modifications or compliance test failures, saving time and development costs."
  },
  {
    "q_ko": "성공적인 B2B 엔터프라이즈 납품을 위해 2.4GHz 센서 보드 기획 단계에서 반드시 확립해야 할 요구사항(PRD) 정의 방법은?",
    "q_en": "How should a Product Requirements Document (PRD) be defined for a B2B wireless sensor to secure enterprise contracts?",
    "a_ko": "필요한 통신 거리, 타겟 배터리 수명, 동작 온도 범위, 제품 크기(폼팩터)의 물리적 한계선을 명확히 수치화하여, 엔터프라이즈 납품 기준에 부합하는 현실적인 하드웨어 설계 목표를 설정해야 합니다.",
    "a_en": "Define explicit targets for communication link margins, operational temperature ranges, enclosure size envelopes, battery lifespans, and reliability specifications. Having measurable targets ensures compliant design execution."
  }
];

const i18n = {
  ko: {
    navHome: "Home",
    navPhilosophy: "Philosophy",
    navCapabilities: "Capabilities",
    navPortfolio: "Portfolio",
    navBlog: "Tech Blog",
    navFaq: "RF Q&A",
    navContact: "Contact",
    btnInquireNav: "프로젝트 의뢰",
    heroKicker: "TOTAL ENGINEERING SOLUTION",
    heroHeadline: "<span class=\"silver-metallic-gradient\">회로 설계부터 양산까지</span><br /><span class=\"silver-metallic-gradient\">검증된 기술력</span>으로<br />성공적인 제품 개발을 보장합니다",
    heroSubtext: "<strong class=\"highlight-text\">RF · BLE · NFC · Mixed-Signal Circuit Engineering</strong><br />20년 이상 축적된 RF 및 Mixed-Signal 실전 경험을 바탕으로, 고객의 개발 목표를 단축하고 양산 성공률을 높이는 최적의 엔지니어링 파트너입니다.",
    btnHeroPrimary: "기술 상담 및 프로젝트 의뢰",
    btnHeroSecondary: "기술 서비스 보기",
    stat1Title: "Years of Experience", stat1Desc: "RF/하드웨어 개발 실전 경력",
    stat2Title: "Core Specialization", stat2Desc: "NFC / Mixed-Signal 회로 설계",
    stat3Title: "Certification Support", stat3Desc: "CE 및 글로벌 규격 인증 대응",
    stat4Title: "Design to Production", stat4Desc: "시작품 원스톱 양산 연계",
    philoTitle: "엔지니어링 철학", philoSub: "20년의 실전 노하우로 고객의 거대한 하드웨어 난제를 명확히 해결합니다.",
    philoBody: "31NS-Tech Product Development LAB은 20년 이상 축적된 RF 및 Mixed-Signal 실전 경험을 바탕으로, 고객의 개발 목표를 단축하고 양산 성공률을 높이는 최적의 토털 엔지니어링 파트너가 되겠습니다.",
    philoQuote: "> 극한 환경에서도 검증된 고신뢰성 하드웨어 솔루션을 제공하는 것이 저희의 핵심 철학입니다.",
    capaTitle: "핵심 기술 역량", capaSub: "RF/무선통신, 듀얼 NFC, 산업용 모터 제어, AFE 센서보드, 양산인증, Dev Vibe 6대 솔루션",
    cap1Title: "RF & BLE Wireless Hardware", cap1Desc: "2.4GHz ISM Band RF 송수신 회로 및 Nordic nRFxx 기반 BLE 디바이스를 설계하여 수신 감도와 전력 소모를 최적화합니다.",
    cap1Bullet1: "2.4GHz RF 송수신 & Nordic nRFxx 회로 설계", cap1Bullet2: "VNA S11 안테나 임피던스 매칭 & 전력 최적화", cap1Bullet3: "PA / LNA / 필터 튜닝 & EMI / EMC 노이즈 억제",
    cap2Title: "NFC & Dual-Frequency RFID", cap2Desc: "125kHz 저주파 RFID와 13.56MHz NFC 듀얼 주파수를 지원하며, 금속 외함 차폐 및 복합 안테나 시스템을 구축합니다.",
    cap2Bullet1: "125kHz LF RFID + 13.56MHz HF NFC 듀얼 회로", cap2Bullet2: "금속 장착 환경 대응 페라이트 차폐 안테나 설계", cap2Bullet3: "커스텀 초소형 NFC 모듈 & Q-Factor 매칭",
    cap3Title: "Industrial Motor & Motion Control", cap3Desc: "DC·BLDC·PMSM·Stepper 다종 모터 드라이브 회로와 EtherCAT 기반 고속 실시간 다축 동기 모션 제어 시스템을 설계합니다.",
    cap3Bullet1: "DC · BLDC · PMSM · Stepper 범용 모터 드라이브 회로", cap3Bullet2: "EtherCAT 기반 고속 실시간 다축 동기 모션 제어", cap3Bullet3: "15mm 초슬림 폼팩터 & 기계 진동 감쇠(Suppression) 튜닝",
    cap4Title: "Mixed-Signal Sensor Boards", cap4Desc: "산업·의료·반도체 장비용 고노이즈 차단 아날로그 프론트엔드(AFE) 및 고해상도 ADC 정밀 센서 인터페이스를 개발합니다.",
    cap4Bullet1: "아날로그 프론트엔드(AFE) & 저노이즈 증폭 필터 설계", cap4Bullet2: "24-bit 고해상도 센서 데이터 conversion 인터페이스", cap4Bullet3: "MCU 기반 ToF & 초정밀 고속 데이터 변환 최적화",
    cap5Title: "양산 · 테스트 · 글로벌 인증", cap5Desc: "시작품 개발 완료 후 DFM 검증, 최적 BOM 단가 산정, 양산 수율 관리 및 KC·FCC·CE 인증 획득 전 과정을 원스톱 조율합니다.",
    cap5Bullet1: "양산용 DFM(Design for Manufacturing) & 수율 최적화", cap5Bullet2: "부품 대체 수급 & 최적 BOM Cost 구성", cap5Bullet3: "KC / FCC / CE 글로벌 필수 인증 규격 컨설팅",
    cap6Title: "💻 Dev Vibe 코딩", cap6Desc: "AI 기반 자연어 프롬프트 엔지니어링을 활용하여 웹, 앱, 유튜브 연동 및 하드웨어 조율 응용 프로그램을 미래지향적으로 개발합니다.",
    cap6Bullet1: "자연어 프롬프트 엔지니어링 기술 분석", cap6Bullet2: "지능형 소프트웨어 및 하드웨어 제어 응용 연동", cap6Bullet3: "웹 / 앱 / 유튜브 특화 Vibe 맞춤 개발",
    step1Title: "요구사항 분석 & 스펙 정의", step1Desc: "프로젝트 목표 성능, RF 수신 감도, 전력 검증 및 최적 칩셋 선별.",
    step2Title: "RF & Mixed-Signal 회로 설계", step2Desc: "노이즈 방지 쉴딩, 다층 PCB 아트워크, AFE 및 PMIC 회로 설계.",
    step3Title: "안테나 튜닝 & 시품 검증", step3Desc: "VNA 계측 장비를 활용하여 2.4GHz/BLE 안테나 50Ω 임피던스 정합.",
    step4Title: "글로벌 인증 & DFM 양산", step4Desc: "KC, FCC, CE 규격 사전 검증 및 양산용 DFM BOM 가이드라인 제공.",
    portTitle: "프로젝트 및 개발 사례", portSub: "국내 대기업 양산 공급부터 재난대응 센서, 소방장비, 듀얼 NFC까지 31NS-Tech 실전 실적",
    proj0Btn: "S사 · L사 공급 완료",
    proj0Title: "산업용 설비 진단 & 예측 보전 시스템", proj0Desc: "다중 센서 통합 및 극소형 폼팩터 설계. 국내 주요 대기업(S사, L사) 양산 공급 및 검증 완료.",
    proj0Tech: "<strong>엔지니어링 세부기술:</strong> 24-bit Delta-Sigma ADC 기반 고속 가속도/진동 FFT 스펙트럼 분석 회로 구현. 수동 L-C 차단 필터로 고주파 전자기 노이즈(EMI)를 완벽 차단하고, 초집적 다층 PCB 아트워크로 극소형 폼팩터를 완성함.",
    proj0B1: "초집적 폼팩터 커스텀 PCB 아트워크 설계", proj0B2: "산업용 가속도·진동·온도 다중 센서 최적화 통합", proj0B3: "RS-485 / BLE 하이브리드 통신 인터페이스 지원", proj0B4: "S사 / L사 B2B 양산 공급 및 신뢰성 품질 검증",
    proj1Btn: "-70°C Cold-Chain",
    proj1Title: "재난대응 극저온 BLE 온도 모니터링 장치", proj1Desc: "nRF52 시리즈 기반 저전력 설계. -20°C ~ -70°C 극저온 환경 백신 콜드체인 신뢰성 검증 및 KC 인증 양산.",
    proj1Tech: "<strong>엔지니어링 세부기술:</strong> Nordic nRF52840 SoC의 DC-DC 컨버터 효율을 극대화하여 대기 전류 2.1µA 달성. -70°C 드라이아이스 환경 내 결로 방지 기판 겔 방수(Conformal Coating) 및 외부 PT100/RTD 고정밀 온도 측정 프로브 AFE 설계.",
    proj1B1: "BLE 통신 모듈 (Nordic nRF52 Series)", proj1B2: "외부 온도 센싱 프로브 인터페이스 설계", proj1B3: "극저온 배터리 방전 방지 저전력 펌웨어 구조", proj1B4: "KC 인증 대응 및 백신 유통 라인 양산 공급",
    proj2Btn: "96dB High-Power",
    proj2Title: "소방 장비용 인명구조 경보기 (PASS)", proj2Desc: "96dB 고출력 피에조 울림통, IP67 완전 방수, OLED 디스플레이 연동 및 소방청 규격 충족.",
    proj2Tech: "<strong>엔지니어링 세부기술:</strong> High-Voltage Piezo Driver 스위칭 앰프 회로 적용으로 96dB 고출력 음압 확보. 3축 가속도 모션 센서를 연동한 30초 무동작 시 자동 발화 구조 및 IP67 완전 방수 이중 실링 외함 구조 완성.",
    proj2B1: "피에조 + 울림통 기반 96dB 고출력 경보 구조", proj2B2: "OLED 상태 디스플레이 및 모션 3축 센서 연동", proj2B3: "극한 환경 내구성 (IP67 완전 방수 및 방진)", proj2B4: "KC 인증 및 소방청 규격 기준 완전 충족",
    proj3Btn: "125kHz + 13.56MHz",
    proj3Title: "NFC 듀얼 주파수 안테나 회로 시스템", proj3Desc: "125kHz 저주파와 13.56MHz NFC 단일 리더기 동시 지원. 금속 차폐 페라이트 매칭 네트워크 설계.",
    proj3Tech: "<strong>엔지니어링 세부기술:</strong> LC 공진 회로 Q-Factor 조율로 두 주파수 간 상호 도청/간섭 방지 노치 필터(Notch Filter) 설계. 차동 RF 앰프 출력단과 고투과율 페라이트 샌드위치 플레이트로 금속 간섭 이격 거리를 5mm 이하로 극소형화함.",
    proj3B1: "125kHz LF + 13.56MHz HF 듀얼 코일 레이아웃", proj3B2: "주파수 간 상호 간섭 억제 노치 필터 설계", proj3B3: "50Ω 독립 매칭 네트워크 및 VNA S11 튜닝", proj3B4: "금속 외함 환경 대응 페라이트 차폐 기판",
    proj4Btn: "High-Speed ToF",
    proj4Title: "초음파 기반 콘크리트 비파괴 강도 측정기", proj4Desc: "초음파 트랜스듀서 고전압 드라이브 및 고속 ADC ToF 정밀 측정 회로, 현장용 휴대 폼팩터 완성.",
    proj4Tech: "<strong>엔지니어링 세부기술:</strong> High-Voltage MOSFET 하프브릿지 트랜스듀서 300V 펄스 드라이브 설계. 100Msps 고속 ADC 기반 ToF(Time of Flight) 샘플링 알고리즘 및 차동 Bandpass 필터로 아날로그 신호 왜곡을 최소화함.",
    proj4B1: "초음파 트랜스듀서 300V 고전압 드라이브 회로", proj4B2: "100Msps 고속 ADC 기반 초정밀 ToF 측정", proj4B3: "신호 필터링 및 고주파 노이즈 억제 AFE", proj4B4: "현장 휴대용 저전력 커스텀 폼팩터 설계",
    blogTitle: "기술 블로그 & 연구 문서", blogSub: "RF/하드웨어 개발 현장에서 검증된 최적화 노하우 및 실무 기술 리퍼런스",
    blog1Title: "BLE 안테나 정합(매칭)과 RF 회로 최적화 실무 기술자료", blog1Desc: "초보자를 위한 PCB 설계 오류부터 VNA 튜닝 완벽 가이드. 50Ω 임피던스 매칭, VSWR 및 Return Loss 최소화, IFA / 세라믹 / 휩 안테나 비교 가이드.",
    blog2Title: "nRF52805 BLE 모듈 회로 설계 및 개발 기술 참고문서", blog2Desc: "Nordic Semiconductor nRF52805 WLCSP 모듈 1차/2차 Build-up PCB 사양, 캔 적용, 안테나 패턴 타입 설계 및 시품 RF 튜닝 실무 프로세스.",
    btnReadDoc: "기술 문서 읽기",
    faqTitle: "RF & 하드웨어 실무 Q&A 50선", faqSub: "2.4GHz 신호 혼선, 안테나 매칭, AFE 노이즈, KC/FCC 인증 대응 필수 하드웨어 답변",
    contactTitle: "프로젝트 의뢰 및 기술 상담", contactLead: "귀사의 하드웨어 난제, 20년 이상 경험의 31NS-Tech Product Development LAB에 문의하세요. 회로 설계, 튜닝, 양산 컨설팅까지 신속히 답변드립니다.",
    contactAddr: "경기도 광명시 (Gwangmyeong-si, Gyeonggi-do)", contactResp: "24시간 이내 엔지니어 사전 검토 후 회신", btnSubmitForm: "SEND INQUIRY PROTOCOL", footerAbout: "20년 이상 경력의 RF/하드웨어 전문가가 회로 설계부터 양산 및 인증까지 실용적인 토털 엔지니어링 솔루션을 제공합니다."
  },
  en: {
    navHome: "Home",
    navPhilosophy: "Philosophy",
    navCapabilities: "Capabilities",
    navPortfolio: "Portfolio",
    navBlog: "Tech Blog",
    navFaq: "RF Q&A",
    navContact: "Contact",
    btnInquireNav: "Inquiry",
    heroKicker: "TOTAL ENGINEERING SOLUTION",
    heroHeadline: "<span class=\"silver-metallic-gradient\">From Circuit Design to Mass Production</span> —<br /><span class=\"silver-metallic-gradient\">Proven Expertise</span><br />for Successful Product Development",
    heroSubtext: "<strong class=\"highlight-text\">RF · BLE · NFC · Mixed-Signal Circuit Engineering</strong><br />Built on 20+ years of hands-on RF and Mixed-Signal experience, we are the engineering partner that accelerates your development timeline and maximizes mass-production success rates.",
    btnHeroPrimary: "Request Consultation",
    btnHeroSecondary: "View Tech Services",
    stat1Title: "Years of Experience", stat1Desc: "RF & HW Engineering Career",
    stat2Title: "Core Specialization", stat2Desc: "NFC & Mixed-Signal Circuits",
    stat3Title: "Certification Support", stat3Desc: "KC / FCC / CE Regulatory Support",
    stat4Title: "Design to Production", stat4Desc: "E2E One-Stop Mass Production",
    philoTitle: "Engineering Philosophy", philoSub: "Solving complex hardware challenges with 20+ years of practical experience.",
    philoBody: "31NS-Tech Product Development LAB leverages 20+ years of RF and Mixed-Signal expertise to shorten your development cycles and maximize mass-production success rates as your dedicated engineering partner.",
    philoQuote: "> Delivering high-reliability hardware solutions validated under extreme conditions is our core philosophy.",
    capaTitle: "Core Capabilities", capaSub: "RF/Wireless, Dual NFC, Industrial Motor Control, AFE Sensor Boards, Certification & Dev Vibe",
    cap1Title: "RF & BLE Wireless Hardware", cap1Desc: "Design 2.4GHz ISM band RF transceivers and Nordic nRFxx BLE hardware to maximize signal sensitivity and power efficiency.",
    cap1Bullet1: "2.4GHz RF Transceiver & Nordic nRFxx Circuit Design", cap1Bullet2: "VNA S11 Antenna Impedance Matching & Power Opt.", cap1Bullet3: "PA / LNA / Filter Tuning & EMI / EMC Suppression",
    cap2Title: "NFC & Dual-Frequency RFID", cap2Desc: "Support dual 125kHz LF RFID and 13.56MHz HF NFC frequencies with metal enclosure ferrite shielding and dual antenna systems.",
    cap2Bullet1: "125kHz LF RFID + 13.56MHz HF NFC Dual Circuit", cap2Bullet2: "Metal Enclosure Ferrite Shielding Antenna Design", cap2Bullet3: "Custom Compact NFC Module & Q-Factor Tuning",
    cap3Title: "Industrial Motor & Motion Control", cap3Desc: "Design multi-motor drive circuits for DC/BLDC/PMSM/Stepper and EtherCAT real-time multi-axis synchronous motion control.",
    cap3Bullet1: "DC · BLDC · PMSM · Stepper Multi-Motor Drive Circuits", cap3Bullet2: "EtherCAT Real-time Multi-axis Synchronous Motion Control", cap3Bullet3: "15mm Ultra-slim Form Factor & Vibration Suppression",
    cap4Title: "Mixed-Signal Sensor Boards", cap4Desc: "Develop high-noise immune Analog Front-End (AFE) and high-resolution ADC sensor interfaces for industrial/medical equipment.",
    cap4Bullet1: "Analog Front-End (AFE) & Low-Noise Amplification Filter", cap4Bullet2: "24-bit High-Resolution Sensor Data Conversion Interface", cap4Bullet3: "MCU-Based ToF & High-Precision Fast Conversion",
    cap5Title: "Mass Production & Certification", cap5Desc: "Complete one-stop support from DFM verification and BOM optimization to mass line troubleshooting and KC/FCC/CE certification.",
    cap5Bullet1: "Design for Manufacturing (DFM) & Yield Optimization", cap5Bullet2: "Component Sourcing & Optimized BOM Cost Structure", cap5Bullet3: "KC / FCC / CE Global Compliance Certification Guide",
    cap6Title: "💻 Dev Vibe Coding", cap6Desc: "Develop futuristic applications and hardware parameter tuning software leveraging AI natural language prompt engineering.",
    cap6Bullet1: "Natural Language Prompt Engineering Analysis", cap6Bullet2: "Intelligent Software & Hardware Control Integration", cap6Bullet3: "Web / App / YouTube Special Vibe Custom Dev.",
    step1Title: "Requirements & Specs", step1Desc: "Define RF performance, battery goals, and select MCUs.",
    step2Title: "RF & PCB Circuit Design", step2Desc: "Design EMI shielding, multilayer PCB artwork, AFE and PMIC.",
    step3Title: "Antenna VNA Tuning", step3Desc: "Execute 50Ω impedance matching via VNA analyzer.",
    step4Title: "Certification & DFM", step4Desc: "Pre-test for KC, FCC, CE and deliver production BOM DFM.",
    portTitle: "Project Portfolio", portSub: "Proven track record from enterprise mass production to cold-chain sensors and dual NFC",
    proj0Btn: "Supplied to S & L Corp",
    proj0Title: "Predictive Maintenance & Condition Monitoring", proj0Desc: "Ultra-compact multi-sensor board mass-produced for major tech enterprises (S-Corp, L-Corp).",
    proj0Tech: "<strong>Technical Details:</strong> Implemented high-speed 24-bit Delta-Sigma ADC acceleration/vibration FFT spectrum analysis circuit. Passive L-C notch filters eliminate high-frequency EMI noise, paired with ultra-dense multi-layer PCB layout.",
    proj0B1: "Ultra-dense custom PCB layout artwork design", proj0B2: "Integrated industrial acceleration, vibration & temp sensors", proj0B3: "RS-485 / BLE hybrid communication interface", proj0B4: "B2B mass-production supply for S-Corp & L-Corp",
    proj1Btn: "-70°C Cold-Chain",
    proj1Title: "BLE Cold-Chain Temperature Monitor", proj1Desc: "Disaster-response ultra-low power nRF52 device tested from -20°C to -70°C for vaccine logistics.",
    proj1Tech: "<strong>Technical Details:</strong> Maximized Nordic nRF52840 SoC DC-DC converter efficiency to achieve 2.1µA standby current. Conformal gel coating prevents condensation in dry ice (-70°C) with external PT100/RTD precision temperature probe AFE.",
    proj1B1: "BLE wireless communication module (Nordic nRF52 Series)", proj1B2: "External temperature sensing probe AFE interface", proj1B3: "Ultra-low temperature low-power firmware architecture", proj1B4: "KC compliance & mass supply for national vaccine logistics",
    proj2Btn: "96dB High-Power",
    proj2Title: "Firefighter Safety PASS Alarm", proj2Desc: "96dB high-power piezo alarm with IP67 waterproof enclosure & OLED interface.",
    proj2Tech: "<strong>Technical Details:</strong> High-Voltage Piezo Driver switching amplifier circuit secures 96dB acoustic output pressure. 3-axis accelerometer sensor triggers auto-alarm after 30s immobility, encased in IP67 dual-sealed waterproof enclosure.",
    proj2B1: "Piezo + resonator chamber 96dB high-power alarm", proj2B2: "OLED display & 3-axis motion sensor integration", proj2B3: "Extreme environment durability (IP67 waterproof & dustproof)", proj2B4: "Full compliance with KC & National Fire Agency standards",
    proj3Btn: "125kHz + 13.56MHz",
    proj3Title: "Dual-Frequency NFC Antenna System", proj3Desc: "Single reader supporting dual 125kHz & 13.56MHz frequencies with metal ferrite shielding.",
    proj3Tech: "<strong>Technical Details:</strong> LC resonance Q-Factor tuning with dual-frequency notch filter to suppress mutual crosstalk. Differential RF amplifier stage with high-permeability ferrite sandwich plate miniaturizes metal clearance distance to under 5mm.",
    proj3B1: "125kHz LF + 13.56MHz HF dual-coil PCB layout", proj3B2: "Crosstalk suppression notch filter design", proj3B3: "50Ω independent matching network & VNA S11 tuning", proj3B4: "High-permeability ferrite substrate for metal enclosures",
    proj4Btn: "High-Speed ToF",
    proj4Title: "Ultrasonic Concrete NDT Equipment", proj4Desc: "High-voltage ultrasonic transducer driver with high-speed ADC ToF precision measurement.",
    proj4Tech: "<strong>Technical Details:</strong> High-Voltage MOSFET half-bridge transducer 300V pulse drive circuit. 100Msps high-speed ADC Time-of-Flight (ToF) sampling algorithm and differential bandpass filter minimize analog signal distortion.",
    proj4B1: "Ultrasonic transducer 300V high-voltage drive circuit", proj4B2: "100Msps high-speed ADC ultra-precise ToF measurement", proj4B3: "Signal filtering & high-frequency noise suppression AFE", proj4B4: "Field portable low-power custom form factor design",
    blogTitle: "Tech Blog & Papers", blogSub: "Practical RF and hardware engineering insights and technical references.",
    blog1Title: "BLE Antenna Impedance Matching & VNA Optimization Guide", blog1Desc: "Complete guide from PCB layout mistakes to VNA S11 Return Loss calibration, VSWR reduction, and antenna selection.",
    blog2Title: "nRF52805 BLE Module Hardware Circuit Design Reference", blog2Desc: "Nordic Semiconductor nRF52805 WLCSP 1st/2nd Build-up PCB design, RF shielding, and VNA antenna tuning process.",
    btnReadDoc: "Read Tech Document",
    faqTitle: "RF Engineering Q&A (50 Items)", faqSub: "Hardware solutions for 2.4GHz interference, antenna matching, AFE noise, and KC/FCC certs",
    contactTitle: "Project Inquiry & Consultation", contactLead: "Facing a tough hardware challenge? Contact 31NS-Tech Product Development LAB for rapid engineering feedback.",
    contactAddr: "Gwangmyeong-si, Gyeonggi-do, Republic of Korea", contactResp: "Engineer review & reply within 24 hours", btnSubmitForm: "SEND INQUIRY PROTOCOL", footerAbout: "20+ years experienced RF/hardware team offering practical total engineering solutions from design to production."
  }
};

let currentLang = 'ko';

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initHeaderScrollState();
  initMobileMenu();
  initActiveNavScroll();
  initPortfolioTabs();
  initFaqAccordion();
  initBlogModal();
  initFormHandler();
  initLangSwitcher();
  initScrollAnimations();

  // Initialize Claude 3D RobotExpressive.glb Interactive Mascot
  try {
    const threeRobot = new ThreeRobot();
    threeRobot.init();
  } catch (err) {
    console.warn('ThreeRobot init warning:', err);
  }

  // Auto-detect English page from URL or <html lang="en">
  if (window.location.pathname.includes('/en') || document.documentElement.lang === 'en') {
    setLanguage('en');
  }
});

// Smooth Dark Header Transition (Dark Slate -> Deeper Dark Obsidian)
function initHeaderScrollState() {
  const header = document.getElementById('site-header');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader);
  updateHeader();
}

// KO / EN Language Toggle Switcher
function initLangSwitcher() {
  const btnKo = document.getElementById('btn-lang-ko');
  const btnEn = document.getElementById('btn-lang-en');

  if (btnKo && btnEn) {
    btnKo.addEventListener('click', () => setLanguage('ko'));
    btnEn.addEventListener('click', () => setLanguage('en'));
  }
}

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang-btn') === lang);
  });

  const dict = i18n[lang];
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  renderFaqList();
}

// Render 50 RF FAQ Accordions with Live Search
function renderFaqList(searchTerm = '') {
  const container = document.getElementById('faq-accordion-container');
  if (!container) return;

  container.innerHTML = '';

  const term = searchTerm.trim().toLowerCase();

  rfFaqData.forEach((item, index) => {
    const question = currentLang === 'ko' ? item.q_ko : item.q_en;
    const answer = currentLang === 'ko' ? item.a_ko : item.a_en;

    if (term && !question.toLowerCase().includes(term) && !answer.toLowerCase().includes(term)) {
      return;
    }

    const numStr = (index + 1).toString().padStart(2, '0');

    const itemEl = document.createElement('div');
    itemEl.className = 'faq-accordion-item';
    itemEl.innerHTML = `
      <button type="button" class="faq-question-btn">
        <span><strong class="faq-q-number">Q${numStr}.</strong> ${question}</span>
        <i class="fas fa-chevron-down faq-chevron"></i>
      </button>
      <div class="faq-answer-panel">
        <p>${answer}</p>
      </div>
    `;

    container.appendChild(itemEl);
  });
}

function initFaqAccordion() {
  renderFaqList();

  const container = document.getElementById('faq-accordion-container');
  if (container && !container.dataset.hasAccordionListener) {
    container.dataset.hasAccordionListener = 'true';
    container.addEventListener('click', (e) => {
      const qBtn = e.target.closest('.faq-question-btn, .faq-question-head, .faq-q-text, .faq-q-number');
      if (qBtn) {
        const item = qBtn.closest('.faq-accordion-item');
        if (item) {
          item.classList.toggle('active');
        }
      }
    });
  }

  const searchInput = document.getElementById('faq-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderFaqList(e.target.value);
    });
  }
}

// Tech Blog Modal Viewers (Includes Full Diagrams and Figures)
function initBlogModal() {
  const modal = document.getElementById('blog-modal');
  const titleEl = document.getElementById('modal-article-title');
  const bodyEl = document.getElementById('modal-article-content');
  const closeBtn = document.getElementById('btn-close-blog-modal');

  const btn1 = document.getElementById('btn-open-blog1');
  const btn2 = document.getElementById('btn-open-blog2');

  if (btn1) {
    btn1.addEventListener('click', () => {
      openBlogDoc("BLE 안테나 정합(매칭)과 RF 회로 최적화 실무 기술자료", `
        <h2>BLE 안테나 정합과 최적화의 모든 것</h2>
        <p><strong>작성일:</strong> 2026-05-15 | <strong>태그:</strong> Hardware, BLE, RF, Embedded</p>
        <hr style="margin:20px 0; border-color:var(--border-dark);" />

        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/BLE_안테나_정합과_최적화_기술자료/img_01.webp" alt="BLE Antenna System Overview" />
        <div class="blog-fig-caption">그림 1. BLE 안테나 시스템 개요 — 50Ω 임피던스 매칭 경로와 불량 설계 비교</div>

        <h3>보이지 않는 파이프라인 (The Invisible Pipeline)</h3>
        <p>RF 신호는 2.4 GHz (파장 약 12.5 cm)로 진동하는 민감한 에너지입니다. 칩셋, 패턴, 안테나가 모두 50옴(Ω)이라는 표준 규격을 맞추지 못하면 에너지는 방사되지 못하고 칩으로 반사되어 수신 거리 감소와 발열을 유발합니다. (VSWR 및 Return Loss 증가)</p>
        
        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/BLE_안테나_정합과_최적화_기술자료/img_02.webp" alt="Matched vs Mismatched" />
        <div class="blog-fig-caption">그림 2. 정합 상태(Matched 50Ω) vs 임피던스 불일치(Mismatched) 비교</div>

        <h3>나에게 맞는 안테나 찾기</h3>
        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/BLE_안테나_정합과_최적화_기술자료/img_03.webp" alt="Antenna Comparison" />
        <div class="blog-fig-caption">그림 3. IFA / 세라믹 칩 / 외장 휩 안테나 비교 분석</div>

        <ul>
          <li><strong>Inverted-F (IFA) — 역F형 패턴 안테나:</strong> 공간 15×25mm, 방사 효율 70%~80%, 비용 Zero. 가장 추천하는 표준 방식 (스마트 센서, 비콘).</li>
          <li><strong>Ceramic Chip — 세라믹 칩 안테나:</strong> 공간 3×2mm, 방사 효율 20%~50%. 초소형 기기에 적합하나 효율이 낮음.</li>
          <li><strong>Wire & Monopole — 외장 휩 안테나:</strong> 31mm 길이, 방사 효율 80%~90%. 고성능 산업용 장비에 최적.</li>
        </ul>

        <h3>VNA 튜닝 실무 프로세스</h3>
        <p>Vector Network Analyzer 계측 장비의 Port Extension 상차 보정을 마친 후, S11 Smith Chart 상의 임피던스 궤적이 50Ω 중심점에 정확히 수렴하도록 Pi(π) 매칭 네트워크의 L, C 값을 정밀 조율합니다.</p>
      `);
    });
  }

  if (btn2) {
    btn2.addEventListener('click', () => {
      openBlogDoc("nRF52805 BLE 모듈 회로 설계 및 개발 기술 참고문서", `
        <h2>nRF52805 BLE 모듈 개발 기술 참고문서</h2>
        <p><strong>작성일:</strong> 2026-05-14 | <strong>태그:</strong> Hardware, BLE, Nordic, WLCSP</p>
        <hr style="margin:20px 0; border-color:var(--border-dark);" />

        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/nRF52805_BLE모듈_개발기술참고문서_이미지포함/img_01.webp" alt="Raytac Module Reference" />
        <div class="blog-fig-caption">그림 1. Raytac nRF52805 모듈 참도 핀아웃 및 안테나 설계 분석</div>

        <h3>nRF52805 WLCSP 패키지 아트워크 고려사항</h3>
        <p>0.09mm 극소형 패드를 사용하는 WLCSP 패키지 특성상 Build-up PCB 사양(2층/4층)에 맞춰 안테나 패턴 타입과 쉴드 캔(Can) 영역을 사전 설계해야 합니다.</p>

        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/nRF52805_BLE모듈_개발기술참고문서_이미지포함/img_02.webp" alt="Nordic Reference BOM" />
        <div class="blog-fig-caption">그림 2. Nordic 레퍼런스 BOM / 0603 대처 수동소자 인치 규격표</div>

        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/nRF52805_BLE모듈_개발기술참고문서_이미지포함/img_03.webp" alt="Inch to mm Reference" />
        <div class="blog-fig-caption">그림 3. SMD 소자 Inch - mm 변환 치수표</div>

        <img src="https://cdn.jsdelivr.net/gh/promisesmk/31ns-Home-blog-assets@main/nRF52805_BLE모듈_개발기술참고문서_이미지포함/img_04.webp" alt="Raytac DK Board" />
        <div class="blog-fig-caption">그림 4. Raytac 개발키트(DK) 보드 레이아웃 및 핑인터페이스 JIG</div>

        <h3>주요 회로 검토 항목</h3>
        <ul>
          <li><strong>Build-up A, B, C:</strong> 층간 비아 인패드(Via-in-pad) 채움 공정 및 50Ω 임피던스 가이드 line 적용.</li>
          <li><strong>RF 쉴딩 캔:</strong> 외부 EMI 노이즈 차단을 위한 캔 립(Can lip) 접지 패턴 1.0mm 간격 배치.</li>
          <li><strong>시품 RF 튜닝:</strong> 1차 기판 제작 후 안테나 튜닝을 실행하고, 2차 메인보드 결합 시 추가 정합 튜닝 수행.</li>
        </ul>
      `);
    });
  }

  function openBlogDoc(title, htmlContent) {
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = htmlContent;
    if (modal) modal.classList.add('open');
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
}

// Custom Magnetic Cursor Effect
function initCustomCursor() {
  const dot = document.getElementById('cursor-dot');
  const follower = document.getElementById('cursor-follower');

  if (!dot || !follower || window.innerWidth <= 768) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
  });

  function renderCursor() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderCursor);
  }
  renderCursor();

  const hoverables = document.querySelectorAll('.magnetic-hover, a, button, .portfolio-luxe-card');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('hovering'));
    el.addEventListener('mouseleave', () => follower.classList.remove('hovering'));
  });
}

// Mobile Menu Navigation Toggle
function initMobileMenu() {
  const btn = document.getElementById('mobile-toggle');
  const nav = document.getElementById('nav-container');

  if (btn && nav) {
    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });

    const links = nav.querySelectorAll('.nav-item');
    links.forEach(l => {
      l.addEventListener('click', () => {
        nav.classList.remove('open');
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      });
    });
  }
}

// Active Nav Item on Scroll
function initActiveNavScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.pageYOffset;

    sections.forEach(sec => {
      const secHeight = sec.offsetHeight;
      const secTop = sec.offsetTop - 140;
      if (scrollPos >= secTop && scrollPos < secTop + secHeight) {
        current = sec.getAttribute('id');
      }
    });

    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${current}`) {
        item.classList.add('active');
      }
    });
  });
}

// Portfolio Dynamic Category Filter
function initPortfolioTabs() {
  const tabs = document.querySelectorAll('.filter-tab-btn');
  const cards = document.querySelectorAll('.portfolio-luxe-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const cat = tab.getAttribute('data-filter');

      cards.forEach(card => {
        const cardCat = card.getAttribute('data-category');

        if (cat === 'all' || cat === cardCat) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

// Terminal Form Submission Handler
function initFormHandler() {
  const form = document.getElementById('consultation-form');
  const formMsg = document.getElementById('form-msg');
  const submitBtn = document.getElementById('submit-btn');

  if (form && submitBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('user-name')?.value;
      const email = document.getElementById('user-email')?.value;
      const message = document.getElementById('user-message')?.value;

      if (!name || !email || !message) {
        if (formMsg) {
          formMsg.style.color = '#FF5F56';
          formMsg.textContent = '> ERROR: 모든 필수 항목을 입력해주세요.';
        }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>TRANSMITTING PROTOCOL...</span> <i class="fas fa-spinner fa-spin"></i>';

      setTimeout(() => {
        if (formMsg) {
          formMsg.style.color = '#b4e300';
          formMsg.textContent = `> SUCCESS: ${name}님, 문의가 안전하게 전달되었습니다. 24시간 이내에 ${email}로 회신드리겠습니다!`;
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>SEND INQUIRY PROTOCOL</span> <i class="fas fa-paper-plane"></i>';
        form.reset();
      }, 1200);
    });
  }
}

// Scroll Intersection Observer Animations
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.capability-luxe-card, .process-step-item, .portfolio-luxe-card, .blog-card-luxe, .contact-card-item').forEach(el => {
    observer.observe(el);
  });
}
