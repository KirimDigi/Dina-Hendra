/**
 * GOOGLE APPS SCRIPT - RSVP & BUKU UCAPAN PERNIKAHAN DINA & HENDRA
 * 
 * SPREADSHEET ID: 13VV-AQhUDP24W74aLRn50_PTclce9oZE4au8LbmkSeY
 * SHEET NAME: Sheet1
 * 
 * Kolom yang digunakan:
 * 1. Timestamp
 * 2. Nama Tamu
 * 3. Ucapan
 * 4. Konfirmasi Kehadiran
 * 5. Jumlah Tamu
 * 
 * CARA DEPLOY / PASANG:
 * 1. Buka spreadsheet Anda: https://docs.google.com/spreadsheets/d/13VV-AQhUDP24W74aLRn50_PTclce9oZE4au8LbmkSeY/edit
 * 2. Klik menu 'Extensions' (Ekstensi) -> 'Apps Script'.
 * 3. Hapus semua kode default, lalu salin dan tempel (paste) seluruh isi file ini ke editor Apps Script.
 * 4. Klik tombol 'Save' (ikon disket).
 * 5. Klik tombol biru 'Deploy' -> 'New deployment' (Penerapan Baru).
 * 6. Klik ikon gerigi di sebelah 'Select type' -> pilih 'Web app'.
 * 7. Isi form deployment:
 *    - Description: RSVP Dina & Hendra
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- SANGAT PENTING
 * 8. Klik 'Deploy', lalu berikan izin (Authorize Access) jika diminta Google.
 * 9. Salin 'Web App URL' yang berakhiran '/exec' dan gunakan URL tersebut di website.
 */

var SPREADSHEET_ID = "13VV-AQhUDP24W74aLRn50_PTclce9oZE4au8LbmkSeY";
var SHEET_NAME = "Sheet1";

function getSheet() {
  var ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Pastikan baris header sudah ada
  if (sheet.getLastRow() === 0) {
    var headers = ["Timestamp", "Nama Tamu", "Ucapan", "Konfirmasi Kehadiran", "Jumlah Tamu"];
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4b0f28");
    headerRange.setFontColor("#ffffff");
  }
  return sheet;
}

// Menangani permintaan GET (Membaca data ucapan atau submit via GET)
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "read";
    
    // Jika action write via GET
    if (action === "write") {
      var nama = (e.parameter.nama || e.parameter.author || "").trim();
      var ucapan = (e.parameter.ucapan || e.parameter.comment || "").trim();
      var kehadiran = (e.parameter.kehadiran || e.parameter.attendance || "Hadir").trim();
      var jumlah = (e.parameter.jumlah || e.parameter.guest || "1").toString().trim();
      
      if (!nama || !ucapan) {
        return createJsonResponse({ status: "error", message: "Nama dan Ucapan wajib diisi" });
      }
      
      var now = new Date();
      var timeZone = Session.getScriptTimeZone() || "Asia/Jakarta";
      var timestamp = Utilities.formatDate(now, timeZone, "yyyy-MM-dd HH:mm:ss");
      
      var sheet = getSheet();
      sheet.appendRow([timestamp, nama, ucapan, formatKehadiran(kehadiran), jumlah]);
      
      return createJsonResponse({
        status: "success",
        message: "Ucapan berhasil dikirim!",
        data: {
          timestamp: timestamp,
          nama: nama,
          ucapan: ucapan,
          kehadiran: formatKehadiran(kehadiran),
          jumlah: jumlah
        }
      });
    }
    
    // Default: Action READ
    var sheet = getSheet();
    var rows = sheet.getDataRange().getValues();
    var results = [];
    
    if (rows.length > 1) {
      // Baris 0 adalah Header
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (row[1] || row[2]) { // Pastikan ada nama atau ucapan
          var dateVal = row[0];
          var formattedTime = "";
          if (dateVal instanceof Date) {
            formattedTime = Utilities.formatDate(dateVal, Session.getScriptTimeZone() || "Asia/Jakarta", "dd MMM yyyy HH:mm");
          } else {
            formattedTime = String(dateVal || "");
          }
          
          results.push({
            timestamp: formattedTime,
            nama: String(row[1] || "Tamu Undangan"),
            ucapan: String(row[2] || ""),
            kehadiran: String(row[3] || "Hadir"),
            jumlah: String(row[4] || "1")
          });
        }
      }
    }
    
    // Urutkan ucapan terbaru di paling atas
    results.reverse();
    
    return createJsonResponse({
      status: "success",
      total: results.length,
      data: results
    });
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

// Menangani permintaan POST (Mengirim ucapan baru)
function doPost(e) {
  try {
    var params = {};
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else {
      params = e.parameter || {};
    }
    
    var nama = (params.nama || params.author || "").trim();
    var ucapan = (params.ucapan || params.comment || "").trim();
    var kehadiran = (params.kehadiran || params.attendance || "Hadir").trim();
    var jumlah = (params.jumlah || params.guest || "1").toString().trim();
    
    if (!nama || !ucapan) {
      return createJsonResponse({ status: "error", message: "Nama dan Ucapan wajib diisi" });
    }
    
    var now = new Date();
    var timeZone = Session.getScriptTimeZone() || "Asia/Jakarta";
    var timestamp = Utilities.formatDate(now, timeZone, "yyyy-MM-dd HH:mm:ss");
    var formattedDisplayTime = Utilities.formatDate(now, timeZone, "dd MMM yyyy HH:mm");
    
    var sheet = getSheet();
    var kehadiranFormatted = formatKehadiran(kehadiran);
    sheet.appendRow([timestamp, nama, ucapan, kehadiranFormatted, jumlah]);
    
    return createJsonResponse({
      status: "success",
      message: "Terima kasih, ucapan dan konfirmasi kehadiran Anda berhasil disimpan!",
      data: {
        timestamp: formattedDisplayTime,
        nama: nama,
        ucapan: ucapan,
        kehadiran: kehadiranFormatted,
        jumlah: jumlah
      }
    });
    
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

function formatKehadiran(val) {
  var v = String(val).toLowerCase();
  if (v.indexOf("hadir") !== -1 && v.indexOf("tidak") === -1) {
    return "Hadir";
  } else if (v.indexOf("tidak") !== -1 || v === "notpresent") {
    return "Tidak Hadir";
  } else if (v === "present") {
    return "Hadir";
  }
  return val;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
