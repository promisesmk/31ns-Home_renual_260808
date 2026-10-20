"""이전 사이트 주소 → 새 홈페이지 위치로 자동 이동하는 페이지를 만듭니다.

GitHub Pages는 서버 리디렉션을 지원하지 않으므로, 각 옛 주소에 '즉시 이동(meta refresh 0초) + 대표 주소(canonical)'
페이지를 둡니다. 구글은 이를 영구 이동으로 처리해 옛 주소의 검색 점수를 새 페이지로 넘깁니다.
옛 주소 목록의 출처: Google Search Console → 페이지 → '찾을 수 없음(404)' (2026-10-18).
새 옛 주소가 404로 잡히면 REDIRECTS에 추가하고 다시 실행합니다: python3 tools/make_redirects.py
"""
import html
import os
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
SITE = 'https://31ns.kr'

# 옛 주소(파일 경로) -> 이동할 새 주소. 끝이 /인 옛 주소는 그 폴더의 index.html로 만듭니다.
REDIRECTS = {
    '/services/': '/#capabilities',
    '/services.html/': '/#capabilities',
    '/about.html': '/#philosophy',
    '/about/': '/#philosophy',
    '/portfolio/': '/#portfolio',
    '/contact/': '/#contact',
    '/contact.html/': '/#contact',
    '/en/services/': '/en/#capabilities',
    '/en/portfolio/': '/en/#portfolio',
    '/en/contact/': '/en/#contact',
    # 기술 블로그 삭제(2026-10-20): 옛 블로그 주소는 관련 페이지로 이동
    '/blog/': '/#technical-resources-section',
    '/blog/ble-antenna-matching/': '/rf-faq/',
    '/blog/nrf52805-design/': '/2.4ghz.html',
    '/en/blog/': '/en/#technical-resources-section',
    '/en/blog/ble-antenna-matching/': '/en/rf-faq/',
    '/en/blog/nrf52805-design/': '/en/2.4ghz.html',
    '/en/blog/rf-antenna-matching-en/': '/en/rf-faq/',
}


def page(target):
    lang = 'en' if target.startswith('/en/') else 'ko'
    canonical = SITE + target.split('#')[0]
    t = html.escape(target, quote=True)
    label = 'Go to the 31NS-Tech website' if lang == 'en' else '31NS-Tech 홈페이지로 이동'
    return (f'<!DOCTYPE html>\n<html lang="{lang}"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>31NS-Tech</title><link rel="canonical" href="{canonical}">'
            f'<meta http-equiv="refresh" content="0; url={t}">'
            f'<script>location.replace({target!r})</script></head>'
            f'<body><p><a href="{t}">{label}</a></p></body></html>\n')


for old, target in REDIRECTS.items():
    rel = old.strip('/')
    path = os.path.join(ROOT, rel, 'index.html') if old.endswith('/') else os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(page(target))
    print(f'{old} -> {target}')
