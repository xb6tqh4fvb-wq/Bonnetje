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

# ---------------- v11-set van 10: Est./since-regels, busletters, Rekening als totaal,
# ---------------- "bar"-gerechten, NL-bedragsvormen 6,- en 2,5, volume 0,33, Tikkie/MULTIBANCO/Rua,
# ---------------- US-tax en NL-fooi afronding ----------------
EIGEN = [
  dict(id='v11_nl_01_est_fooi', style='clean', lang='nl', lines=[
    ('h', 'EETCAFE OUD GLORIE', ''), ('n', 'Est. 1998', ''), ('n', 'Kerkstraat 480 A', ''),
    ('n', '1011 AB Amsterdam', ''), ('n', '', ''),
    ('n', '1 Chocolade bar', '3,50'), ('n', '2 Koffie', '5,00'), ('n', '1 Lunch van de dag', '12,50'),
    ('n', '', ''), ('n', 'Fooi', '2,00'), ('n', 'Rekening', '23,00'), ('n', 'Tikkie', '23,00')],
    items=[('1 Chocolade bar',350),('2 Koffie',500),('1 Lunch van de dag',1250)], total=2300, tip=200),
  dict(id='v11_be_01_busletter', style='clean', lang='nl', lines=[
    ('h', 'BRASSERIE LOUISE', ''), ('n', 'Avenue Louise 221 B', ''), ('n', '1050 Brussel', ''), ('n', '', ''),
    ('n', '1 Waterzooi', '19,50'), ('n', '2 Witte wijn', '11,00'),
    ('n', '', ''), ('n', 'Rekening', '30,50'), ('n', 'MAESTRO', '30,50')],
    items=[('1 Waterzooi',1950),('2 Witte wijn',1100)], total=3050),
  dict(id='v11_nl_02_bedragsvormen', style='clean', lang='nl', lines=[
    ('h', 'CAFE KORT NOTITIE', ''), ('n', 'Plein 4', ''), ('n', '', ''),
    ('n', '1 Pils', '6,-'), ('n', '1 Koffie', '2,5'), ('n', '1 Cola 0,33', '3,30'),
    ('n', '', ''), ('n', 'TOTAAL', '11,80'), ('n', 'PIN', '11,80')],
    items=[('1 Pils',600),('1 Koffie',250),('1 Cola 0,33',330)], total=1180),
  dict(id='v11_es_01_bar_tapas', style='clean', lang='es', lines=[
    ('h', 'BAR TAPAS SOL', ''), ('n', 'Calle de la Palma 22', ''), ('n', '28004 Madrid', ''),
    ('n', 'Since 1987', ''), ('n', '', ''),
    ('n', '2 Cana', '5,00'), ('n', '1 Bar Tapas del dia', '9,50'), ('n', '1 Pan', '1,50'),
    ('n', '', ''), ('n', 'TOTAL', '16,00'), ('n', 'EFECTIVO', '16,00')],
    items=[('2 Cana',500),('1 Bar Tapas del dia',950),('1 Pan',150)], total=1600),
  dict(id='v11_pt_01_multibanco', style='clean', lang='pt', lines=[
    ('h', 'TASCA AUGUSTA', ''), ('n', 'Rua Augusta 15', ''), ('n', '1100-053 Lisboa', ''), ('n', '', ''),
    ('n', '1 Bacalhau', '13,50'), ('n', '2 Vinho verde', '7,00'), ('n', '1 Cafe', '1,20'),
    ('n', '', ''), ('n', 'TOTAL', '21,70'), ('n', 'MULTIBANCO', '21,70')],
    items=[('1 Bacalhau',1350),('2 Vinho verde',700),('1 Cafe',120)], total=2170),
  dict(id='v11_en_01_us_tax', style='clean', lang='en', lines=[
    ('h', 'MELT DINER', ''), ('n', 'Est. 2004', ''), ('n', '77 Congress Ave', ''), ('n', 'Austin TX 78701', ''), ('n', '', ''),
    ('n', '1 Burger', '15.00'), ('n', '1 Fries', '5.00'), ('n', '', ''),
    ('n', 'Subtotal', '20.00'), ('n', 'Sales tax 8.25%', '1.65'),
    ('n', 'TOTAL', '21.65'), ('n', 'CASH', '21.65')],
    items=[('1 Burger',1500),('1 Fries',500)], total=2165),
  dict(id='v11_de_01_seit_scheef', style='skewed', lang='de', lines=[
    ('h', 'BRAUHAUS ZUM ALDEN', ''), ('n', 'Seit 1899', ''), ('n', 'Hauptstrasse 48', ''), ('n', '10115 Berlin', ''), ('n', '', ''),
    ('n', '1 Schnitzel 250 g', '18,50'), ('n', '2 Bier 500 ml', '9,00'), ('n', '1 Brezel', '2,50'),
    ('n', '', ''), ('n', 'SUMME', '30,00'), ('n', 'BAR', '30,00')],
    items=[('1 Schnitzel 250 g',1850),('2 Bier 500 ml',900),('1 Brezel',250)], total=3000),
  dict(id='v11_nl_03_scheef_rekening', style='skewed8', lang='nl', lines=[
    ('h', 'RESTAURANT SCHEVE TOREN', ''), ('n', 'Sinds 2010', ''), ('n', 'Hoofdweg 221', ''),
    ('n', '1056 GE Amsterdam', ''), ('n', '', ''),
    ('n', '2 Soep 250 ml', '11,00'), ('n', '1 Stoofpot 300 g', '17,50'), ('n', '2 Cola 0,33', '6,60'),
    ('n', '', ''), ('n', 'Fooi', '3,00'), ('n', 'Rekening', '38,10'), ('n', 'PIN', '38,10')],
    items=[('2 Soep 250 ml',1100),('1 Stoofpot 300 g',1750),('2 Cola 0,33',660)], total=3810, tip=300),
  dict(id='v11_fr_01_onscherp', style='blurry', lang='fr', lines=[
    ('h', 'CAFE DU COMMERCE', ''), ('n', 'Depuis 1975', ''), ('n', 'Rue de la Roquette 132', ''), ('n', '75011 Paris', ''), ('n', '', ''),
    ('n', '1 Croque monsieur', '9,50'), ('n', '2 Verre de vin', '12,00'), ('n', '1 Tarte citron', '6,50'),
    ('n', '', ''), ('n', 'TOTAL A PAYER', '28,00'), ('n', 'CARTE', '28,00')],
    items=[('1 Croque monsieur',950),('2 Verre de vin',1200),('1 Tarte citron',650)], total=2800),
  dict(id='v11_nl_04_ruis', style='noise', lang='nl', lines=[
    ('h', 'AFHAALCENTRALE SNEL', ''), ('n', 'Anno 2015', ''), ('n', 'Stationsplein 12 B', ''), ('n', '', ''),
    ('n', '1 Kapsalon 400 g', '12,50'), ('n', '2 Cola 0,33', '6,60'), ('n', '1 Extra saus 50 ml', '1,00'),
    ('n', '', ''), ('n', 'TOTAAL', '20,10'), ('n', 'CONTACTLOOS', '20,10')],
    items=[('1 Kapsalon 400 g',1250),('2 Cola 0,33',660),('1 Extra saus 50 ml',100)], total=2010),
]

if __name__ == '__main__':
    import sys
    outdir = sys.argv[1] if len(sys.argv) > 1 else 'tests/testset-v11'
    write_set(EIGEN, outdir)
