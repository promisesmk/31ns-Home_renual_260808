"""승인된 PCB 3D Builder Q&A를 다운로드 서버(workers/pcb3d-api)에서 받아 정적 페이지로 만듭니다.

- /pcb-viewer/qna/            목록 (FAQPage 구조화 데이터)
- /pcb-viewer/qna/<id>/       글 하나 (FAQPage + BreadcrumbList)
- pcb-viewer/index.html 의 <!-- qna:links --> 자리에 최근 글 링크를 넣고, sitemap.xml에 주소를 추가합니다.

배포(GitHub Actions)에서 실행하며, 만든 파일은 커밋하지 않습니다. 글이 없거나 서버에 연결할 수 없으면
아무것도 바꾸지 않고 끝납니다(배포는 계속 진행).
사용: python3 tools/build_qna.py <사이트 폴더> [서버 주소]   (서버 주소 기본값: 환경변수 PCB3D_API)
"""
import html
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
API = (sys.argv[2] if len(sys.argv) > 2 else os.environ.get('PCB3D_API', '')).rstrip('/')
SITE = 'https://31ns.kr'
SHELL_PAGE = 'pcb-viewer/guide/index.html'   # 머리글 · 바닥글 디자인을 빌려 오는 페이지
SHELL_URL = '/pcb-viewer/guide/'
BASE = '/pcb-viewer/qna/'
CATEGORY = {'question': '질문', 'usecase': '활용 사례', 'feature': '기능 요청'}
KST = timezone(timedelta(hours=9))
RECENT_ON_PRODUCT_PAGE = 5


def fetch_items():
    if not API:
        print('build_qna: PCB3D_API not set, skipped')
        return []
    try:
        with urllib.request.urlopen(f'{API}/api/qna', timeout=20) as res:
            return json.load(res).get('items', [])
    except Exception as e:  # 서버 문제로 홈페이지 배포가 멈추지 않게 함
        print(f'build_qna: could not load Q&A ({e}), skipped')
        return []


def esc(value):
    return html.escape(str(value or ''), quote=True)


def paragraphs(text):
    return ''.join(f'<p>{esc(p).replace(chr(10), "<br>")}</p>' for p in re.split(r'\n\s*\n', str(text).strip()) if p.strip())


def day(ms):
    return datetime.fromtimestamp(ms / 1000, KST).strftime('%Y-%m-%d')


def summary(text, limit=150):
    one = re.sub(r'\s+', ' ', str(text)).strip()
    return one if len(one) <= limit else one[:limit - 1].rstrip() + '…'


def load_shell():
    s = open(os.path.join(ROOT, SHELL_PAGE), encoding='utf-8').read()
    # 상대 주소를 사이트 기준 절대 주소로 바꿔 어느 깊이의 페이지에서도 그대로 쓸 수 있게 함
    s = re.sub(r'(\s(?:href|src))="(?!https?:|mailto:|tel:|#|/|data:)([^"]*)"',
               lambda m: f'{m.group(1)}="{urljoin(SHELL_URL, m.group(2))}"', s)
    s = re.sub(r'<use href="(?!/|#)([^"]*)"', lambda m: f'<use href="{urljoin(SHELL_URL, m.group(1))}"', s)
    head, rest = s.split('</head>', 1)
    head = re.sub(r'<!-- seo:start -->.*?<!-- seo:end -->', '{SEO}', head, flags=re.S)
    top = rest[:rest.index('<main')]
    bottom = rest[rest.index('</main>') + len('</main>'):]
    # 언어 전환: 영어 Q&A 페이지는 없으므로 영어 소개 페이지로 연결
    top = top.replace(f'href="/en{SHELL_URL}"', 'href="/en/pcb-viewer/"')
    return head, top, bottom


def render(shell, url_path, title, desc, structured, main):
    head, top, bottom = shell
    url = SITE + url_path
    seo = (f'<title>{esc(title)}</title><meta name="description" content="{esc(desc)}">'
           f'<link rel="canonical" href="{url}"><link rel="icon" href="/favicon.ico" sizes="any">'
           f'<meta property="og:type" content="website"><meta property="og:site_name" content="31NS-Tech">'
           f'<meta property="og:locale" content="ko_KR"><meta property="og:url" content="{url}">'
           f'<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">'
           f'<meta property="og:image" content="{SITE}/assets/og-image.png"><meta name="twitter:card" content="summary_large_image">'
           '<script type="application/ld+json">' + json.dumps(structured, ensure_ascii=False).replace('</', '<\\/') + '</script>')
    page = head.replace('{SEO}', seo) + '</head>' + top.replace(f'href="{SHELL_URL}"', f'href="{url_path}"') + main + bottom
    # 이 페이지는 가이드가 아니므로 가이드 링크의 '현재 위치' 표시를 뺌
    return page.replace(' aria-current="page"', '')


def faq_entity(item):
    answer = item.get('answer') or ''
    entity = {'@type': 'Question', 'name': item['title'], 'text': item['body'], 'dateCreated': day(item['created_at'])}
    if answer:
        entity['acceptedAnswer'] = {'@type': 'Answer', 'text': answer, 'author': {'@id': f'{SITE}/#organization'}}
    return entity


def hero(eyebrow, h1, lead, crumbs):
    nav = '<span aria-hidden="true">/</span>'.join(f'<a href="{href}">{esc(text)}</a>' for text, href in crumbs)
    return (f'<main id="main-content" class="site-main"><section class="resource-hero"><div class="shell">'
            f'<nav class="breadcrumb" aria-label="현재 위치">{nav}</nav><p class="eyebrow">{esc(eyebrow)}</p>'
            f'<h1>{h1}</h1><p class="resource-lead">{esc(lead)}</p></div></section>')


def item_page(shell, item):
    path = f'{BASE}{item["id"]}/'
    author = item.get('author_label') or 'PCB 3D Builder 사용자'
    answer = item.get('answer')
    main = (hero(f'PCB 3D Builder Q&A · {CATEGORY.get(item["category"], "")}', esc(item['title']),
                 f'{author} · {day(item["created_at"])}',
                 [('홈', '/'), ('PCB 3D Builder', '/pcb-viewer/'), ('Q&A', BASE)])
            + '<div class="shell resource-content"><article class="article-body"><div>'
            + f'<h2>{"질문" if item["category"] == "question" else "내용"}</h2>{paragraphs(item["body"])}'
            + (f'<h2>31NS-Tech 답변</h2>{paragraphs(answer)}' if answer else '')
            + f'<p><a href="{BASE}">← Q&amp;A 목록</a> · <a href="/pcb-viewer/#download">PCB 3D Builder 무료 다운로드</a></p>'
            + '</div></article></div></main>')
    structured = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'FAQPage', 'url': SITE + path, 'inLanguage': 'ko-KR', 'mainEntity': [faq_entity(item)]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': '홈', 'item': f'{SITE}/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'PCB 3D Builder', 'item': f'{SITE}/pcb-viewer/'},
            {'@type': 'ListItem', 'position': 3, 'name': 'Q&A', 'item': SITE + BASE},
            {'@type': 'ListItem', 'position': 4, 'name': item['title']}]}]}
    title = f'{item["title"]} | PCB 3D Builder Q&A — 31NS-Tech'
    return path, render(shell, path, title, summary(answer or item['body']), structured, main)


def index_page(shell, items):
    cards = ''.join(
        f'<h2><a href="{BASE}{i["id"]}/">{esc(i["title"])}</a></h2>'
        f'<p class="pv-download-note">{CATEGORY.get(i["category"], "")} · {day(i["created_at"])}{" · 답변 있음" if i.get("answer") else ""}</p>'
        f'<p>{esc(summary(i["body"]))}</p>' for i in items)
    main = (hero('PCB 3D Builder Q&A', 'PCB 3D Builder Q&amp;A.<br><span>사용자 질문과 답변.</span>',
                 '사용자가 남긴 질문 · 활용 사례와 31NS-Tech의 답변을 모았습니다.',
                 [('홈', '/'), ('PCB 3D Builder', '/pcb-viewer/')])
            + f'<div class="shell resource-content"><article class="article-body"><div>{cards}'
            + '<p><a href="/pcb-viewer/#download">질문 남기고 무료 다운로드 →</a></p></div></article></div></main>')
    structured = {'@context': 'https://schema.org', '@type': 'FAQPage', 'url': SITE + BASE, 'inLanguage': 'ko-KR',
                  'mainEntity': [faq_entity(i) for i in items if i.get('answer')]}
    if not structured['mainEntity']:
        structured = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'url': SITE + BASE, 'name': 'PCB 3D Builder Q&A'}
    return render(shell, BASE, 'PCB 3D Builder Q&A | 사용자 질문과 답변 — 31NS-Tech',
                  '부품 모델 · STEP 변환 · PADS ASC · DXF 등 PCB 3D Builder 사용자 질문과 답변 모음.', structured, main)


def write(path, content):
    full = os.path.join(ROOT, path.lstrip('/'), 'index.html')
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, 'w', encoding='utf-8').write(content)


def link_from_product_page(items):
    path = os.path.join(ROOT, 'pcb-viewer/index.html')
    s = open(path, encoding='utf-8').read()
    links = ''.join(f'<li><a href="qna/{i["id"]}/">{esc(i["title"])}</a></li>' for i in items[:RECENT_ON_PRODUCT_PAGE])
    block = (f'<div class="pv-qna-links"><p class="eyebrow">사용자 Q&amp;A</p><ul>{links}</ul>'
             f'<p><a class="text-link" href="qna/">Q&amp;A 전체 보기 <span aria-hidden="true">→</span></a></p></div>')
    if '<!-- qna:links -->' in s:
        open(path, 'w', encoding='utf-8').write(s.replace('<!-- qna:links -->', block))


def add_to_sitemap(paths, lastmod):
    path = os.path.join(ROOT, 'sitemap.xml')
    s = open(path, encoding='utf-8').read()
    entries = ''.join(f'  <url>\n    <loc>{SITE}{p}</loc>\n    <lastmod>{lastmod.get(p, "")}</lastmod>\n  </url>\n'.replace('    <lastmod></lastmod>\n', '')
                      for p in paths if f'<loc>{SITE}{p}</loc>' not in s)
    open(path, 'w', encoding='utf-8').write(s.replace('</urlset>', entries + '</urlset>'))


def main():
    items = [i for i in fetch_items() if re.fullmatch(r'[a-z0-9]{10}', str(i.get('id', '')))]
    if not items:
        print('build_qna: no published Q&A')
        return
    shell = load_shell()
    lastmod = {}
    for item in items:
        path, content = item_page(shell, item)
        write(path, content)
        lastmod[path] = day(item.get('reviewed_at') or item['created_at'])
    write(BASE, index_page(shell, items))
    lastmod[BASE] = max(lastmod.values())
    link_from_product_page(items)
    add_to_sitemap([BASE] + [f'{BASE}{i["id"]}/' for i in items], lastmod)
    print(f'build_qna: {len(items)} Q&A pages')


main()
