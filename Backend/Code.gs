/**
 * QAQC Department System — first functional foundation
 * Uses only the NEW QAQC MONITORING DATABASE.
 * setupDatabase() creates missing tabs only; it never clears existing data.
 */
const DATABASE_ID = '1pcXfWZFIcM00EG5_VzDGLK7ERrCL0WOkvjMx-Y2aBSI';

const MODULES = {
  'J.O Register': {
    sheet: 'JO Register',
    headers: ['Record ID', 'Created At', 'Updated At', 'J.O No', 'S.O No', 'Customer', 'Item No', 'Description', 'Quantity', 'Date Received', 'Target Date', 'Status', 'Remarks'],
    fields: ['J.O No', 'S.O No', 'Customer', 'Item No', 'Description', 'Quantity', 'Date Received', 'Target Date', 'Status', 'Remarks']
  },
  'FGTS Monitoring': {
    sheet: 'FGTS Monitoring',
    headers: ['Record ID', 'Created At', 'Updated At', 'FGTS No', 'S.O No', 'J.O No', 'QC In Charge', 'Quantity', 'Allocation Date', 'Status', 'Remarks'],
    fields: ['FGTS No', 'S.O No', 'J.O No', 'QC In Charge', 'Quantity', 'Allocation Date', 'Status', 'Remarks']
  },
  'Transfer Monitoring': {
    sheet: 'Transfer Monitoring',
    headers: ['Record ID', 'Created At', 'Updated At', 'Transfer No', 'Date', 'S.O No', 'J.O No', 'Item No', 'Description', 'Total Quantity', 'From Department', 'To Department', 'Status', 'Remarks'],
    fields: ['Transfer No', 'Date', 'S.O No', 'J.O No', 'Item No', 'Description', 'Total Quantity', 'From Department', 'To Department', 'Status', 'Remarks']
  }
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('QAQC Department System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function getSystemStatus() {
  try {
    const ss = SpreadsheetApp.openById(DATABASE_ID);
    const existing = ss.getSheets().map(function(s) { return s.getName(); });
    return {
      ok: true,
      appName: 'QAQC Department System',
      databaseName: ss.getName(),
      existingSheets: existing,
      requiredSheets: Object.keys(MODULES).map(function(k) { return MODULES[k].sheet; }),
      message: 'Database access confirmed. Missing tabs can be prepared safely.'
    };
  } catch (err) {
    return { ok: false, message: String(err && err.message ? err.message : err) };
  }
}

/**
 * Safe initialization: only adds missing tabs and headers.
 * Existing sheets and records are not cleared or rewritten.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const created = [];
  Object.keys(MODULES).forEach(function(name) {
    const cfg = MODULES[name];
    let sh = ss.getSheetByName(cfg.sheet);
    if (!sh) {
      sh = ss.insertSheet(cfg.sheet);
      sh.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, cfg.headers.length)
        .setFontWeight('bold').setBackground('#142b4a').setFontColor('#ffffff');
      created.push(cfg.sheet);
    } else if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
      sh.setFrozenRows(1);
      created.push(cfg.sheet + ' (headers added)');
    }
  });
  return { ok: true, databaseName: ss.getName(), created: created, message: created.length ? 'Database tabs prepared.' : 'Required tabs already exist; no changes were needed.' };
}

function getModuleData(moduleName, searchText) {
  const cfg = getModule_(moduleName);
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const sh = ss.getSheetByName(cfg.sheet);
  if (!sh) return { ok: true, records: [], fields: cfg.fields, message: 'Database not initialized. Use Prepare Database first.' };
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, records: [], fields: cfg.fields };
  const headers = values[0].map(String);
  const query = String(searchText || '').trim().toLowerCase();
  const records = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row[0]) continue;
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = formatCell_(row[i]); });
    if (!query || row.join(' ').toLowerCase().indexOf(query) !== -1) records.push(obj);
  }
  records.reverse();
  return { ok: true, records: records, fields: cfg.fields };
}

function saveRecord(moduleName, input) {
  const cfg = getModule_(moduleName);
  if (!input || typeof input !== 'object') throw new Error('No record data was received.');
  const ss = SpreadsheetApp.openById(DATABASE_ID);
  const sh = ss.getSheetByName(cfg.sheet);
  if (!sh) throw new Error('Database tabs are not ready. Click Prepare Database first.');
  const now = new Date();
  const id = String(input['Record ID'] || '').trim();
  const values = sh.getDataRange().getValues();
  const headers = cfg.headers;
  let targetRow = -1;
  if (id) {
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][0]) === id) { targetRow = r + 1; break; }
    }
    if (targetRow < 0) throw new Error('This record could not be found. Refresh the list and try again.');
  }
  const record = {};
  cfg.fields.forEach(function(field) {
    let value = input[field] == null ? '' : String(input[field]).trim();
    if (field === 'Quantity' || field === 'Total Quantity') {
      if (value !== '' && (!isFinite(Number(value)) || Number(value) < 0)) {
        throw new Error(field + ' must be a valid non-negative number.');
      }
      if (value !== '') value = Number(value);
    }
    record[field] = value;
  });
  const nowText = now;
  const createdAt = targetRow > 0 ? values[targetRow - 1][1] : nowText;
  const updatedAt = nowText;
  const recordId = id || Utilities.getUuid();
  const rowValues = headers.map(function(header) {
    if (header === 'Record ID') return recordId;
    if (header === 'Created At') return createdAt;
    if (header === 'Updated At') return updatedAt;
    return record[header] == null ? '' : record[header];
  });
  if (targetRow > 0) {
    sh.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sh.appendRow(rowValues);
  }
  return { ok: true, recordId: recordId, message: targetRow > 0 ? 'Record updated successfully.' : 'Record saved successfully.' };
}

function getModule_(moduleName) {
  const cfg = MODULES[String(moduleName || '')];
  if (!cfg) throw new Error('Unknown module: ' + moduleName);
  return cfg;
}

function formatCell_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return value == null ? '' : value;
}
