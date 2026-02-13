const SPREADSHEET_ID = '1vEf6A4p-G9RTYIShkiv5WNLL7NfL_5l0ZQui2nnQ3Wo';
const MAX_CHAR_LENGTH = 1000; // Protection against enormous payloads

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheets()[0];
    const data = e.parameter; 
    
    // 1. SECURITY: Honeypot Check
    // If a bot fills this hidden field, reject the submission silently
    if (data.hp_field && data.hp_field.length > 0) {
      console.warn("Honeypot triggered. Bot blocked.");
      return ContentService.createTextOutput(JSON.stringify({ 'result': 'blocked' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. SECURITY: Sanitization Function
    const sanitize = (val) => {
      if (!val) return '';
      let str = String(val).trim();
      // Block common spreadsheet injection
      if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        str = "'" + str; 
      }
      // Enforce max length
      return str.substring(0, MAX_CHAR_LENGTH);
    };

    // Append Row with sanitized fields
    sheet.appendRow([
      new Date(),
      sanitize(data.name),
      sanitize(data.email),
      sanitize(data.phone),
      sanitize(data.goal),
      sanitize(data.target_customer),
      sanitize(data.frustration),
      sanitize(data.competitor),
      sanitize(data.bandwidth),
      sanitize(data.assets),
      sanitize(data.budget),
      sanitize(data.website),
      sanitize(data.socials)
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error("Submission Error:", error.toString());
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Processing failed' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 1. Open Google Sheets -> Extensions -> Apps Script
// 2. Paste this code and SAVE.
// 3. Click "Deploy" -> "New Deployment"
// 4. Select Type: "Web App"
// 5. Description: "PoppyPages Lead Capture"
// 6. Execute as: "Me"
// 7. Who has access: "Anyone" (CRITICAL)
// 8. Click "Deploy", Authorize Access.
// 9. Copy the "Web App URL" and paste it into script.js
