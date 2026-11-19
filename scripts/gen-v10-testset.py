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

# ---------------- v10-set van 10: telefoon/bon/tafelnummers, CONTANTI, tussenvoegsels,
# ---------------- fuzzy totaalwoorden (scheef -> T0TAAL-ruis), streepjes achter bedragen ----------------
EIGEN = [
  dict(id='v10_nl_01_telnummers', style='clean', lang='nl', lines=[
    ('h', 'GRAND CAFE DE TELEFOON', ''), ('n', 'Kerkstraat 480', ''), ('n', '1011 AB Amsterdam', ''),
    ('n', 'Tel: 020 555 0134', ''), ('n', 'Bon: 1042', ''), ('n', 'Tafel 123', ''), ('n', '', ''),
    ('n', '1 Huiswijn rood 750 ml', '18,50'), ('n', '2 Tapbier', '7,00'), ('n', '1 Bitterballen', '8,50'),
    ('n', '', ''), ('n', 'TOTAAL', '34,00'), ('n', 'PIN', '34,00')],
    items=[('1 Huiswijn rood 750 ml',1850),('2 Tapbier',700),('1 Bitterballen',850)], total=3400),
  dict(id='v10_it_01_contanti', style='clean', lang='it', lines=[
    ('h', 'RISTORANTE ROMA', ''), ('n', 'Via dei Fori Imperiali 1', ''), ('n', '00186 Roma', ''), ('n', '', ''),
    ('n', '1 Pinsa romana', '12,00'), ('n', '1 Vino della casa 750 ml', '14,00'), ('n', '2 Espresso', '5,00'),
    ('n', '', ''), ('n', 'TOTALE COMPLESSIVO', '31,00'), ('n', 'CONTANTI', '31,00')],
    items=[('1 Pinsa romana',1200),('1 Vino della casa 750 ml',1400),('2 Espresso',500)], total=3100),
  dict(id='v10_es_01_carrer', style='clean', lang='es', lines=[
    ('h', 'BAR BALMES', ''), ('n', 'Carrer de Balmes 112', ''), ('n', '08008 Barcelona', ''),
    ('n', 'Mesa 4', ''), ('n', '', ''),
    ('n', '2 Cana', '5,00'), ('n', '1 Racion pulpo', '14,00'), ('n', '1 Pan con tomate', '2,50'),
    ('n', '', ''), ('n', 'A PAGAR', '21,50'), ('n', 'EFECTIVO', '21,50')],
    items=[('2 Cana',500),('1 Racion pulpo',1400),('1 Pan con tomate',250)], total=2150),
  dict(id='v10_fr_01_roquette', style='clean', lang='fr', lines=[
    ('h', 'CAFE ROQUETTE', ''), ('n', 'Rue de la Roquette 132', ''), ('n', '75011 Paris', ''), ('n', '', ''),
    ('n', '1 Croque monsieur', '9,50'), ('n', '2 Verre de vin', '12,00'), ('n', '1 Cafe creme', '3,50'),
    ('n', '', ''), ('n', 'TOTAL A PAYER', '25,00'), ('n', 'ESPECES', '25,00')],
    items=[('1 Croque monsieur',950),('2 Verre de vin',1200),('1 Cafe creme',350)], total=2500),
  dict(id='v10_de_01_rechnung', style='clean', lang='de', lines=[
    ('h', 'GASTHAUS ZUM FON', ''), ('n', 'Hauptstrasse 48', ''), ('n', '10115 Berlin', ''),
    ('n', 'Tel 030 555 7788', ''), ('n', 'Rechnung 450', ''), ('n', '', ''),
    ('n', '1 Schnitzel 250 g', '18,50'), ('n', '2 Bier 500 ml', '9,00'), ('n', '1 Apfelstrudel', '6,50'),
    ('n', '', ''), ('n', 'SUMME', '34,00'), ('n', 'BAR BEZAHLT', '34,00')],
    items=[('1 Schnitzel 250 g',1850),('2 Bier 500 ml',900),('1 Apfelstrudel',650)], total=3400),
  dict(id='v10_en_01_check', style='clean', lang='en', lines=[
    ('h', 'THE CHECKERED PUB', ''), ('n', '48 Church Street', ''), ('n', 'Austin TX 78701', ''),
    ('n', 'Tel 512 555 0199', ''), ('n', 'Check 2211', ''), ('n', '', ''),
    ('n', '1 Burger', '15.00'), ('n', '1 Fries', '5.00'), ('n', '2 Iced Tea', '7.00'),
    ('n', '', ''), ('n', 'AMOUNT DUE', '27.00'), ('n', 'CASH', '27.00')],
    items=[('1 Burger',1500),('1 Fries',500),('2 Iced Tea',700)], total=2700),
  dict(id='v10_nl_02_scheef_kassabon', style='skewed', lang='nl', lines=[
    ('h', 'LUNCHROOM SCHEEF', ''), ('n', 'Hoofdweg 221', ''), ('n', '1056 GE Amsterdam', ''),
    ('n', 'Kassabon nr 2026', ''), ('n', '', ''),
    ('n', '2 Koffie', '4,60'), ('n', '1 Tosti', '4,60'), ('n', '1 Soep 250 ml', '5,50'),
    ('n', '', ''), ('n', 'TOTAAL', '14,70'), ('n', 'PIN', '14,70')],
    items=[('2 Koffie',460),('1 Tosti',460),('1 Soep 250 ml',550)], total=1470),
  dict(id='v10_nl_03_streepjes', style='clean', lang='nl', lines=[
    ('h', 'CAFE STREEPJE', ''), ('n', 'Plein 12', ''), ('n', '', ''),
    ('n', '1 Koffie', '4,60-'), ('n', '1 Thee', '3,40-'),
    ('n', '', ''), ('n', 'TOTAAL', '8,00'), ('n', 'CONTANT', '8,00')],
    items=[('1 Koffie',460),('1 Thee',340)], total=800),
  dict(id='v10_it_02_scheef_fuzzy', style='skewed8', lang='it', lines=[
    ('h', 'BAR CENTRALE', ''), ('n', 'Piazza del Duomo 3', ''), ('n', '20121 Milano', ''), ('n', '', ''),
    ('n', '2 Cappuccino', '5,00'), ('n', '1 Cornetto', '2,20'), ('n', '1 Spremuta', '4,80'),
    ('n', '', ''), ('n', 'TOTALE', '12,00'), ('n', 'CONTANTE', '12,00')],
    items=[('2 Cappuccino',500),('1 Cornetto',220),('1 Spremuta',480)], total=1200),
  dict(id='v10_nl_04_onscherp_gewicht', style='blurry', lang='nl', lines=[
    ('h', 'EETCAFE GEWICHT', ''), ('n', 'Markt 8', ''), ('n', '', ''),
    ('n', '1 Kipsate 200 g', '9,50'), ('n', '1 Verse muntthee 33 cl', '3,50'), ('n', '2 Kaasblokjes 250 stuks', '12,00'),
    ('n', '', ''), ('n', 'TOTAAL', '25,00'), ('n', 'MASTERCARD', '25,00')],
    items=[('1 Kipsate 200 g',950),('1 Verse muntthee 33 cl',350),('2 Kaasblokjes 250 stuks',1200)], total=2500),
]

if __name__ == '__main__':
    import sys
    outdir = sys.argv[1] if len(sys.argv) > 1 else 'tests/testset-v10'
    write_set(EIGEN, outdir)
