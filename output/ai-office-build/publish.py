from pathlib import Path
import json, re, zipfile
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject
root=Path(__file__).resolve().parents[2]
base='https://tarshar4242.github.io/learn-ai-with-tarshar/'
folder=root/'public/notes/materials/ai-office-startup'
pdf=folder/'course-slides.pdf'
r=PdfReader(pdf);w=PdfWriter();w.clone_document_from_reader(r)
for page in w.pages:
 for ref in page.get('/Annots',[]):
  action=ref.get_object().get('/A',{})
  uri=str(action.get('/URI',''))
  if uri.startswith('http://localhost:8768/'):
   action[NameObject('/URI')]=TextStringObject(uri.replace('http://localhost:8768/',base))
w.write(pdf)
for page in PdfReader(pdf).pages:
 for ref in page.get('/Annots',[]):
  uri=str(ref.get_object().get('/A',{}).get('/URI',''))
  assert not re.search(r'localhost|127\.0\.0\.1|file:',uri),uri
with zipfile.ZipFile(folder/'course-materials.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['course-slides.pdf','practice-contract.pdf','practice-master.pptx','practice-plan.pdf','sample-deck.pptx','practice-prompts.txt','practice-source.txt']:
  z.write(folder/name,'codex-'+name)
 z.writestr('使用說明.txt','AI 開機日｜同仁行政實作班（Codex 版）\n32 頁課堂簡報、Spark 行事曆練習、可編輯母版與套版示例。\n線上課程與操作提示：'+base+'notes/ai-office-startup.html\n')
with zipfile.ZipFile(folder/'course-materials.zip') as z:assert z.testzip() is None
print('Public PDF links and materials ZIP verified.')
