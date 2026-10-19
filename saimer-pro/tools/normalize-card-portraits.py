from pathlib import Path
from PIL import Image, ImageOps, ImageCms, ImageDraw
from io import BytesIO
import json, hashlib, re, sys

# Usage: python tools/normalize-card-portraits.py <originals-directory>
site = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
rows = []
# Hairline/crown to chin, measured on each supplied photograph. Fit the head
# to 63% of the card height with 8% clear space above the crown.
anchors = [
    ('yueto', 'ishihara-yueto', .51, .114, .451),
    ('yui', 'nakayama-yui', .49, .092, .476),
    ('hina', 'tsukigata-hina', .39, .087, .391),
    ('hiroki', 'takashima-hiroki', .52, .095, .650),
]
sheet = Image.new('RGB', (1120, 420), 'white')
for i, (original, slug, cx, crown, chin) in enumerate(anchors):
    p = source / (original + '.jpg')
    before = hashlib.sha256(p.read_bytes()).hexdigest()
    with Image.open(p) as raw:
        im = ImageOps.exif_transpose(raw)
        icc = raw.info.get('icc_profile')
        if icc:
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(BytesIO(icc)), ImageCms.createProfile('sRGB'), outputMode='RGB')
        else:
            im = im.convert('RGB')
        h = (chin-crown)*im.height/.63
        w = h*.75
        left = min(max(0, cx*im.width-w/2), im.width-w)
        top = crown*im.height-.08*h
        box = tuple(round(v) for v in (left, top, left+w, top+h))
        assert box[0]>=0 and box[1]>=0 and box[2]<=im.width and box[3]<=im.height
        assert box[2]-box[0]>=640, (slug, box)
        cropped = im.crop(box)
        row = {'slug':slug,'original':p.name,'original_sha256':before,'crop_box':box,'original_size':im.size,'head_height_ratio':.63,'top_space_ratio':.08,'variants':[]}
        for width in (320,640):
            thumb = cropped.resize((width,width*4//3),Image.Resampling.LANCZOS)
            thumb.info.clear()
            for ext in ('webp','jpg'):
                rel = f'assets/images/talents/{slug}-card-20261020-{width}.{ext}'
                target = site/rel
                if ext=='webp': thumb.save(target, 'WEBP', quality=90, method=6)
                else: thumb.save(target, 'JPEG', quality=90, optimize=True, progressive=True, subsampling=0)
                row['variants'].append({'file':rel,'width':width,'height':width*4//3,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
        sheet.paste(cropped.resize((270,360),Image.Resampling.LANCZOS),(i*280,30))
        ImageDraw.Draw(sheet).text((i*280,5),slug,fill='black')
    assert hashlib.sha256(p.read_bytes()).hexdigest()==before
    rows.append(row)
for rel in ('index.html','talents/index.html'):
    p = site/rel
    text = p.read_text(encoding='utf-8')
    for row in rows:
        slug=row['slug']
        # Only picture elements on the two card grids; profiles keep full frames.
        pattern=r'<picture>[\s\S]*?</picture>'
        def replace(m):
            block=m.group(0)
            if slug+'-320.' not in block: return block
            block=re.sub(r', [^,\" ]*'+re.escape(slug)+r'-960\.(?:webp|jpg) 960w','',block)
            block=re.sub(re.escape(slug)+r'-(320|640|960)\.(webp|jpg)',lambda x:slug+'-card-20261020-'+('640' if x[1]=='960' else x[1])+'.'+x[2],block)
            block=re.sub(r'width="960" height="144[02]"','width="640" height="853"',block)
            return block
        text=re.sub(pattern,replace,text)
    p.write_text(text,encoding='utf-8',newline='\n')
(site/'docs/card-portraits-20261020.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

print('Generated 16 card assets; original hashes preserved; updated home and talent grids.')
