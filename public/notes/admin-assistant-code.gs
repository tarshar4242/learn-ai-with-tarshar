/**********************************************************************
 * 🏡 行政助手 —— LINE 訊息自動變行程
 * LINE 官方帳號 × Google Gemini × Google 試算表 × Google 日曆
 *
 * 使用方式：只要改下面「設定區」前兩行，其他都不用動。
 * 安裝教學：https://tarshar4242.github.io/kt-sweet-journey/admin-assistant.html
 **********************************************************************/

//══════════ ① 設定區（只改這裡）══════════
const CHANNEL_ACCESS_TOKEN = '請貼上你的 LINE Channel access token';
const GEMINI_API_KEY       = '請貼上你的 Gemini API 金鑰';
const SHEET_NAME       = '行政助手';  // 試算表分頁名稱（沒有會自動建立）
const REMINDER_MINUTES = 120;         // 提前幾分鐘提醒（120 ＝ 前 2 小時）
const DEFAULT_HOURS    = 2.5;         // 沒講結束時間時，行程預設幾小時
//═════════════════════════════════════════

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

/*── LINE 把訊息送進來的大門 ──*/
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    (body.events || []).forEach(handleEvent);
  } catch (err) {
    console.error('doPost 錯誤：' + err);
  }
  return ContentService.createTextOutput('ok');
}

/*── 一則訊息進來後的完整流程 ──*/
function handleEvent(event) {
  if (event.type !== 'message') return;
  const msg = event.message;
  let userText = '';
  let imageBase64 = null;

  if (msg.type === 'text') {
    userText = msg.text;
  } else if (msg.type === 'image') {
    imageBase64 = fetchLineImage(msg.id);          // 截圖也能讀
    userText = '（使用者傳來一張截圖，請直接閱讀圖片裡的內容）';
  } else {
    return;  // 貼圖、語音等其他類型先不處理
  }

  try {
    const result = askGemini(userText, imageBase64);   // AI 判讀
    if (result.action === 'create') {
      const record = saveRecord(result);               // 記錄＋排日曆
      replyFlexCard(event.replyToken, record, false);  // 回確認卡
    } else if (result.action === 'update') {
      const record = updateLastRecord(result);         // 說錯了？改上一筆
      if (record) {
        replyFlexCard(event.replyToken, record, true);
      } else {
        replyText(event.replyToken, '我找不到可以修改的行程耶，直接把整件事再跟我說一次就好～');
      }
    } else {
      // question（資訊不夠，反問）或 chat（純聊天）
      replyText(event.replyToken, result.reply || '收到！有行程要記，直接跟我說就好 😊');
    }
  } catch (err) {
    console.error('handleEvent 錯誤：' + err);
    replyText(event.replyToken, '哎呀，我這邊處理時出了點狀況，再傳一次試試？');
  }
}

/*── 請 Gemini 讀懂訊息（或截圖），拆成一件事 ──*/
function askGemini(userText, imageBase64) {
  const today = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];
  const todayStr = Utilities.formatDate(today, 'Asia/Taipei', 'yyyy-MM-dd');
  const last = getLastRecord();

  const prompt =
    '你是「行政助手」，幫使用者把 LINE 訊息整理成行程。今天是 ' + todayStr + '（星期' + week + '）。\n' +
    (last ? '使用者最近一筆行程（若這次是在修改它，請以它為底、只改掉有講到的部分，其他照舊填回）：' + JSON.stringify(last) + '\n' : '') +
    '請閱讀使用者的訊息（或截圖），只輸出下面格式的 JSON，不要多任何文字：\n' +
    '{"action":"create 或 update 或 question 或 chat",' +
    '"title":"行程標題（誰＋做什麼，例：王房東 出租會面）",' +
    '"date":"yyyy-MM-dd","start":"HH:mm 或空字串","end":"HH:mm 或空字串",' +
    '"location":"地點或空字串","note":"一句話備註或空字串",' +
    '"reply":"要回覆使用者的話（question 或 chat 時使用）"}\n' +
    '判斷規則：\n' +
    '1. 訊息裡有明確的「事情＋日期」→ action 填 create。\n' +
    '2. 訊息是在修改剛才那一筆（例：改成 11 點、地點換一下）→ action 填 update。\n' +
    '3. 想記行程但資訊不夠（連日期都沒有）→ action 填 question，把要反問的話放在 reply。\n' +
    '4. 純聊天、問候 → action 填 chat，reply 放簡短友善的回覆。\n' +
    '5. 「禮拜四」「明天」「下週三」這類說法，換算成今天之後最近的那個日期。\n' +
    '6. 台灣用語，繁體中文。';

  const parts = [{ text: prompt }, { text: '使用者訊息：' + userText }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }

  const res = UrlFetchApp.fetch(GEMINI_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      contents: [{ parts: parts }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0.2 }
    }),
    muteHttpExceptions: true
  });
  const data = JSON.parse(res.getContentText());
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/*── 從 LINE 下載使用者傳的截圖 ──*/
function fetchLineImage(messageId) {
  const res = UrlFetchApp.fetch('https://api-data.line.me/v2/bot/message/' + messageId + '/content', {
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN }
  });
  return Utilities.base64Encode(res.getBlob().getBytes());
}

/*── 試算表：追蹤中樞 ──*/
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['記錄時間', '標題', '日期', '開始', '結束', '地點', '備註', '日曆事件ID', '狀態']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/*── 寫進試算表＋排進 Google 日曆（含提醒）──*/
function saveRecord(r) {
  let end = r.end || '';
  if (r.start) {
    if (!end) {
      const s = toDate(r.date, r.start);
      const e2 = new Date(s.getTime() + DEFAULT_HOURS * 60 * 60 * 1000);
      end = Utilities.formatDate(e2, 'Asia/Taipei', 'HH:mm');
    }
  }

  let eventId = '';
  const cal = CalendarApp.getDefaultCalendar();
  if (r.date) {
    let ev;
    if (r.start) {
      ev = cal.createEvent(r.title, toDate(r.date, r.start), toDate(r.date, end),
        { location: r.location || '', description: r.note || '' });
    } else {
      ev = cal.createAllDayEvent(r.title, toDate(r.date, '00:00'),
        { location: r.location || '', description: r.note || '' });
    }
    ev.addPopupReminder(REMINDER_MINUTES);
    eventId = ev.getId();
  }

  const now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
  getSheet().appendRow([now, r.title, r.date, r.start || '', end, r.location || '', r.note || '', eventId, eventId ? '已排入日曆' : '待安排']);

  return { title: r.title, date: r.date, start: r.start || '', end: end, location: r.location || '', note: r.note || '' };
}

/*── 讀最近一筆（給「說錯隨時改」用）──*/
function getLastRecord() {
  const sheet = getSheet();
  const rowN = sheet.getLastRow();
  if (rowN === 1 || rowN === 0) return null;
  const v = sheet.getRange(rowN, 1, 1, 9).getValues()[0];
  return { title: String(v[1]), date: normDate(v[2]), start: normTime(v[3]), end: normTime(v[4]), location: String(v[5]), note: String(v[6]) };
}

/*── 修改最近一筆：舊日曆事件刪掉、整筆重建 ──*/
function updateLastRecord(r) {
  const sheet = getSheet();
  const rowN = sheet.getLastRow();
  if (rowN === 1 || rowN === 0) return null;
  const oldId = String(sheet.getRange(rowN, 8).getValue());
  if (oldId) {
    try { CalendarApp.getEventById(oldId).deleteEvent(); } catch (e) { /* 事件可能已被手動刪掉，略過 */ }
  }
  sheet.deleteRow(rowN);
  return saveRecord(r);
}

/*── 回覆：莫蘭迪綠確認卡 ──*/
function replyFlexCard(replyToken, r, isUpdate) {
  const week = ['日', '一', '二', '三', '四', '五', '六'][toDate(r.date, '00:00').getDay()];
  const dateText = r.date.slice(5).replace('-', '/') + '（週' + week + '）';
  const timeText = r.start ? (r.start + ' – ' + r.end) : '整天（沒講到幾點）';

  const rows = [
    infoRow('日期', dateText),
    infoRow('時間', timeText),
    infoRow('提醒', '前 ' + (REMINDER_MINUTES / 60) + ' 小時')
  ];
  if (r.location) rows.push(infoRow('地點', r.location));
  if (r.note) rows.push(infoRow('備註', r.note));

  const bubble = {
    type: 'bubble',
    styles: { body: { backgroundColor: '#F7F4EC' } },
    body: {
      type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
      contents: [
        {
          type: 'box', layout: 'baseline', spacing: 'sm', contents: [
            { type: 'text', text: '🏡 ' + r.title, weight: 'bold', size: 'md', color: '#2F4858', flex: 7, wrap: true },
            { type: 'text', text: isUpdate ? '✏️ 已改好' : '✏️ 已記錄', size: 'xs', color: '#5F8575', flex: 3, align: 'end' }
          ]
        },
        { type: 'separator', color: '#DFD8C8' },
        { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows },
        { type: 'text', text: '⏰ 已同步更新行事曆', size: 'xs', weight: 'bold', color: '#B0763B' }
      ]
    }
  };

  lineReply(replyToken, [{ type: 'flex', altText: '已記錄：' + r.title + '｜' + dateText + ' ' + timeText, contents: bubble }]);
}

function infoRow(label, value) {
  return {
    type: 'box', layout: 'baseline', spacing: 'sm',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#8AA096', flex: 2 },
      { type: 'text', text: value, size: 'sm', color: '#2F4858', flex: 6, wrap: true }
    ]
  };
}

function replyText(replyToken, text) {
  lineReply(replyToken, [{ type: 'text', text: text }]);
}

function lineReply(replyToken, messages) {
  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    payload: JSON.stringify({ replyToken: replyToken, messages: messages }),
    muteHttpExceptions: true
  });
}

/*── 小工具：把「日期＋時間」組成台灣時區的時間點 ──*/
function toDate(dateStr, timeStr) {
  return new Date(dateStr + 'T' + (timeStr || '00:00') + ':00+08:00');
}
function normDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd');
  return String(v || '');
}
function normTime(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'HH:mm');
  return String(v || '');
}

/**********************************************************************
 * 🧪 測試用：貼好 Gemini 金鑰後，在上方選「測試Gemini」按執行，
 * 下方「執行紀錄」看得到 JSON 就代表 AI 判讀通了（不需要 LINE）。
 **********************************************************************/
function 測試Gemini() {
  const r = askGemini('哥，房東問禮拜四早上 10 點能不能見面談出租細節，地址：台北市中山區民生東路100號5樓', null);
  console.log(JSON.stringify(r, null, 2));
}
