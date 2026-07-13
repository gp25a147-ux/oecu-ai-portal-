import { askGemini } from './gemini.js';
import { oecuKnowledge } from './oecuKnowledge.js';
import { initMoodleSync } from './moodleSync.js';

// --- シラバスデータベース（授業詳細・テスト対策）---
// ユーザーが時間割登録フォームから登録した授業情報を動的に格納します
const syllabusDataExtended = {};


// --- アプリケーションの状態管理 ---
let currentGrade = localStorage.getItem('oecu_grade') || '2';
let currentYear = localStorage.getItem('oecu_year') || '2026';
let currentTheme = localStorage.getItem('oecu_theme') || 'light';
let apiKey = localStorage.getItem('oecu_apikey') || '';

// 【重要】初期状態の時間割は空にする（Moodle同期によって追加される）
let timetable = JSON.parse(localStorage.getItem('oecu_timetable')) || {};

// 選択中の授業スレッドID（初期は未選択 null）
let activeClassId = localStorage.getItem('oecu_active_class_id') || null;
let activeWeekIndex = 4; // 第5回目

// チャット履歴
let chatThreads = JSON.parse(localStorage.getItem('oecu_chat_threads')) || {};

// 添付ファイルの一時リスト
let attachedFiles = [];

// Moodle課題リマインダーリスト
// (手動コピペ由来のタスクと、Moodleカレンダー(ICS)同期由来のタスク "ics-*" が混在する)
let moodleTasks = JSON.parse(localStorage.getItem('oecu_moodle_tasks')) || [];

// アコーディオンの開閉状態（デフォルトは本日を展開、土日は金曜）
const dayNamesEnglish = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
let todayDayIndex = new Date().getDay();
if (todayDayIndex === 0 || todayDayIndex === 6) todayDayIndex = 5; 
const todayDayKey = dayNamesEnglish[todayDayIndex];

let openDays = JSON.parse(localStorage.getItem('oecu_open_days')) || {
  "mon": todayDayKey === 'mon',
  "tue": todayDayKey === 'tue',
  "wed": todayDayKey === 'wed',
  "thu": todayDayKey === 'thu',
  "fri": todayDayKey === 'fri'
};

// 科目ごとのカラーマップ
const subjectColors = {
  "物理学B": "#10b981", 
  "離散数学": "#6366f1", 
  "コンピュータネットワーク": "#1e3a8a", 
  "C言語プログラミング": "#991b1b", 
  "データベース論": "#854d0e", 
  "情報通信ネットワーク": "#2563eb", 
  "アカデミック・スキルズ": "#10b981", 
  "ゲームデザイン論": "#ea580c", 
  "デジタルゲーム制作": "#dc2626", 
  "データベース基礎": "#854d0e", 
  "キャリア設計": "#8b5cf6", 
  "オペレーティングシステム": "#2563eb" 
};

function getSubjectColor(subject) {
  for (const key of Object.keys(subjectColors)) {
    if (subject.includes(key) || key.includes(subject)) {
      return subjectColors[key];
    }
  }
  return "#71717a";
}

// --- DOM要素のキャッシュ ---
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  closeModal: document.getElementById('close-modal'),
  saveSettings: document.getElementById('save-settings'),
  gradeSelect: document.getElementById('modal-grade'),
  yearSelect: document.getElementById('modal-year'),
  apiKeyInput: document.getElementById('modal-apikey'),
  
  timetableContainer: document.getElementById('timetable'),
  
  chatTitle: document.getElementById('chat-title'),
  chatSubtitle: document.getElementById('chat-subtitle'),
  messagesContainer: document.getElementById('messages-container'),
  chatInput: document.getElementById('chat-input'),
  sendBtn: document.getElementById('send-btn'),
  
  sidebarNewChatBtn: document.getElementById('sidebar-new-chat-btn'),
  
  fileInput: document.getElementById('file-input'),
  attachBtn: document.getElementById('attach-btn'),
  filePreviewContainer: document.getElementById('file-preview-container'),
  
  syllabusPanel: document.getElementById('syllabus-panel'),
  syllabusSelectWeek: document.getElementById('syllabus-select-week'),
  
  moodleTextarea: document.getElementById('moodle-textarea'),
  moodleParseBtn: document.getElementById('moodle-parse-btn')
  // moodle-ical-url / moodle-ical-sync-btn / moodle-ics-dropzone などは
  // moodleSync.js が自己完結で管理するのでここではキャッシュしない
};

// --- 初期化処理 ---
export function initApp() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  elements.gradeSelect.value = currentGrade;
  elements.yearSelect.value = currentYear;
  elements.apiKeyInput.value = apiKey;

  registerEventListeners();

  // Moodleカレンダー(iCal URL / .ics)との本物の連携を初期化
  initMoodleSync();

  renderTimetable();
  
  if (activeClassId && timetable[activeClassId]) {
    selectClass(activeClassId);
  } else {
    showNoClassSelectedState();
  }
  
  renderQuickLinks();
  updateMoodleTasksUI();
}

// --- 授業が未選択の時の画面状態 ---
function showNoClassSelectedState() {
  elements.chatTitle.innerText = "授業を選択してください";
  elements.chatSubtitle.innerText = "時間割から授業を選択するか、Moodleと同期してね";
  
  elements.messagesContainer.innerHTML = '';
  
  const welcomeWrapper = document.createElement('div');
  welcomeWrapper.style.display = 'flex';
  welcomeWrapper.style.flexDirection = 'column';
  welcomeWrapper.style.alignItems = 'center';
  welcomeWrapper.style.justifyContent = 'center';
  welcomeWrapper.style.height = '100%';
  welcomeWrapper.style.color = 'var(--text-muted)';
  welcomeWrapper.style.textAlign = 'center';
  welcomeWrapper.style.padding = '40px';
  welcomeWrapper.style.gap = '15px';

  welcomeWrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-color); opacity: 0.8;">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <h3 style="font-weight: 700; color: var(--text-main); font-size: 1.15rem;">時間割データが空だよ</h3>
    <p style="font-size: 0.85rem; max-width: 320px; line-height: 1.5;">
      右側の「**Moodleから個人データを同期**」ボタンを押して、あなたが履修している時間割データを取り込んでみよう！
    </p>
  `;
  
  elements.messagesContainer.appendChild(welcomeWrapper);
  
  elements.syllabusPanel.innerHTML = `
    <div style="text-align: center; color: var(--text-muted); padding: 20px 0; font-size: 0.8rem;">
      授業を選択すると、ここに今日の講義内容やテスト対策アドバイスが表示されるよ。
    </div>
  `;
}

// --- イベントリスナー登録 ---
function registerEventListeners() {
  elements.themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('oecu_theme', currentTheme);
    updateThemeIcon();
  });

  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('open');
  });
  elements.closeModal.addEventListener('click', () => {
    elements.settingsModal.classList.remove('open');
  });
  elements.saveSettings.addEventListener('click', saveSettingsData);

  elements.sendBtn.addEventListener('click', handleSendMessage);
  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  elements.sidebarNewChatBtn.addEventListener('click', clearCurrentThread);

  elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelection);

  elements.syllabusSelectWeek.addEventListener('change', (e) => {
    activeWeekIndex = parseInt(e.target.value);
    updateSyllabusPanel();
  });

  elements.moodleParseBtn.addEventListener('click', parseMoodleText);

  // 時間割追加ボタン
  document.getElementById('timetable-add-btn')?.addEventListener('click', openTimetableModal);
  document.getElementById('timetable-modal-close')?.addEventListener('click', closeTimetableModal);
  document.getElementById('timetable-modal-save')?.addEventListener('click', saveTimetableEntry);
  document.getElementById('timetable-modal-delete')?.addEventListener('click', deleteTimetableEntry);
  document.getElementById('timetable-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'timetable-modal-overlay') closeTimetableModal();
  });
}


// --- テーマアイコンの更新 ---
function updateThemeIcon() {
  const icon = elements.themeToggle.querySelector('i') || elements.themeToggle;
  if (currentTheme === 'dark') {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
  } else {
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
  }
}

// --- 設定の保存 ---
function saveSettingsData() {
  currentGrade = elements.gradeSelect.value;
  currentYear = elements.yearSelect.value;
  apiKey = elements.apiKeyInput.value;

  localStorage.setItem('oecu_grade', currentGrade);
  localStorage.setItem('oecu_year', currentYear);
  localStorage.setItem('oecu_apikey', apiKey);

  elements.settingsModal.classList.remove('open');
  
  renderTimetable();
  if (activeClassId) {
    selectClass(activeClassId);
  } else {
    showNoClassSelectedState();
  }
  showSystemNotification("設定を更新したよ！");
}

// --- 曜日アコーディオン時間割の描画 ---
function renderTimetable() {
  elements.timetableContainer.innerHTML = '';
  
  const days = [
    { id: 'mon', name: '月曜日' },
    { id: 'tue', name: '火曜日' },
    { id: 'wed', name: '水曜日' },
    { id: 'thu', name: '木曜日' },
    { id: 'fri', name: '金曜日' }
  ];

  days.forEach(day => {
    const subjectsForDay = [];
    for (let period = 1; period <= 5; period++) {
      const classKey = `${day.id}-${period}`;
      const syllabusInfo = syllabusDataExtended[currentYear]?.[currentGrade]?.[classKey];
      const userClass = timetable[classKey];
      
      if (syllabusInfo || userClass) {
        subjectsForDay.push({
          key: classKey,
          period: period,
          subject: syllabusInfo ? syllabusInfo.subject : userClass.subject
        });
      }
    }

    const dayHeader = document.createElement('div');
    dayHeader.className = 'accordion-day-header';
    dayHeader.dataset.day = day.id;

    const arrowSpan = document.createElement('span');
    arrowSpan.className = `accordion-day-arrow ${openDays[day.id] ? 'open' : ''}`;
    arrowSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;

    const nameSpan = document.createElement('span');
    nameSpan.innerText = day.name;

    if (day.id === todayDayKey) {
      const badge = document.createElement('span');
      badge.className = 'day-today-badge';
      badge.innerText = '今日';
      nameSpan.appendChild(badge);
    }

    const countSpan = document.createElement('span');
    countSpan.className = 'day-subjects-count';
    countSpan.innerText = `${subjectsForDay.length}科目`;

    dayHeader.appendChild(arrowSpan);
    dayHeader.appendChild(nameSpan);
    dayHeader.appendChild(countSpan);

    const dayContent = document.createElement('div');
    dayContent.className = `accordion-day-content ${openDays[day.id] ? 'open' : ''}`;
    dayContent.id = `content-${day.id}`;

    subjectsForDay.forEach(sub => {
      const item = document.createElement('div');
      item.className = `sidebar-subject-item ${activeClassId === sub.key ? 'active' : ''}`;
      item.dataset.id = sub.key;

      const colorDot = document.createElement('div');
      colorDot.className = 'subject-color-dot';
      colorDot.style.backgroundColor = getSubjectColor(sub.subject);

      const titleSpan = document.createElement('span');
      titleSpan.className = 'subject-title';
      titleSpan.innerText = sub.subject;

      const periodSpan = document.createElement('span');
      periodSpan.className = 'subject-period-text';
      periodSpan.innerText = `${sub.period}限`;

      const hasTask = moodleTasks.some(t => t.classId === sub.key);
      if (hasTask) {
        const dot = document.createElement('div');
        dot.className = 'subject-task-indicator';
        item.appendChild(dot);
      }

      item.appendChild(colorDot);
      item.appendChild(titleSpan);
      item.appendChild(periodSpan);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectClass(sub.key);
      });

      // ダブルクリックで編集モーダルを開く
      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        openTimetableModal(sub.key);
      });

      dayContent.appendChild(item);
    });

    dayHeader.addEventListener('click', () => {
      const isOpen = dayContent.classList.contains('open');
      openDays[day.id] = !isOpen;
      localStorage.setItem('oecu_open_days', JSON.stringify(openDays));

      if (isOpen) {
        dayContent.classList.remove('open');
        arrowSpan.classList.remove('open');
      } else {
        dayContent.classList.add('open');
        arrowSpan.classList.add('open');
      }
    });

    elements.timetableContainer.appendChild(dayHeader);
    elements.timetableContainer.appendChild(dayContent);
  });

  // ＋ 授業を追加ボタン (サイドバー最下部)
  const addBtn = document.createElement('button');
  addBtn.id = 'timetable-add-btn';
  addBtn.className = 'new-chat-sidebar-btn';
  addBtn.style.cssText = 'margin: 8px 12px; background: transparent; border: 1.5px dashed var(--glass-border); color: var(--text-muted); font-size: 0.8rem;';
  addBtn.innerHTML = '<span style="font-size:1.1rem;margin-right:4px;">＋</span><span>授業を追加</span>';
  addBtn.addEventListener('click', () => openTimetableModal(null));
  elements.timetableContainer.appendChild(addBtn);
}

// --- 授業の選択 ---
function selectClass(classId) {
  activeClassId = classId;
  localStorage.setItem('oecu_active_class_id', classId);
  
  document.querySelectorAll('.sidebar-subject-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.id === classId) {
      item.classList.add('active');
    }
  });

  const syllabusInfo = syllabusDataExtended["2026"]?.[currentGrade]?.[classId];
  const userClass = timetable[classId] || { subject: "空きコマ", teacher: "-", room: "-" };
  const subjectName = syllabusInfo ? syllabusInfo.subject : userClass.subject;

  elements.chatTitle.innerText = subjectName;
  elements.chatSubtitle.innerText = syllabusInfo 
    ? `${syllabusInfo.teacher} | ${syllabusInfo.room}` 
    : `${userClass.teacher} | ${userClass.room}`;

  renderChatHistory(classId);
  updateSyllabusPanel();
}

// --- シラバスパネルの更新 ---
function updateSyllabusPanel() {
  const syllabusInfo = syllabusDataExtended["2026"]?.[currentGrade]?.[activeClassId];
  
  if (!syllabusInfo) {
    elements.syllabusPanel.innerHTML = `
      <div class="syllabus-info">
        <p class="syllabus-item" style="text-align: center; color: var(--text-muted); padding: 20px 0;">
          このコマにはシラバス情報が登録されていないよ。
        </p>
      </div>
    `;
    return;
  }

  if (elements.syllabusSelectWeek.children.length === 0) {
    elements.syllabusSelectWeek.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString();
      opt.innerText = `第 ${i + 1} 回目の授業`;
      elements.syllabusSelectWeek.appendChild(opt);
    }
  }
  elements.syllabusSelectWeek.value = activeWeekIndex.toString();

  const currentWeekTopic = syllabusInfo.weeks[activeWeekIndex] || "講義計画がありません";

  elements.syllabusPanel.innerHTML = `
    <div class="syllabus-info">
      <div class="syllabus-item">
        <span class="syllabus-label">授業科目:</span>
        <div style="font-weight: 700;">${syllabusInfo.subject}</div>
      </div>
      <div class="syllabus-item">
        <span class="syllabus-label">担当教員:</span>
        <div>${syllabusInfo.teacher}</div>
      </div>
      <div class="syllabus-item">
        <span class="syllabus-label">本日の講義内容 (第 ${activeWeekIndex + 1} 回):</span>
        <div style="font-weight: 700; color: var(--primary-color); margin-top: 4px;">
          ${currentWeekTopic}
        </div>
      </div>
      <div class="syllabus-item">
        <span class="syllabus-label">成績評価の方法:</span>
        <div>${syllabusInfo.evaluation}</div>
      </div>
      <div class="syllabus-item">
        <span class="syllabus-label">💡 先輩直伝・テスト対策情報:</span>
        <div class="strategy-box">${syllabusInfo.testStrategy}</div>
      </div>
    </div>
  `;
}

// --- チャット履歴の描画 ---
function renderChatHistory(classId) {
  elements.messagesContainer.innerHTML = '';
  const history = chatThreads[classId] || [];

  if (history.length === 0) {
    const syllabusInfo = syllabusDataExtended["2026"]?.[currentGrade]?.[classId];
    const subjectName = syllabusInfo ? syllabusInfo.subject : (timetable[classId]?.subject || "この授業");
    const welcomeText = `こんにちは！**${subjectName}** の専用AIチャットルームへようこそ。
この授業の課題の書き方、内容、テスト対策について何でもサポートするよ！

添付アイコンからレポートのファイル（画像やPDFなど）を貼ってくれれば、添削やアドバイスもできるからね。質問を投げてみて！`;
    
    appendMessageBubble('ai', welcomeText);
  } else {
    history.forEach(msg => {
      appendMessageBubble(msg.sender, msg.text, msg.files);
    });
  }
  
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function appendMessageBubble(sender, text, files = []) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.width = '100%';

  if (files && files.length > 0) {
    files.forEach(file => {
      const fileCard = document.createElement('div');
      fileCard.className = 'attached-file-bubble';
      fileCard.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
      fileCard.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <span>${file.name} (${Math.round(file.size / 1024)} KB)</span>
      `;
      wrapper.appendChild(fileCard);
    });
  }

  const bubble = document.createElement('div');
  bubble.className = `message-bubble message-${sender}`;
  bubble.innerHTML = parseMarkdown(text);

  wrapper.appendChild(bubble);
  elements.messagesContainer.appendChild(wrapper);
}

function parseMarkdown(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  const lines = html.split('<br>');
  let inList = false;
  let result = [];

  lines.forEach(line => {
    if (line.trim().startsWith('- ')) {
      if (!inList) {
        result.push('<ul style="margin-left: 20px; margin-bottom: 8px;">');
        inList = true;
      }
      result.push(`<li>${line.trim().substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  });
  if (inList) result.push('</ul>');
  
  return result.join('<br>');
}

// --- メッセージ送信 ---
async function handleSendMessage() {
  if (!activeClassId) {
    alert("時間割から授業を選択するか、Moodleと同期してね！");
    return;
  }

  const text = elements.chatInput.value.trim();
  if (text === '' && attachedFiles.length === 0) return;

  appendMessageBubble('user', text, attachedFiles);
  elements.chatInput.value = '';

  const newMsg = {
    sender: 'user',
    text: text,
    files: [...attachedFiles]
  };

  if (!chatThreads[activeClassId]) {
    chatThreads[activeClassId] = [];
  }
  chatThreads[activeClassId].push(newMsg);
  localStorage.setItem('oecu_chat_threads', JSON.stringify(chatThreads));

  renderTimetable();
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;

  const currentAttached = [...attachedFiles];
  attachedFiles = [];
  renderFilePreviews();

  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'message-bubble message-ai';
  loadingBubble.id = 'ai-loading';
  loadingBubble.innerHTML = `<span class="loading-dots">AIが考えています...</span>`;
  elements.messagesContainer.appendChild(loadingBubble);
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;

  const syllabusInfo = syllabusDataExtended["2026"]?.[currentGrade]?.[activeClassId];
  
  const responseText = await askGemini(text, apiKey, {
    currentSubjectInfo: syllabusInfo,
    attachedFiles: currentAttached
  });

  const loader = document.getElementById('ai-loading');
  if (loader) loader.remove();

  appendMessageBubble('ai', responseText);
  
  const aiMsg = {
    sender: 'ai',
    text: responseText
  };
  chatThreads[activeClassId].push(aiMsg);
  localStorage.setItem('oecu_chat_threads', JSON.stringify(chatThreads));
  
  renderTimetable();
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function clearCurrentThread() {
  if (!activeClassId) return;
  if (confirm("この授業のチャット履歴を消去して、新しい会話を始める？")) {
    chatThreads[activeClassId] = [];
    localStorage.setItem('oecu_chat_threads', JSON.stringify(chatThreads));
    renderChatHistory(activeClassId);
    renderTimetable();
  }
}

// --- ファイル選択 ---
function handleFileSelection(e) {
  const files = e.target.files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    const fileObj = {
      name: file.name,
      size: file.size,
      type: file.type,
      textData: '',
      base64Data: ''
    };

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        fileObj.base64Data = event.target.result;
        attachedFiles.push(fileObj);
        renderFilePreviews();
      };
      reader.readAsDataURL(file);
    } 
    else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        fileObj.textData = event.target.result;
        attachedFiles.push(fileObj);
        renderFilePreviews();
      };
      reader.readAsText(file);
    } 
    else {
      fileObj.textData = `[ファイル ${file.name} が添付されました。このファイルは ${file.type} 形式です。AIはレポート添削または問題解説の指示としてこのファイルを処理します。]`;
      attachedFiles.push(fileObj);
      renderFilePreviews();
    }
  }
  elements.fileInput.value = '';
}

function renderFilePreviews() {
  elements.filePreviewContainer.innerHTML = '';
  attachedFiles.forEach((file, idx) => {
    const card = document.createElement('div');
    card.className = 'file-preview-card';
    card.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
      <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
      <button class="btn-remove" data-index="${idx}">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    `;
    card.querySelector('.btn-remove').addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      attachedFiles.splice(index, 1);
      renderFilePreviews();
    });
    elements.filePreviewContainer.appendChild(card);
  });
}

// --- Moodleカレンダー(ICS)由来の本物のデータをタスクリストに統合 ---
// moodleSync.js から、iCal URL / .ics ファイルをパースしたイベント配列を受け取って呼ばれる。
// 時間割(timetable)にある科目名とイベントのタイトルを緩くマッチングして、
// 一致すればその授業に紐付け、一致しなければ「その他の予定」として表示する。
export function mergeMoodleCalendarEvents(events) {
  // 手動コピペ機能(parseMoodleText)由来のタスクは保持し、
  // 前回のICS同期由来のタスク("ics-"プレフィックス)だけを今回の結果で置き換える
  const manualTasks = moodleTasks.filter(t => !t.id.startsWith('ics-'));

  const icsTasks = events.map(e => {
    let matchedClassId = null;
    if (e.summary) {
      for (const key of Object.keys(timetable)) {
        const subj = timetable[key].subject;
        if (subj && (e.summary.includes(subj) || subj.includes(e.summary))) {
          matchedClassId = key;
          break;
        }
      }
    }

    const dueDate = e.allDay
      ? e.start.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : e.start.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    return {
      id: `ics-${e.uid || e.start.getTime()}`,
      classId: matchedClassId,
      subject: matchedClassId ? timetable[matchedClassId].subject : (e.summary || 'Moodleの予定'),
      name: e.summary || '(無題の予定)',
      dueDate,
      _sortTime: e.start.getTime()
    };
  }).sort((a, b) => a._sortTime - b._sortTime);

  moodleTasks = [...manualTasks, ...icsTasks];
  localStorage.setItem('oecu_moodle_tasks', JSON.stringify(moodleTasks));

  updateMoodleTasksUI();
  renderTimetable();
}

// --- Moodleコピペ解析 ---
async function parseMoodleText() {
  const text = elements.moodleTextarea.value.trim();
  if (text === '') return;

  elements.moodleParseBtn.innerText = '解析中...';
  elements.moodleParseBtn.disabled = true;

  let parsedTask = null;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const prompt = `以下のMoodleからコピーされたテキストから、課題の情報をJSON形式で抽出してください。必ずJSONオブジェクトのみを返してください。マークダウンの囲み(\`\`\`json)などは不要です。
期待するフォーマット:
{
  "subject": "抽出した講義名（例: 離散数学）",
  "taskName": "課題名（例: レポート第1回）",
  "dueDate": "締め切り日時（例: 6月25日 23:59）"
}

【テキスト】:
${text}`;
      
      const response = await askGemini(prompt, apiKey);
      let jsonText = response.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
      }
      parsedTask = JSON.parse(jsonText);
    } catch (e) {
      console.error("Moodle Parse Error:", e);
    }
  }

  if (!parsedTask) {
    await new Promise(resolve => setTimeout(resolve, 800));

    let subject = "離散数学";
    let taskName = "第2回 小テスト課題";
    let dueDate = "2026年6月30日 23:59";

    if (text.toLowerCase().includes('物理')) {
      subject = "物理学B";
      taskName = "運動方程式レポート";
    } else if (text.includes('プログラミング') || text.includes('C言語')) {
      subject = "C言語プログラミング";
      taskName = "ポインタと構造体の課題";
    } else if (text.includes('データベース') || text.includes('DB')) {
      subject = "データベース論";
      taskName = "SQLクエリ課題";
    }

    const dateMatch = text.match(/(\d+月\d+日)|(\d{4}\/\d{2}\/\d{2})/);
    if (dateMatch) {
      dueDate = dateMatch[0] + " 23:59";
    }

    parsedTask = { subject, taskName, dueDate };
  }

  let matchedClassId = null;
  for (const key of Object.keys(timetable)) {
    if (parsedTask.subject.toLowerCase().includes(timetable[key].subject.toLowerCase()) || 
        timetable[key].subject.toLowerCase().includes(parsedTask.subject.toLowerCase())) {
      matchedClassId = key;
      break;
    }
  }

  // 同期前で時間割が空の場合、適宜登録
  if (!matchedClassId) {
    showSystemNotification("連携できる授業が時間割にありません。Moodle同期を先に行ってください。");
    elements.moodleTextarea.value = '';
    elements.moodleParseBtn.innerText = 'Moodle課題を連携';
    elements.moodleParseBtn.disabled = false;
    return;
  }

  const newTask = {
    id: Date.now().toString(),
    classId: matchedClassId,
    subject: timetable[matchedClassId]?.subject || parsedTask.subject,
    name: parsedTask.taskName,
    dueDate: parsedTask.dueDate
  };

  moodleTasks.push(newTask);
  localStorage.setItem('oecu_moodle_tasks', JSON.stringify(moodleTasks));
  
  elements.moodleTextarea.value = '';
  elements.moodleParseBtn.innerText = 'Moodle課題を連携';
  elements.moodleParseBtn.disabled = false;

  updateMoodleTasksUI();
  renderTimetable();
  showSystemNotification(`Moodleの『${newTask.name}』を時間割に連携したよ！`);
}

function updateMoodleTasksUI() {
  const container = document.getElementById('moodle-tasks-list');
  if (!container) return;

  if (moodleTasks.length === 0) {
    container.innerHTML = `
      <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 10px 0;">
        現在、登録されているMoodle課題はありません。
      </p>
    `;
    return;
  }

  container.innerHTML = '';
  moodleTasks.forEach(task => {
    const card = document.createElement('div');
    card.style.background = 'rgba(217, 119, 6, 0.05)';
    card.style.border = '1px solid rgba(217, 119, 6, 0.2)';
    card.style.borderRadius = '8px';
    card.style.padding = '8px 10px';
    card.style.fontSize = '0.75rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '4px';
    card.style.position = 'relative';

    card.innerHTML = `
      <div style="font-weight: 700; color: var(--accent-color);">${task.subject}</div>
      <div style="font-weight: 600; color: var(--text-main);">${task.name}</div>
      <div style="color: var(--text-muted); font-size: 0.7rem;">⏳ 締切: ${task.dueDate}</div>
      <button class="btn-remove-task" data-id="${task.id}" style="position: absolute; top: 6px; right: 6px; border:none; background:transparent; color: var(--text-muted); cursor:pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    `;

    card.querySelector('.btn-remove-task').addEventListener('click', (e) => {
      const taskId = e.currentTarget.dataset.id;
      moodleTasks = moodleTasks.filter(t => t.id !== taskId);
      localStorage.setItem('oecu_moodle_tasks', JSON.stringify(moodleTasks));
      updateMoodleTasksUI();
      renderTimetable();
    });

    container.appendChild(card);
  });
}

function renderQuickLinks() {
  const container = document.getElementById('quick-links');
  if (!container) return;

  container.innerHTML = '';
  oecuKnowledge.links.forEach(link => {
    const a = document.createElement('a');
    a.href = link.url;
    a.target = '_blank';
    a.className = 'link-btn';
    a.title = link.desc;
    a.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
      <span>${link.name}</span>
    `;
    container.appendChild(a);
  });
}

function showSystemNotification(msg) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%) translateY(20px)';
  toast.style.background = '#0f3566';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '30px';
  toast.style.boxShadow = '0 10px 25px rgba(15, 53, 102, 0.15)';
  toast.style.fontSize = '0.85rem';
  toast.style.fontWeight = '700';
  toast.style.zIndex = '999';
  toast.style.opacity = '0';
  toast.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

  toast.innerText = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  }, 50);

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* ============================================================
 * 時間割登録モーダル
 * ========================================================== */

let _editingClassKey = null; // 編集中のキー(nullなら新規)

function openTimetableModal(classKey) {
  _editingClassKey = typeof classKey === 'string' ? classKey : null;
  const modal = document.getElementById('timetable-modal-overlay');
  const title = document.getElementById('timetable-modal-title');
  const daySelect = document.getElementById('tt-day');
  const periodSelect = document.getElementById('tt-period');
  const subjectInput = document.getElementById('tt-subject');
  const teacherInput = document.getElementById('tt-teacher');
  const roomInput = document.getElementById('tt-room');
  const deleteBtn = document.getElementById('timetable-modal-delete');

  if (_editingClassKey && timetable[_editingClassKey]) {
    // 編集モード
    const entry = timetable[_editingClassKey];
    const [day, period] = _editingClassKey.split('-');
    title.textContent = '授業を編集';
    daySelect.value = day;
    periodSelect.value = period;
    subjectInput.value = entry.subject || '';
    teacherInput.value = entry.teacher || '';
    roomInput.value = entry.room || '';
    deleteBtn.style.display = 'block';
  } else {
    // 新規モード
    title.textContent = '授業を追加';
    daySelect.value = 'mon';
    periodSelect.value = '1';
    subjectInput.value = '';
    teacherInput.value = '';
    roomInput.value = '';
    deleteBtn.style.display = 'none';
  }

  modal.classList.add('open');
  subjectInput.focus();
}

function closeTimetableModal() {
  document.getElementById('timetable-modal-overlay')?.classList.remove('open');
  _editingClassKey = null;
}

function saveTimetableEntry() {
  const day = document.getElementById('tt-day').value;
  const period = document.getElementById('tt-period').value;
  const subject = document.getElementById('tt-subject').value.trim();
  const teacher = document.getElementById('tt-teacher').value.trim();
  const room = document.getElementById('tt-room').value.trim();

  if (!subject) {
    document.getElementById('tt-subject').focus();
    showSystemNotification('科目名を入力してください');
    return;
  }

  const key = `${day}-${period}`;
  timetable[key] = { subject, teacher, room };
  localStorage.setItem('oecu_timetable', JSON.stringify(timetable));

  closeTimetableModal();
  renderTimetable();
  showSystemNotification(`「${subject}」を登録したよ！`);
}

function deleteTimetableEntry() {
  if (!_editingClassKey) return;
  const entry = timetable[_editingClassKey];
  if (!entry) return;
  if (!confirm(`「${entry.subject}」を削除しますか？`)) return;

  delete timetable[_editingClassKey];
  localStorage.setItem('oecu_timetable', JSON.stringify(timetable));

  if (activeClassId === _editingClassKey) {
    activeClassId = null;
    localStorage.removeItem('oecu_active_class_id');
    showNoClassSelectedState();
  }

  closeTimetableModal();
  renderTimetable();
  showSystemNotification('授業を削除したよ');
}
