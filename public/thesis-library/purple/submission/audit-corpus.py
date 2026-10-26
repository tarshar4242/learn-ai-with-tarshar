from pathlib import Path
import json,collections,hashlib,sys,csv
p=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve();sys.path.insert(0,str(p))
from app.engine import Engine,SentenceEncoder,vector_text
enc=SentenceEncoder();tok=enc.model.tokenizer;maxseq=enc.model.max_seq_length
docs=json.loads((p/'data/corpus.json').read_text())['docs'];counts=collections.Counter();rows=[]
for d in docs:
 ids=tok(vector_text(d),truncation=False,add_special_tokens=True)['input_ids'];n=len(ids);counts[d.get('type')]+=1
 rows.append({'id':d['id'],'type':d.get('type'),'law':d.get('law'),'no':d.get('no'),'characters':len(d['text']),'embedding_tokens':n,'embedding_truncated':n>maxseq,'generation_evidence_truncated':len(d['text'])>1500,'url':d.get('url') or '', 'text_sha256':hashlib.sha256(d['text'].encode()).hexdigest()})
out=Path('audit-output');out.mkdir(exist_ok=True);
with (out/'corpus-inventory.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
info={'documents':len(rows),'types':dict(counts),'unique_law_labels':len(set(d.get('law') for d in docs)),'missing_url':sum(not d.get('url') for d in docs),'duplicate_ids':len(docs)-len(set(d['id'] for d in docs)),'blank_text':sum(not d['text'].strip() for d in docs),'unique_texts':len(set(d['text'] for d in docs)),'embedding_max_seq_length':maxseq,'embedding_truncated_documents':sum(r['embedding_truncated'] for r in rows),'max_embedding_tokens':max(r['embedding_tokens'] for r in rows),'generation_evidence_limit':1500,'generation_truncated_documents':sum(r['generation_evidence_truncated'] for r in rows),'max_text_characters':max(r['characters'] for r in rows),'embedding_dimension':enc.model.get_sentence_embedding_dimension(),'corpus_sha256':hashlib.sha256((p/'data/corpus.json').read_bytes()).hexdigest()}
(out/'corpus-audit.json').write_text(json.dumps(info,ensure_ascii=False,indent=2));print(json.dumps(info,ensure_ascii=False))
