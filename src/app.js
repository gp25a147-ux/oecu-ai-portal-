import { askGemini } from './gemini.js';
import { oecuKnowledge } from './oecuKnowledge.js';

// --- シラバスデータベースの更新（画像の授業とマッピング） ---
const syllabusDataExtended = {
  "2026": {
    "2": {
      "mon-1": {
        subject: "物理学B",
        teacher: "物理 太郎 教授",
        room: "J号館 J301教室 (寝屋川)",
        evaluation: "期末試験: 70%, 授業内レポート: 30%",
        testStrategy: "テストは記述式。力学の基礎問題（斜面を滑り落ちる物体の運動方程式）と、波動論に関する大問が毎年出ます。授業資料の練習問題を全て自力で解けるようにしておくこと。",
        weeks: ["物理学入門・単位と次元", "運動の表し方（速度と加速度）", "運動の3法則（運動方程式）", "様々な力（重力、摩擦力、弾性力）", "仕事と運動エネルギー", "力学的エネルギー保存の法則", "衝突と運動量保存の法則", "中間振り返り演習", "波の表し方（波形と周期）", "波の重ね合わせと干渉", "定常波と振動数", "音波とドップラー効果", "光の反射・屈折・回折", "レンズの結像公式と光学機器", "総括と期末試験"]
      },
      "mon-3": {
        subject: "離散数学",
        teacher: "数理 健一 准教授",
        room: "Z号館 Z102講義室 (四條畷)",
        evaluation: "小テスト(計5回): 50%, 期末レポート: 50%",
        testStrategy: "テストはありません。定期的な小テストの成績が直結します。集合論のベン図証明や、論理式の真偽値表の作成が中心。AIを使って論理式の変形プロセスを一つずつ検証しながら学習するのがおすすめです。",
        weeks: ["集合の概念と基本演算", "部分集合とべき集合", "論理と命題・真偽値表", "条件付き命題と対偶・論理等価", "述語論理と全称・存在記号", "数学的帰納法による証明", "関係と写像の概念", "同値関係と商集合", "無限集合と濃度の比較", "グラフ理論の基礎（点と辺）", "オイラーグラフとハミルトングラフ", "木構造と最小全域木", "順列・組合せの数え上げ", "漸化式と数列の一般項", "まとめと最終課題指導"]
      },
      "tue-2": {
        subject: "コンピュータネットワーク",
        teacher: "通信 次郎 教授",
        room: "J号館 J402実習室 (寝屋川)",
        evaluation: "期末試験: 60%, 実習レポート: 40%",
        testStrategy: "OSI参照モデルの各レイヤーの役割とプロトコル名を完全一致で暗記。IPアドレスのサブネットマスクの計算問題は配点が非常に高いため、確実に解けるように計算手順をマスターすること。",
        weeks: ["ネットワークの歴史と階層構造", "プロトコルと標準化（OSIとTCP/IP）", "物理層の機能と伝送媒体", "データリンク層とMACアドレス", "イーサネットと誤り検出技術", "IPアドレスの構造とサブネッティング", "ルーティングの基本原理とプロトコル", "中間確認演習", "TCPとUDPの特徴と違い", "ポート番号とソケット通信の仕組み", "DNS（ドメインネームシステム）の役割", "HTTP/HTTPSとWebの仕組み", "電子メールのプロトコル（SMTP/POP/IMAP）", "情報セキュリティ技術（ファイアウォール・VPN）", "総括と期末試験"]
      },
      "tue-3": {
        subject: "C言語プログラミング",
        teacher: "電通 次郎 講師",
        room: "J号館 J205実習室 (寝屋川)",
        evaluation: "期末コード提出試験: 50%, 毎週の課題: 50%",
        testStrategy: "試験はPCを用いたコード書き込み。ポインタと構造体を組み合わせた片方向連結リストの作成が毎年出題されます。デバッグ（メモリ解放漏れやヌルポインタ参照の回避）を徹底してください。",
        weeks: ["C言語の開発環境と基本構造", "変数とデータ型・演算子", "制御構造（if, switchによる分岐）", "反復処理（for, whileループ）", "1次元・2次元配列の操作", "関数の定義と引数の値渡し", "ポインタの基本（アドレスと間接参照）", "関数へのアドレス渡し（ポインタ引数）", "文字列の操作とライブラリ関数", "変数の寿命とスコープ（静的変数）", "構造体の定義とメンバーアクセス", "構造体配列とポインタの組み合わせ", "動的メモリ確保（malloc, free）", "連結リストの基本実装", "コード提出試験と総括"]
      },
      "tue-4": {
        subject: "データベース論",
        teacher: "データ 健二 教授",
        room: "Z号館 Z204講義室 (四條畷)",
        evaluation: "中間レポート: 40%, 期末筆記試験: 60%",
        testStrategy: "ER図からリレーショナルスキーマ（テーブル設計）への変換問題と、SQLクエリの記述問題（INNER JOINやGROUP BYを用いた集計）が必ず出題されます。SQLの構文ミスに注意。",
        weeks: ["データベースシステムと情報管理の役割", "3層スキーマ構造と独立性", "リレーショナルデータモデルの基本", "E-Rモデルによる概念設計", "関係代数の基本演算（射影、選択、結合）", "SQLによるデータ定義（CREATE TABLE）", "SQLによるデータ抽出（SELECTの基本）", "テーブルの結合（INNER JOIN, LEFT JOIN）", "データのグループ化と集計（GROUP BY）", "副問合せ（サブクエリ）の活用", "関数従属性とデータベースの正規化（第3正規形）", "トランザクションとACID特性", "同時実行制御と障害回復技術", "データベースのセキュリティとNoSQL", "まとめと期末試験"]
      },
      "wed-2": {
        subject: "情報通信ネットワーク",
        teacher: "寝屋川 通信 教授",
        room: "J号館 J401教室 (寝屋川)",
        evaluation: "中間試験: 30%, 期末試験: 50%, レポート: 20%",
        testStrategy: "IPアドレスの設計問題と、TCPのフロー制御（ウィンドウ制御）の仕組みが出題されます。記述式問題が多いので、専門用語を論理的に説明できるように準備すること。",
        weeks: ["講義概要と通信システムの基本構成", "信号の伝送と変復調方式", "多重化技術と回線交換・パケット交換", "MACアドレスとスイッチング", "IPv4/IPv6アドレスの設計と割当", "静的・動的ルーティング制御", "TCPの接続管理と信頼性確保", "ネットワーク演習", "UDPの役割とリアルタイム通信", "DNSとドメイン解決の仕組み", "Web通信（HTTP/HTTPS）のシーケンス", "メールとファイル転送のプロトコル", "暗号技術と鍵管理（SSL/TLS）", "最新の通信技術動向（5G/SDN）", "期末試験と総括"]
      },
      "wed-3": {
        subject: "アカデミック・スキルズ",
        teacher: "寝屋川 次郎 講師",
        room: "J号館 J204演習室 (寝屋川)",
        evaluation: "レポート課題(3回): 70%, 発表評価: 30%",
        testStrategy: "テストはありません。期末レポートの論理構成、および学術的な表現ルール（剽窃の回避、正しい引用）が合否を分けます。AIを使ってレポートのアウトラインを事前に練り上げましょう。",
        weeks: ["大学での学びとレポートのルール", "文献データベースの使い方・検索技術", "信頼できる一次ソースの選定", "論文のクリティカルな読み方", "レポートのアウトライン設計（ピラミッド構造）", "問いの立て方と仮説設定", "パラグラフ・ライティングの実践", "正しい引用と文献目録の作成ルール", "論理展開の検証（帰納法と演繹法）", "プレゼンテーション用スライドのデザイン", "わかりやすい発表のテクニック", "グループ内でのピアレビューと改善", "プレゼン発表会（前半）", "プレゼン発表会（後半）", "レポート最終提出と振り返り"]
      },
      "thu-3": {
        subject: "ゲームデザイン論",
        teacher: "吉宗 クリエイター 教授",
        room: "四條畷 コモンズ3F アクティブスペース",
        evaluation: "ゲーム企画書: 60%, プレゼンテーション: 40%",
        testStrategy: "筆記試験はなし。期末までに提出するオリジナルのゲーム企画書（仕様書）が評価の大部分を占めます。ターゲット層、コアメカニクス、マネタイズモデルが論理的かつ魅力的に表現されているかが重要。",
        weeks: ["ゲームの本質と楽しさの定義", "ゲームを構成する4つの要素（メカニクス等）", "MDAフレームワークによるゲーム分析", "コアゲームループと進行設計", "ゲームバランス調整と難易度曲線", "ユーザー誘導とレベルデザインの基本", "直感的なUI/UXとゲームフィール", "ストーリーとインタラクティブ性の融合", "アクション・RPGの面白さの因数分解", "インディーゲームの企画と差別化戦略", "ペーパープロトタイプによる検証手法", "ヒットするゲーム企画書の書き方", "効果的なピッチプレゼンの技術", "クラス内企画コンペティション", "フィードバックを踏まえた最終企画書の提出"]
      },
      "thu-5": {
        subject: "デジタルゲーム制作",
        teacher: "ゲーム 開発 准教授",
        room: "Z号館 Z403ゲーム開発室 (四條畷)",
        evaluation: "最終ゲーム作品の完成度: 70%, 毎週のコードコミット: 30%",
        testStrategy: "テストなし。Unity等で制作したオリジナルゲーム作品（2D/3Dどちらでも可）の提出が必須。教員は「ゲームプレイ中のエラーがないこと」「物理挙動が適切か」「サウンドとアニメーションの調和」を評価します。",
        weeks: ["ゲーム開発エンジンの概要と初期設定", "プロジェクト構成とアセットインポート", "オブジェクトの配置とコンポーネントの役割", "C#スクリプトによるオブジェクト制御", "入力システムの構築（移動とアクション）", "コライダーと物理挙動（衝突判定）", "プリファブ化と動的なオブジェクト生成", "UI（スコア、ライフ、メニュー）の実装", "カメラ制御とCinemachineの活用", "オーディオソースと音響効果の設定", "アニメーターコントローラーとモーション遷移", "エフェクト（パーティクルシステム）の追加", "ゲームループの完成（スタートからゲームオーバー）", "ビルドと最適化処理", "作品展示会と講評会"]
      },
      "fri-2": {
        subject: "データベース基礎",
        teacher: "システム 教授",
        room: "J号館 J305教室 (寝屋川)",
        evaluation: "期末試験: 50%, 実習課題: 50%",
        testStrategy: "リレーショナルモデルの基礎概念と、簡単なSELECTクエリ（条件抽出、並べ替え、値の絞り込み）が出題されます。実習で取り扱うDBの基本操作手順を復習しておきましょう。",
        weeks: ["データベースとは（ファイル管理との違い）", "リレーショナルモデルとテーブルの構成要素", "主キーと外部キーの役割", "データ定義文（CREATE TABLEの基礎）", "データの挿入・更新・削除（INSERT/UPDATE/DELETE）", "基本問い合わせ（SELECT, WHEREの利用）", "比較演算子と論理演算子の組み合わせ", "並べ替え（ORDER BY）と重複排除（DISTINCT）", "パターンのマッチング（LIKE演算子）", "複数のテーブルをつなぐ（JOINの考え方）", "データベースの整合性制約", "ビューの作成と利用方法", "トランザクション処理の簡単なイメージ", "データベース製品（MySQL, PostgreSQL）の特徴", "期末試験とまとめ"]
      },
      "fri-3": {
        subject: "キャリア設計",
        teacher: "キャリア 支援 講師",
        room: "Z号館 Z105教室 (四條畷)",
        evaluation: "自己分析ポートフォリオ: 60%, プレゼンテーション: 40%",
        testStrategy: "テストなし。自分自身の強み、弱み、将来のキャリアプランをまとめたポートフォリオの作成が必須。教員は「自己の客観的な分析ができているか」「具体的なアクションプランがあるか」を評価します。",
        weeks: ["大学生活のゴール設定とキャリアの意味", "自己分析1（これまでの強みと弱みの棚卸し）", "自己分析2（価値観とやりたいことの発見）", "業界研究のやり方・職種の違いを知る", "OECU卒業生の就職実績と先輩の事例研究", "インターンシップの目的と選び方", "履歴書・エントリーシート（ES）の基本ルール", "伝わる自己PRの書き方と推敲", "グループディスカッションの体験と対策", "面接の基本マナーと想定問答の準備", "ポートフォリオの構成案作成", "ポートフォリオ用資料の収集と統合", "プレゼンテーションの準備とリハーサル", "自己PRプレゼン大会（前半）", "自己PRプレゼン大会（後半）"]
      },
      "fri-4": {
        subject: "オペレーティングシステム",
        teacher: "システム 准教授",
        room: "Z号館 Z205実習室 (四條畷)",
        evaluation: "期末筆記試験: 60%, 毎週の小テスト: 40%",
        testStrategy: "プロセスの状態遷移、スレッドの概念、CPUスケジューリングアルゴリズム（先着順、ラウンドロビンなど）が記述問題で出ます。メモリ管理（ページング方式、仮想メモリ）の仕組みも頻出。",
        weeks: ["オペレーティングシステム (OS) の役割と歴史", "カーネルとユーザーモードの違い・システムコール", "プロセスとスレッドの概念・状態遷移", "CPUスケジューリングアルゴリズム", "プロセス間通信と同期（セマフォ、ミューテックス）", "デッドロックの発生条件と回避策", "主記憶管理（固定区画と動的区画方式）", "仮想記憶の仕組みとページング方式", "ページ置換アルゴリズム（FIFO, LRU）", "ファイルシステムの構造とファイルアロケーション", "I/Oデバイス管理とデバイスドライバの役割", "仮想化技術とコンテナ（Dockerなど）の原理", "OSのセキュリティとアクセス制御", "代表的なOS（Linux, Windows）のアーキテクチャ", "期末試験とまとめ"]
      }
    }
  }
};

// --- アプリケーションの状態管理 ---
let currentGrade = localStorage.getItem('oecu_grade') || '2'; // デモのためデフォルト2年生
let currentYear = localStorage.getItem('oecu_year') || '2026';
let currentTheme = localStorage.getItem('oecu_theme') || 'light';
let apiKey = localStorage.getItem('oecu_apikey') || '';

// 画像に合わせた初期時間割データ
let timetable = JSON.parse(localStorage.getItem('oecu_timetable')) || {
  "mon-1": { subject: "物理学B", teacher: "物理 太郎", room: "J301" },
  "mon-3": { subject: "離散数学", teacher: "数理 健一", room: "Z102" },
  "tue-2": { subject: "コンピュータネットワーク", teacher: "通信 次郎", room: "J402" },
  "tue-3": { subject: "C言語プログラミング", teacher: "電通 次郎", room: "J205" },
  "tue-4": { subject: "データベース論", teacher: "データ 健二", room: "Z204" },
  "wed-2": { subject: "情報通信ネットワーク", teacher: "寝屋川 通信", room: "J401" },
  "wed-3": { subject: "アカデミック・スキルズ", teacher: "寝屋川 次郎", room: "J204" },
  "thu-3": { subject: "ゲームデザイン論", teacher: "吉宗 クリエイター", room: "コモンズ3F" },
  "thu-5": { subject: "デジタルゲーム制作", teacher: "ゲーム 開発", room: "Z403" },
  "fri-2": { subject: "データベース基礎", teacher: "システム", room: "J305" },
  "fri-3": { subject: "キャリア設計", teacher: "キャリア 支援", room: "Z105" },
  "fri-4": { subject: "オペレーティングシステム", teacher: "システム 准教授", room: "Z205" }
};

// 選択中の授業スレッドID（デフォルト：月曜3限 離散数学）
let activeClassId = "mon-3";
let activeWeekIndex = 4; // 第5回目

// チャット履歴
let chatThreads = JSON.parse(localStorage.getItem('oecu_chat_threads')) || {};

// 添付ファイルの一時リスト
let attachedFiles = [];

// Moodle課題リマインダーリスト
let moodleTasks = JSON.parse(localStorage.getItem('oecu_moodle_tasks')) || [];

// Moodle同期状態
let isMoodleSynced = localStorage.getItem('oecu_moodle_synced') === 'true';

// アコーディオンの開閉状態
// 土日の場合はデフォルトで「金曜日」を開き、それ以外は当日の曜日を開く
const dayNamesEnglish = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
let todayDayIndex = new Date().getDay();
if (todayDayIndex === 0 || todayDayIndex === 6) todayDayIndex = 5; // 土日は金曜日にマッピング
const todayDayKey = dayNamesEnglish[todayDayIndex];

let openDays = JSON.parse(localStorage.getItem('oecu_open_days')) || {
  "mon": todayDayKey === 'mon',
  "tue": todayDayKey === 'tue',
  "wed": todayDayKey === 'wed',
  "thu": todayDayKey === 'thu',
  "fri": todayDayKey === 'fri'
};

// 科目ごとのカラーマップ（画像再現のため）
const subjectColors = {
  "物理学B": "#10b981", // 緑
  "離散数学": "#6366f1", // 紫
  "コンピュータネットワーク": "#1e3a8a", // 濃い青
  "C言語プログラミング": "#991b1b", // 濃い赤
  "データベース論": "#854d0e", // 濃い茶
  "情報通信ネットワーク": "#2563eb", // 青
  "アカデミック・スキルズ": "#10b981", // 緑
  "ゲームデザイン論": "#ea580c", // オレンジ
  "デジタルゲーム制作": "#dc2626", // 赤
  "データベース基礎": "#854d0e", // 茶
  "キャリア設計": "#8b5cf6", // 紫
  "オペレーティングシステム": "#2563eb" // 青
};

// 科目のドット色を取得するヘルパー
function getSubjectColor(subject) {
  for (const key of Object.keys(subjectColors)) {
    if (subject.includes(key) || key.includes(subject)) {
      return subjectColors[key];
    }
  }
  return "#71717a"; // デフォルトグレー
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
  
  // 新規チャットボタン（画像通りサイドバー内のものにマッピング）
  sidebarNewChatBtn: document.getElementById('sidebar-new-chat-btn'),
  
  fileInput: document.getElementById('file-input'),
  attachBtn: document.getElementById('attach-btn'),
  filePreviewContainer: document.getElementById('file-preview-container'),
  
  syllabusPanel: document.getElementById('syllabus-panel'),
  syllabusSelectWeek: document.getElementById('syllabus-select-week'),
  
  moodleTextarea: document.getElementById('moodle-textarea'),
  moodleParseBtn: document.getElementById('moodle-parse-btn'),
  
  moodleSyncBtn: document.getElementById('moodle-sync-btn'),
  moodleSyncStatus: document.getElementById('moodle-sync-status'),
  moodleUserInfo: document.getElementById('moodle-user-info'),
  moodleSyncLoader: document.getElementById('moodle-sync-loader'),
  moodleSyncProgressBar: document.getElementById('moodle-sync-progress-bar'),
  moodleStudentName: document.getElementById('moodle-student-name')
};

// --- 初期化処理 ---
export function initApp() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  elements.gradeSelect.value = currentGrade;
  elements.yearSelect.value = currentYear;
  elements.apiKeyInput.value = apiKey;

  registerEventListeners();

  if (isMoodleSynced) {
    elements.moodleSyncStatus.innerText = "連携中";
    elements.moodleSyncStatus.style.color = "#0056b3";
    elements.moodleUserInfo.style.display = "block";
    elements.moodleSyncBtn.innerText = "Moodle同期データをリセット";
    elements.moodleSyncBtn.style.background = "var(--danger-color)";
  }

  renderTimetable();
  selectClass(activeClassId);
  renderQuickLinks();
  updateMoodleTasksUI();
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

  // 新規チャットボタン
  elements.sidebarNewChatBtn.addEventListener('click', clearCurrentThread);

  elements.attachBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelection);

  elements.syllabusSelectWeek.addEventListener('change', (e) => {
    activeWeekIndex = parseInt(e.target.value);
    updateSyllabusPanel();
  });

  elements.moodleParseBtn.addEventListener('click', parseMoodleText);
  elements.moodleSyncBtn.addEventListener('click', handleMoodleSyncClick);
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
  selectClass(activeClassId);
  showSystemNotification("設定を更新したよ！");
}

// --- 曜日アコーディオン時間割の描画 (画像仕様) ---
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
    // 曜日にある授業リストを抽出
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

    // 1. アコーディオンヘッダーの作成
    const dayHeader = document.createElement('div');
    dayHeader.className = 'accordion-day-header';
    dayHeader.dataset.day = day.id;

    // 開閉矢印アイコン
    const arrowSpan = document.createElement('span');
    arrowSpan.className = `accordion-day-arrow ${openDays[day.id] ? 'open' : ''}`;
    arrowSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`;

    // 曜日テキスト
    const nameSpan = document.createElement('span');
    nameSpan.innerText = day.name;

    // 「今日」バッジの追加 (今日であれば追加)
    let todayBadge = '';
    if (day.id === todayDayKey) {
      const badge = document.createElement('span');
      badge.className = 'day-today-badge';
      badge.innerText = '今日';
      nameSpan.appendChild(badge);
    }

    // 科目数表示
    const countSpan = document.createElement('span');
    countSpan.className = 'day-subjects-count';
    countSpan.innerText = `${subjectsForDay.length}科目`;

    dayHeader.appendChild(arrowSpan);
    dayHeader.appendChild(nameSpan);
    dayHeader.appendChild(countSpan);

    // 2. アコーディオンコンテンツ容器
    const dayContent = document.createElement('div');
    dayContent.className = `accordion-day-content ${openDays[day.id] ? 'open' : ''}`;
    dayContent.id = `content-${day.id}`;

    // 各授業項目の作成
    subjectsForDay.forEach(sub => {
      const item = document.createElement('div');
      item.className = `sidebar-subject-item ${activeClassId === sub.key ? 'active' : ''}`;
      item.dataset.id = sub.key;

      // 科目ごとの丸いカラーマーク
      const colorDot = document.createElement('div');
      colorDot.className = 'subject-color-dot';
      colorDot.style.backgroundColor = getSubjectColor(sub.subject);

      // 授業タイトル
      const titleSpan = document.createElement('span');
      titleSpan.className = 'subject-title';
      titleSpan.innerText = sub.subject;

      // 時限テキスト
      const periodSpan = document.createElement('span');
      periodSpan.className = 'subject-period-text';
      periodSpan.innerText = `${sub.period}限`;

      // 課題リマインダードット
      const hasTask = moodleTasks.some(t => t.classId === sub.key);
      if (hasTask) {
        const dot = document.createElement('div');
        dot.className = 'subject-task-indicator';
        item.appendChild(dot);
      }

      item.appendChild(colorDot);
      item.appendChild(titleSpan);
      item.appendChild(periodSpan);

      // クリックで授業選択
      item.addEventListener('click', (e) => {
        e.stopPropagation(); // バブリング防止
        selectClass(sub.key);
      });

      dayContent.appendChild(item);
    });

    // 曜日ヘッダークリックでアコーディオン開閉
    dayHeader.addEventListener('click', () => {
      const isOpen = dayContent.classList.contains('open');
      
      // 開閉状態反転
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
}

// --- 授業の選択 ---
function selectClass(classId) {
  activeClassId = classId;
  
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

// --- Moodle同期 (デモ) ---
function handleMoodleSyncClick() {
  if (isMoodleSynced) {
    if (confirm("Moodleの個人同期データをリセットしますか？")) {
      isMoodleSynced = false;
      localStorage.setItem('oecu_moodle_synced', 'false');
      
      moodleTasks = [];
      localStorage.setItem('oecu_moodle_tasks', JSON.stringify(moodleTasks));
      
      elements.moodleSyncStatus.innerText = "未連携";
      elements.moodleSyncStatus.style.color = "var(--text-muted)";
      elements.moodleUserInfo.style.display = "none";
      elements.moodleSyncBtn.innerText = "Moodleから個人データを同期 (デモ)";
      elements.moodleSyncBtn.style.background = "var(--primary-color)";
      
      renderTimetable();
      updateMoodleTasksUI();
      showSystemNotification("連携データをリセットしたよ。");
    }
    return;
  }

  elements.moodleSyncBtn.disabled = true;
  elements.moodleSyncBtn.innerText = "接続中...";
  elements.moodleSyncLoader.style.display = "block";
  elements.moodleSyncProgressBar.style.width = "0%";

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    elements.moodleSyncProgressBar.style.width = `${progress}%`;
    
    if (progress === 30) {
      elements.moodleSyncBtn.innerText = "ログイン情報を取得中...";
    } else if (progress === 70) {
      elements.moodleSyncBtn.innerText = "個人時間割を読込中...";
    } else if (progress === 90) {
      elements.moodleSyncBtn.innerText = "未提出の課題を同期中...";
    }
    
    if (progress >= 100) {
      clearInterval(interval);
      completeMoodleSync();
    }
  }, 200);
}

function completeMoodleSync() {
  isMoodleSynced = true;
  localStorage.setItem('oecu_moodle_synced', 'true');

  moodleTasks = [
    {
      id: "moodle-task-1",
      classId: "mon-3", // 離散数学
      subject: "離散数学",
      name: "第2回小テスト：論理式と真偽値表の変形",
      dueDate: "2026/06/28 23:59"
    },
    {
      id: "moodle-task-2",
      classId: "tue-3", // C言語プログラミング
      subject: "C言語プログラミング",
      name: "第5回実習課題：構造体と値渡しの実装",
      dueDate: "2026/07/02 23:59"
    },
    {
      id: "moodle-task-3",
      classId: "thu-3", // ゲームデザイン論
      subject: "ゲームデザイン論",
      name: "中間ゲーム企画書ドラフト提出",
      dueDate: "2026/07/05 23:59"
    }
  ];
  localStorage.setItem('oecu_moodle_tasks', JSON.stringify(moodleTasks));

  elements.moodleSyncLoader.style.display = "none";
  elements.moodleSyncStatus.innerText = "連携中";
  elements.moodleSyncStatus.style.color = "#0056b3";
  elements.moodleUserInfo.style.display = "block";
  elements.moodleSyncBtn.disabled = false;
  elements.moodleSyncBtn.innerText = "Moodle同期データをリセット";
  elements.moodleSyncBtn.style.background = "var(--danger-color)";

  renderTimetable();
  updateMoodleTasksUI();
  selectClass(activeClassId);

  const syncWelcomeMsg = `🔔 **Moodle個人データの同期が完了したよ！**
Moodleのログインセッションから、君が受講している講義と未提出の課題を自動的に読み込んで、時間割とAIに連携したよ。

**【今回読み込まれた未提出課題】**
1. **離散数学** (月曜3限)
   - 課題: 第2回小テスト：論理式と真偽値表の変形 (締切: 6/28 23:59)
2. **C言語プログラミング** (火曜3限)
   - 課題: 第5回実習課題：構造体と値渡しの実装 (締切: 7/02 23:59)
3. **ゲームデザイン論** (木曜3限)
   - 課題: 中間ゲーム企画書ドラフト提出 (締切: 7/05 23:59)

特に**離散数学**の課題は締切が近いね！
このチャットで「真偽値表の書き方がわからない」「論理等価の証明を教えて」と話しかけてくれれば、いつでもアドバイスするから気軽に聞いてね！`;

  if (!chatThreads["mon-3"]) {
    chatThreads["mon-3"] = [];
  }
  chatThreads["mon-3"].push({
    sender: "ai",
    text: syncWelcomeMsg
  });
  localStorage.setItem('oecu_chat_threads', JSON.stringify(chatThreads));

  if (activeClassId === "mon-3") {
    renderChatHistory("mon-3");
  }

  showSystemNotification("Moodleとのデータ同期が成功したよ！");
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

  if (!matchedClassId) {
    matchedClassId = activeClassId;
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
