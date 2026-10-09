"""Build the static preview from the public performance-data derivative."""
import json, html, pathlib, datetime, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'performance.json').read_text())
esc = html.escape
new_tab = 'target="_blank" rel="noopener noreferrer"'
new_tab_hint = '<span class="sr-only">（新しいタブで開きます）</span>'
def heading(key, ja, number):
    return f'<div class="section-heading"><h2 id="{key}-heading" tabindex="-1"><span class="en">{key.upper()}</span><span class="ja">{ja}</span></h2><span class="section-number">{number}</span></div>'
def cta(place, label='チケット情報', style='primary'):
    sale=DATA['sale']; active=sale['status']=='on_sale' and sale['url']
    target=sale['url'] if active else '#ticket'
    text='チケットを購入' if active else ('公演情報' if sale['status']=='ended' else label)
    extra = f' {new_tab}' if active else ''
    hint = new_tab_hint if active else ''
    return f'<a class="button {style}" data-ticket-placement="{place}" href="{esc(target)}"{extra}>{text}{hint}</a>'
nav=''.join(f'<a href="#{key}">{key.upper()}</a>' for key in ['story','schedule','ticket','cast','access'])
people=[p for g in DATA['castGroups'] for p in g['members']]
reading_ids={p['id'] for g in DATA['castGroups'] if g['label']=='〈Reading cast〉' for p in g['members']}
day_html=''
for day in DATA['schedule']:
    shows=''
    for s in day['shows']:
        appearances=''
        for person in people:
            if s['number'] in person.get('appearances',[]):
                category='<span class="reading-label">Reading cast</span>' if person['id'] in reading_ids else '<span class="sr-only">Wキャスト</span>'
                appearances+=f'<p>{category}<a href="#{person["id"]}">{esc(person["name"])}</a></p>'
        shows+=f'<li data-show-number="{s["number"]}"><div class="show-heading"><span class="show-number">{s["number"]}</span><time datetime="{day["date"]}T{s["time"]}:00+09:00">{s["time"]}</time></div><div class="show-cast">{appearances}</div></li>'
    day_html+=f'<article class="day"><h3><span class="en day-date">{day["date"][5:].replace("-","/")}</span><span class="weekday">{day["weekday"]}</span></h3><ul>{shows}</ul></article>'
ticket_html=''
for seat in DATA['tickets']:
    benefits=''.join(f'<li>{esc(t)}</li>' for t in seat['benefits'])
    ticket_html+=f'<article class="ticket-card"><h3>{esc(seat["name"])}</h3><div class="ticket-card-body"><p class="price"><span class="en">{seat["price"]:,}</span><span>円</span></p>{"<ul>"+benefits+"</ul>" if benefits else ""}</div></article>'
cast_html=''
for group in DATA['castGroups']:
    cards=''
    for person in group['members']:
        photo=person.get('image')
        if photo:
            frame=f'<div class="cast-photo"><img src="{esc(photo)}" alt="" width="640" height="800" loading="lazy" decoding="async" style="object-position:{esc(person.get("focus","50% 30%"))}"><span class="image-fallback" hidden>写真準備中</span></div>'
        else:
            frame='<div class="cast-photo photo-pending" aria-hidden="true"><span class="photo-label"><span class="en">PHOTO</span><span>写真準備中</span></span></div>'
        appearance=f'<p class="cast-appearances"><span>出演回</span>{esc(person["appearanceLabel"])}</p>' if person.get('appearanceLabel') else ''
        cards+=f'<article class="cast-card" id="{person["id"]}" data-cast-id="{person["id"]}">{frame}<h3>{esc(person["name"])}</h3>{appearance}</article>'
    label=f'<h3 class="cast-group-label">{esc(group["label"])}</h3>' if group['label'] else ''
    paired=' cast-pair' if group.get('paired') else ''
    cast_html+=f'<div class="cast-group{paired}">{label}<div class="cast-grid">{cards}</div></div>'
def sentences(text):
    return ''.join(f'<span class="story-sentence">{esc(s)}</span>' for s in re.split(r'(?<=。)',text) if s)
motives=''
for color, paragraph in zip(['red','blue','green','pink'],DATA['story'][3:7]):
    name, rest=paragraph.split('は',1)
    motives+=f'<li><p class="story-copy"><span class="role-name role-{color}">{esc(name)}</span>は{esc(rest)}</p></li>'
staff=''.join(f'<div><dt>{esc(x["role"])}</dt><dd>{esc(x["name"])}</dd></div>' for x in DATA['staff'])
first=DATA['schedule'][0]; last=DATA['schedule'][-1]
start=datetime.date.fromisoformat(first['date']); end=datetime.date.fromisoformat(last['date'])
year=start.year
start_date=start.strftime('%m.%d'); end_date=end.strftime('%m.%d')
start_en=start.strftime('%a').upper(); end_en=end.strftime('%a').upper()
total=sum(len(day['shows']) for day in DATA['schedule'])
period=f'{year}年{start.month}月{start.day}日({first["weekday"]})〜{end.day}日({last["weekday"]})'
venue=esc(DATA['venue'])
sale_label='ON SALE' if DATA['sale']['status']=='on_sale' and DATA['sale']['url'] else ('CLOSED' if DATA['sale']['status']=='ended' else 'RELEASE')
release=esc(DATA['sale']['releaseText'])
sale=DATA['sale']
sale_period=''
if sale.get('startsAt') and sale.get('endsAt'):
    sale_period=f'<dl class="sale-period"><div><dt>販売開始</dt><dd><time datetime="{esc(sale["startsAt"])}">{esc(sale["startLabel"])}</time></dd></div><div><dt>販売終了</dt><dd><time datetime="{esc(sale["endsAt"])}">{esc(sale["endLabel"])}</time></dd></div></dl><p class="sale-method">※{esc(sale["method"])}</p>'
sale_message='発売前' if sale['status']=='before_sale' else release
sale_details=f'<div><p class="sale-status">{sale_message}</p><p class="sale-vendor">{esc(sale.get("vendor",""))}</p>{sale_period or "<p>"+release+"</p>"}</div>'
if sale['url'] and sale['status']!='ended':
    ticket_label='チケットを購入' if sale['status']=='on_sale' else 'カンフェティの販売ページを見る'
    ticket_primary=f'<a class="button primary sale-page-link" data-ticket-placement="ticket" href="{esc(sale["url"])}" {new_tab}>{ticket_label}{new_tab_hint}</a>'
else:
    ticket_primary=''
ticket_actions=f'{ticket_primary}<a class="button secondary" href="#schedule">出演日程を確認する</a>'
title=esc(DATA['title'])
brand_title=title.replace('イエロー','<span class="title-yellow">イエロー</span>',1).replace('死','<span class="title-red">死</span>',1)
page=f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#FFD928"><title>舞台『{title}』｜Soft Boiled Theater-16</title><meta name="description" content="舞台『{title}』。{period}、{venue}にて全{total}ステージ。公演日程、チケット、出演者、あらすじのご案内。"><link rel="icon" type="image/svg+xml" href="assets/yellow-is-dead-favicon.svg"><link rel="preload" as="image" href="assets/yellow-is-dead-hero-mobile-800.webp" imagesrcset="assets/yellow-is-dead-hero-mobile-640.webp 640w, assets/yellow-is-dead-hero-mobile-800.webp 800w" imagesizes="100vw" media="(max-width:767px)" type="image/webp" fetchpriority="high"><link rel="preload" as="font" type="font/woff2" href="fonts/yellow-is-dead-gothic-800.woff2" crossorigin><link rel="stylesheet" href="style.css"><script src="app.js" defer></script></head>
<body><a class="skip-link" href="#main">本文へ移動</a>
<header class="site-header"><div class="header-inner"><a class="brand" href="#top" aria-label="{title}のページ先頭"><span class="brand-title">{brand_title}</span><span class="brand-series en">Soft Boiled Theater-16</span></a><nav class="desktop-nav" aria-label="メインメニュー">{nav}</nav>{cta('header','チケット情報','primary header-ticket')}<details class="mobile-menu"><summary aria-label="メニューを開閉" aria-controls="mobile-navigation"><span class="menu-lines" aria-hidden="true"></span><span class="menu-caption">MENU</span></summary><nav id="mobile-navigation" aria-label="モバイルメニュー">{nav}</nav></details></div></header>
<main id="main" tabindex="-1"><section class="hero" id="top" aria-label="公演概要"><picture class="hero-picture"><source media="(max-width:767px)" srcset="assets/yellow-is-dead-hero-mobile-640.webp 640w, assets/yellow-is-dead-hero-mobile-800.webp 800w" sizes="100vw"><img src="assets/yellow-is-dead-hero-1536.webp" srcset="assets/yellow-is-dead-hero-1536.webp 1536w, assets/yellow-is-dead-hero-1920.webp 1920w" sizes="100vw" alt="白い洗濯機の中に残された、血の付いたイエローのマスク" width="1536" height="1024" fetchpriority="high" decoding="async"></picture><div class="caution-tape" aria-hidden="true"><span class="en">CAUTION</span><strong class="en">Soft Boiled Theater-16</strong><span class="en">CAUTION</span></div><div class="hero-inner"><div class="hero-copy"><p class="hero-unit">クリエイティブユニット【ソフトボイルド】</p><p class="hero-series en">Soft Boiled Theater-16</p><h1><span class="sr-only">{title}</span><picture><source media="(max-width:767px)" srcset="assets/yellow-is-dead-logo-640.webp"><img class="official-logo" src="assets/yellow-is-dead-logo-800.webp" srcset="assets/yellow-is-dead-logo-640.webp 640w, assets/yellow-is-dead-logo-800.webp 800w, assets/yellow-is-dead-logo-1200.webp 1200w" sizes="(max-width:767px) calc(100vw - 40px), (min-width:1600px) 560px, 46vw" alt="" width="1200" height="750" fetchpriority="high"></picture></h1><div class="hero-date"><span class="en year">{year}</span><p class="en date-range"><span>{start_date}<small>{start_en}</small></span><span class="date-separator">—</span><span>{end_date}<small>{end_en}</small></span></p></div><p class="hero-venue en">{venue} <span class="jp">全{total}ステージ</span></p><p class="release-text">{release}</p><div class="hero-actions">{cta('hero','公演日程・チケット')}<a class="button secondary" href="#story">物語を読む</a></div></div></div></section>
<div class="performance-strip"><div class="container"><span class="en strip-date">{year}. {start_date} <small>{start_en}</small> — {end_date} <small>{end_en}</small></span><span class="en strip-venue">{venue}</span><span>全{total}ステージ</span></div></div>
<section class="section story-section" id="story" aria-labelledby="story-heading"><div class="container">{heading('story','物語','01')}<div class="story-grid"><p class="story-lead story-copy">{esc(DATA['story'][0]).replace("イエロー", '<span class="keep-word role-yellow">イエロー</span>')}</p><figure class="story-photo"><img src="assets/yellow-is-dead-story-floor.webp" alt="" width="1000" height="680" loading="lazy" fetchpriority="low" decoding="async"></figure><p class="story-paragraph story-copy">{sentences(DATA['story'][1])}</p></div><p class="motive-intro story-copy">{esc(DATA['story'][2])}</p><ul class="story-motives">{motives}</ul><p class="story-ending story-copy">{sentences(DATA['story'][7])}</p></div></section>
<section class="section schedule-section" id="schedule" aria-labelledby="schedule-heading"><div class="container">{heading('schedule','公演日程','02')}<div class="section-intro"><p>{period}</p><p class="section-note">全{total}ステージ / 開演時刻</p></div><p class="schedule-cast-note">Wキャスト・Reading castの出演者を各公演に表示しています。</p><div class="schedule-grid">{day_html}</div><div class="section-action"><a class="button secondary" href="#ticket">料金・特典を見る</a></div></div></section>
<section class="section ticket-section" id="ticket" aria-labelledby="ticket-heading"><div class="container">{heading('ticket','チケット','03')}<p class="ticket-notice">{esc(DATA['ticketNote'])}</p><div class="ticket-grid">{ticket_html}</div><p class="benefit-note">（ブロマイドの絵柄はS席特典と同じ）</p><div class="ticket-release"><span class="en">{sale_label}</span>{sale_details}</div><div class="ticket-action">{ticket_actions}</div></div></section>
<section class="section cast-section" id="cast" aria-labelledby="cast-heading"><div class="container">{heading('cast','出演者','04')}{cast_html}</div></section>
<section class="section access-section" id="access" aria-labelledby="access-heading"><div class="container">{heading('access','劇場・アクセス','05')}<div class="access-layout"><div><p class="venue-kicker">シアターグリーン</p><h3 class="venue-title en">{venue}</h3><p class="address">{esc(DATA['access']['postal'])}<br>{esc(DATA['access']['address'])}</p></div><div class="access-directions"><ul>{''.join('<li>'+esc(t)+'</li>' for t in DATA['access']['routes'])}</ul><div class="access-links"><a class="button primary" href="{esc(DATA['access']['mapUrl'])}" {new_tab}>Google マップで開く{new_tab_hint}</a><a class="text-link" href="{esc(DATA['access']['officialUrl'])}" {new_tab}>劇場公式アクセス案内{new_tab_hint}</a></div></div></div></div></section>
<section class="section staff-section" id="staff" aria-labelledby="staff-heading"><div class="container">{heading('staff','スタッフ','06')}<dl class="staff-list">{staff}</dl></div></section></main>
<footer class="site-footer"><div class="container footer-inner"><div><p class="en footer-series">Soft Boiled Theater-16</p><p class="footer-title">『{title}』</p></div><div class="footer-actions">{cta('footer','チケット情報')}<a class="text-link" href="#top">ページ先頭へ</a></div></div></footer>
<nav class="mobile-sticky" aria-label="公演情報へのクイックアクセス"><a href="#schedule">公演日程</a>{cta('sticky','チケット情報')}</nav></body></html>'''
(ROOT/'index.html').write_text(page,encoding='utf-8')
print('Built index.html from performance.json')
