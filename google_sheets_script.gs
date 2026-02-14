const SPREADSHEET_ID = '1vEf6A4p-G9RTYIShkiv5WNLL7NfL_5l0ZQui2nnQ3Wo';
const MAX_CHAR_LENGTH = 5000; 

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  if (action === 'getPosts') {
    const sheet = getOrCreateSheet(ss, 'Posts');
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const posts = data.map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    }).filter(p => p.status === 'published');
    
    return ContentService.createTextOutput(JSON.stringify(posts.reverse()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getPost') {
    const id = e.parameter.id;
    const sheet = getOrCreateSheet(ss, 'Posts');
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const row = data.find(r => String(r[0]) === String(id));
    
    if (row) {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = e.parameter;
    const action = data.action || 'submitLead';

    // Honeypot Check
    if (data.hp_field && data.hp_field.length > 0) {
      return ContentService.createTextOutput(JSON.stringify({ result: 'blocked' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'submitLead') {
      const sheet = ss.getSheets()[0]; // Leads sheet
      const email = sanitize(data.email);
      if (!email) throw new Error("Email required");

      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const emailCol = headers.indexOf('email');
      
      // Find existing row by email
      let rowIndex = -1;
      if (emailCol !== -1) {
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][emailCol] === email) {
            rowIndex = i + 1;
            break;
          }
        }
      }

      const rowValues = headers.map(h => {
        if (h === 'timestamp') return new Date();
        return sanitize(data[h]) || (rowIndex !== -1 ? rows[rowIndex-1][headers.indexOf(h)] : '');
      });

      if (rowIndex !== -1) {
        sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'addPost') {
      const sheet = getOrCreateSheet(ss, 'Posts');
      const id = new Date().getTime();
      sheet.appendRow([
        id, 
        new Date(), 
        sanitize(data.title), 
        sanitize(data.excerpt), 
        sanitize(data.content), 
        'published'
      ]);
      return ContentService.createTextOutput(JSON.stringify({ result: 'success', id: id }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sanitize(val) {
  if (!val) return '';
  let str = String(val).trim();
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str; 
  }
  return str.substring(0, MAX_CHAR_LENGTH);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Posts') {
      sheet.appendRow(['id', 'date', 'title', 'excerpt', 'content', 'status']);
    }
  }
  return sheet;
}
