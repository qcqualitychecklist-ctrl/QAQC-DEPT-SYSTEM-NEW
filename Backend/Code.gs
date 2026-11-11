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
const PUNCHLIST_SHEET = 'Punchlist Monitoring';
const NCR_SHEET = 'NCR Monitoring';
const COMPLAINT_SHEET = 'Complaint Monitoring';
const PDI_SHEET = 'PDI Monitoring';
const COMPLAINT_HEADERS = ['Complaint ID','Date','Company','Client','Name of Complainant','J.O','S.O','Item','Panel Name','Qty','Complaint Description','Person Responsible','Investigation','Status','Created At','Updated At','Items JSON','Attachment URL','Submitted By Username'];
const PDI_HEADERS = ["Requestor's Email","Requestor's Name",'J.O','S.O','Client','Date of PDI','Time','Representative Name','Contact Number','Scope of Inspection','Comments or Special Request','QC in Charge','Status','Remarks'];
const NCR_HEADERS = ['Reference','Date','Prepared by','Section','Person In Charge','Description of Issue','Corrective Action','Status','Date Closed'];
const PUNCHLIST_HEADERS = ['Punchlist ID','Created At','Updated At','Date Issue','J.O','S.O','Client','Item','Panel Name','Qty','Category','Description of Punchlist','Concern Section','Target Date','Received By','Received Date','Closed By','Closed Date','Status'];
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
const TRANSFER_HEADERS = ['Record ID','Created At','Updated At','Transfer ID','Date Received','Time Received','Section','Transfer No.','J.O','S.O','Client','Item No.','Panel Name','Qty','Location','Status','Done Qty','Remaining Qty','QC In Charge','FGTS No.','Date Finished','Status Remark','Remarks','Reminders','Allocation Pool Qty','Remaining For Record ID'];
const ALLOCATION_HEADERS = ['Allocation ID','Transfer ID','QC In Charge','FGTS No.','Qty','Date Finished','Allocation Remarks','Created At','Updated At','Category','Transfer Record ID'];
const FGTS_TRANSFER_SHEET = 'FGTS Transfer Allocation';
const FGTS_TRANSFER_HEADERS = ['Allocation ID','Transfer Record ID','Transfer ID','FGTS Number','J.O. Number','S.O. Number','Client Name','Item Number','Panel Name','Transfer Quantity','QC In Charge','Allocated Quantity','Remaining Quantity','Date Assigned','Date Received','Date Finished','Remarks','Created At','Created By','Updated At','Updated By','Category','Transfer Status'];
const TRANSFER_FIELDS = ['Date Received','Time Received','Section','Transfer No.','J.O','S.O','Client','Item No.','Panel Name','Qty','Location','Status','Status Remark','Remarks'];
const JO_FIELDS = ['J.O No','S.O No','Customer','Item No','Description','Quantity','Date Received','Target Date','Status','Remarks'];
const REMINDER_AFTER_DAYS = 3;

const ACCOUNT_SHEET = 'System Accounts';
const ACCOUNT_HEADERS = ['Full Name','Department','Position','Username','Password Hash','Role','Created At'];
function accountHash_(password) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(password),Utilities.Charset.UTF_8);
  return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}
function createAccount(fullName,department,position,username,password) {
  fullName=String(fullName||'').trim(); department=String(department||'').trim();
  position=String(position||'').trim(); username=String(username||'').trim();
  password=String(password||'');
  if(!fullName||!department||!position||!username||!password)throw new Error('Please complete all required fields.');
  if(password.length<8)throw new Error('Password must be at least 8 characters.');
  if(!/^[A-Za-z0-9._-]{3,30}$/.test(username))throw new Error('Username must be 3-30 characters and use letters, numbers, dot, underscore, or hyphen.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const ss=SpreadsheetApp.openById(DATABASE_ID);
    let sh=ss.getSheetByName(ACCOUNT_SHEET);
    if(!sh){sh=ss.insertSheet(ACCOUNT_SHEET);sh.getRange(1,1,1,ACCOUNT_HEADERS.length).setValues([ACCOUNT_HEADERS]);sh.setFrozenRows(1);}
    const values=sh.getDataRange().getDisplayValues();
    const normalized=username.toLowerCase();
    if(values.slice(1).some(r=>String(r[3]||'').toLowerCase()===normalized))throw new Error('Username already exists.');
    const isAdmin=normalized==='assocadmin' && fullName.toLowerCase()==='aprillyn de guia';
    if(normalized==='assocadmin'&&!isAdmin)throw new Error('This username is reserved for the system administrator.');
    sh.appendRow([fullName,department,position,username,accountHash_(password),isAdmin?'Admin':'User',new Date()]);
    return {ok:true,message:'Account created successfully. You can now log in.'};
  } finally {lock.releaseLock();}
}
function issueComplaintSessionToken_(username){
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('qaqc_complaint_session_'+token,String(username||'').trim(),21600);return token;
}
function getComplaintSessionUsername_(token){const key=String(token||'').trim();return key?String(CacheService.getScriptCache().get('qaqc_complaint_session_'+key)||'').trim():'';}
function revokeComplaintSession(token){const key=String(token||'').trim();if(key)CacheService.getScriptCache().remove('qaqc_complaint_session_'+key);return {ok:true};}
function loginAccount(username,password) {
  username=String(username||'').trim();password=String(password||'');
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ACCOUNT_SHEET);
  if(!sh||sh.getLastRow()<2)return {ok:false,message:'Invalid username or password.'};
  const rows=sh.getDataRange().getValues(),hash=accountHash_(password);
  for(let i=1;i<rows.length;i++)if(String(rows[i][3]||'').toLowerCase()===username.toLowerCase()&&String(rows[i][4]||'')===hash){const accountUsername=String(rows[i][3]||'');return {ok:true,fullName:String(rows[i][0]||''),department:String(rows[i][1]||''),position:String(rows[i][2]||''),username:accountUsername,role:String(rows[i][5]||'User'),authToken:issueComplaintSessionToken_(accountUsername)};}
  return {ok:false,message:'Invalid username or password.'};
}
function updateAccountCredentials(currentUsername,currentPassword,newUsername,newPassword) {
  currentUsername=String(currentUsername||'').trim();
  currentPassword=String(currentPassword||'');
  newUsername=String(newUsername||'').trim();
  newPassword=String(newPassword||'');
  if(!currentUsername||!currentPassword||!newUsername)throw new Error('Username and current password are required.');
  if(!/^[A-Za-z0-9._-]{3,30}$/.test(newUsername))throw new Error('Username must be 3-30 characters and use letters, numbers, dot, underscore, or hyphen.');
  if(newPassword&&newPassword.length<8)throw new Error('New password must be at least 8 characters.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(ACCOUNT_SHEET);
    if(!sh||sh.getLastRow()<2)throw new Error('Account was not found.');
    const rows=sh.getDataRange().getValues(),hash=accountHash_(currentPassword);
    let rowNumber=0,rowData=null;
    for(let i=1;i<rows.length;i++)if(String(rows[i][3]||'').toLowerCase()===currentUsername.toLowerCase()&&String(rows[i][4]||'')===hash){rowNumber=i+1;rowData=rows[i];break;}
    if(!rowNumber)throw new Error('Current password is incorrect. No changes were made.');
    const normalized=newUsername.toLowerCase();
    for(let i=1;i<rows.length;i++)if(i+1!==rowNumber&&String(rows[i][3]||'').toLowerCase()===normalized)throw new Error('Username already exists. Please choose another username.');
    const isAdmin=String(rowData[5]||'User')==='Admin';
    if(normalized==='assocadmin'&&(!isAdmin||String(rowData[0]||'').toLowerCase()!=='aprillyn de guia'))throw new Error('This username is reserved for the system administrator.');
    sh.getRange(rowNumber,4).setValue(newUsername);
    if(newPassword)sh.getRange(rowNumber,5).setValue(accountHash_(newPassword));
    return {ok:true,username:newUsername,message:'Account settings updated successfully.'};
  } finally {lock.releaseLock();}
}


function doGet(e) {
  const page=String(e&&e.parameter&&e.parameter.page||'').toLowerCase();
  const publicComplaint=page==='complaint',publicPdi=page==='pdi';
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle(publicPdi?'PDI Request Form':publicComplaint?'Submit a Complaint | QAQC':'QAQC Department System')
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
  try{const cache=CacheService.getScriptCache();const names=arguments.length?Array.from(arguments):['Transfer Monitoring','J.O Register','FGTS Monitoring'];names.forEach(name=>{const key=String(name).replace(/[^a-z0-9]/gi,'_');cache.remove('qaqc_module_v2_'+key);cache.remove('qaqc_module_v3_'+key);});}catch(e){}
}

function getSystemStatus() {
  try {
    const ss = SpreadsheetApp.openById(DATABASE_ID);
    return {ok:true,databaseName:ss.getName(),existingSheets:ss.getSheets().map(s=>s.getName()),
      requiredSheets:[JO_SHEET,JO_OVERRIDE_SHEET,TRANSFER_SHEET,ALLOCATION_SHEET,FGTS_TRANSFER_SHEET,REWORK_SHEET,REWORK_MAIN_SHEET,REWORK_DETAILS_SHEET,REWORK_ASSIGNMENTS_SHEET,PUNCHLIST_SHEET,NCR_SHEET,COMPLAINT_SHEET,PDI_SHEET]};
  } catch (e) { return {ok:false,message:String(e.message||e)}; }
}

function setupDatabase() {
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const created = [];
  [[JO_SHEET,JO_HEADERS],[JO_OVERRIDE_SHEET,JO_OVERRIDE_HEADERS],[TRANSFER_SHEET,TRANSFER_HEADERS],[ALLOCATION_SHEET,ALLOCATION_HEADERS],[FGTS_TRANSFER_SHEET,FGTS_TRANSFER_HEADERS],[REWORK_SHEET,REWORK_HEADERS],[REWORK_MAIN_SHEET,REWORK_MAIN_HEADERS],[REWORK_DETAILS_SHEET,REWORK_DETAILS_HEADERS],[REWORK_ASSIGNMENTS_SHEET,REWORK_ASSIGNMENT_HEADERS],[PUNCHLIST_SHEET,PUNCHLIST_HEADERS],[NCR_SHEET,NCR_HEADERS],[COMPLAINT_SHEET,COMPLAINT_HEADERS],[PDI_SHEET,PDI_HEADERS]].forEach(pair=>{
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

function getModuleData(moduleName, searchText, pageNumber, pageSize, returnAll, forceRefresh) {
  if (!['Transfer Monitoring','J.O Register','FGTS Monitoring','Rework Monitoring','Punchlist Monitoring','NCR Monitoring','Complaint Monitoring','PDI Monitoring'].includes(moduleName)) throw new Error('Unsupported monitoring module: '+moduleName+'.');
  const query=String(searchText||'').trim();
  // v3 stores the records already sorted, avoiding a full-array sort on the
  // immediate follow-up request used by the first-50 loading flow.
  const cacheKey='qaqc_module_v3_'+moduleName.replace(/[^a-z0-9]/gi,'_');
  let result=null,loadedFromCache=false;
  if(!query&&!forceRefresh){
    result=readModuleCache_(cacheKey);
    loadedFromCache=!!(result&&result.ok);
  }
  if(!result){
    if(moduleName==='Transfer Monitoring')result=getTransferRecords(query);
    else if(moduleName==='J.O Register')result=getExternalJORecords_(query);
    else if(moduleName==='Rework Monitoring')result=getReworkRecords_(query);
    else if(moduleName==='Punchlist Monitoring')result=getPunchlistRecords_(query);
    else if(moduleName==='NCR Monitoring')result=getNcrRecords_(query);
    else if(moduleName==='Complaint Monitoring')result=getComplaintRecords_(query);
    else if(moduleName==='PDI Monitoring')result=getPdiRecords_(query);
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
  return start==null||end==null?'':Math.round((end-start)/86400000)+1;
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
  const dateField=moduleName==='J.O Register'?'Received':moduleName==='Rework Monitoring'?'Date Issue':moduleName==='NCR Monitoring'?'Date':moduleName==='Complaint Monitoring'?'Date':moduleName==='PDI Monitoring'?'Date of PDI':'Date Received';
  return (records||[]).map((record,index)=>({record:record,index:index,date:joParseDate_(record&&record[dateField])}))
    .sort((a,b)=>{
      const at=a.date?a.date.getTime():-Infinity,bt=b.date?b.date.getTime():-Infinity;
      if(at!==bt)return bt-at;
      return a.index-b.index;
    }).map(item=>item.record);
}


function saveNcr_(input){
 if(!input)throw new Error('No NCR data received.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(NCR_SHEET);
 if(!sh)throw new Error('Click Prepare Database first to create the NCR Monitoring tab.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(String),now=new Date();
 const required=['Date','Prepared by','Section','Person In Charge','Description of Issue'];
 required.forEach(h=>{if(!String(input[h]||'').trim())throw new Error(h+' is required.')});
 const status=String(input.Status||'Open').trim();
 if(!['Open','Closed'].includes(status))throw new Error('Status must be Open or Closed.');
 if(status==='Closed'&&!String(input['Date Closed']||'').trim())throw new Error('Date Closed is required when Status is Closed.');
 const ref=String(input.Reference||'').trim()||('NCR-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyyMMdd-HHmmss'));
 const rec=Object.assign({},input,{Reference:ref,Status:status}),out=headers.map(h=>rec[h]===undefined?'':rec[h]);
 let row=-1;const refCol=headers.indexOf('Reference');
 if(refCol>=0&&String(input.Reference||'').trim())for(let i=1;i<data.length;i++)if(String(data[i][refCol]).trim()===ref){row=i+1;break}
 if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
 invalidateModuleCache_('NCR Monitoring');
 return {ok:true,recordId:ref,message:row>0?'NCR record updated.':'NCR record saved.'};
}
function updateNcrStatus(reference,status,dateClosed){
 const ref=String(reference||'').trim(),next=String(status||'').trim(),closedDate=String(dateClosed||'').trim();
 if(!ref)throw new Error('Missing NCR Reference.');
 if(!['Open','Closed'].includes(next))throw new Error('Status must be Open or Closed.');
 if(next==='Closed'&&!closedDate)throw new Error('Date Closed is required.');
 const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(NCR_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('NCR record was not found.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(String),refCol=headers.indexOf('Reference');
 if(refCol<0)throw new Error('Reference column is missing.');
 let row=-1;for(let i=1;i<data.length;i++)if(String(data[i][refCol]).trim()===ref){row=i+1;break}
 if(row<0)throw new Error('NCR record was not found. Refresh and try again.');
 const statusCol=headers.indexOf('Status'),dateCol=headers.indexOf('Date Closed');
 if(statusCol<0||dateCol<0)throw new Error('NCR Status or Date Closed column is missing.');
 sh.getRange(row,statusCol+1).setValue(next);
 sh.getRange(row,dateCol+1).setValue(next==='Closed'?closedDate:'');
 invalidateModuleCache_('NCR Monitoring');
 return {ok:true,recordId:ref,status:next,dateClosed:next==='Closed'?closedDate:'',message:next==='Closed'?'NCR closed.':'NCR reopened.'};
}
function deleteNcr(reference){
 const ref=String(reference||'').trim();if(!ref)throw new Error('Missing NCR Reference.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(NCR_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('NCR record was not found.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(String),col=headers.indexOf('Reference');
 if(col<0)throw new Error('Reference column is missing.');
 let row=-1;for(let i=1;i<data.length;i++)if(String(data[i][col]).trim()===ref){row=i+1;break}
 if(row<0)throw new Error('NCR record was not found. Refresh and try again.');
 sh.deleteRow(row);invalidateModuleCache_('NCR Monitoring');return {ok:true,recordId:ref,message:'NCR record deleted.'};
}

function invalidateComplaintCache_(){try{CacheService.getScriptCache().remove('qaqc_module_v3_Complaint_Monitoring');}catch(e){}}
function ensureComplaintSchema_(sh){
 if(!sh||!sh.getLastColumn())throw new Error('Complaint Monitoring database is not prepared yet.');
 const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
 [['QC In-Charge','Person Responsible'],['Cause','Investigation']].forEach(([oldName,newName])=>{const oldIndex=headers.indexOf(oldName),newIndex=headers.indexOf(newName);if(oldIndex>=0&&newIndex<0){sh.getRange(1,oldIndex+1).setValue(newName);headers[oldIndex]=newName;}});
 ['Person Responsible','Investigation','Submitted By Username'].forEach(name=>{if(!headers.includes(name)){const col=sh.getLastColumn()+1;sh.getRange(1,col).setValue(name).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');headers.push(name);}});
 return headers;
}
function saveComplaint_(input){
 if(!input)throw new Error('No complaint data received.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(COMPLAINT_SHEET);
 if(!sh)throw new Error('Click Prepare Database first to create the Complaint Monitoring tab.');
 const headers=ensureComplaintSchema_(sh),data=sh.getDataRange().getValues(),now=new Date();
 const required=['Date','Company','Client','Name of Complainant','Complaint Description'];
 required.forEach(h=>{if(!String(input[h]||'').trim())throw new Error(h+' is required.')});
 if(!['GEMCOR','GPI'].includes(String(input.Company||'').trim().toUpperCase()))throw new Error('Company must be GEMCOR or GPI.');
 const qty=String(input.Qty||'').trim();
 if(qty&&(!isFinite(Number(qty))||Number(qty)<=0))throw new Error('Qty must be greater than zero.');
 const status=String(input.Status||'Open').trim();
 if(!['Open','In Progress','Closed'].includes(status))throw new Error('Invalid complaint status.');
 const id=String(input['Complaint ID']||'').trim()||('CMP-'+Utilities.getUuid().slice(0,8).toUpperCase());
 const rec=Object.assign({},input,{'Complaint ID':id,Status:status,'Created At':now,'Updated At':now});
 let row=-1;const idCol=headers.indexOf('Complaint ID');
 if(input['Complaint ID']&&idCol>=0)for(let i=1;i<data.length;i++)if(String(data[i][idCol]).trim()===id){row=i+1;rec['Created At']=data[i][headers.indexOf('Created At')]||now;break;}
 const out=headers.map(h=>rec[h]===undefined?'':rec[h]);
 if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
 invalidateComplaintCache_();
 return {ok:true,recordId:id,message:row>0?'Complaint updated.':'Complaint saved.'};
}

function submitPublicComplaint(payload,sessionToken){
  if(!payload||!payload.header||!Array.isArray(payload.items)||!payload.items.length)throw new Error('Complete the complaint details and add at least one item.');
  const accountUsername=sessionToken?getComplaintSessionUsername_(sessionToken):'';
  if(sessionToken&&!accountUsername)throw new Error('Your account session expired. Please log in again before submitting.');
  const h=payload.header,required=['Date','Company','Client','Name of Complainant'];
  required.forEach(k=>{if(!String(h[k]||'').trim())throw new Error(k+' is required.')});
  const company=String(h.Company||'').trim().toUpperCase();
  if(!['GEMCOR','GPI'].includes(company))throw new Error('Please select GEMCOR or GPI.');
  if(payload.items.length>30)throw new Error('A maximum of 30 items can be included in one submission.');
  payload.items.forEach((item,i)=>{
    if(!String(item.Item||'').trim())throw new Error('Item is required for item row '+(i+1)+'.');
    if(!String(item['Complaint Description']||'').trim())throw new Error('Complaint Description is required for item row '+(i+1)+'.');
    if(item.Qty!==''&&item.Qty!=null&&(!isFinite(Number(item.Qty))||Number(item.Qty)<=0))throw new Error('Qty must be greater than zero for item row '+(i+1)+'.');
  });
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(COMPLAINT_SHEET);
    if(!sh)throw new Error('Complaint Monitoring database is not prepared yet. Please contact QA/QC.');
    const id='CMP-'+Utilities.getUuid().slice(0,8).toUpperCase(),now=new Date();
    const headers=ensureComplaintSchema_(sh);
    let attachmentUrl='';
    if(payload.attachment&&payload.attachment.data){
      const a=payload.attachment, mime=String(a.mimeType||'');
      if(!/^(image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime|webm))$/.test(mime))throw new Error('Only image or video attachments are allowed.');
      const bytes=Utilities.base64Decode(String(a.data).split(',').pop());
      if(bytes.length>10*1024*1024)throw new Error('Attachment must not exceed 10 MB.');
      let folder;const folders=DriveApp.getFoldersByName('QAQC Complaint Attachments');
      folder=folders.hasNext()?folders.next():DriveApp.createFolder('QAQC Complaint Attachments');
      const ext=(String(a.fileName||'attachment').match(/\.[A-Za-z0-9]{2,5}$/)||[''])[0];
      const file=folder.createFile(Utilities.newBlob(bytes,mime,id+ext));
      attachmentUrl=file.getUrl();
    }
    const items=payload.items.map(x=>({Item:String(x.Item||'').trim(), 'Panel Name':String(x['Panel Name']||'').trim(),Qty:String(x.Qty||'').trim(),'Complaint Description':String(x['Complaint Description']||'').trim()}));
    const rec={'Complaint ID':id,Date:String(h.Date),Company:company,Client:String(h.Client).trim(),'Name of Complainant':String(h['Name of Complainant']).trim(),'J.O':String(h['J.O']||'').trim(),'S.O':String(h['S.O']||'').trim(),Item:items.map(x=>x.Item).join(', '),'Panel Name':items.map(x=>x['Panel Name']).filter(Boolean).join(', '),Qty:items.map(x=>x.Qty).filter(Boolean).join(', '),'Complaint Description':items.map(x=>x.Item+': '+x['Complaint Description']).join(' | '),'Person Responsible':'',Investigation:'',Status:'Open','Created At':now,'Updated At':now,'Items JSON':JSON.stringify(items),'Attachment URL':attachmentUrl,'Submitted By Username':accountUsername};
    sh.appendRow(headers.map(k=>rec[k]===undefined?'':rec[k]));
    invalidateComplaintCache_();
    return {ok:true,recordId:id,attachmentUrl:attachmentUrl,message:'Your complaint has been submitted successfully.'};
  }finally{lock.releaseLock();}
}

function getMyComplaintHistory(sessionToken){
  const username=getComplaintSessionUsername_(sessionToken);if(!username)throw new Error('Your account session expired. Please log in again to view complaint history.');
  const result=getComplaintRecords_('');return {ok:true,records:(result.records||[]).filter(r=>String(r['Submitted By Username']||'').toLowerCase()===username.toLowerCase())};
}

function submitPdiRequest(payload){
 const required=["Requestor's Email","Requestor's Name",'J.O','S.O','Client','Date of PDI','Time','Representative Name','Contact Number','Scope of Inspection'];
 if(!payload||typeof payload!=='object')throw new Error('Please complete the PDI request form.');
 required.forEach(k=>{if(!String(payload[k]||'').trim())throw new Error(k+' is required.');});
 const email=String(payload["Requestor's Email"]).trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Please enter a valid requestor email address.');
 const date=String(payload['Date of PDI']).trim(),time=String(payload.Time).trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Please select a valid Date of PDI.');
 if(!/^\d{2}:\d{2}$/.test(time))throw new Error('Please select a valid inspection time.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(PDI_SHEET);
  if(!sh)throw new Error('PDI Monitoring database is not prepared. Please contact QA/QC.');
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
  const record=Object.assign({},payload,{'QC in Charge':'',Status:'Pending',Remarks:''});
  sh.appendRow(headers.map(h=>record[h]===undefined?'':record[h]));
  try{CacheService.getScriptCache().remove('qaqc_module_v3_PDI_Monitoring');}catch(e){}
  return {ok:true,message:'Your PDI request has been submitted successfully.'};
 }finally{lock.releaseLock();}
}
function getPdiRecords_(searchText){
 const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(PDI_SHEET);
 if(!sh||sh.getLastRow()<2)return {ok:true,records:[],fields:PDI_HEADERS};
 const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
 const records=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(row=>{const rec={};headers.forEach((name,i)=>rec[name]=name==='Time'?formatTimeCell_(row[i]):formatCell_(row[i]));if(!rec.Status)rec.Status='Pending';return rec;});
 const q=String(searchText||'').trim().toLowerCase();
 return {ok:true,records:q?records.filter(rec=>Object.values(rec).some(v=>String(v||'').toLowerCase().includes(q))):records,fields:PDI_HEADERS};
}
function getComplaintRecords_(searchText){
 const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(COMPLAINT_SHEET);
 if(!sh||sh.getLastRow()<2)return {ok:true,records:[],fields:COMPLAINT_HEADERS};
 const headers=ensureComplaintSchema_(sh);
 const records=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(row=>{const rec={};headers.forEach((h,i)=>rec[h]=formatCell_(row[i]));if(!rec.Status)rec.Status='Open';return rec;});
 const q=String(searchText||'').trim().toLowerCase();
 return {ok:true,records:q?records.filter(rec=>Object.values(rec).some(v=>String(v||'').toLowerCase().includes(q))):records,fields:COMPLAINT_HEADERS};
}
function updateComplaintStatus(id,status,personResponsible,investigation){
 const key=String(id||'').trim(),next=String(status||'').trim();
 if(!key)throw new Error('Missing Complaint ID.');
 if(!['Open','In Progress','Closed'].includes(next))throw new Error('Invalid complaint status.');
 const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(COMPLAINT_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('Complaint record was not found.');
 const headers=ensureComplaintSchema_(sh),data=sh.getDataRange().getValues(),idCol=headers.indexOf('Complaint ID');
 let row=-1;for(let i=1;i<data.length;i++)if(String(data[i][idCol]).trim()===key){row=i+1;break;}
 if(row<0)throw new Error('Complaint record was not found. Refresh and try again.');
 [['Status',next],['Person Responsible',String(personResponsible||'').trim()],['Investigation',String(investigation||'').trim()],['Updated At',new Date()]].forEach(([name,value])=>{const col=headers.indexOf(name);if(col>=0)sh.getRange(row,col+1).setValue(value);});
 invalidateModuleCache_('Complaint Monitoring');
 return {ok:true,recordId:key,message:'Complaint updated.'};
}
function deleteComplaint(id){
 const key=String(id||'').trim();if(!key)throw new Error('Missing Complaint ID.');
 const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(COMPLAINT_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('Complaint record was not found.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(String),col=headers.indexOf('Complaint ID');
 for(let i=1;i<data.length;i++)if(String(data[i][col]).trim()===key){sh.deleteRow(i+1);invalidateComplaintCache_();return {ok:true,message:'Complaint deleted.'};}
 throw new Error('Complaint record was not found. Refresh and try again.');
}

function getNcrRecords_(searchText){
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(NCR_SHEET);
 if(!sh||sh.getLastRow()<2)return {ok:true,records:[],fields:NCR_HEADERS};
 const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(String);
 const records=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(row=>{const rec={};headers.forEach((h,i)=>rec[h]=formatCell_(row[i]));if(!String(rec.Status||'').trim())rec.Status=String(rec['Date Closed']||'').trim()?'Closed':'Open';return rec;});
 const q=String(searchText||'').trim().toLowerCase();
 return {ok:true,records:q?records.filter(rec=>Object.values(rec).some(v=>String(v||'').toLowerCase().includes(q))):records,fields:NCR_HEADERS};
}

function getPunchlistRecords_(searchText){
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(PUNCHLIST_SHEET);
 if(!sh||sh.getLastRow()<2)return {ok:true,records:[],fields:PUNCHLIST_HEADERS};
 const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(String);
 const records=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().map(row=>{const o={};headers.forEach((h,i)=>o[h]=formatCell_(row[i]));return o;});
 const q=String(searchText||'').trim().toLowerCase();
 return {ok:true,records:q?records.filter(o=>Object.values(o).some(v=>String(v||'').toLowerCase().includes(q))):records,fields:PUNCHLIST_HEADERS};
}
function savePunchlist_(input){
 if(!input)throw new Error('No punchlist data received.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(PUNCHLIST_SHEET);
 if(!sh)throw new Error('Click Prepare Database first to create the Punchlist Monitoring tab.');
 const id=String(input['Punchlist ID']||'').trim(),now=new Date(),data=sh.getDataRange().getValues(),headers=data[0].map(String);
 let rowIndex=-1;
 if(id)for(let i=1;i<data.length;i++)if(String(data[i][headers.indexOf('Punchlist ID')])===id){rowIndex=i+1;break;}
 const rec=Object.assign({},input,{'Punchlist ID':id||('PL-'+Utilities.getUuid().slice(0,8).toUpperCase()),'Created At':rowIndex>0?data[rowIndex-1][headers.indexOf('Created At')]:now,'Updated At':now,'Status':String(input.Status||'Open')});
 if(!String(rec['J.O']||'').trim()&&!String(rec['S.O']||'').trim())throw new Error('Enter a J.O or S.O number.');
 if(!String(rec['Description of Punchlist']||'').trim())throw new Error('Description of Punchlist is required.');
 if(!['A','B','C'].includes(String(rec.Category||'')))throw new Error('Choose Category A, B, or C.');
 if(!['Open','Closed'].includes(String(rec.Status)))throw new Error('Status must be Open or Closed.');
 const out=headers.map(h=>rec[h]===undefined?'':rec[h]);
 if(rowIndex>0)sh.getRange(rowIndex,1,1,out.length).setValues([out]);else sh.appendRow(out);
 invalidateModuleCache_('Punchlist Monitoring');
 return {ok:true,recordId:rec['Punchlist ID'],message:rowIndex>0?'Punchlist updated.':'Punchlist saved.'};
}

function closePunchlist(id,closedBy,closedDate){
 const key=String(id||'').trim(),by=String(closedBy||'').trim(),date=String(closedDate||'').trim();
 if(!key)throw new Error('Missing Punchlist ID.');
 if(!by||!date)throw new Error('Closed By and Close Date are required.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(PUNCHLIST_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('Punchlist record was not found.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(String),idCol=headers.indexOf('Punchlist ID');
 if(idCol<0)throw new Error('Punchlist ID column is missing.');
 let row=-1;for(let i=1;i<data.length;i++)if(String(data[i][idCol])===key){row=i+1;break;}
 if(row<0)throw new Error('Punchlist record was not found. Refresh and try again.');
 const set=(name,value)=>{const col=headers.indexOf(name);if(col>=0)sh.getRange(row,col+1).setValue(value)};
 set('Closed By',by);set('Closed Date',date);set('Status','Closed');set('Updated At',new Date());
 invalidateModuleCache_('Punchlist Monitoring');return {ok:true,recordId:key,message:'Punchlist closed.'};
}
function deletePunchlistByJO(jo){
 const jobOrder=String(jo||'').trim();if(!jobOrder)throw new Error('Missing J.O. number.');
 const sh=SpreadsheetApp.openById(DATABASE_ID).getSheetByName(PUNCHLIST_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('No punchlist records were found.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(v=>String(v||'').trim()),joCol=headers.indexOf('J.O');
 if(joCol<0)throw new Error('J.O. column is missing from Punchlist Monitoring.');
 const rows=[];for(let i=1;i<data.length;i++)if(String(data[i][joCol]||'').trim()===jobOrder)rows.push(i+1);
 if(!rows.length)throw new Error('No punchlist entries found for J.O. '+jobOrder+'.');
 const deletedCount=rows.length;rows.reverse().forEach(row=>sh.deleteRow(row));invalidateModuleCache_('Punchlist Monitoring');
 return {ok:true,deletedCount,message:'Deleted '+deletedCount+' punchlist entr'+(deletedCount===1?'y':'ies')+' under J.O. '+jobOrder+'.'};
}
function deletePunchlist(id){
 const key=String(id||'').trim();if(!key)throw new Error('Missing Punchlist ID.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(PUNCHLIST_SHEET);
 if(!sh||sh.getLastRow()<2)throw new Error('Punchlist record was not found.');
 const data=sh.getDataRange().getValues(),headers=data[0].map(String),idCol=headers.indexOf('Punchlist ID');
 if(idCol<0)throw new Error('Punchlist ID column is missing.');
 let row=-1;for(let i=1;i<data.length;i++)if(String(data[i][idCol])===key){row=i+1;break;}
 if(row<0)throw new Error('Punchlist record was not found. Refresh and try again.');
 sh.deleteRow(row);invalidateModuleCache_('Punchlist Monitoring');return {ok:true,recordId:key,message:'Punchlist description deleted.'};
}
function saveRecord(moduleName,input) {
  if(moduleName==='NCR Monitoring') return saveNcr_(input);
  if(moduleName==='Complaint Monitoring') return saveComplaint_(input);
  if(moduleName==='Rework Monitoring') return saveReworkCase_(input);
  if(moduleName==='Punchlist Monitoring') return savePunchlist_(input);
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
  // Ensure legacy allocation rows have their parent Transfer Record ID where it
  // can be identified unambiguously. Never fall back to Transfer ID because one
  // Transfer ID may contain multiple item records.
  if(transferSheet&&allocSheet)migrateAllocationRecordIds_(transferSheet,allocSheet);
  const transferRows=transferSheet&&transferSheet.getLastRow()>1
    ?transferSheet.getRange(2,1,transferSheet.getLastRow()-1,TRANSFER_HEADERS.length).getDisplayValues():[];
  const allocHeaders=allocSheet&&allocSheet.getLastRow()>0
    ?allocSheet.getRange(1,1,1,allocSheet.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()):[];
  const allocs=allocSheet&&allocSheet.getLastRow()>1
    ?allocSheet.getRange(2,1,allocSheet.getLastRow()-1,allocSheet.getLastColumn()).getValues():[];
  const allocRecordIdIndex=allocHeaders.indexOf('Transfer Record ID');
  const allocsByRecord={};
  allocs.forEach(a=>{
    const recordId=allocRecordIdIndex>=0?String(a[allocRecordIdIndex]||''):'';
    if(!recordId)return;
    if(!allocsByRecord[recordId])allocsByRecord[recordId]=[];
    allocsByRecord[recordId].push(a);
  });
  const recordIdIndex=TRANSFER_HEADERS.indexOf('Record ID');
  const soIndex=TRANSFER_HEADERS.indexOf('S.O'),itemIndex=TRANSFER_HEADERS.indexOf('Item No.');
  transferRows.forEach(t=>{
    const recordId=String(t[recordIdIndex]||''),linked=allocsByRecord[recordId]||[];
    if(!linked.length)return;
    const so=String(t[soIndex]||'').trim(),item=String(t[itemIndex]||'').trim();
    if(!so||!item)return;
    const key=fgtsJobKey_(so,item);
    linked.forEach((a,i)=>addAllocation(key,a[3],a[2],a[4],a[5],'ALLOC-'+recordId+'-'+i));
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
    ['Qty','Transferred','Balance'].forEach(h=>o[h]=Number(String(o[h]||0).replace(/,/g,''))||0);
    // J.O Register Date Completion is item-specific and appears only after
    // the transferred quantity reaches that exact source item's required Qty.
    if(o.Qty<=0||o.Transferred<o.Qty)o['Date Served']='';
    const finalDue=joParseDate_(o['Delivery Date']), finalServed=joParseDate_(o['Date Served']);
    o.Timeliness=finalServed&&finalDue?(finalServed.getTime()<=finalDue.getTime()?'On Time':'Delayed'):'Pending';
    if(!q||Object.values(o).join(' ').toLowerCase().includes(q))records.push(o);
  });
  return {ok:true,records:records,fields:JO_OVERRIDE_HEADERS.slice(2)};
}

/**
 * FGTS Monitoring reads the external FGTS sheet. Classification is looked up
 * from the J.O Register source using S.O + Item No. Source data is not modified.
 */

function syncFGTSTransferAllocations_() {
  const ss=SpreadsheetApp.openById(DATABASE_ID),transfer=ss.getSheetByName(TRANSFER_SHEET),alloc=ss.getSheetByName(ALLOCATION_SHEET);
  let target=ss.getSheetByName(FGTS_TRANSFER_SHEET);if(!target)target=ss.insertSheet(FGTS_TRANSFER_SHEET);
  let th=target.getLastColumn()>0?target.getRange(1,1,1,target.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()):[];
  if(!th.length||!th[0]){target.getRange(1,1,1,FGTS_TRANSFER_HEADERS.length).setValues([FGTS_TRANSFER_HEADERS]);target.setFrozenRows(1);target.getRange(1,1,1,FGTS_TRANSFER_HEADERS.length).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');}
  else FGTS_TRANSFER_HEADERS.forEach(h=>{if(!th.includes(h)){const col=target.getLastColumn()+1;target.getRange(1,col).setValue(h).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');th[col-1]=h;}});
  if(!transfer||!alloc||transfer.getLastRow()<2||alloc.getLastRow()<2){if(target.getLastRow()>1)target.getRange(2,1,target.getLastRow()-1,target.getLastColumn()).clearContent();return {ok:true,count:0};}
  migrateAllocationRecordIds_(transfer,alloc);
  const tHeaders=transfer.getRange(1,1,1,transfer.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()),aHeaders=alloc.getRange(1,1,1,alloc.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
  const ti=n=>tHeaders.indexOf(n),ai=n=>aHeaders.indexOf(n),parents=Object.create(null);
  transfer.getDataRange().getValues().slice(1).forEach(r=>{const id=String(r[ti('Record ID')]||'');if(id)parents[id]=r;});
  const now=new Date(),out=[];
  alloc.getDataRange().getValues().slice(1).forEach(a=>{
    const parentId=String(a[ai('Transfer Record ID')]||''),p=parents[parentId],allocationId=String(a[ai('Allocation ID')]||'');
    if(!p||!allocationId||String(p[ti('Status')]||'').trim().toLowerCase()!=='passed')return;
    const created=a[ai('Created At')]||now,updated=a[ai('Updated At')]||created;
    const row={'Allocation ID':allocationId,'Transfer Record ID':parentId,'Transfer ID':p[ti('Transfer ID')],'FGTS Number':a[ai('FGTS No.')],'J.O. Number':p[ti('J.O')],'S.O. Number':p[ti('S.O')],'Client Name':p[ti('Client')],'Item Number':p[ti('Item No.')],'Panel Name':p[ti('Panel Name')],'Transfer Quantity':Number(p[ti('Allocation Pool Qty')])||Number(p[ti('Qty')])||0,'QC In Charge':a[ai('QC In Charge')],'Allocated Quantity':Number(a[ai('Qty')])||0,'Remaining Quantity':Number(p[ti('Remaining Qty')])||0,'Date Assigned':created,'Date Received':p[ti('Date Received')],'Date Finished':a[ai('Date Finished')]||p[ti('Date Finished')]||'','Remarks':a[ai('Allocation Remarks')]||p[ti('Remarks')]||'','Created At':created,'Created By':'System','Updated At':updated,'Updated By':'System','Category':a[ai('Category')]||'','Transfer Status':p[ti('Status')]};
    out.push(FGTS_TRANSFER_HEADERS.map(h=>row[h]??''));
  });
  if(target.getLastRow()>1)target.getRange(2,1,target.getLastRow()-1,target.getLastColumn()).clearContent();
  if(out.length)target.getRange(2,1,out.length,FGTS_TRANSFER_HEADERS.length).setValues(out);
  return {ok:true,count:out.length};
}

function getFGTSMonitoringRecords_(searchText) {
  const query=String(searchText||'').trim().toLowerCase(),records=[];
  const fgtsSS=SpreadsheetApp.openById(FGTS_SOURCE_ID),fgtsSheet=fgtsSS.getSheets().find(s=>s.getSheetId()===FGTS_SOURCE_GID);
  if(!fgtsSheet)throw new Error('Could not find FGTS source sheet tab gid '+FGTS_SOURCE_GID+'.');
  const last=fgtsSheet.getLastRow(),rows=last>=FGTS_SOURCE_START_ROW?fgtsSheet.getRange(FGTS_SOURCE_START_ROW,1,last-FGTS_SOURCE_START_ROW+1,14).getValues():[];
  const joSS=SpreadsheetApp.openById(JO_SOURCE_ID),joSheet=joSS.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID),classByJob={},joRows=[];
  const classificationStartRow=Math.min(2272,JO_SOURCE_START_ROW);
  if(joSheet&&joSheet.getLastRow()>=classificationStartRow){
    joRows.push(...joSheet.getRange(classificationStartRow,1,joSheet.getLastRow()-classificationStartRow+1,14).getDisplayValues());
    joRows.forEach(r=>{const so=String(r[1]||'').trim(),item=String(r[8]||'').trim();if(!so||!item)return;const key=fgtsJobKey_(so,item);if(!classByJob[key]&&String(r[6]||'').trim())classByJob[key]=String(r[6]).trim();});
    const db=SpreadsheetApp.openById(DATABASE_ID),overrideSheet=db.getSheetByName(JO_OVERRIDE_SHEET);
    if(overrideSheet&&overrideSheet.getLastRow()>1)overrideSheet.getDataRange().getDisplayValues().slice(1).forEach(o=>{const m=String(o[0]||'').match(/^SRC-(\d+)$/),classification=String(o[2]||'').trim();if(!m||!classification)return;const idx=Number(m[1])-classificationStartRow;if(idx<0||idx>=joRows.length)return;const r=joRows[idx],so=String(r[1]||'').trim(),item=String(r[8]||'').trim();if(so&&item)classByJob[fgtsJobKey_(so,item)]=classification;});
  }
  rows.forEach(r=>{
    const so=String(r[4]||'').trim(),item=String(r[6]||'').trim(),received=joDate_(formatCell_(r[2])),finished=joDate_(formatCell_(r[3]));
    if(!so&&!item&&!String(r[9]||'').trim()&&!String(r[10]||'').trim())return;
    const rd=joParseDate_(received),fd=joParseDate_(finished),leadDays=rd&&fd?Math.max(1,Math.round((fd.getTime()-rd.getTime())/86400000)+1):'';
    const rec={'Classification':classByJob[fgtsJobKey_(so,item)]||'Others','Lead Days':leadDays,'Date Received':received,'Date Finish':finished,'S.O. no.':so,'Client':r[5]||'','Item no.':item,'Panel Name':r[7]||'','Qty':Number(String(r[8]||'').replace(/,/g,''))||r[8]||'','FGTS no.':r[9]||'','QC-In Charge':r[10]||'','Remarks':r[11]||'','Category':r[13]||''};
    if(!query||Object.values(rec).join(' ').toLowerCase().includes(query))records.push(rec);
  });
  syncFGTSTransferAllocations_();
  const db=SpreadsheetApp.openById(DATABASE_ID),derived=db.getSheetByName(FGTS_TRANSFER_SHEET);
  if(derived&&derived.getLastRow()>1){
    const h=derived.getRange(1,1,1,derived.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()),ix=n=>h.indexOf(n);
    derived.getDataRange().getValues().slice(1).forEach(r=>{
      const so=String(r[ix('S.O. Number')]||'').trim(),item=String(r[ix('Item Number')]||'').trim(),received=joDate_(formatCell_(r[ix('Date Received')])),finished=joDate_(formatCell_(r[ix('Date Finished')]));
      const rd=joParseDate_(received),fd=joParseDate_(finished),leadDays=rd&&fd?Math.max(1,Math.round((fd.getTime()-rd.getTime())/86400000)+1):'';
      const rec={'Classification':classByJob[fgtsJobKey_(so,item)]||'Others','Lead Days':leadDays,'Date Received':received,'Date Finish':finished,'S.O. no.':so,'Client':r[ix('Client Name')]||'','Item no.':item,'Panel Name':r[ix('Panel Name')]||'','Qty':Number(r[ix('Allocated Quantity')])||0,'FGTS no.':r[ix('FGTS Number')]||'','QC-In Charge':r[ix('QC In Charge')]||'','Remarks':r[ix('Remarks')]||'','Category':r[ix('Category')]||''};
      if(!query||Object.values(rec).join(' ').toLowerCase().includes(query))records.push(rec);
    });
  }
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
  if(value&&!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Enter a valid Date Finished.');
  let header=details.getLastColumn()?details.getRange(1,1,1,details.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()):[];
  const findHeader=name=>header.findIndex(v=>v.toLowerCase().replace(/\\s+/g,' ')===name.toLowerCase());
  ['Concern Section','Date Finished','Status','Lead Time'].forEach(name=>{if(findHeader(name)<0){const col=details.getLastColumn()+1;details.getRange(1,col).setValue(name).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');header[col-1]=name;}});
  const sectionCol=findHeader('Concern Section')+1,finishedCol=findHeader('Date Finished')+1,statusCol=findHeader('Status')+1,leadCol=findHeader('Lead Time')+1;
  const rows=details.getDataRange().getValues(),sectionRows=[];
  for(let i=1;i<rows.length;i++)if(String(rows[i][1])===caseId&&String(rows[i][sectionCol-1]||'Unassigned')===section)sectionRows.push({row:i+1,data:rows[i]});
  if(!sectionRows.length)throw new Error('No descriptions found for this Concern Section.');
  const closedAt=new Date();
  sectionRows.forEach(x=>{details.getRange(x.row,finishedCol).setValue(value?new Date(value+'T12:00:00'):'');details.getRange(x.row,statusCol).setValue(value?'Closed':'Open');const closedCol=findHeader('Closed At')+1;if(closedCol)details.getRange(x.row,closedCol).setValue(value?closedAt:'');});
  const allClosed=!!value;
  const leadTime=allClosed?reworkLeadTimeDays_(mainData[3],value):'';
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

function ensureTransferAllocationColumns_(sh) {
  const headers=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getDisplayValues()[0].map(v=>String(v||'').trim());
  ['Allocation Pool Qty','Remaining For Record ID'].forEach(name=>{if(headers.indexOf(name)<0){const col=sh.getLastColumn()+1;sh.getRange(1,col).setValue(name).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');}});
  const allHeaders=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim());
  const poolCol=allHeaders.indexOf('Allocation Pool Qty')+1,qtyCol=allHeaders.indexOf('Qty')+1;
  if(sh.getLastRow()>1){const values=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();values.forEach((row,i)=>{if(row[poolCol-1]===''||row[poolCol-1]==null)sh.getRange(i+2,poolCol).setValue(Number(row[qtyCol-1])||0);});}
}
function syncRemainingTransferRow_(recordId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET),alloc=ss.getSheetByName(ALLOCATION_SHEET);
  if(!sh)return;
  ensureTransferAllocationColumns_(sh);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(v=>String(v||'').trim()),ix=name=>headers.indexOf(name);
  const data=sh.getDataRange().getValues();let parentIndex=-1;
  for(let i=1;i<data.length;i++)if(String(data[i][ix('Record ID')])===String(recordId)){parentIndex=i;break;}
  if(parentIndex<0)return;
  const parent=data[parentIndex],pool=Number(parent[ix('Allocation Pool Qty')])||Number(parent[ix('Qty')])||0;
  const allocations=alloc&&alloc.getLastRow()>1?alloc.getDataRange().getValues().slice(1).filter(a=>String(a[10])===String(recordId)):[];
  const done=allocations.reduce((sum,a)=>sum+(Number(a[4])||0),0),remaining=Math.max(0,pool-done);
  const now=new Date();
  sh.getRange(parentIndex+1,ix('Qty')+1).setValue(done>0?done:pool);
  sh.getRange(parentIndex+1,ix('Allocation Pool Qty')+1).setValue(pool);
  sh.getRange(parentIndex+1,ix('Done Qty')+1).setValue(done);
  sh.getRange(parentIndex+1,ix('Remaining Qty')+1).setValue(remaining);
  sh.getRange(parentIndex+1,ix('Status')+1).setValue(done>0?'Passed':'Ongoing');
  const childRows=[];
  for(let i=1;i<data.length;i++)if(String(data[i][ix('Remaining For Record ID')])===String(recordId))childRows.push(i);
  let reusable=-1;
  childRows.forEach(i=>{
    const childId=String(data[i][ix('Record ID')]),childAlloc=alloc&&alloc.getLastRow()>1?alloc.getDataRange().getValues().slice(1).filter(a=>String(a[10])===childId):[];
    if(!childAlloc.length&&reusable<0)reusable=i;
  });
  if(remaining>0){
    const target=Array(childRows.length?1:0).fill(0);
    if(reusable>=0){
      const rowNo=reusable+1;sh.getRange(rowNo,ix('Qty')+1).setValue(remaining);sh.getRange(rowNo,ix('Allocation Pool Qty')+1).setValue(remaining);
      sh.getRange(rowNo,ix('Updated At')+1).setValue(now);
    } else {
      const child={};headers.forEach((h,j)=>child[h]=parent[j]??'');
      const childId=Utilities.getUuid();
      child['Record ID']=childId;child['Created At']=now;child['Updated At']=now;child['Qty']=remaining;child['Allocation Pool Qty']=remaining;child['Remaining For Record ID']=recordId;
      child['Done Qty']=0;child['Remaining Qty']=remaining;child['QC In Charge']='';child['FGTS No.']='';child['Date Finished']='';child['Status']='Ongoing';child['Reminders']='';
      sh.appendRow(headers.map(h=>child[h]??''));
    }
  } else {
    for(let k=childRows.length-1;k>=0;k--){
      const i=childRows[k],childId=String(data[i][ix('Record ID')]),childAlloc=alloc&&alloc.getLastRow()>1?alloc.getDataRange().getValues().slice(1).filter(a=>String(a[10])===childId):[];
      if(!childAlloc.length)sh.deleteRow(i+1);
    }
  }
}

function getTransferRecords(searchText) {
  const ss=SpreadsheetApp.openById(DATABASE_ID), sh=ss.getSheetByName(TRANSFER_SHEET), allocSh=ss.getSheetByName(ALLOCATION_SHEET);
  if(!sh) return {ok:true,records:[],fields:TRANSFER_HEADERS};
  ensureTransferAllocationColumns_(sh);
  if(allocSh&&allocSh.getLastRow()>1)migrateAllocationRecordIds_(sh,allocSh);
  const vals=sh.getDataRange().getValues(), allocations=allocSh&&allocSh.getLastRow()>1?allocSh.getDataRange().getValues().slice(1):[];
  const allocationsByRecord=Object.create(null);
  allocations.forEach(a=>{const id=String(a[10]||'');if(id)(allocationsByRecord[id]||(allocationsByRecord[id]=[])).push(a);});
  const query=String(searchText||'').trim().toLowerCase(), records=[];
  for(let i=1;i<vals.length;i++){
    if(!vals[i][0])continue;
    const obj={}; TRANSFER_HEADERS.forEach((h,j)=>obj[h]=h==='Time Received'?formatTimeCell_(vals[i][j]):formatCell_(vals[i][j]));
    const recordId=String(obj['Record ID']||'');
    const linked=allocationsByRecord[recordId]||[];
    const done=linked.reduce((sum,a)=>sum+(Number(a[4])||0),0);
    obj['Done Qty']=done;
    obj['Remaining Qty']=Math.max(0,(Number(obj['Qty'])||0)-done);
    obj['QC In Charge']=[...new Set(linked.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', ');
    obj['FGTS No.']=[...new Set(linked.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', ');
    obj['Date Finished']=latestFinishedDate_(linked);
    obj.Category=[...new Set(linked.map(a=>String(a[9]||'').trim()).filter(Boolean))].join(', ');
    const allocationRemarks=[...new Set(linked.map(a=>String(a[6]||'').trim()).filter(Boolean))].join(' | ');if(allocationRemarks)obj.Remarks=allocationRemarks;
    if(['Ongoing','Hold','For line up'].includes(String(obj.Status)) && obj['Date Received']){
      const received=new Date(obj['Date Received']); const days=Math.floor((new Date().setHours(0,0,0,0)-received.setHours(0,0,0,0))/86400000);
      obj.Reminders=days>=REMINDER_AFTER_DAYS?'DELAYED ('+days+' days)':'';
    } else obj.Reminders='';
    if(!query||Object.values(obj).join(' ').toLowerCase().includes(query))records.push(obj);
  }
  records.reverse(); return {ok:true,records:records,fields:TRANSFER_HEADERS};
}

function getTransferJOOptions(joNumber) {
  const normalize=value=>String(value==null?'':value).replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ').toUpperCase();
  const jo=normalize(joNumber);if(!jo)return {ok:true,matches:[]};
  const source=SpreadsheetApp.openById(JO_SOURCE_ID);
  const sheet=source.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID);
  if(!sheet)throw new Error('Could not find J.O Register source sheet tab gid '+JO_SOURCE_GID+'.');
  const last=sheet.getLastRow();if(last<JO_SOURCE_START_ROW)return {ok:true,matches:[]};
  const found=sheet.getRange(JO_SOURCE_START_ROW,1,last-JO_SOURCE_START_ROW+1,1)
    .createTextFinder(String(joNumber).trim()).matchCase(false).matchEntireCell(true).findAll();
  const seen={};
  found.forEach(cell=>{
    const row=sheet.getRange(cell.getRow(),1,1,8).getDisplayValues()[0];
    if(normalize(row[0])!==jo)return;
    const so=String(row[1]||'').replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ');
    const client=String(row[7]||'').replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ');
    if(!so&&!client)return;
    const key=JSON.stringify([normalize(so),normalize(client)]);
    if(!seen[key])seen[key]={so:so,client:client};
  });
  const pairs=Object.keys(seen).map(key=>seen[key]);
  return {ok:true,matches:pairs.length?[pairs[0]]:[]};
}
function getTransferItemDetails(joNumber,soNumber,itemNumber) {
 const normalize=value=>String(value==null?'':value).replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ').toUpperCase();
 const jo=normalize(joNumber),item=normalize(itemNumber);
 if(!jo||!item)return {ok:true,matches:[]};
 const source=SpreadsheetApp.openById(JO_SOURCE_ID);
 const sheet=source.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID);
 if(!sheet)throw new Error('Could not find J.O Register source sheet tab gid '+JO_SOURCE_GID+'.');
 const last=sheet.getLastRow();if(last<JO_SOURCE_START_ROW)return {ok:true,matches:[]};
 const found=sheet.getRange(JO_SOURCE_START_ROW,1,last-JO_SOURCE_START_ROW+1,1)
   .createTextFinder(String(joNumber).trim()).matchCase(false).matchEntireCell(true).findAll();
 const seen={};
 found.forEach(cell=>{
  const row=sheet.getRange(cell.getRow(),1,1,10).getDisplayValues()[0];
  if(normalize(row[0])!==jo||normalize(row[8])!==item)return;
  const panelName=String(row[9]||'').trim();if(panelName)seen[normalize(panelName)]=panelName;
 });
 return {ok:true,matches:Object.keys(seen).map(key=>({panelName:seen[key]}))};
}
function validateTransferBatchQuantities_(items,sh) {
 const normalize=value=>String(value==null?'':value).replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ').toUpperCase();
 const source=SpreadsheetApp.openById(JO_SOURCE_ID),sourceSheet=source.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID);
 if(!sourceSheet)throw new Error('Could not find J.O Register source sheet.');
 const last=sourceSheet.getLastRow(),original={},pending={},prior={};
 if(last>=JO_SOURCE_START_ROW){
  sourceSheet.getRange(JO_SOURCE_START_ROW,1,last-JO_SOURCE_START_ROW+1,10).getDisplayValues().forEach(row=>{
   const jo=normalize(row[0]),item=normalize(row[8]);if(!jo||!item)return;
   const key=JSON.stringify([jo,item]);original[key]=(original[key]||0)+(Number(String(row[3]||'').replace(/,/g,''))||0);
  });
 }
 const joIdx=TRANSFER_HEADERS.indexOf('J.O'),itemIdx=TRANSFER_HEADERS.indexOf('Item No.'),qtyIdx=TRANSFER_HEADERS.indexOf('Qty');
 if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,TRANSFER_HEADERS.length).getDisplayValues().forEach(row=>{
  const jo=normalize(row[joIdx]),item=normalize(row[itemIdx]);if(!jo||!item)return;
  const key=JSON.stringify([jo,item]);prior[key]=(prior[key]||0)+(Number(String(row[qtyIdx]||'').replace(/,/g,''))||0);
 });
 items.forEach((item,i)=>{
  const jo=normalize(item['J.O']),itemNo=normalize(item['Item No.']),qty=Number(item.Qty)||0;
  if(!jo||!itemNo)throw new Error('J.O. and Item No. are required for row '+(i+1)+'.');
  const key=JSON.stringify([jo,itemNo]);
  if(!original[key])throw new Error('J.O. '+item['J.O']+' / Item '+item['Item No.']+' was not found in the J.O Register.');
  pending[key]=(pending[key]||0)+qty;
 });
 Object.keys(pending).forEach(key=>{
  const total=(prior[key]||0)+pending[key],limit=original[key];
  if(total>limit)throw new Error('Cannot save: total transfer Qty ('+total+') exceeds the original J.O Register Qty ('+limit+') for this J.O. and Item No.');
 });
}


function reserveTransferIds_(count,sh) {
 const lock=LockService.getScriptLock();lock.waitLock(10000);
 try {
  const year='2027',propertyKey='QAQC_TRANSFER_ID_SEQ_'+year,props=PropertiesService.getScriptProperties();
  let max=Number(props.getProperty(propertyKey)||0)||0;
  if(sh&&sh.getLastRow()>1){
   const idx=TRANSFER_HEADERS.indexOf('Transfer ID')+1;
   sh.getRange(2,idx,sh.getLastRow()-1,1).getDisplayValues().forEach(row=>{
    const parts=String(row[0]||'').trim().split('-');
    if(parts.length===3&&parts[0]==='TID'&&parts[1]===year){const seq=Number(parts[2]);if(Number.isFinite(seq))max=Math.max(max,seq);}
   });
  }
  const first=max+1;props.setProperty(propertyKey,String(max+count));
  return Array.from({length:count},(_,i)=>'TID-'+year+'-'+String(first+i).padStart(2,'0'));
 } finally {lock.releaseLock();}
}

function validateTransferEditQuantity_(input,recordId,transferSheet) {
 const normalize=value=>String(value==null?'':value).replace(/\u00a0/g,' ').trim().replace(/\s+/g,' ').toUpperCase();
 const jo=normalize(input['J.O']),item=normalize(input['Item No.']),qty=Number(input.Qty)||0;
 if(!jo||!item)return;
 const source=SpreadsheetApp.openById(JO_SOURCE_ID);
 const sourceSheet=source.getSheets().find(s=>s.getSheetId()===JO_SOURCE_GID);
 if(!sourceSheet)throw new Error('Could not find J.O Register source sheet.');
 const last=sourceSheet.getLastRow();let original=0;
 if(last>=JO_SOURCE_START_ROW){
  const matches=sourceSheet.getRange(JO_SOURCE_START_ROW,1,last-JO_SOURCE_START_ROW+1,1).createTextFinder(String(input['J.O']).trim()).matchCase(false).matchEntireCell(true).findAll();
  matches.forEach(cell=>{
   const row=sourceSheet.getRange(cell.getRow(),1,1,10).getDisplayValues()[0];
   if(normalize(row[0])===jo&&normalize(row[8])===item)original+=Number(String(row[3]||'').replace(/,/g,''))||0;
  });
 }
 if(!original)throw new Error('J.O. '+input['J.O']+' / Item '+input['Item No.']+' was not found in the J.O Register.');
 const headers=TRANSFER_HEADERS,joIdx=headers.indexOf('J.O'),itemIdx=headers.indexOf('Item No.'),qtyIdx=headers.indexOf('Qty'),idIdx=headers.indexOf('Record ID');
 let prior=0;
 if(transferSheet.getLastRow()>1){
  transferSheet.getRange(2,1,transferSheet.getLastRow()-1,headers.length).getDisplayValues().forEach(row=>{
   if(String(row[idIdx])===String(recordId))return;
   if(normalize(row[joIdx])===jo&&normalize(row[itemIdx])===item)prior+=Number(String(row[qtyIdx]||'').replace(/,/g,''))||0;
  });
 }
 if(prior+qty>original)throw new Error('Cannot save edit: total transfer Qty ('+(prior+qty)+') exceeds the original J.O Register Qty ('+original+') for this J.O. and Item No.');
}

function saveTransfer(input) {
  if(!input)throw new Error('No transfer details received.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  ensureTransferAllocationColumns_(sh);
  const qty=Number(input.Qty);
  if(!isFinite(qty)||qty<=0)throw new Error('Qty must be greater than zero.');
  const id=String(input['Record ID']||''), now=new Date(); let row=-1,old=null;
  if(id){const lastRow=sh.getLastRow();if(lastRow>1){const match=sh.getRange(2,1,lastRow-1,1).createTextFinder(id).matchEntireCell(true).findNext();if(match){row=match.getRow();old=sh.getRange(row,1,1,TRANSFER_HEADERS.length).getValues()[0];}}if(row<0)throw new Error('Transfer record not found. Refresh and try again.');}
  const recordId=id||Utilities.getUuid(),transferId=old?String(old[3]):reserveTransferIds_(1,sh)[0];
  if(old)validateTransferEditQuantity_(input,id,sh);
  const linkedAllocations=old?getAllocationRows_(id):[];
  const alreadyAllocated=linkedAllocations.reduce((sum,a)=>sum+(Number(a[4])||0),0);
  if(alreadyAllocated>qty)throw new Error('The new transfer Qty cannot be less than the already allocated quantity ('+alreadyAllocated+').');
  if(String(input.Status||'')==='Passed'&&alreadyAllocated<qty)throw new Error('Status cannot be Passed until Done Qty meets the required Qty.');
  const inputObj=Object.assign({},input,{'Transfer ID':transferId,'Done Qty':alreadyAllocated,'Remaining Qty':qty-alreadyAllocated,'QC In Charge':[...new Set(linkedAllocations.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', '),'FGTS No.':[...new Set(linkedAllocations.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', '),'Date Finished':latestFinishedDate_(linkedAllocations),'Status Remark':Object.prototype.hasOwnProperty.call(input,'Status Remark')?input['Status Remark']:(old?old[21]:''),'Remarks':Object.prototype.hasOwnProperty.call(input,'Remarks')?input['Remarks']:(old?old[22]:''),'Reminders':'','Allocation Pool Qty':qty,'Remaining For Record ID':old?String(old[TRANSFER_HEADERS.indexOf('Remaining For Record ID')]||''):''});
  if(old && !String(input['Time Received']||'').trim()) inputObj['Time Received']=formatTimeCell_(old[5]);
  const out=TRANSFER_HEADERS.map((h,j)=>h==='Record ID'?recordId:h==='Created At'?(old?old[1]:now):h==='Updated At'?now:(inputObj[h]??''));
  if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  if(old)syncTransferSummary_(recordId,linkedAllocations);
  syncRemainingTransferRow_(recordId);
  if(!old){const last=sh.getLastRow();sh.getRange(last,TRANSFER_HEADERS.indexOf('Allocation Pool Qty')+1).setValue(qty);}
  syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
  return {ok:true,recordId:recordId,transferId:transferId,message:row>0?'Transfer updated.':'Transfer saved.'};
}

function saveTransfersBatch(common, items) {
 if(!common||!Array.isArray(items)||items.length<1)throw new Error('Add at least one J.O. and item row to save.');
 if(String(common['Record ID']||''))throw new Error('Multi-row save is only available when adding a new transfer.');
 const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
 if(!sh)throw new Error('Click Prepare Database first.');
 ensureTransferAllocationColumns_(sh);
 items.forEach((item,i)=>{
  if(!String(item['J.O']||'').trim())throw new Error('J.O. is required for row '+(i+1)+'.');
  if(!String(item['Item No.']||'').trim())throw new Error('Item No. is required for row '+(i+1)+'.');
  if(!isFinite(Number(item.Qty))||Number(item.Qty)<=0)throw new Error('Row '+(i+1)+' Qty must be greater than zero.');
 });
 validateTransferBatchQuantities_(items,sh);
 const now=new Date(),rows=[],transferId=reserveTransferIds_(1,sh)[0];
 const status=String(common.Status||'Ongoing')==='Passed'?'Ongoing':(common.Status||'Ongoing');
 items.forEach(item=>{
  const recordId=Utilities.getUuid();
  const input=Object.assign({},common,item,{'Record ID':recordId,'Created At':now,'Updated At':now,'Transfer ID':transferId,'Status':status,'Done Qty':0,'Remaining Qty':Number(item.Qty)||0,'QC In Charge':'','FGTS No.':'','Date Finished':'','Reminders':'','Allocation Pool Qty':Number(item.Qty)||0,'Remaining For Record ID':''});
  rows.push(TRANSFER_HEADERS.map(header=>input[header]??''));
 });
 sh.getRange(sh.getLastRow()+1,1,rows.length,TRANSFER_HEADERS.length).setValues(rows);
 syncFGTSTransferAllocations_();
 invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
 return {ok:true,count:rows.length,transferId:transferId,message:'Saved '+rows.length+' detail row(s) under '+transferId+'.'};
}

function saveAdditionalTransfersBatch(common, items) {
  if(!Array.isArray(items))items=[];
  if(!items.length)items=[{}];
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh)throw new Error('Click Prepare Database first.');
  ensureTransferAllocationColumns_(sh);
  const now=new Date(),saved=[],reservedIds=reserveTransferIds_(items.length,sh);
  items.forEach((item,index)=>{
    const transferId=reservedIds[index],recordId=Utilities.getUuid();
    const inputObj=Object.assign({},common,item,{'Record ID':recordId,'Created At':now,'Updated At':now,'Transfer ID':transferId,'Done Qty':0,'Remaining Qty':Number(item.Qty)||0,'QC In Charge':'','FGTS No.':'','Date Finished':'','Reminders':'','Status':String(common.Status||'Ongoing'),'Allocation Pool Qty':Number(item.Qty)||0,'Remaining For Record ID':''});
    const out=TRANSFER_HEADERS.map(h=>h==='Record ID'?recordId:h==='Created At'||h==='Updated At'?now:(inputObj[h]??''));
    sh.appendRow(out);saved.push(transferId);
  });
  syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
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

function saveAllocationsBatch(recordId, common, entries) {
  if(!recordId||!common||!Array.isArray(entries))throw new Error('Transfer Record ID and allocation details are required.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),transfer=ss.getSheetByName(TRANSFER_SHEET),sh=ss.getSheetByName(ALLOCATION_SHEET);
  if(!transfer||!sh)throw new Error('Click Prepare Database first.');
  migrateAllocationRecordIds_(transfer,sh);
  const tr=transfer.getDataRange().getValues().find((r,i)=>i>0&&String(r[0])===String(recordId));
  if(!tr)throw new Error('Parent transfer record not found.');
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],idx=name=>headers.indexOf(name);
  const fgts=String(common['FGTS No.']||'').trim(),category=String(common.Category||'').trim(),remarks=String(common['Allocation Remarks']||'').trim();
  if(!fgts)throw new Error('FGTS No. is required.');
  const rows=sh.getDataRange().getValues();
  if(!entries.length&&!common['Replace All']){
    const matches=[];
    for(let i=1;i<rows.length;i++)if(String(rows[i][idx('Transfer Record ID')])===String(recordId))matches.push({row:i+1,values:rows[i].slice()});
    if(!matches.length)throw new Error('Click + Add QC, then enter QC In Charge and Qty for at least one allocation.');
    const now=new Date();
    matches.forEach(item=>{sh.getRange(item.row,idx('FGTS No.')+1).setValue(fgts);sh.getRange(item.row,idx('Date Finished')+1).setValue(common['Date Finished']||'');sh.getRange(item.row,idx('Allocation Remarks')+1).setValue(remarks);sh.getRange(item.row,idx('Updated At')+1).setValue(now);sh.getRange(item.row,idx('Category')+1).setValue(category);});
    syncTransferSummary_(recordId);syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
    return {ok:true,message:'Allocation details updated.'};
  }
  const cleaned=entries.map(e=>({id:String(e['Allocation ID']||''),qc:String(e['QC In Charge']||'').trim(),qty:Number(e.Qty)}));
  cleaned.forEach(e=>{if(!e.qc)throw new Error('QC In Charge is required for every row.');if(!isFinite(e.qty)||e.qty<=0)throw new Error('Every QC Qty must be greater than zero.');});
  const keepIds=cleaned.map(e=>e.id).filter(Boolean);
  const existingTotal=rows.slice(1).reduce((sum,r)=>sum+(String(r[idx('Transfer Record ID')])===String(recordId)&&!keepIds.includes(String(r[idx('Allocation ID')]))?(Number(r[idx('Qty')])||0):0),0);
  const incomingTotal=cleaned.reduce((sum,e)=>sum+e.qty,0);
  if(existingTotal+incomingTotal>Number(tr[13]))throw new Error('Total allocated quantity ('+(existingTotal+incomingTotal)+') cannot exceed transfer Qty ('+tr[13]+').');
  const now=new Date();
  cleaned.forEach(e=>{
    let row=-1,old=null;
    if(e.id){for(let i=1;i<rows.length;i++)if(String(rows[i][idx('Allocation ID')])===e.id&&String(rows[i][idx('Transfer Record ID')])===String(recordId)){row=i+1;old=rows[i];break;}if(row<0)throw new Error('Allocation not found. Refresh and try again.');}
    const aid=e.id||Utilities.getUuid();
    const out=headers.map(h=>h==='Allocation ID'?aid:h==='Transfer ID'?tr[3]:h==='Transfer Record ID'?recordId:h==='QC In Charge'?e.qc:h==='FGTS No.'?fgts:h==='Qty'?e.qty:h==='Date Finished'?(common['Date Finished']||''):h==='Allocation Remarks'?remarks:h==='Created At'?(old?old[idx('Created At')]:now):h==='Updated At'?now:h==='Category'?category:'');
    if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  });
  if(common['Replace All']){for(let i=rows.length-1;i>=1;i--)if(String(rows[i][idx('Transfer Record ID')])===String(recordId)&&!keepIds.includes(String(rows[i][idx('Allocation ID')])))sh.deleteRow(i+1);}
  syncTransferSummary_(recordId);syncRemainingTransferRow_(recordId);syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
  return {ok:true,message:common['Replace All']?'QC allocation changes saved.':(keepIds.length?'QC allocation changes saved.':'All QC allocations saved.')};
}

function ensureAllocationCategoryColumn_(sh) {
  const lastCol=Math.max(sh.getLastColumn(),1);
  const headers=sh.getRange(1,1,1,lastCol).getDisplayValues()[0].map(v=>String(v||'').trim());
  ['Category','Transfer Record ID'].forEach(name=>{
    if(headers.indexOf(name)<0){const col=sh.getLastColumn()+1;sh.getRange(1,col).setValue(name).setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');}
  });
}
function migrateAllocationRecordIds_(transfer,alloc) {
  ensureAllocationCategoryColumn_(alloc);
  const t=transfer.getDataRange().getValues(),a=alloc.getDataRange().getValues();
  const transferCol=TRANSFER_HEADERS.indexOf('Transfer ID'),recordCol=TRANSFER_HEADERS.indexOf('Record ID');
  const byTransfer={};
  for(let i=1;i<t.length;i++){const tid=String(t[i][transferCol]||'');if(tid)(byTransfer[tid]||(byTransfer[tid]=[])).push(String(t[i][recordCol]||''));}
  const headers=alloc.getRange(1,1,1,alloc.getLastColumn()).getDisplayValues()[0];
  const recordIdCol=headers.indexOf('Transfer Record ID');
  let migrated=0,ambiguous=0;
  for(let i=1;i<a.length;i++){
    if(String(a[i][recordIdCol]||''))continue;
    const tid=String(a[i][1]||''),matches=byTransfer[tid]||[];
    if(matches.length===1&&matches[0]){alloc.getRange(i+1,recordIdCol+1).setValue(matches[0]);migrated++;}
    else if(matches.length>1)ambiguous++;
  }
  return {migrated:migrated,ambiguous:ambiguous};
}

function updateAllocationRemarksOnly(recordId, remarks) {
  if(!recordId)throw new Error('Transfer Record ID is required.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(ALLOCATION_SHEET),transfer=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh||sh.getLastRow()<2)throw new Error('No saved QC allocations were found for this transfer.');
  migrateAllocationRecordIds_(transfer,sh);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
  const recordCol=headers.indexOf('Transfer Record ID'),remarksCol=headers.indexOf('Allocation Remarks'),updatedCol=headers.indexOf('Updated At');
  const values=sh.getDataRange().getValues(),now=new Date();let updated=0;
  for(let i=1;i<values.length;i++){
    if(String(values[i][recordCol])!==String(recordId))continue;
    sh.getRange(i+1,remarksCol+1).setValue(String(remarks||'').trim());
    if(updatedCol>=0)sh.getRange(i+1,updatedCol+1).setValue(now);
    updated++;
  }
  if(!updated)throw new Error('No saved QC allocations were found for this transfer.');
  syncTransferSummary_(recordId);
  syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
  return {ok:true,message:'Allocation Remarks updated successfully.'};
}

function getAllocations(recordId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(ALLOCATION_SHEET),transfer=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh||sh.getLastRow()<2)return {ok:true,allocations:[]};
  migrateAllocationRecordIds_(transfer,sh);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],idx=name=>headers.indexOf(name);
  const rows=sh.getDataRange().getValues().slice(1).filter(r=>String(r[idx('Transfer Record ID')])===String(recordId));
  return {ok:true,allocations:rows.map(r=>({'Allocation ID':r[idx('Allocation ID')],'Transfer ID':r[idx('Transfer ID')],'QC In Charge':r[idx('QC In Charge')],'FGTS No.':r[idx('FGTS No.')],'Qty':r[idx('Qty')],'Date Finished':formatCell_(r[idx('Date Finished')]),'Allocation Remarks':r[idx('Allocation Remarks')],Category:r[idx('Category')]||''}))};
}

function saveAllocation(recordId,input) {
  if(!recordId||!input)throw new Error('Transfer Record ID and allocation details are required.');
  const ss=SpreadsheetApp.openById(DATABASE_ID),transfer=ss.getSheetByName(TRANSFER_SHEET),sh=ss.getSheetByName(ALLOCATION_SHEET);
  if(!transfer||!sh)throw new Error('Click Prepare Database first.');
  migrateAllocationRecordIds_(transfer,sh);
  const tr=transfer.getDataRange().getValues().find((r,i)=>i>0&&String(r[0])===String(recordId));
  if(!tr)throw new Error('Parent transfer record not found.');
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],idx=name=>headers.indexOf(name);
  const qc=String(input['QC In Charge']||'').trim(),fgts=String(input['FGTS No.']||'').trim(),qty=Number(input.Qty);
  if(!qc)throw new Error('QC In Charge is required.');
  if(!fgts)throw new Error('FGTS No. is required.');
  if(!isFinite(qty)||qty<=0)throw new Error('Allocation Qty must be greater than zero.');
  const rows=sh.getDataRange().getValues(),id=String(input['Allocation ID']||'');let row=-1;
  if(id){for(let i=1;i<rows.length;i++)if(String(rows[i][idx('Allocation ID')])===id&&String(rows[i][idx('Transfer Record ID')])===String(recordId)){row=i+1;break;}if(row<0)throw new Error('Allocation not found. Refresh and try again.');}
  const existingTotal=rows.slice(1).reduce((sum,r)=>sum+(String(r[idx('Transfer Record ID')])===String(recordId)&&String(r[idx('Allocation ID')])!==id?(Number(r[idx('Qty')])||0):0),0);
  if(existingTotal+qty>Number(tr[13]))throw new Error('Total allocated quantity ('+(existingTotal+qty)+') cannot exceed transfer Qty ('+tr[13]+').');
  const now=new Date(),aid=id||Utilities.getUuid(),out=headers.map(h=>h==='Allocation ID'?aid:h==='Transfer ID'?tr[3]:h==='Transfer Record ID'?recordId:h==='QC In Charge'?qc:h==='FGTS No.'?fgts:h==='Qty'?qty:h==='Date Finished'?(input['Date Finished']||''):h==='Allocation Remarks'?(input['Allocation Remarks']||''):h==='Created At'?(row>0?rows[row-1][idx('Created At')]:now):h==='Updated At'?now:h==='Category'?(input.Category||''):'');
  if(row>0)sh.getRange(row,1,1,out.length).setValues([out]);else sh.appendRow(out);
  syncTransferSummary_(recordId);syncRemainingTransferRow_(recordId);
  syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
  return {ok:true,message:row>0?'QC allocation updated.':'QC allocation saved.'};
}

function deleteAllocation(recordId,allocationId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(ALLOCATION_SHEET),transfer=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh)throw new Error('Allocation sheet not found.');
  migrateAllocationRecordIds_(transfer,sh);
  const rows=sh.getDataRange().getValues(),headers=rows[0].map(v=>String(v||'').trim()),recordCol=headers.indexOf('Transfer Record ID');
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(allocationId)&&String(rows[i][recordCol])===String(recordId)){sh.deleteRow(i+1);syncTransferSummary_(recordId);syncRemainingTransferRow_(recordId);syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');return {ok:true,message:'Allocation deleted.'};}
  throw new Error('Allocation not found.');
}

function deleteTransfer(recordId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET),alloc=ss.getSheetByName(ALLOCATION_SHEET);
  if(!sh)throw new Error('Transfer sheet not found.');
  const rows=sh.getDataRange().getValues();let transferId='',row=-1;
  for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(recordId)){row=i+1;transferId=String(rows[i][3]);break;}
  if(row<0)throw new Error('Transfer record not found.');
  if(alloc&&alloc.getLastRow()>1){migrateAllocationRecordIds_(sh,alloc);const a=alloc.getDataRange().getValues(),headers=a[0].map(v=>String(v||'').trim()),recordCol=headers.indexOf('Transfer Record ID');for(let i=a.length-1;i>=1;i--)if(String(a[i][recordCol])===String(recordId))alloc.deleteRow(i+1);}
  sh.deleteRow(row);
  syncFGTSTransferAllocations_();
  invalidateModuleCache_('Transfer Monitoring','J.O Register','FGTS Monitoring');
  return {ok:true,message:'Transfer record and its linked QC allocations were deleted.'};
}

function getAllocationRows_(recordId) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(ALLOCATION_SHEET),transfer=ss.getSheetByName(TRANSFER_SHEET);
  if(!sh||sh.getLastRow()<2)return [];
  migrateAllocationRecordIds_(transfer,sh);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0],recordCol=headers.indexOf('Transfer Record ID');
  return sh.getDataRange().getValues().slice(1).filter(r=>String(r[recordCol])===String(recordId));
}

function syncTransferSummary_(recordId,allocationRows) {
  const ss=SpreadsheetApp.openById(DATABASE_ID),sh=ss.getSheetByName(TRANSFER_SHEET),allocSh=ss.getSheetByName(ALLOCATION_SHEET);
  const lastRow=sh?sh.getLastRow():0;if(lastRow<2)return;
  const match=sh.getRange(2,1,lastRow-1,1).createTextFinder(String(recordId)).matchEntireCell(true).findNext();
  if(!match)return;
  const rowIndex=match.getRow(),tr=sh.getRange(rowIndex,1,1,TRANSFER_HEADERS.length).getValues()[0],allocs=Array.isArray(allocationRows)?allocationRows:getAllocationRows_(recordId);
  const done=allocs.reduce((sum,a)=>sum+(Number(a[4])||0),0);
  const qc=[...new Set(allocs.map(a=>String(a[2]||'').trim()).filter(Boolean))].join(', ');
  const fgts=[...new Set(allocs.map(a=>String(a[3]||'').trim()).filter(Boolean))].join(', ');
  const finished=latestFinishedDate_(allocs),qty=Number(tr[13])||0;
  sh.getRange(rowIndex,17,1,5).setValues([[done,Math.max(0,qty-done),qc,fgts,finished]]);
  const allocationRemarks=[...new Set(allocs.map(a=>String(a[6]||'').trim()).filter(Boolean))].join(' | ');if(allocationRemarks)sh.getRange(rowIndex,23).setValue(allocationRemarks);
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
