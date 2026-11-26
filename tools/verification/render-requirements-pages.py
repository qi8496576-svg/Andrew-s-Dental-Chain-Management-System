from pathlib import Path
import argparse,json
import pypdfium2 as pdfium
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('--pdf',required=True);p.add_argument('--out',required=True);a=p.parse_args()
out=Path(a.out);out.mkdir(parents=True,exist_ok=True);doc=pdfium.PdfDocument(a.pdf);texts=[]
for i,page in enumerate(doc):
 page.render(scale=1.8).to_pil().convert('RGB').save(out/f'page-{i+1}.png');texts.append(page.get_textpage().get_text_range())
for start in range(0,len(doc),8):
 sheet=Image.new('RGB',(1600,4600),'#d5d9df');draw=ImageDraw.Draw(sheet)
 for j in range(start,min(start+8,len(doc))):
  image=Image.open(out/f'page-{j+1}.png');image.thumbnail((780,1100));x=(j-start)%2*800;y=(j-start)//2*1150;sheet.paste(image,(x,y+30));draw.text((x+10,y+8),'PAGE '+str(j+1),fill='black')
 sheet.save(out/f'sheet-{start//8+1}.png')
(out/'text-pages.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'rendered_pages':len(doc),'new_content_pages':[i+1 for i,t in enumerate(texts) if any(x in t for x in ['RegistrationFeePolicy','演示支付','professional_title','费用与短时号源'])]},ensure_ascii=False))
