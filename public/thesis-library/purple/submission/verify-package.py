from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
count=0
for line in (root/'SHA256SUMS.txt').read_text().splitlines():
 expected,name=line.split('  ',1)
 assert sha((root/name).read_bytes())==expected,name
 count+=1
m=json.loads((root/'source-manifest.json').read_text())
assert sha((root/'platform-source.zip').read_bytes())==m['archive_sha256']
with zipfile.ZipFile(root/'platform-source.zip') as z:
 for name,expected in m['files'].items():
  assert sha(z.read('platform/'+name))==expected,name
print(f'OK: {count} submission files and {len(m["files"])} source files verified')
