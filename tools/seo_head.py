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
    'index.html': ('/', 'ko', '31NS-Tech 삼일앤에스테크 | RF·BLE 회로설계 · PCB 아트웍부터 양산까지 하드웨어 개발',
                   'RF·BLE·NFC 회로설계와 PCB 아트웍 외주, 센서 · 모터 제어, 임베디드 펌웨어, 시제품, KC·FCC·CE 인증 대응, 양산까지 하드웨어 개발 용역 — 삼일앤에스테크(31NS-Tech).',
                   'website', 'en/index.html'),
    'en/index.html': ('/en/', 'en', '31NS-Tech | Electronics Design Services: RF/BLE Circuits, PCB Layout to Production',
                      'Electronics design services: RF, BLE and NFC circuits, PCB layout, sensors, motor control, firmware, prototypes, KC/FCC/CE certification and production.',
                      'website', 'index.html'),
    '2.4ghz.html': ('/2.4ghz.html', 'ko', '2.4GHz BLE 무선 제품 개발 | 멀티벤더 칩·모듈 회로 설계 — 31NS-Tech',
                    'Nordic·TI·Silicon Labs·Espressif·NXP·Telink 2.4GHz 칩·모듈 검토부터 회로·안테나 설계, VNA 튜닝, KC·FCC·CE 인증 대응과 양산 연계까지.',
                    'website', 'en/2.4ghz.html'),
    'en/2.4ghz.html': ('/en/2.4ghz.html', 'en', '2.4GHz Wireless Product Development | Multi-Vendor Chips & Modules — 31NS-Tech',
                       '2.4GHz BLE product development: Nordic, TI, Silicon Labs, Espressif, NXP and Telink chip selection, RF circuit and antenna design, tuning, certification.',
                       'website', '2.4ghz.html'),
    'rf-faq/index.html': ('/rf-faq/', 'ko', 'RF·BLE 실무 Q&A 50선 | 안테나 · 저전력 · 인증 · 양산 — 31NS-Tech',
                          'RF · 안테나, BLE 저전력, 노이즈 · 신뢰성, 인증 · 규격, 양산 · 개발 관리에 대한 50개 실무 질문과 답변.',
                          'website', 'en/rf-faq/index.html'),
    'en/rf-faq/index.html': ('/en/rf-faq/', 'en', '50 Practical RF & BLE Questions Answered | 31NS-Tech',
                             '50 practical questions and answers on RF, antennas, low-power BLE, reliability, certification and production.',
                             'website', 'rf-faq/index.html'),
    'pcb-viewer/index.html': ('/pcb-viewer/', 'ko', 'PCB 3D Builder | 무료 PCB 3D STEP 변환 프로그램 (PADS ASC · 거버 · DXF) — 31NS-Tech',
                              'PADS ASC · 거버 + 좌표 · DXF를 끌어다 놓으면 부품까지 붙은 PCB 3D STEP을 만드는 무료 Windows 프로그램. KiCad 3D 모델 자동 매칭, 케이스 높이 확인.',
                              'website', 'en/pcb-viewer/index.html'),
    'pcb-viewer/guide/index.html': ('/pcb-viewer/guide/', 'ko', 'PCB 3D Builder 사용 가이드 | 보드 입력부터 STEP 저장까지 — 31NS-Tech',
                                    'PCB 3D Builder 4.0 사용 가이드: ASC · 거버 · DXF 입력, 3D 자동 채우기, 부품 확인 · 보정, 3D 자유 배치, STEP 저장과 문제 해결.',
                                    'article', 'en/pcb-viewer/guide/index.html'),
    'en/pcb-viewer/index.html': ('/en/pcb-viewer/', 'en', 'PCB 3D Builder | Free PCB to 3D STEP Converter (PADS ASC · Gerber · DXF) — 31NS-Tech',
                                 'Free Windows program that turns PADS ASC, Gerber + placement or DXF into a 3D STEP of the populated PCB, with KiCad 3D model matching and height checks.',
                                 'website', 'pcb-viewer/index.html'),
    'en/pcb-viewer/guide/index.html': ('/en/pcb-viewer/guide/', 'en', 'PCB 3D Builder User Guide | From Board Input to STEP Export — 31NS-Tech',
                                       'Step-by-step PCB 3D Builder 4.0 guide: ASC, Gerber and DXF input, 3D auto-fill, part check and adjust, free placement, STEP export and troubleshooting.',
                                       'article', 'pcb-viewer/guide/index.html'),
    'cases/industrial-iot/index.html': ('/cases/industrial-iot/', 'ko', '산업용 설비 예측진단 센서 개발 사례 | 진동 · 초음파 · RS-485 — 31NS-Tech',
                                        '25 × 49 × 15mm 외함에 3축 진동 · 경사 · 초음파 센서를 담은 설비 부착형 예측진단 센서. 센서 보드 회로 · 아트워크와 RS-485 통신 설계, 사양과 고장별 측정 파형.',
                                        'article', 'en/cases/industrial-iot/index.html'),
    'en/cases/industrial-iot/index.html': ('/en/cases/industrial-iot/', 'en', 'Industrial Predictive Maintenance Sensor Case Study | Vibration · Ultrasound · RS-485 — 31NS-Tech',
                                           'Case study: an equipment-mounted predictive maintenance sensor with vibration, tilt and ultrasound sensing, board design and RS-485 communication.',
                                           'article', 'cases/industrial-iot/index.html'),
    'cases/golf-grip-sensor/index.html': ('/cases/golf-grip-sensor/', 'ko', '스마트 골프클럽 그립 압력 · 스윙 센서 개발 사례 | BLE · 24-bit ADC — 31NS-Tech',
                                          '골프 그립 안에서 8채널 그립 압력과 6축 모션 · 3축 지자기를 측정해 BLE로 앱에 보내는 센서 보드. 회로 개발부터 PCB 어셈블리 공급까지, 설계 범위와 블록 구성.',
                                          'article', 'en/cases/golf-grip-sensor/index.html'),
    'en/cases/golf-grip-sensor/index.html': ('/en/cases/golf-grip-sensor/', 'en', 'Smart Golf Club Grip Pressure & Swing Sensor Case Study | BLE · 24-bit ADC — 31NS-Tech',
                                             'Case study: a golf grip sensor board measuring 8-channel grip pressure and motion, sent to an app over BLE, from circuit design to assembled PCB supply.',
                                             'article', 'cases/golf-grip-sensor/index.html'),
    'privacy/index.html': ('/privacy/', 'ko', '개인정보처리방침 — 31NS-Tech (삼일앤에스테크)',
                           '삼일앤에스테크(31NS-Tech) 홈페이지의 개인정보 수집 항목 · 목적 · 보유 기간, 처리 위탁과 국외 이전, 이용자의 권리와 보호책임자 안내.',
                           'website', 'en/privacy/index.html'),
    'en/privacy/index.html': ('/en/privacy/', 'en', 'Privacy Policy — 31NS-Tech',
                              'What personal information the 31NS-Tech website collects, why, how long it is kept, processors and transfer abroad, and your rights.',
                              'website', 'privacy/index.html'),
}

LOCALE = {'ko': 'ko_KR', 'en': 'en_US'}


def esc(v):
    return v.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'


ORGANIZATION = {
    '@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech', 'alternateName': ['삼일앤에스테크', '31NS Tech'], 'url': f'{SITE}/',
    'description': 'RF·BLE·NFC 회로설계, PCB 아트웍, 센서 · 모터 제어, 임베디드 펌웨어, 시제품과 KC·FCC·CE 인증 대응, 양산 연계까지 하드웨어 제품 개발',
    'knowsAbout': ['회로설계', 'PCB 아트웍', 'RF 회로 설계', 'BLE 제품 개발', 'NFC 안테나', '안테나 매칭', '센서 AFE', '모터 제어', '임베디드 펌웨어', 'KC 인증', 'FCC 인증', 'CE 인증', 'PCB 3D STEP'],
    'areaServed': 'KR',
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
                              'name': 'PCB 3D Builder', 'softwareVersion': '4.0.1',
                              'applicationCategory': 'DesignApplication',
                              'operatingSystem': 'Windows 10, Windows 11 (64-bit)',
                              'screenshot': [f'{SITE}/assets/pcb3d/step4-parts-3d.webp', f'{SITE}/assets/pcb3d/step1-drop.webp', f'{SITE}/assets/pcb3d/step5-check.webp'], 'image': f'{SITE}/assets/og-pcb3d.png',
                              'url': f'{SITE}/pcb-viewer/', 'inLanguage': 'ko-KR',
                              'description': 'PADS ASCII(.asc) 또는 DXF(필요하면 좌표 파일)로 부품이 배치된 PCB 3D STEP 모델을 만드는 Windows 프로그램',
                              'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'KRW'},
                              'publisher': {'@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech', 'url': f'{SITE}/'}},
    'en/pcb-viewer/index.html': {'@context': 'https://schema.org', '@type': 'SoftwareApplication',
                                 'name': 'PCB 3D Builder', 'softwareVersion': '4.0.1',
                                 'applicationCategory': 'DesignApplication',
                                 'operatingSystem': 'Windows 10, Windows 11 (64-bit)',
                                 'screenshot': [f'{SITE}/assets/pcb3d/step4-parts-3d.webp', f'{SITE}/assets/pcb3d/step1-drop.webp', f'{SITE}/assets/pcb3d/step5-check.webp'], 'image': f'{SITE}/assets/og-pcb3d.png',
                              'url': f'{SITE}/en/pcb-viewer/', 'inLanguage': 'en',
                                 'description': 'A Windows program that builds a 3D STEP model of a populated PCB from PADS ASCII (.asc), or from DXF with a placement file',
                                 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'KRW'},
                                 'publisher': {'@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech', 'url': f'{SITE}/'}},
}

# Breadcrumbs (Home > section > page) and article types for pages without their own structured data
CRUMB = {
    'ko': {'home': '홈', 'cases': ('개발 사례', '/#case-studies-section'), 'res': ('기술 자료', '/#technical-resources-section'), 'pcb': ('PCB 3D Builder', '/pcb-viewer/')},
    'en': {'home': 'Home', 'cases': ('Case Studies', '/en/#case-studies-section'), 'res': ('Resources', '/en/#technical-resources-section'), 'pcb': ('PCB 3D Builder', '/en/pcb-viewer/')},
}
TRAIL = {  # path -> parent crumbs before the page itself
    '2.4ghz.html': ['res'], 'en/2.4ghz.html': ['res'], 'rf-faq/index.html': ['res'], 'en/rf-faq/index.html': ['res'],
    'pcb-viewer/index.html': ['res'], 'en/pcb-viewer/index.html': ['res'],
    'pcb-viewer/guide/index.html': ['res', 'pcb'], 'en/pcb-viewer/guide/index.html': ['res', 'pcb'],
    'cases/industrial-iot/index.html': ['cases'], 'en/cases/industrial-iot/index.html': ['cases'],
    'cases/golf-grip-sensor/index.html': ['cases'], 'en/cases/golf-grip-sensor/index.html': ['cases'],
}
ARTICLE = {  # path -> (type, image)
    'cases/industrial-iot/index.html': ('Article', '/assets/cases/industrial-sensor-product.webp'),
    'en/cases/industrial-iot/index.html': ('Article', '/assets/cases/industrial-sensor-product.webp'),
    'cases/golf-grip-sensor/index.html': ('Article', '/assets/og-image.png'),
    'en/cases/golf-grip-sensor/index.html': ('Article', '/assets/og-image.png'),
    'pcb-viewer/guide/index.html': ('TechArticle', '/assets/pcb3d/step4-parts-3d.webp'),
    'en/pcb-viewer/guide/index.html': ('TechArticle', '/assets/pcb3d/step4-parts-3d.webp'),
}
# Images listed in the sitemap (helps image search for the product pages)
SITEMAP_IMAGES = {
    'pcb-viewer/index.html': ['/assets/og-pcb3d.png', '/assets/pcb3d/hero-3d-board.webp', '/assets/pcb3d/step1-drop.webp', '/assets/pcb3d/step2-loading.webp', '/assets/pcb3d/step3-board-confirm.webp', '/assets/pcb3d/step4-parts-3d.webp', '/assets/pcb3d/step5-check.webp', '/assets/pcb3d/step6-step-save.webp'],
    'cases/industrial-iot/index.html': ['/assets/cases/industrial-sensor-product.webp', '/assets/cases/industrial-sensor.webp'],
    '2.4ghz.html': ['/assets/rf-report/rf-tuning-report-p1.webp', '/assets/rf-report/rf-tuning-report-p3.webp'],
}
SITEMAP_IMAGES['en/pcb-viewer/index.html'] = SITEMAP_IMAGES['pcb-viewer/index.html']


def faq_from_page(path, lang):
    """FAQPage from the page's own visible FAQ (<details class="faq-entry">), so the two never drift apart."""
    import html as _html
    s = open(f'{ROOT}/{path}', encoding='utf-8').read()
    items = re.findall(r'<span class="faq-question">(.*?)</span>.*?<p class="faq-answer-copy">(.*?)</p>', s, flags=re.S)
    text = lambda h: _html.unescape(re.sub(r'<[^>]+>', '', h)).strip()
    return {'@type': 'FAQPage', 'inLanguage': 'ko-KR' if lang == 'ko' else 'en',
            'mainEntity': [{'@type': 'Question', 'name': text(q), 'acceptedAnswer': {'@type': 'Answer', 'text': text(a)}} for q, a in items]}


def graph_for(path):
    url_path, lang, title, desc, _og, _alt = PAGES[path]
    nodes = []
    if path in STRUCTURED:
        base = dict(STRUCTURED[path]); base.pop('@context', None)
        nodes += base.pop('@graph') if '@graph' in base else [base]
    if path in TRAIL:
        c = CRUMB[lang]
        items = [(c['home'], '/' if lang == 'ko' else '/en/')] + [c[k] for k in TRAIL[path]] + [(title.split(' | ')[0].split(' — ')[0], url_path)]
        nodes.append({'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i, 'name': n, 'item': SITE + u} for i, (n, u) in enumerate(items, 1)]})
    if path in ARTICLE:
        kind, image = ARTICLE[path]
        nodes.append({'@type': kind, 'headline': title.split(' — ')[0][:110], 'description': desc, 'url': SITE + url_path,
                      'mainEntityOfPage': SITE + url_path, 'inLanguage': 'ko-KR' if lang == 'ko' else 'en', 'image': SITE + image,
                      'dateModified': LASTMOD.get(path), 'author': {'@id': ORG_ID}, 'publisher': {'@id': ORG_ID}})
    if path in ('pcb-viewer/index.html', 'en/pcb-viewer/index.html'):
        nodes.append(faq_from_page(path, lang))
    if not nodes:
        return None
    return nodes[0] | {'@context': 'https://schema.org'} if len(nodes) == 1 else {'@context': 'https://schema.org', '@graph': nodes}


# Sitemap lastmod: only where the content change date is known (YYYY-MM-DD). Pages not listed get no lastmod.
LASTMOD = {
    'index.html': '2026-10-23',
    'en/index.html': '2026-10-23',
    '2.4ghz.html': '2026-10-16',
    'en/2.4ghz.html': '2026-10-16',
    'rf-faq/index.html': '2026-10-15',
    'en/rf-faq/index.html': '2026-10-15',
    'pcb-viewer/index.html': '2026-10-24',
    'pcb-viewer/guide/index.html': '2026-10-23',
    'en/pcb-viewer/index.html': '2026-10-24',
    'en/pcb-viewer/guide/index.html': '2026-10-23',
    'cases/industrial-iot/index.html': '2026-10-19',
    'en/cases/industrial-iot/index.html': '2026-10-19',
    'cases/golf-grip-sensor/index.html': '2026-10-19',
    'en/cases/golf-grip-sensor/index.html': '2026-10-19',
    'privacy/index.html': '2026-10-23',
    'en/privacy/index.html': '2026-10-23',
}
# 블로그 글: 작성일은 본문의 <time>과 같게 (기술 블로그는 2026-10-20 삭제 — 다시 만들면 여기에 추가)
BLOG_PUBLISHED = {}
for _path, _published in BLOG_PUBLISHED.items():
    _url_path, _lang, _title, _desc, _og, _alt = PAGES[_path]
    STRUCTURED[_path] = {'@context': 'https://schema.org', '@type': 'BlogPosting',
                         'headline': _title.rsplit(' | ', 1)[0], 'description': _desc,
                         'url': f'{SITE}{_url_path}', 'mainEntityOfPage': f'{SITE}{_url_path}',
                         'inLanguage': 'ko-KR' if _lang == 'ko' else 'en', 'image': OG_IMAGE,
                         'datePublished': _published, 'dateModified': LASTMOD.get(_path, _published),
                         'author': {'@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech'},
                         'publisher': {'@type': 'Organization', '@id': ORG_ID, 'name': '31NS-Tech',
                                       'logo': {'@type': 'ImageObject', 'url': f'{SITE}/assets/brand-logo.png'}}}

# Google Analytics 4 — 기존 사이트와 같은 측정 ID(방문 통계가 끊기지 않게). seo 블록 밖에 두어 Q&A 페이지 생성(tools/build_qna.py)에도 그대로 남음
GA_ID = 'G-M6ZKCVME6D'
GA = (f'<!-- ga:start --><script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>'
      f"<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','{GA_ID}');</script><!-- ga:end -->")

# 검색엔진 소유 확인 (구글 Search Console). 네이버는 루트의 naver*.html 파일 2개로 확인 — 지우지 말 것
GOOGLE_SITE_VERIFICATION = 'qu5hGjVkZSDNpjMph6IgMP4_tZRvpLXZIqfIaNYNoDo'

OG_ALT = {'ko': '31NS-Tech — 회로에서 제품까지', 'en': '31NS-Tech — From circuit to product'}
# Pages with their own share image: path -> (image URL, alt by language)
PCB_OG = (f'{SITE}/assets/og-pcb3d.png', {'ko': 'PCB 3D Builder — 부품까지 붙은 PCB 3D STEP', 'en': 'PCB 3D Builder — a 3D STEP of the populated PCB'})
OG_PAGE = {k: PCB_OG for k in ('pcb-viewer/index.html', 'pcb-viewer/guide/index.html', 'en/pcb-viewer/index.html', 'en/pcb-viewer/guide/index.html')}

STRIP = [
    r'<title>.*?</title>',
    r'<meta name="description"[^>]*>',
    r'<meta name="title"[^>]*>',
    r'<meta name="keywords"[^>]*>',
    r'<link rel="icon"[^>]*>',
    r'<link rel="apple-touch-icon"[^>]*>',
    r'<meta name="google-site-verification"[^>]*>',
    r'<meta name="naver-site-verification"[^>]*>',
    r'<link rel="canonical"[^>]*>',
    r'<link rel="alternate" hreflang="[^"]*"[^>]*>',
    r'<meta property="og:[^"]*"[^>]*>',
    r'<meta name="twitter:[^"]*"[^>]*>',
    r'<!-- ga:start -->.*?<!-- ga:end -->',
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
             f'<meta property="og:image" content="{OG_PAGE.get(path, (OG_IMAGE,))[0]}">', '<meta property="og:image:width" content="1200">',
             '<meta property="og:image:height" content="630">',
             f'<meta property="og:image:alt" content="{OG_PAGE[path][1][lang] if path in OG_PAGE else OG_ALT[lang]}">',
             '<meta name="twitter:card" content="summary_large_image">']
    if path == 'index.html':
        tags.append(f'<meta name="google-site-verification" content="{GOOGLE_SITE_VERIFICATION}">')
    graph = graph_for(path)
    if graph:
        tags.append(jsonld(graph).replace('<script type="application/ld+json">', '<script type="application/ld+json" data-seo>'))
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
    head = head[:m.end()] + build(path) + GA + head[m.end():]
    open(full, 'w', encoding='utf-8').write(head + rest)
    print('ok', path)


def sitemap():
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
    for path, (url_path, lang, _t, _d, _o, alt) in PAGES.items():
        lines.append('  <url>')
        lines.append(f'    <loc>{SITE}{url_path}</loc>')
        if path in LASTMOD:
            lines.append(f'    <lastmod>{LASTMOD[path]}</lastmod>')
        if alt:
            ko, en = (url_path, PAGES[alt][0]) if lang == 'ko' else (PAGES[alt][0], url_path)
            for code, href in (('ko', ko), ('en', en), ('x-default', ko)):
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{code}" href="{SITE}{href}"/>')
        for img in SITEMAP_IMAGES.get(path, []):
            lines.append(f'    <image:image><image:loc>{SITE}{img}</image:loc></image:image>')
        lines.append('  </url>')
    lines.append('</urlset>')
    open(f'{ROOT}/sitemap.xml', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('ok sitemap.xml', len(PAGES), 'urls')


sitemap()
