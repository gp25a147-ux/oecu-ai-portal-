/**
 * moodleSync.js
 * ---------------------------------------------------------------
 * Moodleが公式に提供している「カレンダーエクスポート」機能
 * (iCal URL / .ics ファイル) を使って、本物の課題・予定データを
 * ポータルに取り込むモジュール。
 *
 * なぜこの方式か:
 *  - MoodleにログインID/パスワードを保存させる方式は
 *    情報漏洩リスクが高く、Moodle利用規約にも抵触しうるため不採用。
 *  - iCalエクスポートURLは「読み取り専用トークン付きURL」なので、
 *    仮に流出してもログイン情報そのものは漏れない。
 *  - .icsファイルは通信を一切使わず完全にブラウザ内で処理されるため、
 *    最も安全で確実な方法。
 *
 * このモジュールの責務:
 *  - iCal URLのfetch / .icsファイルの読み込み・パース
 *  - 同期ステータス表示・プログレスバー・エラーハンドリング
 *  - パース結果を app.js の mergeMoodleCalendarEvents() に渡して
 *    実際のタスクリスト(#moodle-tasks-list)・時間割の●印の更新は app.js に一任する
 *    (二重管理を避けるため、タスクの永続化・描画はapp.js側の1箇所に集約)
 * ---------------------------------------------------------------
 */

import { mergeMoodleCalendarEvents } from './app.js';

const STORAGE_KEY_META = 'oecu_moodle_sync_meta_v1';

/* ============================================================
 * 1. ICS (iCalendar) パーサー
 *    外部ライブラリなし・完全自前実装 (Chrome拡張のCSP制約下でも動く)
 * ========================================================== */

/** RFC5545の行アンフォールディング (継続行は先頭が空白/タブ) */
function unfoldICS(rawText) {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const unfolded = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }
  return unfolded;
}

/** ICSのテキストエスケープを解除 (\, \; \n \\) */
function unescapeICSText(value) {
  if (!value) return '';
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** "20260714T090000Z" / "20260714T090000" / "20260714" (VALUE=DATE) を Date に変換 */
function parseICSDateTime(value, isDateOnly) {
  if (!value) return null;
  const v = value.trim();

  if (isDateOnly || /^\d{8}$/.test(v)) {
    const y = +v.slice(0, 4), m = +v.slice(4, 6), d = +v.slice(6, 8);
    return new Date(y, m - 1, d);
  }

  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (z === 'Z') {
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }
  // タイムゾーンIDが指定されているケースもローカル時刻として近似
  return new Date(+y, +mo - 1, +d, +h, +mi, +s);
}

/**
 * ICSテキストをパースしてイベント配列を返す
 * @returns {Array<{uid:string, summary:string, description:string, start:Date, end:Date|null, allDay:boolean}>}
 */
export function parseICS(icsText) {
  const lines = unfoldICS(icsText);
  const events = [];
  let current = null;

  for (const rawLine of lines) {
    if (!rawLine) continue;
    const line = rawLine.trim();

    if (line === 'BEGIN:VEVENT') {
      current = { uid: '', summary: '', description: '', start: null, end: null, allDay: false };
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current && current.start) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const sepIndex = line.indexOf(':');
    if (sepIndex === -1) continue;
    const propPart = line.slice(0, sepIndex); // 例: DTSTART;VALUE=DATE;TZID=...
    const value = line.slice(sepIndex + 1);
    const propName = propPart.split(';')[0].toUpperCase();
    const isDateOnly = /VALUE=DATE(?!-TIME)/i.test(propPart);

    switch (propName) {
      case 'UID':
        current.uid = value;
        break;
      case 'SUMMARY':
        current.summary = unescapeICSText(value);
        break;
      case 'DESCRIPTION':
        current.description = unescapeICSText(value);
        break;
      case 'DTSTART':
        current.start = parseICSDateTime(value, isDateOnly);
        current.allDay = isDateOnly;
        break;
      case 'DTEND':
        current.end = parseICSDateTime(value, isDateOnly);
        break;
      default:
        break;
    }
  }

  return events.filter(e => e.start instanceof Date && !isNaN(e.start));
}

/** 表示・取込対象の期間でイベントを絞り込む (過去3日〜未来60日) */
function filterRelevantEvents(events) {
  const now = new Date();
  const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const future = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  return events.filter(e => e.start >= past && e.start <= future);
}

/* ============================================================
 * 2. 同期メタ情報の永続化 (最終同期時刻・同期元)
 * ========================================================== */

function saveMeta(meta) {
  try {
    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(meta));
  } catch (err) {
    console.error('[moodleSync] メタ情報の保存に失敗:', err);
  }
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_META);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ============================================================
 * 3. UI 更新ヘルパー (同期ステータス・プログレスバーのみ担当)
 * ========================================================== */

function $(id) { return document.getElementById(id); }

function setStatus(text, state) {
  // state: 'idle' | 'syncing' | 'success' | 'error'
  const el = $('moodle-sync-status');
  if (!el) return;
  el.textContent = text;
  const colors = {
    idle: 'var(--text-muted)',
    syncing: 'var(--primary-color)',
    success: 'var(--accent-secondary)',
    error: 'var(--danger-color)',
  };
  el.style.color = colors[state] || colors.idle;
}

function showLoader(show) {
  const loader = $('moodle-sync-loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
  if (!show) setProgress(0);
}

function setProgress(pct) {
  const bar = $('moodle-sync-progress-bar');
  if (bar) bar.style.width = `${pct}%`;
}

/** fetch中の疑似プログレス表示 (実際の進捗は取得できないため段階的に演出) */
function fakeProgressTicker() {
  let pct = 8;
  setProgress(pct);
  const timer = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18, 90);
    setProgress(pct);
  }, 220);
  return () => { clearInterval(timer); setProgress(100); };
}

function formatSyncTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
 * 4. 同期処理本体
 * ========================================================== */

async function syncFromUrl(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    setStatus('URLが不正です', 'error');
    return;
  }

  setStatus('取得中...', 'syncing');
  showLoader(true);
  const stopTicker = fakeProgressTicker();

  try {
    const res = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error('取得内容がiCal形式ではありません');
    }

    const events = filterRelevantEvents(parseICS(text));
    mergeMoodleCalendarEvents(events);

    const meta = { source: 'url', sourceUrl: url, lastSync: new Date().toISOString(), count: events.length };
    saveMeta(meta);
    setStatus(`連携済み（${formatSyncTime(meta.lastSync)}更新・${events.length}件）`, 'success');
  } catch (err) {
    console.error('[moodleSync] URL同期失敗:', err);
    // CORSでブロックされた場合、多くはネットワークエラー(TypeError)として現れる
    const isLikelyCORS = err instanceof TypeError;
    setStatus(
      isLikelyCORS
        ? '取得失敗（CORSブロックの可能性）→ .icsファイルをDLしてドロップしてください'
        : `取得失敗: ${err.message}`,
      'error'
    );
  } finally {
    stopTicker();
    setTimeout(() => showLoader(false), 400);
  }
}

async function syncFromFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.ics')) {
    setStatus('.icsファイルを選択してください', 'error');
    return;
  }

  setStatus('ファイルを読み込み中...', 'syncing');
  showLoader(true);
  const stopTicker = fakeProgressTicker();

  try {
    const text = await file.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error('iCal形式のファイルではありません');
    }
    const events = filterRelevantEvents(parseICS(text));
    mergeMoodleCalendarEvents(events);

    const meta = { source: 'file', fileName: file.name, lastSync: new Date().toISOString(), count: events.length };
    saveMeta(meta);
    setStatus(`連携済み（${formatSyncTime(meta.lastSync)}更新・${events.length}件）`, 'success');
  } catch (err) {
    console.error('[moodleSync] ファイル同期失敗:', err);
    setStatus(`読み込み失敗: ${err.message}`, 'error');
  } finally {
    stopTicker();
    setTimeout(() => showLoader(false), 400);
  }
}

/* ============================================================
 * 5. 初期化・イベント配線
 * ========================================================== */

export function initMoodleSync() {
  const meta = loadMeta();
  if (meta?.lastSync) {
    setStatus(`連携済み（${formatSyncTime(meta.lastSync)}更新・${meta.count ?? 0}件）`, 'success');
  } else {
    setStatus('未連携', 'idle');
  }
  if (meta?.sourceUrl) {
    const urlInput = $('moodle-ical-url');
    if (urlInput) urlInput.value = meta.sourceUrl;
  }

  // --- URL同期ボタン ---
  const syncBtn = $('moodle-ical-sync-btn');
  const urlInput = $('moodle-ical-url');
  if (syncBtn && urlInput) {
    syncBtn.addEventListener('click', () => syncFromUrl(urlInput.value.trim()));
  }

  // --- .ics ドロップゾーン ---
  const dropzone = $('moodle-ics-dropzone');
  const fileInput = $('moodle-ics-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) syncFromFile(file);
      fileInput.value = '';
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files?.[0];
      if (file) syncFromFile(file);
    });
  }
}
