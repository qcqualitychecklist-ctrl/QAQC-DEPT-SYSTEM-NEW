/**
 * QAQC Department System
 * Uses only the NEW QAQC MONITORING DATABASE.
 * Transfer ID links every QC allocation to its parent transfer.
 */
const DATABASE_ID = '1pcXfWZFIcM00EG5_VzDGLK7ERrCL0WOkvjMx-Y2aBSI';
const JO_SHEET = 'JO Register';
const JO_OVERRIDE_SHEET = 'JO Register Overrides';
const JO_SOURCE_ID = '1QZ7_R2e2Kl5ylC6ag1Va9KPUQdg02wVvKLiFEJGy2is';
const JO_SOURCE_GID = 1597956270;
const JO_SOURCE_START_ROW = 2273;
const FGTS_SOURCE_ID = '1he8ext1x_5p8BROaxoaHQkEV7eBBSI09nIZoQeDRe54';
const FGTS_SOURCE_GID = 91015752;
const FGTS_SOURCE_START_ROW = 6;
const FGTS_HEADERS = ['Classification','Lead Days','Date Received','Date Finish','S.O. no.','Client','Item no.','Panel Name','Qty','FGTS no.','QC-In Charge','Remarks','Category'];
const JO_OVERRIDE_HEADERS = ['Source Row','Updated At','CLASSIFICATION','J.O','S.O','Received','Delivery Date','Client','Item No.','Panel Name','Qty','Unit','Transferred','Balance','FGTS No.','Date Served','Remarks','Status','Timeliness'];
const TRANSFER_SHEET = 'Transfer Monitoring';
const ALLOCATION_SHEET = 'QC Allocation Details';
const REWORK_SHEET = 'Rework Monitoring';
const REWORK_HEADERS = ['Date Issue','S.O','J.O','Client Name','Item no.','Panel Name','Qty','Description of Rework','Person In-Charge','Concern Section','QC - in - Charge','Date Received','Lead Time','Status','Rework or Back Job','Category Issue','Corrective Action / Resolution'];
const REWORK_MAIN_SHEET = 'Rework Main';
const REWORK_DETAILS_SHEET = 'Rework Details';
const REWORK_ASSIGNMENTS_SHEET = 'Rework Assignments';
const REWORK_MAIN_HEADERS = ['Rework ID','Created At','Updated At','Date Issue','S.O','J.O','Client Name','Item no.','Panel Name','Qty','Date Received','QC - in - Charge','Date Finished']; // Date Received is retained only for legacy storage.
const REWORK_DETAILS_HEADERS = ['Detail ID','Rework ID','Created At','Updated At','Description of Rework','QC - in - Charge','Lead Time','Status','Rework or Back Job','Category Issue','Corrective Action / Resolution','Concern Section','Closed At','Date Finished','Item no.','Panel Name','Qty','Item ID'];
const REWORK_ASSIGNMENT_HEADERS = ['Assignment ID','Detail ID','Person In-Charge','Concern Section','Created At','Updated At'];
const REWORK_CONCERN_SECTIONS = ['Engineering','Machineries','Fabrication','PC','Busbarring','Final Assy','Warehouse','Wiring'];
const REWORK_STATUS_OPTIONS = ['Closed','Open'];
const REWORK_TYPE_OPTIONS = ['Rework','Backjob'];
const REWORK_CATEGORY_OPTIONS = ['Installation / Workmanship Error','Lacking / Incomplete Components, Parts & Materials','Wrong Component / Incorrect Installation','Damaged / Defective Component','Process / Verification Non-Compliance','Drawing / Engineering Error'];
const REWORK_CORRECTIVE_OPTIONS = ['To Correct Workmanship','To Complete Missing Components / Breaker','To Correct Installation','To Replace Defective Breaker / Component','To Repeat Process Until Verified','Engineering Review / Document Revision','Followed Approved Shop Drawing','To Correct Rating of Breaker / Component'];

const JO_HEADERS = ['Record ID','Created At','Updated At','J.O No','S.O No','Customer','Item No','Description','Quantity','Date Received','Target Date','Status','Remarks'];
const TRANSFER_HEADERS = ['Record ID','Created At','Updated At','Transfer ID','Date Received','Time Received','Section','Transfer No.','J.O','S.O','Client','Item No.','Panel Name','Qty','Location','Status','Done Qty','Remaining Qty','QC In Charge','FGTS No.','Date Finished','Status Remark','Remarks','Reminders'];
const ALLOCATION_HEADERS = ['Allocation ID','Transfer ID','QC In Charge','FGTS No.','Qty','Date Finished','Allocation Remarks','Created At','Updated At','Category'];
const TRANSFER_FIELDS = ['Date Received','Time Received','Section','Transfer No.','J.O','S.O','Client','Item No.','Panel Name','Qty','Location','Status','Status Remark','Remarks'];
const JO_FIELDS = ['J.O No','S.O No','Customer','Item No','Description','Quantity','Date Received','Target Date','Status','Remarks'];
const REMINDER_AFTER_DAYS = 3;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('QAQC Department System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

// Short-lived compressed cache for read-heavy monitoring modules. Cache failures are non-fatal.
function readModuleCache_(key){
  try{const packed=CacheService.getScriptCache().get(key);if(!packed)return null;const bytes=Utilities.base64Decode(packed);const json=Utilities.ungzip(Utilities.newBlob(bytes)).getDataAsString('UTF-8');return JSON.parse(json);}catch(e){return null;}
}
function writeModuleCache_(key,value){
  try{const packed=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(value),'application/json')).getBytes());if(packed.length<95000)CacheService.getScriptCache().put(key,packed,20);}catch(e){}
}
function invalidateModuleCache_(){
  try{const cache=CacheService.getScriptCache();const names=arguments.length?Array.from(arguments):['Transfer Monitoring','J.O Register','FGTS Monitoring'];names.forEach(name=>cache.remove('qaqc_module_v2_'+String(name).replace(/[^a-z0-9]/gi,'_')));}catch(e){}
}

function getSystemStatus() {
  try {
    const ss = SpreadsheetApp.openById(DATABASE_ID);
    return {ok:true,databaseName:ss.getName(),existingSheets:ss.getSheets().map(s=>s.getName()),
      requiredSheets:[JO_SHEET,JO_OVERRIDE_SHEET,TRANSFER_SHEET,ALLOCATION_SHEET,REWORK_SHEET,REWORK_MAIN_SHEET,REWORK_DETAILS_SHEET,REWORK_ASSIGNMENTS_SHEET]};
  } catch (e) { return {ok:false,message:String(e.message||e)}; }
}

function setupDatabase() {
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const created = [];
  [[JO_SHEET,JO_HEADERS],[JO_OVERRIDE_SHEET,JO_OVERRIDE_HEADERS],[TRANSFER_SHEET,TRANSFER_HEADERS],[ALLOCATION_SHEET,ALLOCATION_HEADERS],[REWORK_SHEET,REWORK_HEADERS],[REWORK_MAIN_SHEET,REWORK_MAIN_HEADERS],[REWORK_DETAILS_SHEET,REWORK_DETAILS_HEADERS],[REWORK_ASSIGNMENTS_SHEET,REWORK_ASSIGNMENT_HEADERS]].forEach(pair=>{
    let sh=ss.getSheetByName(pair[0]);
    if (!sh) { sh=ss.insertSheet(pair[0]); created.push(pair[0]); }
    if (sh.getLastRow()===0) {
      sh.getRange(1,1,1,pair[1].length).setValues([pair[1]]);
      sh.setFrozenRows(1);
      sh.getRange(1,1,1,pair[1].length).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');
    } else {
      const existing=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getDisplayValues()[0];
      if (existing.indexOf(pair[1][0])<0) throw new Error('The sheet "'+pair[0]+'" already contains a different layout. No data was changed; please check the headers before continuing.');
      pair[1].forEach(header=>{if(existing.indexOf(header)<0){const expectedCol=pair[1].indexOf(header)+1;const col=!String(existing[expectedCol-1]||'').trim()?expectedCol:sh.getLastColumn()+1;sh.getRange(1,col).setValue(header).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');existing[col-1]=header;}});
    }
  });
  return {ok:true,created:created,message:created.length?'Database tabs are ready.':'Database tabs already exist; existing records were preserved.'};
}

function getModuleData(moduleName, searchText, pageNumber, pageSize, returnAll) {
  if (!['Transfer Monitoring','J.O Register','FGTS Monitoring','Rework Monitoring'].includes(moduleName)) throw new Error('Unsupported monitoring module: '+moduleName+'.');
  const query=String(searchText||'').trim();
  // v3 stores the records already sorted, avoiding a full-array sort on the
  // immediate follow-up request used by the first-50 loading flow.
  const cacheKey='qaqc_module_v3_'+moduleName.replace(/[^a-z0-9]/gi,'_');
  let result=null,loadedFromCache=false;
  if(!query){
    result=readModuleCache_(cacheKey);
    loadedFromCache=!!(result&&result.ok);
  }
  if(!result){
    if(moduleName==='Transfer Monitoring')result=getTransferRecords(query);
    else if(moduleName==='J.O Register')result=getExternalJORecords_(query);
    else if(moduleName==='Rework Monitoring')result=getReworkRecords_(query);
    else result=getFGTSMonitoringRecords_(query);
  }
  if(!result||!result.ok)return result;
  if(!loadedFromCache){
    result.records=sortModuleRecordsNewestFirst_(moduleName,result.records||[]);
    if(!query)writeModuleCache_(cacheKey,result);
  }
  if(returnAll===true)return result;
  const page=Math.max(1,parseInt(pageNumber,10)||1);
  const size=Math.min(100,Math.max(1,parseInt(pageSize,10)||50));
  const total=result.records.length;
  const start=(page-1)*size;
  return Object.assign({},result,{
    records:result.records.slice(start,start+size),
    pagination:{page:page,pageSize:size,totalRecords:total,totalPages:Math.max(1,Math.ceil(total/size))}
  });
}


function reworkDateOnlyUtc_(value) {
  if(value instanceof Date && !isNaN(value.getTime())) return Date.UTC(value.getFullYear(),value.getMonth(),value.getDate());
  const s=String(value==null?'':value).trim();
  if(!s)return null;
  const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(iso)return Date.UTC(Number(iso[1]),Number(iso[2])-1,Number(iso[3]));
  const parsed=joParseDate_(s);
  return parsed instanceof Date&&!isNaN(parsed.getTime())?Date.UTC(parsed.getFullYear(),parsed.getMonth(),parsed.getDate()):null;
}
function reworkLeadTimeDays_(dateIssue,dateClosed) {
  const start=reworkDateOnlyUtc_(dateIssue),end=reworkDateOnlyUtc_(dateClosed);
  return start==null||end==null?'':Math.round((end-start)/86400000);
}

function getReworkRecords_(searchText) {
  const ss=SpreadsheetApp.openById(DATABASE_ID);
  const main=ss.getSheetByName(REWORK_MAIN_SHEET),details=ss.getSheetByName(REWORK_DETAILS_SHEET),assignments=ss.getSheetByName(REWORK_ASSIGNMENTS_SHEET);
  if(!main||main.getLastRow()<2)return {ok:true,records:[],fields:REWORK_MAIN_HEADERS};
  const detailHeaders=details&&details.getLastColumn()>0?details.getRange(1,1,1,details.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()):[];
  const detailIndex=name=>detailHeaders.indexOf(name);
  const mainRows=main.getDataRange().getValues().slice(1);
  const detailRows=details&&details.getLastRow()>1?details.getDataRange().getValues().slice(1):[];
  const assignmentRows=assignments&&assignments.getLastRow()>1?assignments.getDataRange().getValues().slice(1):[];
  const peopleByDetail=Object.create(null);
  assignmentRows.forEach(a=>{
    const id=String(a[1]||'');if(!id)return;
    (peopleByDetail[id]||(peopleByDetail[id]=[])).push({'Assignment ID':String(a[0]||''),'Person In-Charge':String(a[2]||''),'Concern Section':String(a[3]||'')});
  });
  const detailsByCase=Object.create(null);
  detailRows.forEach(d=>{
    const caseId=String(d[1]||'');if(!caseId)return;
    const people=peopleByDetail[String(d[0]||'')]||[];
    const item={
      'Detail ID':String(d[0]||''),
      'Item ID':String(d[detailIndex('Item ID')]||''),
      'Description of Rework':String(d[4]||''),
      'QC - in - Charge':String(d[5]||''),
      'Lead Time':String(d[6]||''),
      Status:String(d[7]||'Open'),
      'Rework or Back Job':String(d[8]||'Rework'),
      'Category Issue':String(d[9]||''),
      'Corrective Action / Resolution':String(d[10]||''),
      'Concern Section':String(d[11]||'')||(people.map(a=>a['Concern Section']).filter(Boolean)[0]||''),
      'Closed At':formatCell_(d[detailIndex('Closed At')]||(String(d[7]||'').trim().toLowerCase()==='closed'?d[3]:'')),
      'Date Finished':formatCell_(d[detailIndex('Date Finished')]),
      'Item no.':String(d[detailIndex('Item no.')]||''),'Panel Name':String(d[detailIndex('Panel Name')]||''),'Qty':detailIndex('Qty')<0?'':(d[detailIndex('Qty')]==null?'':String(d[detailIndex('Qty')])),
      Assignments:people
    };
    (detailsByCase[caseId]||(detailsByCase[caseId]=[])).push(item);
  });
  const query=String(searchText||'').trim().toLowerCase(),records=[];
  mainRows.forEach(r=>{
    const id=String(r[0]||'');if(!id)return;
    const detailList=detailsByCase[id]||[];
    detailList.forEach(d=>{const isClosed=String(d.Status||'Open').trim().toLowerCase()==='closed';d['Lead Time']='';});
    const sectionGroups=Object.create(null);detailList.forEach(d=>{const section=String(d['Concern Section']||'Unassigned');(sectionGroups[section]||(sectionGroups[section]=[])).push(d)});
    Object.keys(sectionGroups).forEach(section=>{const group=sectionGroups[section],finished=String(group.map(d=>d['Date Finished']||'').find(Boolean)||'');const allClosed=group.length>0&&group.every(d=>String(d.Status||'Open').trim().toLowerCase()==='closed');const lead=allClosed&&finished?reworkLeadTimeDays_(r[3],finished):'';group.forEach(d=>{d['Date Finished']=finished;d['Lead Time']=lead;});});
    const qc=String(r[11]||detailList.map(d=>d['QC - in - Charge']).find(Boolean)||'');
    const allClosed=detailList.length>0&&detailList.every(d=>String(d.Status||'Open').trim().toLowerCase()==='closed');
    const closureDates=allClosed?detailList.map(d=>String(d['Closed At']||'')).filter(Boolean).sort():[];
    const finishedDate=formatCell_(r[12]||(closureDates.length?closureDates[closureDates.length-1]:''));
    const leadTime=allClosed&&finishedDate?reworkLeadTimeDays_(r[3],finishedDate):'';
    const obj={
      'Rework ID':id,'Created At':formatCell_(r[1]),'Updated At':formatCell_(r[2]),
      'Date Issue':formatCell_(r[3]),'S.O':String(r[4]||''),'J.O':String(r[5]||''),
      'Client Name':String(r[6]||''),'Item no.':String(r[7]||''),'Panel Name':String(r[8]||''),
      'Qty':r[9]==null?'':String(r[9]),'Date Received':'',
      'QC - in - Charge':qc,'Date Finished':'','Lead Time':'','Details':detailList,
      'Description Summary':detailList.map(d=>d['Description of Rework']).filter(Boolean).join(' | '),
      'Concern Section Summary':[...new Set(detailList.map(d=>d['Concern Section']||((d.Assignments||[]).map(a=>a['Concern Section']).filter(Boolean)[0]||'')).filter(Boolean))].join(', '),
      'Status Summary':detailList.length&&detailList.every(d=>String(d.Status||'Open').trim().toLowerCase()==='closed')?'Closed':detailList.length?'Open':'No details',
      'Detail Count':detailList.length
    };
    const searchValue=[obj['Date Issue'],obj['S.O'],obj['J.O'],obj['Client Name'],obj['Item no.'],obj['Panel Name'],obj.Qty,obj['Description Summary'],obj['Status Summary'],obj['QC - in - Charge'],obj['Concern Section Summary'],obj['Lead Time'],...detailList.flatMap(d=>[d['Description of Rework'],d['QC - in - Charge'],d['Lead Time'],d.Status,d['Rework or Back Job'],d['Category Issue'],d['Corrective Action / Resolution'],d['Concern Section'],...d.Assignments.flatMap(a=>[a['Person In-Charge'],a['Concern Section']])])].join(' ').toLowerCase();
    if(!query||searchValue.includes(query))records.push(obj);
  });
  return {ok:true,records:records,fields:REWORK_MAIN_HEADERS};
}

function sortModuleRecordsNewestFirst_(moduleName, records) {
  const dateField=moduleName==='J.O Register'?'Received':moduleName==='Rework Monitoring'?'Date Issue':'Date Received';
  return (records||[]).map((record,index)=>({record:record,index:index,date:joParseDate_(record&&record[dateField])}))
    .sort((a,b)=>{
      const at=a.date?a.date.getTime():-Infinity,bt=b.date?b.date.getTime():-Infinity;
      if(at!==bt)return bt-at;
      return a.index-b.index;
    }).map(item=>item.record);
}

function saveRecord(moduleName,input) {
  if(moduleName==='Rework Monitoring') return saveReworkCase_(input);
  if(moduleName==='Transfer Monitoring') return saveTransfer(input);
  if(moduleName==='J.O Register') return saveJOOverride_(input);
  throw new Error('Unsupported module.');
  if(!input) throw new Error('No record data received.');
  const ss=SpreadsheetApp.openById(DATABASE_ID), sh=ss.getSheetByName(JO_SHEET);
  if(!sh) throw new Error('Click Prepare Database first.');
  const data=sh.getDataRange().getValues(), id=String(input['Record ID']||''), now=new Date();
  let row=-1;
  if(id){for(let i=1;i<data.length;i++)if(String(data[i][0])===id){row=i+1;break;}if(row<0)throw new Error('Record not found. Refresh and try again.');}
  const old=row>0?data[row-1]:null, recordId=id||Utilities.getUuid();
  const out=JO_HEADERS.map(h=>h==='Record ID'?recordId:h==='Created At'?(old?old[1]:now):h==='Updated At'?now:(input[h]??''));
  if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  return {ok:true,recordId:recordId,message:row>0?'J.O record updated.':'J.O record saved.'};
}


function getExternalJORecords_(searchText) {
  const source=SpreadsheetApp.openById(JO_SOURCE_ID);
  const sourceSheet=source.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID);
  if(!sourceSheet) throw new Error('Could not find source sheet tab gid '+JO_SOURCE_GID+'.');
  const last=sourceSheet.getLastRow();
  if(last<JO_SOURCE_START_ROW) return {ok:true,records:[],fields:JO_OVERRIDE_HEADERS.slice(2)};
  const sourceRows=sourceSheet.getRange(JO_SOURCE_START_ROW,1,last-JO_SOURCE_START_ROW+1,14).getDisplayValues();
  const db=SpreadsheetApp.openById(DATABASE_ID), overrideSheet=db.getSheetByName(JO_OVERRIDE_SHEET);
  const saved=overrideSheet&&overrideSheet.getLastRow()>1?overrideSheet.getDataRange().getDisplayValues().slice(1):[];
  const overrides={}; saved.forEach(r=>{if(r[0])overrides[String(r[0])]=r;});

  // Build J.O transfer summaries by S.O. + Item No. (FGTS source has no J.O number).
  // FGTS source rows and internal QC allocations are merged, with cross-source
  // duplicate protection so the same allocation is not counted twice.
  const summaryByJob={};
  const allocationSeenByJob={};
  const ensureSummary=(key)=>{
    if(!summaryByJob[key])summaryByJob[key]={transferred:0,fgts:new Set(),dates:[]};
    if(!allocationSeenByJob[key])allocationSeenByJob[key]=new Set();
    return summaryByJob[key];
  };
  const addAllocation=(key,fgts,qc,qty,date,uniqueHint)=>{
    if(!key) return;
    const summary=ensureSummary(key);
    const fgtsText=String(fgts||'').trim();
    const qcText=String(qc||'').trim().toUpperCase();
    const qtyNum=Number(String(qty||0).replace(/,/g,''))||0;
    const dateText=formatCell_(date);
    // With an FGTS number, dedupe the same FGTS/QC/Qty/finish-date allocation
    // across the external FGTS sheet and internal Transfer Monitoring.
    // Without an FGTS number, keep separate source rows/allocations distinct.
    const identity=fgtsText
      ?JSON.stringify([fgtsText.toUpperCase(),qcText,qtyNum,dateText])
      :JSON.stringify(['NO-FGTS',qcText,qtyNum,dateText,String(uniqueHint||'')]);
    if(allocationSeenByJob[key].has(identity))return;
    allocationSeenByJob[key].add(identity);
    summary.transferred+=qtyNum;
    if(fgtsText)summary.fgts.add(fgtsText);
    if(dateText)summary.dates.push(dateText);
  };

  // External FGTS Monitoring is the primary record source for FGTS allocations.
  const fgtsSS=SpreadsheetApp.openById(FGTS_SOURCE_ID);
  const fgtsSheet=fgtsSS.getSheets().find(s=>s.getSheetId()===FGTS_SOURCE_GID);
  if(!fgtsSheet)throw new Error('Could not find FGTS source sheet tab gid '+FGTS_SOURCE_GID+'.');
  if(fgtsSheet.getLastRow()>=FGTS_SOURCE_START_ROW){
    const fgtsRows=fgtsSheet.getRange(FGTS_SOURCE_START_ROW,1,fgtsSheet.getLastRow()-FGTS_SOURCE_START_ROW+1,14).getValues();
    fgtsRows.forEach((r,i)=>{
      const so=String(r[4]||'').trim(),item=String(r[6]||'').trim();
      if(!so||!item)return;
      if(!String(r[9]||'').trim()&&!String(r[10]||'').trim()&&!String(r[8]||'').trim())return;
      const key=fgtsJobKey_(so,item);
      addAllocation(key,r[9],r[10],r[8],r[3],'FGTS-ROW-'+(FGTS_SOURCE_START_ROW+i));
    });
  }

  // Include internal allocations as well, but skip any allocation already
  // represented by the same FGTS/QC/Qty/finish-date combination above.
  const transferSheet=db.getSheetByName(TRANSFER_SHEET), allocSheet=db.getSheetByName(ALLOCATION_SHEET);
  const transferRows=transferSheet&&transferSheet.getLastRow()>1
    ?transferSheet.getRange(2,1,transferSheet.getLastRow()-1,TRANSFER_HEADERS.length).getDisplayValues():[];
  const allocs=allocSheet&&allocSheet.getLastRow()>1
    ?allocSheet.getRange(2,1,allocSheet.getLastRow()-1,ALLOCATION_HEADERS.length).getValues():[];
  const allocsByTransfer={};
  allocs.forEach(a=>{
    const id=String(a[1]||'');if(!id)return;
    if(!allocsByTransfer[id])allocsByTransfer[id]=[];
    allocsByTransfer[id].push(a);
  });
  const soIndex=TRANSFER_HEADERS.indexOf('S.O'),itemIndex=TRANSFER_HEADERS.indexOf('Item No.');
  const transferIdIndex=TRANSFER_HEADERS.indexOf('Transfer ID');
  transferRows.forEach(t=>{
    const id=String(t[transferIdIndex]||''),linked=allocsByTransfer[id]||[];
    if(!linked.length)return;
    const so=String(t[soIndex]||'').trim(),item=String(t[itemIndex]||'').trim();
    if(!so||!item)return;
    const key=fgtsJobKey_(so,item);
    linked.forEach((a,i)=>addAllocation(key,a[3],a[2],a[4],a[5],'ALLOC-'+id+'-'+i));
  });

  const q=String(searchText||'').trim().toLowerCase(), records=[];
  sourceRows.forEach((r,i)=>{
    const row=JO_SOURCE_START_ROW+i, jo=String(r[0]||'').trim(); if(!jo)return;
    const key='SRC-'+row, qty=Number(String(r[3]||'').replace(/,/g,''))||0;
    const o={'Record ID':key,'CLASSIFICATION':r[6]||'','J.O':jo,'S.O':r[1]||'','Received':joDate_(r[10]),'Delivery Date':joDate_(r[13]),'Client':r[7]||'','Item No.':r[8]||'','Panel Name':r[9]||'','Qty':qty,'Unit':r[4]||'','Transferred':0,'Balance':qty,'FGTS No.':'','Date Served':'','Remarks':'','Status':'Not Served','Timeliness':'Pending'};
    const summary=summaryByJob[fgtsJobKey_(o['S.O'],o['Item No.'])];
    if(summary){
      o.Transferred=summary.transferred;
      o.Balance=Math.max(0,qty-o.Transferred);
      o['FGTS No.']=[...summary.fgts].join(', ');
      summary.dates.sort();
      o['Date Served']=summary.dates.length?summary.dates[summary.dates.length-1]:'';
    }
    if(qty>0&&o.Balance<=0)o.Status='Finished';else if(o.Transferred>0)o.Status='Partial';
    const due=joParseDate_(o['Delivery Date']), served=joParseDate_(o['Date Served']);
    if(served&&due)o.Timeliness=served.getTime()<=due.getTime()?'On Time':'Delayed';
    else o.Timeliness='Pending';
    const ov=overrides[key];
    if(ov)JO_OVERRIDE_HEADERS.slice(2).forEach((h,j)=>{if(h!=='Timeliness'&&ov[j+2]!==''&&ov[j+2]!=null)o[h]=ov[j+2];});
    const finalDue=joParseDate_(o['Delivery Date']), finalServed=joParseDate_(o['Date Served']);
    o.Timeliness=finalServed&&finalDue?(finalServed.getTime()<=finalDue.getTime()?'On Time':'Delayed'):'Pending';
    ['Qty','Transferred','Balance'].forEach(h=>o[h]=Number(String(o[h]||0).replace(/,/g,''))||0);
    if(!q||Object.values(o).join(' ').toLowerCase().includes(q))records.push(o);
  });
  return {ok:true,records:records,fields:JO_OVERRIDE_HEADERS.slice(2)};
}

/**
 * FGTS Monitoring reads the external FGTS sheet. Classification is looked up
 * from the J.O Register source using S.O + Item No. Source data is not modified.
 */
function getFGTSMonitoringRecords_(searchText) {
  const fgtsSS=SpreadsheetApp.openById(FGTS_SOURCE_ID);
  const fgtsSheet=fgtsSS.getSheets().find(s=>s.getSheetId()===FGTS_SOURCE_GID);
  if(!fgtsSheet)throw new Error('Could not find FGTS source sheet tab gid '+FGTS_SOURCE_GID+'.');
  const last=fgtsSheet.getLastRow();
  if(last<FGTS_SOURCE_START_ROW)return {ok:true,records:[],fields:FGTS_HEADERS};
  const rows=fgtsSheet.getRange(FGTS_SOURCE_START_ROW,1,last-FGTS_SOURCE_START_ROW+1,14).getValues();
  const joSS=SpreadsheetApp.openById(JO_SOURCE_ID);
  const joSheet=joSS.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID);
  const classByJob={}, joRows=[];
  const classificationStartRow=Math.min(2272,JO_SOURCE_START_ROW);
  if(joSheet&&joSheet.getLastRow()>=classificationStartRow){
    joRows.push(...joSheet.getRange(classificationStartRow,1,joSheet.getLastRow()-classificationStartRow+1,14).getDisplayValues());
    joRows.forEach(r=>{const so=String(r[1]||'').trim(),item=String(r[8]||'').trim();if(!so||!item)return;const key=fgtsJobKey_(so,item);if(!classByJob[key]&&String(r[6]||'').trim())classByJob[key]=String(r[6]).trim();});
    const db=SpreadsheetApp.openById(DATABASE_ID),overrideSheet=db.getSheetByName(JO_OVERRIDE_SHEET);
    if(overrideSheet&&overrideSheet.getLastRow()>1){
      overrideSheet.getDataRange().getDisplayValues().slice(1).forEach(o=>{
        const m=String(o[0]||'').match(/^SRC-(\d+)$/),classification=String(o[2]||'').trim();if(!m||!classification)return;
        const idx=Number(m[1])-classificationStartRow;if(idx<0||idx>=joRows.length)return;
        const r=joRows[idx],so=String(r[1]||'').trim(),item=String(r[8]||'').trim();if(so&&item)classByJob[fgtsJobKey_(so,item)]=classification;
      });
    }
  }
  const query=String(searchText||'').trim().toLowerCase(),records=[];
  rows.forEach(r=>{
    const so=String(r[4]||'').trim(),item=String(r[6]||'').trim();
    const received=joDate_(formatCell_(r[2])),finished=joDate_(formatCell_(r[3]));
    if(!so&&!item&&!String(r[9]||'').trim()&&!String(r[10]||'').trim())return;
    const rd=joParseDate_(received),fd=joParseDate_(finished);
    const leadDays=rd&&fd?Math.max(1,Math.round((fd.getTime()-rd.getTime())/86400000)+1):'';
    const record={'Classification':classByJob[fgtsJobKey_(so,item)]||'Others','Lead Days':leadDays,'Date Received':received,'Date Finish':finished,'S.O. no.':so,'Client':r[5]||'','Item no.':item,'Panel Name':r[7]||'','Qty':Number(String(r[8]||'').replace(/,/g,''))||r[8]||'','FGTS no.':r[9]||'','QC-In Charge':r[10]||'','Remarks':r[11]||'','Category':r[13]||''};
    if(!query||Object.values(record).join(' ').toLowerCase().includes(query))records.push(record);
  });
  records.reverse();return {ok:true,records:records,fields:FGTS_HEADERS};
}
function fgtsJobKey_(so,item){return JSON.stringify([String(so||'').trim().toUpperCase(),String(item||'').trim().toUpperCase()]);}

function deleteReworkCase(reworkId) {
  const id=String(reworkId||'').trim();
  if(!id)throw new Error('Missing Rework ID.');
  const ss=SpreadsheetApp.openById(DATABASE_ID);
  const main=ss.getSheetByName(REWORK_MAIN_SHEET),details=ss.getSheetByName(REWORK_DETAILS_SHEET),assignments=ss.getSheetByName(REWORK_ASSIGNMENTS_SHEET);
  if(!main||!details||!assignments)throw new Error('Rework database tabs are missing.');
  const mainRows=main.getDataRange().getValues();let mainRow=-1;
  for(let i=1;i<mainRows.length;i++)if(String(mainRows[i][0])===id){mainRow=i+1;break;}
  if(mainRow<0)throw new Error('Rework case not found. Refresh and try again.');
  const detailRows=details.getLastRow()>1?details.getDataRange().getValues():[];
  const detailIds=[];for(let i=1;i<detailRows.length;i++)if(String(detailRows[i][1])===id)detailIds.push(String(detailRows[i][0]));
  const detailSet=Object.create(null);detailIds.forEach(v=>detailSet[v]=true);
  const assignmentRows=assignments.getLastRow()>1?assignments.getDataRange().getValues():[];
  for(let i=assignmentRows.length-1;i>=1;i--)if(detailSet[String(assignmentRows[i][1])])assignments.deleteRow(i+1);
  for(let i=detailRows.length-1;i>=1;i--)if(String(detailRows[i][1])===id)details.deleteRow(i+1);
  main.deleteRow(mainRow);
  invalidateModuleCache_('Rework Monitoring');
  return {ok:true,message:'Rework case and linked descriptions/assignments deleted.'};
}

function saveReworkCase_(input) {
  if(!input)throw new Error('No rework information received.');
  const ss=SpreadsheetApp.openById(DATABASE_ID);
  const main=ss.getSheetByName(REWORK_MAIN_SHEET),details=ss.getSheetByName(REWORK_DETAILS_SHEET),assignments=ss.getSheetByName(REWORK_ASSIGNMENTS_SHEET);
  if(!main||!details||!assignments)throw new Error('Rework database tabs are missing. Use Prepare Database after this feature is deployed.');
  const mainHeaders=main.getRange(1,1,1,Math.max(main.getLastColumn(),REWORK_MAIN_HEADERS.length)).getDisplayValues()[0].map(v=>String(v||'').trim());
  REWORK_MAIN_HEADERS.forEach((header,i)=>{if(!mainHeaders[i])main.getRange(1,i+1).setValue(header).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');});
  let detailHeader=details.getRange(1,1,1,Math.max(details.getLastColumn(),1)).getDisplayValues()[0].map(v=>String(v||'').trim());
  REWORK_DETAILS_HEADERS.forEach(header=>{if(!detailHeader.includes(header)){const col=details.getLastColumn()+1;details.getRange(1,col).setValue(header).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');detailHeader[col-1]=header;}});
  detailHeader=details.getRange(1,1,1,details.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
  const id=String(input['Rework ID']||''),now=new Date();
  const mainRows=main.getDataRange().getValues();let mainRow=-1,oldMain=null;
  if(id){for(let i=1;i<mainRows.length;i++)if(String(mainRows[i][0])===id){mainRow=i+1;oldMain=mainRows[i];break;}if(mainRow<0)throw new Error('Rework record not found. Refresh and try again.');}
  const detailsInput=Array.isArray(input.Details)?input.Details:[];
  if(!detailsInput.length)throw new Error('Add at least one Rework Description.');
  detailsInput.forEach((d,i)=>{
    if(!String(d['Description of Rework']||'').trim())throw new Error('Description of Rework is required for detail '+(i+1)+'.');
    if(!['Open','Closed'].includes(String(d.Status||'Open')))throw new Error('Choose a valid Status for detail '+(i+1)+'.');
    if(!['Rework','Backjob'].includes(String(d['Rework or Back Job']||'Rework')))throw new Error('Choose Rework or Backjob for detail '+(i+1)+'.');
    if(!REWORK_CONCERN_SECTIONS.includes(String(d['Concern Section']||'')))throw new Error('Choose a valid Concern Section for description '+(i+1)+'.');
    if(!Array.isArray(d.Assignments)||!d.Assignments.length||d.Assignments.some(a=>!String(a['Person In-Charge']||'').trim()))throw new Error('Each description needs at least one Person In-Charge.');
  });
  const caseId=id||Utilities.getUuid();
  const allDetailsClosed=detailsInput.length>0&&detailsInput.every(d=>String(d.Status||'Open').trim().toLowerCase()==='closed');
  const caseClosedAt=oldMain&&oldMain[12]?oldMain[12]:'';
  const mainRecord={'Rework ID':caseId,'Created At':oldMain?oldMain[1]:now,'Updated At':now,'Date Issue':input['Date Issue']||'','S.O':input['S.O']||'','J.O':input['J.O']||'','Client Name':input['Client Name']||'','Item no.':(detailsInput[0]&&detailsInput[0]['Item no.'])||input['Item no.']||'','Panel Name':(detailsInput[0]&&detailsInput[0]['Panel Name'])||input['Panel Name']||'','Qty':(detailsInput[0]&&detailsInput[0].Qty)||input.Qty||'','Date Received':oldMain?oldMain[10]:'','QC - in - Charge':String(input['QC - in - Charge']||'').trim(),'Date Finished':caseClosedAt};
  const mainOut=REWORK_MAIN_HEADERS.map(h=>mainRecord[h]??'');
  const oldDetailRows=details.getLastRow()>1?details.getDataRange().getValues().slice(1):[];
  const oldAssignmentRows=assignments.getLastRow()>1?assignments.getDataRange().getValues().slice(1):[];
  const existingDetails=oldDetailRows.filter(r=>String(r[1])===caseId);
  const existingDetailMap=Object.create(null);existingDetails.forEach(r=>existingDetailMap[String(r[0])]=r);
  const allDetailById=Object.create(null);oldDetailRows.forEach(r=>{const key=String(r[0]||'');if(key)allDetailById[key]=r;});
  const allAssignmentById=Object.create(null);oldAssignmentRows.forEach(r=>{const key=String(r[0]||'');if(key)allAssignmentById[key]=r;});
  // Validate submitted child IDs before any database writes. Existing IDs must belong to this case/detail.
  const seenDetailIds=Object.create(null),seenAssignmentIds=Object.create(null);
  detailsInput.forEach((d,i)=>{
    const suppliedDetailId=String(d['Detail ID']||'').trim();
    if(suppliedDetailId&&seenDetailIds[suppliedDetailId])
      throw new Error('The same Detail ID was submitted more than once. Refresh the record and try again.');
    if(suppliedDetailId)seenDetailIds[suppliedDetailId]=true;
    if(suppliedDetailId&&(!allDetailById[suppliedDetailId]||String(allDetailById[suppliedDetailId][1])!==caseId))
      throw new Error('Detail '+(i+1)+' has an invalid Detail ID. Refresh the record and try again.');
    const detailId=suppliedDetailId||'';
    (Array.isArray(d.Assignments)?d.Assignments:[]).forEach((a,j)=>{
      const suppliedAssignmentId=String(a['Assignment ID']||'').trim();
      if(suppliedAssignmentId&&seenAssignmentIds[suppliedAssignmentId])
        throw new Error('The same Assignment ID was submitted more than once. Refresh the record and try again.');
      if(suppliedAssignmentId)seenAssignmentIds[suppliedAssignmentId]=true;
      if(suppliedAssignmentId){
        const oldAssignment=allAssignmentById[suppliedAssignmentId];
        if(!detailId||!existingDetailMap[detailId]||!oldAssignment||String(oldAssignment[1])!==detailId)
          throw new Error('Assignment '+(j+1)+' in detail '+(i+1)+' has an invalid Assignment ID. Refresh the record and try again.');
      }
    });
  });
  if(mainRow>0)main.getRange(mainRow,1,1,mainOut.length).setValues([mainOut]);else main.appendRow(mainOut);
  const caseLeadTime=allDetailsClosed&&caseClosedAt?reworkLeadTimeDays_(input['Date Issue'],caseClosedAt):'';
  const savedDetailIds=[],detailOutput=[],assignmentOutput=[];
  detailsInput.forEach((d,detailIndex)=>{
    const detailId=String(d['Detail ID']||'')||Utilities.getUuid(),old=existingDetailMap[detailId],status=String(d.Status||'Open').trim();
    savedDetailIds.push(detailId);
    const detailRecord={'Detail ID':detailId,'Rework ID':caseId,'Created At':old?old[2]:now,'Updated At':now,'Description of Rework':String(d['Description of Rework']||'').trim(),'QC - in - Charge':String(input['QC - in - Charge']||'').trim(),'Lead Time':'','Status':status,'Rework or Back Job':String(d['Rework or Back Job']||'Rework'),'Category Issue':String(d['Category Issue']||''),'Corrective Action / Resolution':String(d['Corrective Action / Resolution']||''),'Concern Section':String(d['Concern Section']||''),'Closed At':status.toLowerCase()==='closed'?(old&&old[detailHeader.indexOf('Closed At')]||''):'','Date Finished':old&&detailHeader.indexOf('Date Finished')>=0?old[detailHeader.indexOf('Date Finished')]:'','Item no.':String(d['Item no.']||input['Item no.']||''),'Panel Name':String(d['Panel Name']||input['Panel Name']||''),'Qty':d.Qty==null?(input.Qty||''):d.Qty,'Item ID':String(d['Item ID']||'')};
    detailOutput.push(detailHeader.map(h=>detailRecord[h]??''));
    (Array.isArray(d.Assignments)?d.Assignments:[]).forEach(a=>{
      const assignmentId=String(a['Assignment ID']||'')||Utilities.getUuid();
      const oldAssignment=allAssignmentById[assignmentId];
      assignmentOutput.push([assignmentId,detailId,String(a['Person In-Charge']||'').trim(),'',oldAssignment?oldAssignment[4]:now,now]);
    });
  });
  const keptDetails=oldDetailRows.filter(r=>String(r[1])!==caseId);
  const nextDetails=keptDetails.concat(detailOutput);
  details.getRange(2,1,Math.max(details.getLastRow()-1,1),details.getLastColumn()).clearContent();
  if(nextDetails.length)details.getRange(2,1,nextDetails.length,detailHeader.length).setValues(nextDetails);
  const keptAssignments=oldAssignmentRows.filter(r=>!existingDetails.some(d=>String(d[0])===String(r[1])));
  const nextAssignments=keptAssignments.concat(assignmentOutput);
  assignments.getRange(2,1,Math.max(assignments.getLastRow()-1,1),REWORK_ASSIGNMENT_HEADERS.length).clearContent();
  if(nextAssignments.length)assignments.getRange(2,1,nextAssignments.length,REWORK_ASSIGNMENT_HEADERS.length).setValues(nextAssignments);
  invalidateModuleCache_('Rework Monitoring');
  return {ok:true,recordId:caseId,message:mainRow>0?'Rework record updated.':'Rework record saved.'};
}


function toggleReworkDetailStatus(reworkId, detailId) {
  const caseId=String(reworkId||'').trim(), targetId=String(detailId||'').trim();
  if(!caseId||!targetId)throw new Error('Missing Rework case or description ID.');
  const ss=SpreadsheetApp.openById(DATABASE_ID);
  const main=ss.getSheetByName(REWORK_MAIN_SHEET),details=ss.getSheetByName(REWORK_DETAILS_SHEET);
  if(!main||!details)throw new Error('Rework database tabs are missing.');
  const mainRows=main.getDataRange().getValues();let mainRow=-1,mainData=null;
  for(let i=1;i<mainRows.length;i++)if(String(mainRows[i][0])===caseId){mainRow=i+1;mainData=mainRows[i];break;}
  if(mainRow<0)throw new Error('Rework case not found. Refresh and try again.');
  const headers=details.getRange(1,1,1,details.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
  const statusCol=headers.indexOf('Status')+1,closedCol=headers.indexOf('Closed At')+1,updatedCol=headers.indexOf('Updated At')+1;
  if(!statusCol||!closedCol)throw new Error('Status or Closed At column is missing.');
  const rows=details.getDataRange().getValues();let targetRow=-1,targetStatus='';
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===targetId&&String(rows[i][1])===caseId){targetRow=i+1;targetStatus=String(rows[i][statusCol-1]||'Open').trim();break;}
  if(targetRow<0)throw new Error('Rework description not found. Refresh and try again.');
  const nextStatus=targetStatus.toLowerCase()==='closed'?'Open':'Closed',now=new Date();
  details.getRange(targetRow,statusCol).setValue(nextStatus);
  details.getRange(targetRow,closedCol).setValue(nextStatus==='Closed'?now:'');
  if(updatedCol)details.getRange(targetRow,updatedCol).setValue(now);
  const updatedRows=details.getDataRange().getValues(),sectionCol=headers.indexOf('Concern Section')+1,finishedCol=headers.indexOf('Date Finished')+1,leadCol=headers.indexOf('Lead Time')+1;
  const dateIssue=mainData[3],section=sectionCol?String(updatedRows[targetRow-1][sectionCol-1]||'Unassigned'):'Unassigned';
  const sectionRows=[];for(let i=1;i<updatedRows.length;i++)if(String(updatedRows[i][1])===caseId&&String(sectionCol?updatedRows[i][sectionCol-1]||'Unassigned':'Unassigned')===section)sectionRows.push({row:i+1,data:updatedRows[i]});
  const allClosed=sectionRows.length>0&&sectionRows.every(x=>String(x.data[statusCol-1]||'Open').trim().toLowerCase()==='closed');
  const finishedDate=finishedCol?sectionRows.map(x=>x.data[finishedCol-1]).find(Boolean)||'':'';
  const leadTime=allClosed&&finishedDate?reworkLeadTimeDays_(dateIssue,finishedDate):'';
  sectionRows.forEach(x=>{if(leadCol)details.getRange(x.row,leadCol).setValue(leadTime);});
  invalidateModuleCache_('Rework Monitoring');
  return {ok:true,status:nextStatus,message:'Description status changed to '+nextStatus+'.'};
}


function updateReworkFinishedDate(reworkId, concernSection, dateValue) {
  const caseId=String(reworkId||'').trim(),section=String(concernSection||'').trim()||'Unassigned';
  if(!caseId)throw new Error('Missing Rework ID.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),main=ss.getSheetByName(REWORK_MAIN_SHEET),details=ss.getSheetByName(REWORK_DETAILS_SHEET);
  if(!main||!details)throw new Error('Rework database tabs are missing.');
  const mainRows=main.getDataRange().getValues();let mainRow=-1,mainData=null;
  for(let i=1;i<mainRows.length;i++)if(String(mainRows[i][0])===caseId){mainRow=i+1;mainData=mainRows[i];break;}
  if(mainRow<0)throw new Error('Rework case not found.');
  const value=String(dateValue||'').trim();
  if(value&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(value))throw new Error('Enter a valid Date Finished.');
  const header=details.getRange(1,1,1,details.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
  const sectionCol=header.indexOf('Concern Section')+1,finishedCol=header.indexOf('Date Finished')+1,statusCol=header.indexOf('Status')+1,leadCol=header.indexOf('Lead Time')+1;
  if(!finishedCol||!sectionCol||!statusCol)throw new Error('Rework section date columns are missing.');
  const rows=details.getDataRange().getValues(),sectionRows=[];
  for(let i=1;i<rows.length;i++)if(String(rows[i][1])===caseId&&String(rows[i][sectionCol-1]||'Unassigned')===section)sectionRows.push({row:i+1,data:rows[i]});
  if(!sectionRows.length)throw new Error('No descriptions found for this Concern Section.');
  sectionRows.forEach(x=>details.getRange(x.row,finishedCol).setValue(value?new Date(value+'T12:00:00'):''));
  const allClosed=sectionRows.every(x=>String(x.data[statusCol-1]||'Open').trim().toLowerCase()==='closed');
  const leadTime=allClosed&&value?reworkLeadTimeDays_(mainData[3],value):'';
  if(leadCol)sectionRows.forEach(x=>details.getRange(x.row,leadCol).setValue(leadTime));
  invalidateModuleCache_('Rework Monitoring');
  return {ok:true,dateFinished:value,concernSection:section,leadTime:leadTime,message:'Section Date Finished updated.'};
}

function saveJOOverride_(input) {
  if(!input)throw new Error('No J.O changes received.');
  const id=String(input['Record ID']||'');
  if(!/^SRC-\d+$/.test(id))throw new Error('J.O source row key is invalid. Refresh and try again.');
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(JO_OVERRIDE_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  const lastRow=sh.getLastRow();let target=0;
  if(lastRow>1){const match=sh.getRange(2,1,lastRow-1,1).createTextFinder(id).matchEntireCell(true).findNext();if(match)target=match.getRow();}
  const now=new Date();
  const out=JO_OVERRIDE_HEADERS.map(h=>h==='Source Row'?id:h==='Updated At'?now:(input[h]??''));
  if(target)sh.getRange(target,1,1,out.length).setValues([out]);else sh.appendRow(out);
  invalidateModuleCache_('J.O Register','FGTS Monitoring');
  return {ok:true,message:'J.O changes saved for source row '+id.slice(4)+'.'};
}
function joDate_(v){const s=String(v||'').trim();if(!s)return '';const d=joParseDate_(s);return d?Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd'):s;}
function joParseDate_(v){
  if(v instanceof Date&&!isNaN(v.getTime()))return new Date(v.getFullYear(),v.getMonth(),v.getDate());
  const s=String(v||'').trim();if(!s)return null;
  let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if(m){const d=new Date(+m[1],+m[2]-1,+m[3]);return isNaN(d.getTime())?null:d;}
  m=s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if(m){let d=new Date(+m[3],+m[2]-1,+m[1]);if(!isNaN(d.getTime()))return d;d=new Date(+m[3],+m[1]-1,+m[2]);return isNaN(d.getTime())?null:d;}
  const d=new Date(s);return isNaN(d.getTime())?null:new Date(d.getFullYear(),d.getMonth(),d.getDate());
}

function getTransferRecords(searchText) {
  const ss=SpreadsheetApp.openById(DATABASE_ID), sh=ss.getSheetByName(TRANSFER_SHEET), allocSh=ss.getSheetByName(ALLOCATION_SHEET);
  if(!sh) return {ok:true,records:[],fields:TRANSFER_HEADERS};
  const vals=sh.getDataRange().getValues(), allocations=allocSh&&allocSh.getLastRow()>1?allocSh.getDataRange().getValues().slice(1):[];
  const allocationsByTransfer=Object.create(null);
  allocations.forEach(a=>{const id=String(a[1]||'');if(!id)return;(allocationsByTransfer[id]||(allocationsByTransfer[id]=[])).push(a)});
  const query=String(searchText||'').trim().toLowerCase(), records=[];
  for(let i=1;i<vals.length;i++){
    if(!vals[i][0])continue;
    const obj={}; TRANSFER_HEADERS.forEach((h,j)=>obj[h]=h==='Time Received'?formatTimeCell_(vals[i][j]):formatCell_(vals[i][j]));
    const linked=allocationsByTransfer[String(obj['Transfer ID'])]||[];
    const done=linked.reduce((sum,a)=>sum+(Number(a[4])||0),0);
    obj['Done Qty']=done;
    obj['Remaining Qty']=Math.max(0,(Number(obj['Qty'])||0)-done);
    obj['QC In Charge']=[...new Set(linked.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', ');
    obj['FGTS No.']=[...new Set(linked.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', ');
    obj['Date Finished']=latestFinishedDate_(linked);
    if(['Ongoing','Hold','For line up'].includes(String(obj.Status)) && obj['Date Received']){
      const received=new Date(obj['Date Received']); const days=Math.floor((new Date().setHours(0,0,0,0)-received.setHours(0,0,0,0))/86400000);
      obj.Reminders=days>=REMINDER_AFTER_DAYS?'DELAYED ('+days+' days)':'';
    } else obj.Reminders='';
    if(!query||Object.values(obj).join(' ').toLowerCase().includes(query))records.push(obj);
  }
  records.reverse(); return {ok:true,records:records,fields:TRANSFER_HEADERS};
}

function saveTransfer(input) {
  if(!input)throw new Error('No transfer details received.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  const qty=Number(input.Qty);
  if(!isFinite(qty)||qty<=0)throw new Error('Qty must be greater than zero.');
  const id=String(input['Record ID']||''), now=new Date(); let row=-1,old=null;
  if(id){const lastRow=sh.getLastRow();if(lastRow>1){const match=sh.getRange(2,1,lastRow-1,1).createTextFinder(id).matchEntireCell(true).findNext();if(match){row=match.getRow();old=sh.getRange(row,1,1,TRANSFER_HEADERS.length).getValues()[0];}}if(row<0)throw new Error('Transfer record not found. Refresh and try again.');}
  const recordId=id||Utilities.getUuid(),transferId=old?String(old[3]):('TR-'+Utilities.getUuid().toUpperCase());
  const linkedAllocations=old?getAllocationRows_(transferId):[];
  const alreadyAllocated=linkedAllocations.reduce((sum,a)=>sum+(Number(a[4])||0),0);
  if(alreadyAllocated>qty)throw new Error('The new transfer Qty cannot be less than the already allocated quantity ('+alreadyAllocated+').');
  if(String(input.Status||'')==='Passed'&&alreadyAllocated<qty)throw new Error('Status cannot be Passed until Done Qty meets the required Qty.');
  const inputObj=Object.assign({},input,{'Transfer ID':transferId,'Done Qty':alreadyAllocated,'Remaining Qty':qty-alreadyAllocated,'QC In Charge':[...new Set(linkedAllocations.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', '),'FGTS No.':[...new Set(linkedAllocations.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', '),'Date Finished':latestFinishedDate_(linkedAllocations),'Reminders':''});
  if(old && !String(input['Time Received']||'').trim()) inputObj['Time Received']=formatTimeCell_(old[5]);
  const out=TRANSFER_HEADERS.map((h,j)=>h==='Record ID'?recordId:h==='Created At'?(old?old[1]:now):h==='Updated At'?now:(inputObj[h]??''));
  if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  if(old)syncTransferSummary_(transferId,linkedAllocations);
  invalidateModuleCache_('Transfer Monitoring','J.O Register');
  return {ok:true,recordId:recordId,transferId:transferId,message:row>0?'Transfer updated.':'Transfer saved.'};
}

function saveTransfersBatch(common, items) {
  if(!common||!Array.isArray(items)||items.length<1)throw new Error('Add at least one item to save.');
  if(String(common['Record ID']||''))throw new Error('Multi-item save is only available when adding a new transfer.');
  const ss=SpreadsheetApp.openById(DATABASE_ID), sh=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  items.forEach((item,i)=>{if(!isFinite(Number(item.Qty))||Number(item.Qty)<=0)throw new Error('Item '+(i+1)+' Qty must be greater than zero.');});
  const saved=[];
  items.forEach(item=>{const input=Object.assign({},common,item,{'Record ID':'','Status':String(common.Status||'Ongoing')==='Passed'?'Ongoing':(common.Status||'Ongoing')});saved.push(saveTransfer(input));});
  invalidateModuleCache_('Transfer Monitoring','J.O Register');
  return {ok:true,count:saved.length,transferIds:saved.map(r=>r.transferId),message:'All '+saved.length+' item rows saved successfully.'};
}

function saveAdditionalTransfersBatch(common, items) {
  if(!common||!Array.isArray(items)||items.length<1)throw new Error('Add at least one additional item.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  const now=new Date(),saved=[];
  items.forEach(item=>{
    const transferId='TR-'+Utilities.getUuid().toUpperCase(),recordId=Utilities.getUuid();
    const inputObj=Object.assign({},common,item,{'Record ID':recordId,'Created At':now,'Updated At':now,'Transfer ID':transferId,'Done Qty':0,'Remaining Qty':Number(item.Qty)||0,'QC In Charge':'','FGTS No.':'','Date Finished':'','Reminders':'','Status':String(common.Status||'Ongoing')});
    const out=TRANSFER_HEADERS.map(h=>h==='Record ID'?recordId:h==='Created At'||h==='Updated At'?now:(inputObj[h]??''));
    sh.appendRow(out);saved.push(transferId);
  });
  invalidateModuleCache_('Transfer Monitoring','J.O Register');
  return {ok:true,count:saved.length,transferIds:saved,message:'Saved '+saved.length+' additional item row(s) in free-form mode.'};
}

function latestFinishedDate_(allocations) {
  const dates=allocations.map(a=>a[5]).filter(v=>v!==''&&v!=null);
  if(!dates.length)return '';
  dates.sort((a,b)=>{
    const da=a instanceof Date?a:new Date(a),db=b instanceof Date?b:new Date(b);
    const ta=da.getTime(),tb=db.getTime();
    if(!isNaN(ta)&&!isNaN(tb))return tb-ta;
    return String(b).localeCompare(String(a));
  });
  return formatCell_(dates[0]);
}

function saveAllocationsBatch(transferId, common, entries) {
  if(!transferId||!common||!Array.isArray(entries)||(!entries.length&&!common['Replace All']))throw new Error('Transfer and at least one QC allocation are required.');
  const ss=SpreadsheetApp.openById(DATABASE_ID), transfer=ss.getSheetByName(TRANSFER_SHEET), sh=ss.getSheetByName(ALLOCATION_SHEET);
  if(!transfer||!sh)throw new Error('Click Prepare Database first.');
  ensureAllocationCategoryColumn_(sh);
  const tr=transfer.getDataRange().getValues().find((r,i)=>i>0&&String(r[3])===String(transferId));
  if(!tr)throw new Error('Parent transfer not found.');
  const fgts=String(common['FGTS No.']||'').trim(), category=String(common.Category||'').trim();
  if(!fgts)throw new Error('FGTS No. is required.');
  const rows=sh.getDataRange().getValues(), ids=entries.map(e=>String(e['Allocation ID']||'')).filter(Boolean);
  const cleaned=entries.map(e=>({id:String(e['Allocation ID']||''),qc:String(e['QC In Charge']||'').trim(),qty:Number(e.Qty)}));
  cleaned.forEach(e=>{if(!e.qc)throw new Error('QC In Charge is required for every row.');if(!isFinite(e.qty)||e.qty<=0)throw new Error('Every QC Qty must be greater than zero.');});
  const existingTotal=rows.slice(1).reduce((sum,r)=>sum+(String(r[1])===String(transferId)&&!ids.includes(String(r[0]))?(Number(r[4])||0):0),0);
  const incomingTotal=cleaned.reduce((sum,e)=>sum+e.qty,0);
  if(existingTotal+incomingTotal>Number(tr[13]))throw new Error('Total allocated quantity ('+(existingTotal+incomingTotal)+') cannot exceed transfer Qty ('+tr[13]+').');
  const now=new Date();
  cleaned.forEach(e=>{
    let row=-1, old=null;
    if(e.id){for(let i=1;i<rows.length;i++)if(String(rows[i][0])===e.id&&String(rows[i][1])===String(transferId)){row=i+1;old=rows[i];break;}if(row<0)throw new Error('Allocation not found. Refresh and try again.');}
    const aid=e.id||Utilities.getUuid();
    const out=ALLOCATION_HEADERS.map(h=>h==='Allocation ID'?aid:h==='Transfer ID'?transferId:h==='QC In Charge'?e.qc:h==='FGTS No.'?fgts:h==='Qty'?e.qty:h==='Date Finished'?(common['Date Finished']||''):h==='Allocation Remarks'?'':h==='Created At'?(old?old[7]:now):h==='Updated At'?now:h==='Category'?category:'');
    if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  });
  const currentIds=cleaned.map(e=>e.id).filter(Boolean);
  if(common['Replace All']){for(let i=rows.length-1;i>=1;i--){if(String(rows[i][1])===String(transferId)&&!currentIds.includes(String(rows[i][0]))){sh.deleteRow(i+1);}}}
  syncTransferSummary_(transferId);
  invalidateModuleCache_('Transfer Monitoring','J.O Register');
  return {ok:true,message:common['Replace All']?'QC allocation changes saved.':(ids.length?'QC allocation changes saved.':'All QC allocations saved.')};
}

function ensureAllocationCategoryColumn_(sh) {
  const lastCol=Math.max(sh.getLastColumn(),1);
  const headers=sh.getRange(1,1,1,lastCol).getDisplayValues()[0];
  if(headers.indexOf('Category')<0){const col=sh.getLastColumn()+1;sh.getRange(1,col).setValue('Category').setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');}
}

function getAllocations(transferId) {
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ALLOCATION_SHEET);
  if(!sh||sh.getLastRow()<2)return {ok:true,allocations:[]};
  const rows=sh.getDataRange().getValues().slice(1).filter(r=>String(r[1])===String(transferId));
  return {ok:true,allocations:rows.map(r=>({'Allocation ID':r[0],'Transfer ID':r[1],'QC In Charge':r[2],'FGTS No.':r[3],'Qty':r[4],'Date Finished':formatCell_(r[5]),'Allocation Remarks':r[6],Category:r[9]||''}))};
}

function saveAllocation(transferId,input) {
  if(!transferId||!input)throw new Error('Transfer ID and allocation details are required.');
  const ss=SpreadsheetApp.openById(DATABASE_ID), transfer=ss.getSheetByName(TRANSFER_SHEET), sh=ss.getSheetByName(ALLOCATION_SHEET);
  if(!transfer||!sh)throw new Error('Click Prepare Database first.');
  const tr=transfer.getDataRange().getValues().find((r,i)=>i>0&&String(r[3])===String(transferId));
  if(!tr)throw new Error('Parent transfer not found.');
  const qc=String(input['QC In Charge']||'').trim(),fgts=String(input['FGTS No.']||'').trim(),qty=Number(input.Qty);
  if(!qc)throw new Error('QC In Charge is required.');
  if(!fgts)throw new Error('FGTS No. is required.');
  if(!isFinite(qty)||qty<=0)throw new Error('Allocation Qty must be greater than zero.');
  const rows=sh.getDataRange().getValues(),id=String(input['Allocation ID']||'');let row=-1;
  if(id){for(let i=1;i<rows.length;i++)if(String(rows[i][0])===id&&String(rows[i][1])===String(transferId)){row=i+1;break;}if(row<0)throw new Error('Allocation not found. Refresh and try again.');}
  const existingTotal=rows.slice(1).reduce((sum,r,i)=>sum+(String(r[1])===String(transferId)&&String(r[0])!==id?(Number(r[4])||0):0),0);
  if(existingTotal+qty>Number(tr[13]))throw new Error('Total allocated quantity ('+(existingTotal+qty)+') cannot exceed transfer Qty ('+tr[13]+').');
  const now=new Date(),aid=id||Utilities.getUuid(),out=ALLOCATION_HEADERS.map(h=>h==='Allocation ID'?aid:h==='Transfer ID'?transferId:h==='Created At'?(row>0?rows[row-1][7]:now):h==='Updated At'?now:(input[h]??''));
  if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  syncTransferSummary_(transferId);
  invalidateModuleCache_('Transfer Monitoring','J.O Register');
  return {ok:true,message:row>0?'QC allocation updated.':'QC allocation saved.'};
}

function deleteAllocation(transferId,allocationId) {
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ALLOCATION_SHEET);
  if(!sh)throw new Error('Allocation sheet not found.');
  const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(allocationId)&&String(rows[i][1])===String(transferId)){sh.deleteRow(i+1);syncTransferSummary_(transferId);invalidateModuleCache_('Transfer Monitoring','J.O Register');return {ok:true,message:'Allocation deleted.'};}
  throw new Error('Allocation not found.');
}

function deleteTransfer(recordId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID), sh=ss.getSheetByName(TRANSFER_SHEET), alloc=ss.getSheetByName(ALLOCATION_SHEET);
  if(!sh)throw new Error('Transfer sheet not found.');
  const rows=sh.getDataRange().getValues();let transferId='',row=-1;
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(recordId)){row=i+1;transferId=String(rows[i][3]);break;}
  if(row<0)throw new Error('Transfer record not found.');
  if(alloc&&alloc.getLastRow()>1){const a=alloc.getDataRange().getValues();for(let i=a.length-1;i>=1;i--)if(String(a[i][1])===transferId)alloc.deleteRow(i+1);}
  sh.deleteRow(row);
  invalidateModuleCache_('Transfer Monitoring','J.O Register');
  return {ok:true,message:'Transfer and its linked QC allocations were deleted.'};
}

function getAllocationRows_(transferId) {
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ALLOCATION_SHEET);
  const lastRow=sh?sh.getLastRow():0;if(lastRow<2)return [];
  const matches=sh.getRange(2,2,lastRow-1,1).createTextFinder(String(transferId)).matchEntireCell(true).findAll();
  return matches.map(cell=>sh.getRange(cell.getRow(),1,1,ALLOCATION_HEADERS.length).getValues()[0]);
}

function syncTransferSummary_(transferId,allocationRows) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  const lastRow=sh?sh.getLastRow():0;if(lastRow<2)return;
  const match=sh.getRange(2,4,lastRow-1,1).createTextFinder(String(transferId)).matchEntireCell(true).findNext();
  if(!match)return;
  const rowIndex=match.getRow(),tr=sh.getRange(rowIndex,1,1,TRANSFER_HEADERS.length).getValues()[0],allocs=Array.isArray(allocationRows)?allocationRows:getAllocationRows_(transferId);
  const done=allocs.reduce((sum,a)=>sum+(Number(a[4])||0),0);
  const qc=[...new Set(allocs.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', ');
  const fgts=[...new Set(allocs.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', ');
  const finished=latestFinishedDate_(allocs);
  const qty=Number(tr[13])||0;
  sh.getRange(rowIndex,17,1,5).setValues([[done,Math.max(0,qty-done),qc,fgts,finished]]);
  let status=String(tr[15]||''),received=tr[4];
  if(qty>0&&done>=qty){status='Passed';sh.getRange(rowIndex,16).setValue(status);}
  else if(status==='Passed'){status='Ongoing';sh.getRange(rowIndex,16).setValue(status);}
  let reminder='';
  if(['Ongoing','Hold','For line up'].includes(status)&&received){const d=new Date(received);const days=Math.floor((new Date().setHours(0,0,0,0)-d.setHours(0,0,0,0))/86400000);if(days>=REMINDER_AFTER_DAYS)reminder='DELAYED ('+days+' days)';}
  sh.getRange(rowIndex,24).setValue(reminder);
}

function deleteJO(recordId) {
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(JO_SHEET),rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(recordId)){sh.deleteRow(i+1);return {ok:true,message:'J.O record deleted.'};}
  throw new Error('J.O record not found.');
}
function formatCell_(v){if(v instanceof Date)return Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');return v==null?'':v;}
function formatTimeCell_(v){if(v instanceof Date)return Utilities.formatDate(v,Session.getScriptTimeZone(),'HH:mm');return v==null?'':String(v).trim();}
