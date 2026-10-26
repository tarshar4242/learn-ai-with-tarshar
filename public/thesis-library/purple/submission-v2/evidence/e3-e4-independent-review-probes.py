import sys,json,tempfile
from pathlib import Path
sys.path.insert(0,'/tmp/thesis-review-e1-e4-1026')
from app.answer_checks import boundary_mismatches,quantity_tokens,modal_tokens,number_value
from app.engine import Engine
out=[]
for answer,source in [('10.0日以上','10日以上'),('1,000元以上','0元以上'),('不應提出申請','應提出申請'),('申請人得領取','申請人須申請，並取得資格'),('六個月','未達六個月'),('30日以上','三十日以上')]:
 out.append({'answer':answer,'source':source,'answer_tokens':quantity_tokens(answer),'source_tokens':quantity_tokens(source),'mismatches':boundary_mismatches(answer,[source])})
with tempfile.TemporaryDirectory() as p:
 root=Path(p);(root/'data').mkdir();(root/'data/corpus.json').write_text(json.dumps({'docs':[{'id':'good','law':'測試','no':'第1條','text':'三十日以上，應提出申請。'}]}))
 eng=Engine(root,llm=object());res={'warnings':[]};tr={}
 eng._validate_answer({'status':'answered','points':[{'text':'不採用項','citations':['fake'],'quote':'fake'},{'text':'超過30日應提出申請','citations':['good'],'quote':'不在原文'}]}, {'good'},res,tr)
 out.append({'dropped_point_renumbering':res,'trace':tr})
 # A quote in a different retrieved but uncited source is already tested. This
 # additional case ensures corpus text beyond the model evidence cutoff fails.
 long='甲'*1500+'禁止獨特尾段';eng.by_id['good']['text']=long;res={'warnings':[]};tr={}
 eng._validate_answer({'status':'answered','points':[{'text':'核對尾段','citations':['good'],'quote':'禁止獨特尾段'}]}, {'good'},res,tr)
 out.append({'quote_beyond_evidence':res,'trace':tr})
Path('/tmp/e3-e4-independent-review-probes.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps(out,ensure_ascii=False,indent=2))
