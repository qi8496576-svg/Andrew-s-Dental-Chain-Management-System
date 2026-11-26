from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from lxml import etree as E
import re,json,math,html
ROOT=Path.cwd();OUT=ROOT/'docs/diagrams/official'
S=2
FONTS={}
def font(size):
 if size not in FONTS:FONTS[size]=ImageFont.truetype('C:/Windows/Fonts/simsun.ttc',round(size*S))
 return FONTS[size]
def path_points(d):
 tokens=re.findall(r'[MLHVZ]|-?\d+(?:\.\d+)?',d);pos=0;x=y=0;points=[]
 while pos<len(tokens):
  op=tokens[pos];pos+=1
  if op in ['M','L']:x=float(tokens[pos]);y=float(tokens[pos+1]);pos+=2
  elif op=='H':x=float(tokens[pos]);pos+=1
  elif op=='V':y=float(tokens[pos]);pos+=1
  elif op=='Z':points.append(points[0]);continue
  points.append((x*S,y*S))
 return points
def render(p):
 r=E.fromstring(p.read_bytes());W,H=[float(r.get(x)) for x in ['width','height']];im=Image.new('RGB',(math.ceil(W*S),math.ceil(H*S)),'white');draw=ImageDraw.Draw(im)
 def f(el,key,default=0):return float(el.get(key,default))
 def line(a,b,width,dash=None):
  if dash:
   pattern=[float(v)*S for v in dash.split()];dist=math.dist(a,b);at=0;j=0
   if not dist:return
   while at<dist:
    end=min(dist,at+pattern[j%len(pattern)])
    if j%2==0:draw.line([(a[0]+(b[0]-a[0])*at/dist,a[1]+(b[1]-a[1])*at/dist),(a[0]+(b[0]-a[0])*end/dist,a[1]+(b[1]-a[1])*end/dist)],fill='black',width=width)
    at=end;j+=1
  else:draw.line([a,b],fill='black',width=width)
 for el in r.iter():
  tag=E.QName(el).localname;w=max(1,round(f(el,'stroke-width',1)*S));fill=el.get('fill','black');stroke=el.get('stroke');fill=None if fill=='none' else fill
  if tag=='rect':
   if el.get('width')=='100%':continue
   x,y,ww,hh=[f(el,k)*S for k in ['x','y','width','height']]
   draw.rounded_rectangle((x,y,x+ww,y+hh),radius=f(el,'rx')*S,fill=fill,outline=stroke,width=w)
  elif tag in ['circle','ellipse']:
   x,y=f(el,'cx')*S,f(el,'cy')*S;rx=f(el,'r',f(el,'rx'))*S;ry=f(el,'r',f(el,'ry'))*S
   draw.ellipse((x-rx,y-ry,x+rx,y+ry),fill=fill,outline=stroke,width=w)
  elif tag=='line':line((f(el,'x1')*S,f(el,'y1')*S),(f(el,'x2')*S,f(el,'y2')*S),w,el.get('stroke-dasharray'))
  elif tag=='polygon':draw.polygon([tuple(float(x)*S for x in pair.split(',')) for pair in el.get('points').split()],fill=fill,outline=stroke,width=w)
  elif tag=='path':
   points=path_points(el.get('d'))
   if fill:draw.polygon(points,fill=fill)
   if stroke:draw.line(points,fill=stroke,width=w,joint='curve')
  elif tag=='text':
   size=f(el,'font-size',18);fo=font(size);text=el.text or '';x=f(el,'x')*S;y=f(el,'y')*S;anchor=el.get('text-anchor','start');tw=draw.textlength(text,font=fo)
   if anchor=='middle':x-=tw/2
   elif anchor=='end':x-=tw
   draw.text((x,y),text,font=fo,anchor='ls',fill='black')
   if el.get('text-decoration')=='underline':draw.line((x,y+S*2,x+tw,y+S*2),fill='black',width=max(1,S))
 im.save(p.with_suffix('.png'))
 return im

figures=json.loads((ROOT/'docs/diagrams/figure-index.json').read_text(encoding='utf8'))
for f in figures:
 if not f['source'].endswith('.svg'):continue
 source=ROOT/f['source'];render(source)
 target=ROOT/f['official_image'];target.write_bytes(source.with_suffix('.png').read_bytes());source.with_suffix('.png').unlink()
 (ROOT/f['media']).write_bytes(target.read_bytes())
 (ROOT/'docs/diagrams/official'/(f['id']+'.svg')).write_bytes(source.read_bytes())
 for alias in f['matching_original_pngs']:
  (ROOT/alias).write_bytes(target.read_bytes());(ROOT/alias).with_suffix('.svg').write_bytes(source.read_bytes())
 f['media_sha256']=__import__('hashlib').sha256(target.read_bytes()).hexdigest()
(ROOT/'docs/diagrams/figure-index.json').write_text(json.dumps(figures,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Exported current PNGs from the 18 canonical SVG sources')
