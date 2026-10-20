/**
 * QAQC Department System
 * Uses only the NEW QAQC MONITORING DATABASE.
 * Transfer ID links every QC allocation to its parent transfer.
 */
const DATABASE_ID = '1pcXfWZFIcM00EG5_VzDGLK7ERrCL0WOkvjMx-Y2aBSI';
const JO_SHEET = 'JO Register';
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
      requiredSheets:[JO_SHEET,TRANSFER_SHEET,ALLOCATION_SHEET]};
  } catch (e) { return {ok:false,message:String(e.message||e)}; }
}

function setupDatabase() {
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const created = [];
  [[JO_SHEET,JO_HEADERS],[TRANSFER_SHEET,TRANSFER_HEADERS],[ALLOCATION_SHEET,ALLOCATION_HEADERS]].forEach(pair=>{
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
  if (moduleName!=='J.O Register') throw new Error('QC Allocation is managed inside Transfer Monitoring.');
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
  if(moduleName!=='J.O Register') throw new Error('Unsupported module.');
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
    obj['Date Finished']=[...new Set(linked.map(a=>formatCell_(a[5])).filter(Boolean))].join(', ');
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
  const inputObj=Object.assign({},input,{'Transfer ID':transferId,'Done Qty':alreadyAllocated,'Remaining Qty':qty-alreadyAllocated,'QC In Charge':[...new Set(linkedAllocations.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', '),'FGTS No.':[...new Set(linkedAllocations.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', '),'Date Finished':[...new Set(linkedAllocations.map(a=>formatCell_(a[5])).filter(Boolean))].join(', '),'Reminders':''});
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
  if(!sh||sh.getLastRow()<2)return [];
  return sh.getDataRange().getValues().slice(1).filter(r=>String(r[1])===String(transferId));
}

function syncTransferSummary_(transferId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh||sh.getLastRow()<2)return;
  const values=sh.getDataRange().getValues();
  let rowIndex=-1;
  for(let i=1;i<values.length;i++)if(String(values[i][3])===String(transferId)){rowIndex=i+1;break;}
  if(rowIndex<0)return;
  const tr=values[rowIndex-1],allocs=getAllocationRows_(transferId);
  const done=allocs.reduce((sum,a)=>sum+(Number(a[4])||0),0);
  const qc=[...new Set(allocs.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', ');
  const fgts=[...new Set(allocs.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', ');
  const finished=[...new Set(allocs.map(a=>formatCell_(a[5])).filter(Boolean))].join(', ');
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
