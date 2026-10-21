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

function getSystemStatus() {
  try {
    const ss = SpreadsheetApp.openById(DATABASE_ID);
    return {ok:true,databaseName:ss.getName(),existingSheets:ss.getSheets().map(s=>s.getName()),
      requiredSheets:[JO_SHEET,JO_OVERRIDE_SHEET,TRANSFER_SHEET,ALLOCATION_SHEET]};
  } catch (e) { return {ok:false,message:String(e.message||e)}; }
}

function setupDatabase() {
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const created = [];
  [[JO_SHEET,JO_HEADERS],[JO_OVERRIDE_SHEET,JO_OVERRIDE_HEADERS],[TRANSFER_SHEET,TRANSFER_HEADERS],[ALLOCATION_SHEET,ALLOCATION_HEADERS]].forEach(pair=>{
    let sh=ss.getSheetByName(pair[0]);
    if (!sh) { sh=ss.insertSheet(pair[0]); created.push(pair[0]); }
    if (sh.getLastRow()===0) {
      sh.getRange(1,1,1,pair[1].length).setValues([pair[1]]);
      sh.setFrozenRows(1);
      sh.getRange(1,1,1,pair[1].length).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');
    } else {
      const existing=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getDisplayValues()[0];
      if (existing.indexOf(pair[1][0])<0) throw new Error('The sheet "'+pair[0]+'" already contains a different layout. No data was changed; please check the headers before continuing.');
      pair[1].forEach(header=>{if(existing.indexOf(header)<0){const col=sh.getLastColumn()+1;sh.getRange(1,col).setValue(header).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');existing.push(header);}});
    }
  });
  return {ok:true,created:created,message:created.length?'Database tabs are ready.':'Database tabs already exist; existing records were preserved.'};
}

function getModuleData(moduleName, searchText) {
  if (moduleName==='Transfer Monitoring') return getTransferRecords(searchText);
  if (moduleName==='J.O Register') return getExternalJORecords_(searchText);
  if (moduleName==='FGTS Monitoring') return getFGTSMonitoringRecords_(searchText);
  throw new Error('Unsupported monitoring module: '+moduleName+'.');
  const ss=SpreadsheetApp.openById(DATABASE_ID), sh=ss.getSheetByName(JO_SHEET);
  if (!sh) return {ok:true,records:[],fields:JO_FIELDS};
  const values=sh.getDataRange().getValues(), query=String(searchText||'').toLowerCase().trim(), records=[];
  for(let i=1;i<values.length;i++){
    if(!values[i][0]) continue;
    const obj={}; JO_HEADERS.forEach((h,j)=>obj[h]=formatCell_(values[i][j]));
    if(!query||values[i].join(' ').toLowerCase().includes(query)) records.push(obj);
  }
  records.reverse(); return {ok:true,records:records,fields:JO_FIELDS};
}

function saveRecord(moduleName,input) {
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

function saveJOOverride_(input) {
  if(!input)throw new Error('No J.O changes received.');
  const id=String(input['Record ID']||'');
  if(!/^SRC-\d+$/.test(id))throw new Error('J.O source row key is invalid. Refresh and try again.');
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(JO_OVERRIDE_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  const rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,JO_OVERRIDE_HEADERS.length).getDisplayValues():[];
  const found=rows.findIndex(r=>String(r[0])===id), target=found>=0?found+2:0, now=new Date();
  const out=JO_OVERRIDE_HEADERS.map(h=>h==='Source Row'?id:h==='Updated At'?now:(input[h]??''));
  if(target)sh.getRange(target,1,1,out.length).setValues([out]);else sh.appendRow(out);
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
  const query=String(searchText||'').trim().toLowerCase(), records=[];
  for(let i=1;i<vals.length;i++){
    if(!vals[i][0])continue;
    const obj={}; TRANSFER_HEADERS.forEach((h,j)=>obj[h]=h==='Time Received'?formatTimeCell_(vals[i][j]):formatCell_(vals[i][j]));
    const linked=allocations.filter(a=>String(a[1])===String(obj['Transfer ID']));
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
  const id=String(input['Record ID']||''), data=sh.getDataRange().getValues(), now=new Date(); let row=-1;
  if(id){for(let i=1;i<data.length;i++)if(String(data[i][0])===id){row=i+1;break;}if(row<0)throw new Error('Transfer record not found. Refresh and try again.');}
  const old=row>0?data[row-1]:null,recordId=id||Utilities.getUuid(),transferId=old?String(old[3]):('TR-'+Utilities.getUuid().toUpperCase());
  const linkedAllocations=getAllocationRows_(transferId);
  const alreadyAllocated=linkedAllocations.reduce((sum,a)=>sum+(Number(a[4])||0),0);
  if(alreadyAllocated>qty)throw new Error('The new transfer Qty cannot be less than the already allocated quantity ('+alreadyAllocated+').');
  if(String(input.Status||'')==='Passed'&&alreadyAllocated<qty)throw new Error('Status cannot be Passed until Done Qty meets the required Qty.');
  const inputObj=Object.assign({},input,{'Transfer ID':transferId,'Done Qty':alreadyAllocated,'Remaining Qty':qty-alreadyAllocated,'QC In Charge':[...new Set(linkedAllocations.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', '),'FGTS No.':[...new Set(linkedAllocations.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', '),'Date Finished':latestFinishedDate_(linkedAllocations),'Reminders':''});
  if(old && !String(input['Time Received']||'').trim()) inputObj['Time Received']=formatTimeCell_(old[5]);
  const out=TRANSFER_HEADERS.map((h,j)=>h==='Record ID'?recordId:h==='Created At'?(old?old[1]:now):h==='Updated At'?now:(inputObj[h]??''));
  if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  syncTransferSummary_(transferId);
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
  return {ok:true,message:row>0?'QC allocation updated.':'QC allocation saved.'};
}

function deleteAllocation(transferId,allocationId) {
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ALLOCATION_SHEET);
  if(!sh)throw new Error('Allocation sheet not found.');
  const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(allocationId)&&String(rows[i][1])===String(transferId)){sh.deleteRow(i+1);syncTransferSummary_(transferId);return {ok:true,message:'Allocation deleted.'};}
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
  return {ok:true,message:'Transfer and its linked QC allocations were deleted.'};
}

function getAllocationRows_(transferId) {
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ALLOCATION_SHEET);
  const lastRow=sh?sh.getLastRow():0;if(lastRow<2)return [];
  const matches=sh.getRange(2,2,lastRow-1,1).createTextFinder(String(transferId)).matchEntireCell(true).findAll();
  return matches.map(cell=>sh.getRange(cell.getRow(),1,1,ALLOCATION_HEADERS.length).getValues()[0]);
}

function syncTransferSummary_(transferId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  const lastRow=sh?sh.getLastRow():0;if(lastRow<2)return;
  const match=sh.getRange(2,4,lastRow-1,1).createTextFinder(String(transferId)).matchEntireCell(true).findNext();
  if(!match)return;
  const rowIndex=match.getRow(),tr=sh.getRange(rowIndex,1,1,TRANSFER_HEADERS.length).getValues()[0],allocs=getAllocationRows_(transferId);
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
