/**
 * QAQC DEPT SYSTEM — Backend foundation
 * Safe setup: this file only reads the configured spreadsheet.
 * It does not create, clear, or modify any sheets or records.
 */

const DATABASE_ID = '1pcXfWZFIcM00EG5_VzDGLK7ERrCL0WOkvjMx-Y2aBSI';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('QAQC Department System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/**
 * Read-only connection check for the new QAQC database.
 */
function getSystemStatus() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DATABASE_ID);
    return {
      ok: true,
      appName: 'QAQC Department System',
      databaseName: spreadsheet.getName(),
      message: 'Connected to database',
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      appName: 'QAQC Department System',
      message: String(error && error.message ? error.message : error)
    };
  }
}
