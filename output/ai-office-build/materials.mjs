import fs from 'node:fs/promises';
import path from 'node:path';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
import {finalizePresentation} from '/Users/kin145lo42/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations/container_tools/artifact_tool_utils.mjs';
const root='/Users/kin145lo42/kt-site/learn-ai-with-tarshar';
const workspaceDir=path.join(root,'output/ai-office-build');
const skill='/Users/kin145lo42/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations';
const bg=new Uint8Array(await fs.readFile(path.join(root,'public/notes/assets/ai-office-startup/paper.png')));
const rows=[
 ['同仁數位工具體驗計畫','行政同仁實作工作坊\n两小時，完成一份可核對的工作成果'],
 ['為什麼要做','整理資料不再反覆複製貼上\n每一項成果都附上來源\n把判斷與核對留給承辦人'],
 ['誰可以參加','本次工作坊參與同仁\n無程式基礎也能參與\n每組二至三人，輪流操作與核對'],
 ['怎麼進行','準備筆電與單位允許的 AI 帳號\n使用講師提供的虛構資料\n完成重點表，再互相檢查'],
 ['交付與檢查','每組交一張重點表\n欄位：事項、依據、負責角色、待確認\n不使用真實個資及未公開內部文件']
];
for(const kind of ['template','example']){
 const p=Presentation.create({slideSize:{width:1280,height:720}});
 const master=p.masters.add('AI 開機日｜手帳母版');master.background.fill='#faf7ed';
 const layout=p.layouts.add('標題與三點內容');layout.setParentLayoutId(master.id);
 layout.placeholders.add({type:'title',index:0,geometry:'textbox',position:{left:115,top:80,width:1050,height:90},text:'標題'});
 layout.placeholders.add({type:'body',index:0,geometry:'textbox',position:{left:125,top:235,width:1020,height:325},text:'三個重點'});
 for(let i=0;i<5;i++){
  const s=p.slides.add();s.setLayout(layout);
  s.images.add({blob:bg,contentType:'image/png',position:{left:0,top:0,width:1280,height:720}});
  // Move inherited placeholders to foreground by adding editable slide-local title and body.
  const t=s.placeholders.getItem('title');t.text=kind==='template'?['計畫名稱','為什麼要做','誰可以參加','怎麼進行','下一步'][i]:rows[i][0];
  t.position={left:115,top:80,width:1050,height:100};
  t.text.style={typeface:'Iansui',fontSize:48,bold:true,color:'#30291f',autoFit:'none'};
  const b=s.placeholders.getItem('body');b.text=kind==='template'?['填入計畫名稱、對象及一句目的','填入三個有來源的目的或痛點','填入適用對象、資格與準備','填入辦理方式、流程與產出','填入要交的成果與核對事項'][i]:rows[i][1].replace('两','兩');
  b.position={left:125,top:235,width:1020,height:325};
  b.text.style={typeface:'Iansui',fontSize:36,color:'#30291f',autoFit:'none'};
  const foot=s.shapes.add({geometry:'textbox',position:{left:115,top:622,width:1050,height:40},fill:'none',line:{fill:'none',width:0}});foot.text=`${i+1} / 5    Learn AI with Tarshar｜2026`;foot.text.style={typeface:'Iansui',fontSize:19,color:'#52654e'};
  s.speakerNotes.textFrame.setText(kind==='template'?'本檔為新編課堂練習母版，非機關正式公版。保留標題與正文的可編輯文字及手帳紙張背景；以提供資料填入內容。':'本檔為依虛構計畫製作的套版成果示例，不代表曾以 Spark 實際執行。來源為同一教材包的計畫練習資料。');
 }
 const candidate=path.join(workspaceDir,kind+'-candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
 await fs.mkdir(path.join(workspaceDir,'final'),{recursive:true});
 const finalPath=path.join(workspaceDir,'final',kind+'-final-v6.pptx');
 await finalizePresentation({workspaceDir,candidatePath:candidate,finalPath,pythonExecutable:'/Users/kin145lo42/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000'],explicitTotalSlideCount:5,verifyArtifactToolImport:true,receiptPath:path.join(workspaceDir,kind+'-validation-v6.json')});
 await fs.copyFile(finalPath,path.join(root,'public/notes/materials/ai-office-startup',kind==='template'?'practice-master.pptx':'sample-deck.pptx'));
 for(let i=0;i<p.slides.items.length;i++){
  const b=await p.export({slide:p.slides.items[i],format:'png',scale:.6});await fs.writeFile(path.join(workspaceDir,`${kind}-${i+1}.png`),new Uint8Array(await b.arrayBuffer()));
 }
 console.log(kind+' done');
}