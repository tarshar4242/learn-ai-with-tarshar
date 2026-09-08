from pathlib import Path
import shutil,zipfile,re,json
root=Path('/Users/kin145lo42/kt-site/learn-ai-with-tarshar')
site=Path('/Users/kin145lo42/Agent/ray/100_Todo/projects/課程｜同仁AI開機日｜私人預覽')
public=site/'public';src=root/'public/notes'
for p in ['ai-office-startup.html','ai-office-startup-slides.html']:shutil.copy(src/p,public/p)
for p in ['assets/ai-office-startup','materials/ai-office-startup']:shutil.copytree(src/p,public/p,dirs_exist_ok=True)
(public/'index.html').write_text('''<!doctype html><html lang="zh-TW"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI 開機日｜實作教室</title><style>@font-face{font-family:Iansui;src:url('assets/ai-office-startup/Iansui-Regular.ttf')}*{box-sizing:border-box}body{margin:0;background:#eee5ce;color:#302a20;font-family:Iansui,serif}main{max-width:900px;margin:auto;padding:24px}img{width:100%;border:1px solid #82765f}h1{font-size:30px}p{font-size:21px;line-height:1.8}a{display:block;margin:16px 0;padding:18px;border:1px solid #82765f;background:#fffdf2;color:#344b35;text-decoration:none;font-size:23px;box-shadow:3px 4px #c9c1ad}a:nth-of-type(1){background:#d5e4d0}small{display:block;line-height:1.8;color:#67634f}</style><main><img src="assets/ai-office-startup/cover.png" alt="AI 開機日，小D教練的手把手實作課"><h1>兩小時，真的做出來</h1><p>Spark 行事曆 37 分鐘 × 母版套簡報 40 分鐘<br>跟著做 → 換你做 → 打開成品核對</p><a href="ai-office-startup-slides.html">打開 32 頁實作簡報 →</a><a href="ai-office-startup.html">課程草案、素材與操作提示 →</a><a href="course-materials.zip" download>下載完整教材包 ZIP ↓</a><a href="materials/ai-office-startup/course-slides.pdf">下載課堂簡報 PDF ↓</a><small>私人審閱版｜單位名稱與場次待確認。教材使用虛構練習資料。</small></main></html>''')
with zipfile.ZipFile(public/'course-materials.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in (public/'materials/ai-office-startup').rglob('*'):
  if p.is_file():z.write(p,p.name)
shutil.copytree(public,site/'dist',dirs_exist_ok=True)
# Validate every local HTML resource and download target in final site.
bad=[]
for p in public.glob('*.html'):
 for link in re.findall(r'(?:href|src)=["\']([^"\']+)',p.read_text()):
  if link.startswith(('http','#','data:','mailto:','javascript:')):continue
  if not (p.parent/link.split('#')[0].split('?')[0]).exists():bad.append((p.name,link))
assert not bad,bad
with zipfile.ZipFile(public/'course-materials.zip') as z:assert z.testzip() is None
print('All local links resolve; ZIP integrity valid. Snapshot synced.')
