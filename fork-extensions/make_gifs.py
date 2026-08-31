from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, os

SRC = Path(r'C:\Temp\codex-clipboard-08e8e9ba-2fe7-46e0-a42e-d6a7b3c5246f.png')
OUT = Path('gifs')
OUT.mkdir(exist_ok=True)
im = Image.open(SRC).convert('RGB')

# (name, crop box) 17 tiles in the supplied reference sheet.
tiles = [
 ('01_initial_stand',(35,10,240,300)), ('02_take_folder',(275,10,485,300)),
 ('03_look_folder',(520,10,735,300)), ('04_throw_folder',(755,10,1095,300)),
 ('05_crouch_search',(1090,55,1285,305)), ('06_careful_search',(1285,105,1535,305)),
 ('07_rummage_pile',(20,375,315,605)), ('08_pick_folder',(315,375,555,605)),
 ('09_quick_check',(600,370,825,605)), ('10_not_this',(850,370,1080,605)),
 ('11_toss_aside',(1130,355,1510,605)), ('12_found_target',(35,660,275,930)),
 ('13_found_happy',(270,660,505,930)), ('14_star_eyes',(500,660,760,930)),
 ('15_happy_store',(740,660,1000,930)), ('16_stand_organize',(1035,655,1270,930)),
 ('17_return_initial',(1280,655,1510,930)),
]

def fit_crop(box):
    # Each box is hand-tuned to exclude the blue labels and neighboring tiles.
    crop = im.crop(box)
    crop.thumbnail((246, 292), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (256, 300), 'white')
    canvas.paste(crop, ((256-crop.width)//2, (300-crop.height)//2))
    return canvas

def transformed(base, dx=0, dy=0, scale=1.0, angle=0):
    w,h=base.size
    if scale != 1.0:
        nw,nh=max(1,int(w*scale)),max(1,int(h*scale))
        b=base.resize((nw,nh),Image.Resampling.BICUBIC)
    else: b=base
    if angle:
        b=b.rotate(angle,Image.Resampling.BICUBIC,expand=True,fillcolor='white')
    canvas=Image.new('RGB',(256,300),'white')
    canvas.paste(b,((256-b.width)//2+dx,(300-b.height)//2+dy))
    return canvas

def add_fx(img, kind, phase, i, n):
    d=ImageDraw.Draw(img)
    t=i/(n-1) if n>1 else 0
    if kind in ('blink','idle') and i in (2,3):
        # simple eyelid accents, subtle and style-matched
        d.arc((91,98,112,113),180,360,fill=(24,40,90),width=2)
        d.arc((142,98,163,113),180,360,fill=(24,40,90),width=2)
    if kind=='throw':
        for k in range(2):
            x=192-int(80*t)-k*10; y=55+int(12*math.sin(t*math.pi))+k*12
            d.arc((x,y,x+35,y+20),190,300,fill=(30,35,60),width=2)
    if kind in ('spark','found'):
        cx,cy=36,65
        for k in range(3):
            a=phase+k*2.1; r=14+5*math.sin(a)
            x=cx+int(math.cos(a)*r); y=cy+int(math.sin(a)*r)
            d.line((x-4,y,x+4,y),fill=(247,180,48),width=2)
            d.line((x,y-4,x,y+4),fill=(247,180,48),width=2)
    if kind=='stars':
        for k in range(4):
            x=30+55*k; y=40+int(12*math.sin(phase+k)); r=4+(k%2)*2
            d.polygon([(x,y-r),(x+2,y-2),(x+r,y),(x+2,y+2),(x,y+r),(x-2,y+2),(x-r,y),(x-2,y-2)],fill=(250,190,54))
    if kind=='sigh':
        r=8+int(5*math.sin(phase)); d.ellipse((190-r,65-r,190+r,65+r),outline=(145,160,190),width=2)
        d.ellipse((205-r//2,53-r//2,205+r//2,53+r//2),outline=(145,160,190),width=2)
    if kind=='papers':
        for k in range(3):
            x=25+int((i*13+k*47)%180); y=255-int((i*9+k*11)%45)
            d.line((x,y,x+18,y-5),fill=(120,130,150),width=1)
    return img

def make(name, box, effect='idle', n=8, duration=110):
    base=fit_crop(box)
    frames=[]
    for i in range(n):
        ph=2*math.pi*i/n
        if effect=='idle': dx=int(2*math.sin(ph)); dy=int(-3*math.sin(ph)); sc=1+0.01*math.sin(ph); ang=1.2*math.sin(ph)
        elif effect in ('blink',): dx=int(2*math.sin(ph)); dy=int(-2*math.sin(ph)); sc=1; ang=0
        elif effect=='throw': dx=int(16*math.sin(math.pi*min(1,i/(n-1)))); dy=int(-5*math.sin(math.pi*min(1,i/(n-1)))); sc=1+0.03*math.sin(ph); ang=-4*math.sin(ph)
        elif effect in ('crouch','rise'): dx=int(2*math.sin(ph)); dy=int((10 if effect=='crouch' else -10)*math.sin(math.pi*i/(n-1))); sc=1+0.02*math.sin(math.pi*i/(n-1)); ang=2*math.sin(ph)
        elif effect in ('bounce','happy'): dx=int(2*math.sin(ph)); dy=int(-8*abs(math.sin(ph))); sc=1+0.025*abs(math.sin(ph)); ang=3*math.sin(ph)
        elif effect=='toss': dx=int(10*math.sin(ph)); dy=int(-4*math.sin(ph)); sc=1; ang=6*math.sin(ph)
        else: dx=int(3*math.sin(ph)); dy=int(-2*math.sin(ph)); sc=1; ang=1.5*math.sin(ph)
        fr=transformed(base,dx,dy,sc,ang)
        fr=add_fx(fr,effect,ph,i,n)
        frames.append(fr)
    frames[0].save(OUT/(name+'.gif'),save_all=True,append_images=frames[1:],duration=duration,loop=0,optimize=False)

effects=['idle','blink','blink','throw','crouch','idle','papers','crouch','blink','sigh','toss','found','happy','stars','happy','rise','idle']
for (name,box),fx in zip(tiles,effects): make(name,box,fx,n=10 if fx in ('idle','blink','happy','stars') else 8)
print(f'generated {len(tiles)} GIFs in {OUT.resolve()}')
