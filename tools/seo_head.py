"""공개 페이지 <head>의 SEO 태그(title·description·canonical·hreflang·OG·구조화 데이터)를 한 번에 맞춥니다.
sitemap.xml도 같은 표(PAGES · LASTMOD)로 다시 만듭니다. 여러 번 실행해도 결과가 같습니다.
사용: 저장소 루트에서 python3 tools/seo_head.py"""
import json
import re
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
SITE = 'https://31ns.kr'
OG_IMAGE = f'{SITE}/assets/og-image.png'
ORG_ID = f'{SITE}/#organization'

# path -> (url path, lang, title, description, og type, translation path or None)
PAGES = {
    'index.html': ('/', 'ko', '31NS-Tech | RF·BLE·NFC 회로 설계부터 양산까지, 하드웨어 제품 개발',
                   'RF·BLE·NFC 무선, 센서 AFE, 모터 제어 회로 설계부터 시제품, KC·FCC·CE 인증 대응, 양산 연계까지 하드웨어 제품 개발을 지원하는 31NS-Tech입니다.',
                   'website', 'en/index.html'),
    'en/index.html': ('/en/', 'en', '31NS-Tech | Hardware Product Development from Circuit to Production',
                      '31NS-Tech hardware engineering: RF, BLE and NFC, sensor and analog circuits, motor control, prototyping, certification support and the transition to mass production.',
                      'website', 'index.html'),
    '2.4ghz.html': ('/2.4ghz.html', 'ko', '2.4GHz BLE 무선 제품 개발 | 멀티벤더 칩·모듈 회로 설계 — 31NS-Tech',
                    'Nordic·TI·Silicon Labs·Espressif·NXP·Telink 2.4GHz 칩·모듈 검토부터 회로·안테나 설계, VNA 튜닝, KC·FCC·CE 인증 대응과 양산 연계까지.',
                    'website', 'en/2.4ghz.html'),
    'en/2.4ghz.html': ('/en/2.4ghz.html', 'en', '2.4GHz Wireless Product Development | Multi-Vendor Chips & Modules — 31NS-Tech',
                       'From evaluating 2.4GHz chips and modules from Nordic, TI, Silicon Labs, Espressif, NXP and Telink to circuit and antenna design, VNA tuning, certification and production.',
                       'website', '2.4ghz.html'),
    'blog/index.html': ('/blog/', 'ko', '기술 블로그 | BLE 안테나 정합 · nRF52805 설계 문서 — 31NS-Tech',
                        'BLE 안테나 정합과 nRF52805 모듈 설계를 그림 · 회로 · 측정 과정과 함께 정리한 31NS-Tech 기술 문서입니다.',
                        'website', 'en/blog/index.html'),
    'en/blog/index.html': ('/en/blog/', 'en', 'Technical Blog | BLE Antenna Matching · nRF52805 Design Notes — 31NS-Tech',
                           'Technical notes with circuits, figures and measurements on BLE antenna matching and nRF52805 module design.',
                           'website', 'blog/index.html'),
    'blog/ble-antenna-matching/index.html': ('/blog/ble-antenna-matching/', 'ko', 'BLE 안테나 정합(매칭)과 RF 회로 최적화 실무 기술자료 | 31NS-Tech',
                                             'BLE 제품의 50Ω 임피던스 매칭, IFA · 칩 · 휩 안테나 비교, VNA S11 스미스 차트 튜닝 절차를 그림과 함께 정리한 실무 기술자료입니다.',
                                             'article', 'en/blog/ble-antenna-matching/index.html'),
    'en/blog/ble-antenna-matching/index.html': ('/en/blog/ble-antenna-matching/', 'en', 'BLE Antenna Matching and RF Circuit Optimization: A Practical Guide | 31NS-Tech',
                                                'A look at 50Ω impedance matching, IFA, chip and whip antenna comparison, and hands-on VNA S11 Smith chart tuning.',
                                                'article', 'blog/ble-antenna-matching/index.html'),
    'blog/nrf52805-design/index.html': ('/blog/nrf52805-design/', 'ko', 'nRF52805 BLE 모듈 회로 설계 및 개발 기술 참고문서 | 31NS-Tech',
                                        'nRF52805 WLCSP 패키지 아트워크, Build-up PCB와 쉴드캔, 레퍼런스 BOM, 시제품 RF 튜닝 검토 항목을 정리한 기술 참고문서입니다.',
                                        'article', 'en/blog/nrf52805-design/index.html'),
    'en/blog/nrf52805-design/index.html': ('/en/blog/nrf52805-design/', 'en', 'nRF52805 BLE Module Circuit Design and Development Reference | 31NS-Tech',
                                           'Review points for nRF52805 WLCSP layout, build-up PCB and shield can, reference BOM, and prototype RF tuning.',
                                           'article', 'blog/nrf52805-design/index.html'),
    'rf-faq/index.html': ('/rf-faq/', 'ko', 'RF·BLE 실무 Q&A 50선 | 안테나 · 저전력 · 인증 · 양산 — 31NS-Tech',
                          'RF · 안테나, BLE 저전력, 노이즈 · 신뢰성, 인증 · 규격, 양산 · 개발 관리에 대한 50개 실무 질문과 답변.',
                          'website', 'en/rf-faq/index.html'),
    'en/rf-faq/index.html': ('/en/rf-faq/', 'en', '50 Practical RF & BLE Questions Answered | 31NS-Tech',
                             '50 practical questions and answers on RF, antennas, low-power BLE, reliability, certification and production.',
                             'website', 'rf-faq/index.html'),
    'pcb-viewer/index.html': ('/pcb-viewer/', 'ko', 'PCB 3D Builder | PADS ASC 또는 DXF로 PCB 3D STEP 만들기 — 31NS-Tech',
                              'PADS ASCII(.asc) 또는 DXF(필요하면 좌표 파일)로 부품이 배치된 PCB 3D STEP 모델을 만드는 Windows 프로그램. 부품 모델 매칭 · 자동 정렬, 데이터시트 PDF로 부품 3D 만들기, 높이 확인과 엑셀 검토 보고서를 지원합니다.',
                              'website', 'en/pcb-viewer/index.html'),
    'pcb-viewer/guide/index.html': ('/pcb-viewer/guide/', 'ko', 'PCB 3D Builder 사용 가이드 | 보드 입력부터 STEP 저장까지 — 31NS-Tech',
                                    'PCB 3D Builder v2.1 사용설명서와 소스를 바탕으로 설계 파일 입력, 부품 모델 확인 · 보정, STEP 저장(PNG · 엑셀 보고서는 부가 기능)과 검토 순서를 정리한 가이드입니다.',
                                    'article', 'en/pcb-viewer/guide/index.html'),
    'en/pcb-viewer/index.html': ('/en/pcb-viewer/', 'en', 'PCB 3D Builder | Create PCB 3D STEP Models from PADS ASC or DXF — 31NS-Tech',
                                 'A Windows program that builds a 3D STEP model of a populated PCB from PADS ASCII (.asc), or from DXF with a placement file if needed. Includes part model matching and auto alignment, part 3D from datasheet PDFs, height checks and an Excel review report.',
                                 'website', 'pcb-viewer/index.html'),
    'en/pcb-viewer/guide/index.html': ('/en/pcb-viewer/guide/', 'en', 'PCB 3D Builder User Guide | From Board Input to STEP Export — 31NS-Tech',
                                       'A step-by-step guide based on the PCB 3D Builder v2.1 user manual and source: design file input, part model check and adjustment, and saving and reviewing the STEP, with the PNG image and Excel report as extras.',
                                       'article', 'pcb-viewer/guide/index.html'),
}

LOCALE = {'ko': 'ko_KR', 'en': 'en_US'}


def esc(v):
    return v.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'


ORGANIZATION = {
    '@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech', 'url': f'{SITE}/',
    'logo': f'{SITE}/assets/brand-logo.png', 'email': 'nskim@31ns.kr',
    'address': {'@type': 'PostalAddress', 'streetAddress': '광명역로 28', 'addressLocality': '광명시',
                'addressRegion': '경기도', 'addressCountry': 'KR'}
}

STRUCTURED = {
    'index.html': {'@context': 'https://schema.org', '@graph': [
        ORGANIZATION,
        {'@type': 'WebSite', '@id': f'{SITE}/#website', 'url': f'{SITE}/', 'name': '31NS-Tech',
         'inLanguage': 'ko-KR', 'publisher': {'@id': ORG_ID}}]},
    'en/index.html': {'@context': 'https://schema.org', '@type': 'WebSite', '@id': f'{SITE}/en/#website',
                      'url': f'{SITE}/en/', 'name': '31NS-Tech', 'inLanguage': 'en', 'publisher': {'@id': ORG_ID}},
    'pcb-viewer/index.html': {'@context': 'https://schema.org', '@type': 'SoftwareApplication',
                              'name': 'PCB 3D Builder', 'softwareVersion': '2.1',
                              'applicationCategory': 'DesignApplication',
                              'operatingSystem': 'Windows 10, Windows 11 (64-bit)',
                              'url': f'{SITE}/pcb-viewer/', 'inLanguage': 'ko-KR',
                              'description': 'PADS ASCII(.asc) 또는 DXF(필요하면 좌표 파일)로 부품이 배치된 PCB 3D STEP 모델을 만드는 Windows 프로그램',
                              'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'KRW'},
                              'publisher': {'@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech', 'url': f'{SITE}/'}},
    'en/pcb-viewer/index.html': {'@context': 'https://schema.org', '@type': 'SoftwareApplication',
                                 'name': 'PCB 3D Builder', 'softwareVersion': '2.1',
                                 'applicationCategory': 'DesignApplication',
                                 'operatingSystem': 'Windows 10, Windows 11 (64-bit)',
                                 'url': f'{SITE}/en/pcb-viewer/', 'inLanguage': 'en',
                                 'description': 'A Windows program that builds a 3D STEP model of a populated PCB from PADS ASCII (.asc), or from DXF with a placement file',
                                 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'KRW'},
                                 'publisher': {'@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech', 'url': f'{SITE}/'}},
}

# Sitemap lastmod: only where the content change date is known (YYYY-MM-DD). Pages not listed get no lastmod.
LASTMOD = {
    'index.html': '2026-10-15',
    'en/index.html': '2026-10-15',
    '2.4ghz.html': '2026-10-16',
    'en/2.4ghz.html': '2026-10-16',
    'blog/index.html': '2026-10-15',
    'en/blog/index.html': '2026-10-15',
    'blog/ble-antenna-matching/index.html': '2026-10-15',
    'en/blog/ble-antenna-matching/index.html': '2026-10-15',
    'blog/nrf52805-design/index.html': '2026-10-15',
    'en/blog/nrf52805-design/index.html': '2026-10-15',
    'rf-faq/index.html': '2026-10-15',
    'en/rf-faq/index.html': '2026-10-15',
    'pcb-viewer/index.html': '2026-10-15',
    'pcb-viewer/guide/index.html': '2026-10-15',
    'en/pcb-viewer/index.html': '2026-10-15',
    'en/pcb-viewer/guide/index.html': '2026-10-15',
}
OG_ALT = {'ko': '31NS-Tech — 회로에서 제품까지', 'en': '31NS-Tech — From circuit to product'}

STRIP = [
    r'<title>.*?</title>',
    r'<meta name="description"[^>]*>',
    r'<meta name="title"[^>]*>',
    r'<meta name="keywords"[^>]*>',
    r'<link rel="canonical"[^>]*>',
    r'<link rel="alternate" hreflang="[^"]*"[^>]*>',
    r'<meta property="og:[^"]*"[^>]*>',
    r'<meta name="twitter:[^"]*"[^>]*>',
    r'<!-- seo:start -->|<!-- seo:end -->',
    r'<script type="application/ld\+json" data-seo>.*?</script>',
]


def build(path):
    url_path, lang, title, desc, og_type, alt = PAGES[path]
    url = SITE + url_path
    tags = [f'<title>{esc(title)}</title>', f'<meta name="description" content="{esc(desc)}">',
            f'<link rel="canonical" href="{url}">',
            # site icon (from the teal mark of the existing brand logo): /favicon.ico at the root + touch icon
            '<link rel="icon" href="/favicon.ico" sizes="any">', '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">']
    if alt:
        other = SITE + PAGES[alt][0]
        ko, en = (url, other) if lang == 'ko' else (other, url)
        tags += [f'<link rel="alternate" hreflang="ko" href="{ko}">', f'<link rel="alternate" hreflang="en" href="{en}">',
                 f'<link rel="alternate" hreflang="x-default" href="{ko}">']
    tags += [f'<meta property="og:type" content="{og_type}">', f'<meta property="og:site_name" content="31NS-Tech">',
             f'<meta property="og:locale" content="{LOCALE[lang]}">', f'<meta property="og:url" content="{url}">',
             f'<meta property="og:title" content="{esc(title)}">', f'<meta property="og:description" content="{esc(desc)}">',
             f'<meta property="og:image" content="{OG_IMAGE}">', '<meta property="og:image:width" content="1200">',
             '<meta property="og:image:height" content="630">',
             f'<meta property="og:image:alt" content="{OG_ALT[lang]}">',
             '<meta name="twitter:card" content="summary_large_image">']
    if path in STRUCTURED:
        tags.append(jsonld(STRUCTURED[path]).replace('<script type="application/ld+json">', '<script type="application/ld+json" data-seo>'))
    return '<!-- seo:start -->' + ''.join(tags) + '<!-- seo:end -->'


for path in PAGES:
    full = f'{ROOT}/{path}'
    s = open(full, encoding='utf-8').read()
    head_end = s.index('</head>')
    head, rest = s[:head_end], s[head_end:]
    for pat in STRIP:
        head = re.sub(pat, '', head, flags=re.S)
    m = re.search(r'<meta (?:content="width=device-width[^"]*" name="viewport"|name="viewport" content="[^"]*")>', head)
    assert m, path
    head = head[:m.end()] + build(path) + head[m.end():]
    open(full, 'w', encoding='utf-8').write(head + rest)
    print('ok', path)


def sitemap():
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for path, (url_path, lang, _t, _d, _o, alt) in PAGES.items():
        lines.append('  <url>')
        lines.append(f'    <loc>{SITE}{url_path}</loc>')
        if path in LASTMOD:
            lines.append(f'    <lastmod>{LASTMOD[path]}</lastmod>')
        if alt:
            ko, en = (url_path, PAGES[alt][0]) if lang == 'ko' else (PAGES[alt][0], url_path)
            for code, href in (('ko', ko), ('en', en), ('x-default', ko)):
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{code}" href="{SITE}{href}"/>')
        lines.append('  </url>')
    lines.append('</urlset>')
    open(f'{ROOT}/sitemap.xml', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('ok sitemap.xml', len(PAGES), 'urls')


sitemap()
