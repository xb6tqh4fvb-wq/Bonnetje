#!/usr/bin/env python3
"""Genereert synthetische testbonnen voor de Bonnetje-meting (v9).
Set 'eigen10': 10 bonnen met adres, postcode, PIN/betaalregels, twee btw-tarieven, scheef/onscherp/ruis.
Set 'setA98': 15 bonnen / 98 regels in de stijl van de v6-v8 meetset A.
Schrijft PNG's + ground-truth.json naar de opgegeven mappen.
"""
import json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
W, H = 1120, 936
LEFT = 70
RIGHT = 1050

def render(lines, style, path, seed=0):
    random.seed(seed)
    img = Image.new('L', (W, H), 255)
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, 30)
    fontb = ImageFont.truetype(FONT_B, 32)
    y = 46
    for kind, left, right in lines:
        f = fontb if kind == 'h' else font
        d.text((LEFT, y), left, font=f, fill=0)
        if right:
            tw = d.textlength(right, font=f)
            d.text((RIGHT - tw, y), right, font=f, fill=0)
        y += 44
        if y > H - 50:
            break
    if style == 'skewed':
        img = img.rotate(7.5, resample=Image.BICUBIC, fillcolor=255)
    elif style == 'skewed8':
        img = img.rotate(-8.5, resample=Image.BICUBIC, fillcolor=255)
    elif style == 'blurry':
        img = img.filter(ImageFilter.GaussianBlur(1.6))
    elif style == 'lowcontrast':
        img = img.point(lambda p: int(255 - (255 - p) * 0.45))
    elif style == 'noise':
        img = img.rotate(2.0, resample=Image.BICUBIC, fillcolor=255)
        px = img.load()
        for _ in range(int(W * H * 0.02)):
            x = random.randrange(W); yy = random.randrange(H)
            px[x, yy] = random.randrange(0, 140)
        img.save(path.replace('.png', '.jpg'), quality=72)
        img = Image.open(path.replace('.png', '.jpg')).convert('L')
    img.save(path)

def eur(cents):
    return f"{cents//100},{cents%100:02d}"

def usd(cents):
    return f"{cents//100}.{cents%100:02d}"

# ---------------- eigen set van 10 ----------------
EIGEN = [
  dict(id='v9_nl_01_netjes', style='clean', lang='nl', lines=[
    ('h', "CAFE DE KERK", ''), ('n', 'Kerkstraat 480', ''), ('n', '1011 AB Amsterdam', ''),
    ('n', 'Tel: 020-1234567', ''), ('n', '', ''),
    ('n', '2 Tapbier', '7,00'), ('n', '1 Bitterballen', '8,50'), ('n', '1 Sate met friet', '18,50'), ('n', '2 Koffie', '6,40'),
    ('n', '', ''), ('n', 'BTW 9%', '2,72'),
    ('n', 'TOTAAL', '40,40'), ('n', 'PIN', '40,40')],
    items=[('2 Tapbier',700),('1 Bitterballen',850),('1 Sate met friet',1850),('2 Koffie',640)], total=4040),
  dict(id='v9_nl_02_scheef', style='skewed', lang='nl', lines=[
    ('h', 'RESTAURANT DE POSTHOORN', ''), ('n', 'Stationsplein 12', ''), ('n', '3511 ED Utrecht', ''), ('n', '', ''),
    ('n', '1 Fles rode wijn', '24,00'), ('n', '2 Biefstuk', '49,00'), ('n', '1 Salade geitenkaas', '16,50'), ('n', '3 Spa rood', '9,75'),
    ('n', '', ''), ('n', 'TOTAAL', '99,25'), ('n', 'PIN', '99,25')],
    items=[('1 Fles rode wijn',2400),('2 Biefstuk',4900),('1 Salade geitenkaas',1650),('3 Spa rood',975)], total=9925),
  dict(id='v9_nl_03_twee_btw', style='clean', lang='nl', lines=[
    ('h', 'EETCAFE DE BRUG', ''), ('n', 'Brugstraat 7A', ''), ('n', '6211 LM Maastricht', ''), ('n', '', ''),
    ('n', '2 Broodje bal', '9,00'), ('n', '1 Soep van de dag', '6,50'), ('n', '2 Witte wijn', '11,00'),
    ('n', '', ''), ('n', 'BTW 9% over 15,50', '1,28'), ('n', 'BTW 21% over 11,00', '1,91'),
    ('n', 'TOTAAL', '26,50'), ('n', 'PIN', '26,50')],
    items=[('2 Broodje bal',900),('1 Soep van de dag',650),('2 Witte wijn',1100)], total=2650),
  dict(id='v9_en_01_netjes', style='clean', lang='en', lines=[
    ('h', 'THE CROWN INN', ''), ('n', '48 High Street', ''), ('n', 'Oxford OX1 4AS', ''), ('n', '', ''),
    ('n', '2 Fish & Chips', '25.90'), ('n', '1 Pint Ale', '5.20'), ('n', '1 Sticky Toffee Pudding', '6.50'),
    ('n', '', ''), ('n', 'TOTAL', '37.60'), ('n', 'CARD', '37.60')],
    items=[('2 Fish & Chips',2590),('1 Pint Ale',520),('1 Sticky Toffee Pudding',650)], total=3760),
  dict(id='v9_en_02_us_zip', style='clean', lang='en', lines=[
    ('h', "JOE'S DINER", ''), ('n', '123 Main Street', ''), ('n', 'AUSTIN TX 78701', ''), ('n', '', ''),
    ('n', '1 Burger', '15.00'), ('n', '1 Fries', '5.00'), ('n', '', ''),
    ('n', 'Subtotal', '20.00'), ('n', 'Sales tax 8.25%', '1.65'),
    ('n', 'TOTAL', '21.65'), ('n', 'VISA', '21.65')],
    items=[('1 Burger',1500),('1 Fries',500)], total=2165),
  dict(id='v9_de_01_netjes', style='clean', lang='de', lines=[
    ('h', 'GASTHAUS ADLER', ''), ('n', 'Hauptstr. 48', ''), ('n', '10115 Berlin', ''), ('n', '', ''),
    ('n', '1 Schnitzel Wiener Art', '18,50'), ('n', '2 Bier vom Fass', '9,00'), ('n', '1 Apfelstrudel', '6,50'),
    ('n', '', ''), ('n', 'MwSt 19%', '5,43'),
    ('n', 'SUMME', '34,00'), ('n', 'KARTE', '34,00')],
    items=[('1 Schnitzel Wiener Art',1850),('2 Bier vom Fass',900),('1 Apfelstrudel',650)], total=3400),
  dict(id='v9_fr_01_laagcontrast', style='lowcontrast', lang='fr', lines=[
    ('h', 'BISTROT DU COIN', ''), ('n', '12 rue de la Paix', ''), ('n', '75002 Paris', ''), ('n', '', ''),
    ('n', '1 Croque monsieur', '9,50'), ('n', '2 Verre de vin', '12,00'), ('n', '1 Cafe creme', '3,50'),
    ('n', '', ''), ('n', 'TVA 20%', '4,17'),
    ('n', 'TOTAL', '25,00'), ('n', 'CARTE', '25,00')],
    items=[('1 Croque monsieur',950),('2 Verre de vin',1200),('1 Cafe creme',350)], total=2500),
  dict(id='v9_es_01_ruis', style='noise', lang='es', lines=[
    ('h', 'BAR MANOLO', ''), ('n', 'Calle Mayor 25', ''), ('n', '28013 Madrid', ''), ('n', '', ''),
    ('n', '2 Cana', '5,00'), ('n', '1 Racion pulpo', '14,00'), ('n', '1 Pan y alioli', '2,50'),
    ('n', '', ''), ('n', 'IVA 10%', '1,95'),
    ('n', 'TOTAL', '21,50'), ('n', 'TARJETA', '21,50')],
    items=[('2 Cana',500),('1 Racion pulpo',1400),('1 Pan y alioli',250)], total=2150),
  dict(id='v9_it_01_onscherp', style='blurry', lang='it', lines=[
    ('h', 'TRATTORIA DA LUIGI', ''), ('n', 'Via Roma 10', ''), ('n', '20121 Milano', ''), ('n', '', ''),
    ('n', '1 Pinsa romana', '12,00'), ('n', '1 Vino della casa', '7,00'), ('n', '2 Espresso', '5,00'),
    ('n', '', ''), ('n', 'TOTALE', '24,00'), ('n', 'CONTACTLESS', '24,00')],
    items=[('1 Pinsa romana',1200),('1 Vino della casa',700),('2 Espresso',500)], total=2400),
  dict(id='v9_nl_04_groot_scheef', style='skewed8', lang='nl', lines=[
    ('h', 'GRAND CAFE CENTRAL', ''), ('n', 'Damrak 70', ''), ('n', '1012 LM Amsterdam', ''), ('n', 'KvK 12345678', ''), ('n', '', ''),
    ('n', '3 Tapbier', '11,25'), ('n', '1 Nachos grande', '9,50'), ('n', '2 Cappuccino', '7,00'),
    ('n', '1 Tosti ham kaas', '6,75'), ('n', '1 Appeltaart', '4,50'),
    ('n', '', ''), ('n', 'BTW 9%', '3,22'),
    ('n', 'TOTAAL', '39,00'), ('n', 'PIN', '39,00')],
    items=[('3 Tapbier',1125),('1 Nachos grande',950),('2 Cappuccino',700),('1 Tosti ham kaas',675),('1 Appeltaart',450)], total=3900),
]

# ---------------- set A: 15 bonnen, 98 regels (stijl v6-v8) ----------------
def set_a():
    specs = [
        ('a_nl_01_netjes', 'clean', 'nl', 7), ('a_nl_02_scheef', 'skewed', 'nl', 7),
        ('a_nl_03_laagcontrast', 'lowcontrast', 'nl', 6), ('a_nl_04_ruis', 'noise', 'nl', 7),
        ('a_nl_05_onscherp', 'blurry', 'nl', 6),
        ('a_en_01_netjes', 'clean', 'en', 7), ('a_en_02_scheef', 'skewed8', 'en', 6),
        ('a_en_03_laagcontrast', 'lowcontrast', 'en', 7), ('a_en_04_ruis', 'noise', 'en', 6),
        ('a_en_05_onscherp', 'blurry', 'en', 7),
        ('a_es_01_netjes', 'clean', 'es', 7), ('a_es_02_scheef', 'skewed', 'es', 6),
        ('a_es_03_laagcontrast', 'lowcontrast', 'es', 7), ('a_es_04_ruis', 'noise', 'es', 6),
        ('a_es_05_onscherp', 'blurry', 'es', 6),
    ]
    menu = {
        'nl': [('2 Tapbier', 700), ('1 Bitterballen', 850), ('1 Sate met friet', 1850), ('2 Koffie', 640),
               ('1 Fles rode wijn', 2400), ('3 Spa rood', 975), ('2 Biefstuk', 4900), ('1 Salade geitenkaas', 1650),
               ('1 Tosti ham kaas', 675), ('1 Appeltaart', 450), ('2 Cappuccino', 700), ('1 Nachos grande', 950),
               ('1 Soep van de dag', 650), ('2 Witte wijn', 1100), ('1 IJs met slagroom', 550)],
        'en': [('2 Fish & Chips', 2590), ('1 Pint Ale', 520), ('1 Sticky Toffee Pudding', 650),
               ('1 Burger', 1500), ('1 Fries', 500), ('2 Caesar Salad', 1900), ('1 Club Sandwich', 975),
               ('2 Lemonade', 600), ('1 Steak Pie', 1350), ('1 Garlic Bread', 450), ('2 Coffee', 640),
               ('1 Onion Rings', 525), ('1 Cheesecake', 695), ('1 House Wine', 700), ('1 Soup of the Day', 625)],
        'es': [('2 Cana', 500), ('1 Racion pulpo', 1400), ('1 Pan y alioli', 250), ('1 Menu del dia', 1250),
               ('2 Vino tinto', 700), ('1 Patatas bravas', 650), ('1 Croquetas', 750), ('2 Agua con gas', 500),
               ('1 Gambas al ajillo', 1150), ('1 Tortilla', 800), ('2 Cafe con leche', 460), ('1 Flan', 450),
               ('1 Ensalada mixta', 850), ('1 Jamon iberico', 1600), ('1 Tarta de queso', 550)],
    }
    head = {'nl': ('RESTAURANT DE SMAK', 'Herengracht 123', '1016 BG Amsterdam', 'TOTAAL', 'PIN'),
            'en': ('THE OLD TAVERN', '12 Church Lane', 'York YO1 7AB', 'TOTAL', 'CARD'),
            'es': ('CASA PEPE', 'Calle Granada 8', '18002 Granada', 'TOTAL', 'TARJETA')}
    out = []
    random.seed(98)
    for rid, style, lang, nitems in specs:
        pool = menu[lang][:]
        random.shuffle(pool)
        chosen = pool[:nitems]
        total = sum(c for _, c in chosen)
        h, addr, city, totw, payw = head[lang]
        fmt = usd if lang == 'en' else eur
        lines = [('h', h, ''), ('n', addr, ''), ('n', city, ''), ('n', '', '')]
        for name, cents in chosen:
            lines.append(('n', name, fmt(cents)))
        lines.append(('n', '', ''))
        if lang == 'nl':
            lines.append(('n', 'BTW 9%', fmt(round(total * 0.09 / 1.09))))
        if lang == 'es':
            lines.append(('n', 'IVA 10%', fmt(round(total * 0.10 / 1.10))))
        lines.append(('n', totw, fmt(total)))
        lines.append(('n', payw, fmt(total)))
        out.append(dict(id=rid, style=style, lang=lang, lines=lines, items=chosen, total=total))
    return out

def write_set(specs, outdir):
    os.makedirs(outdir, exist_ok=True)
    gt = []
    for i, spec in enumerate(specs):
        path = os.path.join(outdir, spec['id'] + '.png')
        render(spec['lines'], spec['style'], path, seed=1000 + i)
        text_lines = [(l + (' ' + r if r else '')).strip() for _, l, r in spec['lines'] if (l or r)]
        gt.append({
            'id': spec['id'], 'file': spec['id'] + '.png', 'lang': spec['lang'], 'style': spec['style'],
            'items': [{'description': n, 'lineTotalCents': c} for n, c in spec['items']],
            'totalCents': spec['total'],
            'textLines': text_lines,
        })
    with open(os.path.join(outdir, 'ground-truth.json'), 'w') as f:
        json.dump(gt, f, ensure_ascii=False, indent=1)
    print(f"{outdir}: {len(gt)} bonnen, {sum(len(g['items']) for g in gt)} regels")

if __name__ == '__main__':
    write_set(EIGEN, '/tmp/bench/www/sets/eigen10')
    write_set(set_a(), '/tmp/bench/www/sets/setA98')
