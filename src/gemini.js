import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';
import { oecuKnowledge } from './oecuKnowledge.js';
import { syllabusData } from './syllabus.js';

// デモモード（APIキーがない場合）の自動応答処理
function getDemoResponse(prompt, currentSubjectInfo) {
  const p = prompt.toLowerCase();
  
  // 1. シャトルバス関連
  if (p.includes('バス') || p.includes('シャトル') || p.includes('シャトルバス') || p.includes('時刻表')) {
    return `🚌 **キャンパス間シャトルバス（無料）の情報だよ！**
- **寝屋川発**: ${oecuKnowledge.shuttleBus.stops.neyagawa}
- **四條畷発**: ${oecuKnowledge.shuttleBus.stops.nawate}
- **運行間隔**: ${oecuKnowledge.shuttleBus.interval}
- **先輩からのアドバイス**: ${oecuKnowledge.shuttleBus.tips}
※乗車時は必ず**学生証**が必要だから忘れないようにね！`;
  }
  
  // 2. Wi-Fi関連
  if (p.includes('wi-fi') || p.includes('wifi') || p.includes('ワイファイ') || p.includes('インターネット')) {
    return `📶 **学内Wi-Fi (OECU-WiFi) の接続方法だよ！**
SSID: **${oecuKnowledge.wifi.ssid}**
認証方式: **${oecuKnowledge.wifi.auth}**

**【接続手順】**
${oecuKnowledge.wifi.method}
何かエラーが出る場合は、情報ネットワークセンターに相談してみるといいよ！`;
  }

  // 3. 学食・食堂関連
  if (p.includes('学食') || p.includes('食堂') || p.includes('カレー') || p.includes('ランチ') || p.includes('ご飯')) {
    return `🍔 **OECUの学食・ショップ情報だよ！**

**【寝屋川キャンパス】**
${oecuKnowledge.cafeteria.neyagawa.map(x => `- **${x.name}**: ${x.detail}`).join('\n')}

**【四條畷キャンパス】**
${oecuKnowledge.cafeteria.nawate.map(x => `- **${x.name}**: ${x.detail}`).join('\n')}

寝屋川Z号館の『OECUカレー(380円)』は安くて定番だから一度食べてみてね！`;
  }

  // 4. レポート・課題のサポート
  if (p.includes('レポート') || p.includes('課題') || p.includes('書き方') || p.includes('論文')) {
    return `📝 **レポート作成の基本構成テンプレートだよ！**
レポートは以下の3部構成（または4部構成）を意識すると、論理的で評価が高くなるよ。

---
**1. 序論 (Introduction) [全体の10〜15%]**
- なぜこのテーマを選んだのか（背景・目的）
- 本レポートで何を明らかにするのか（問いの設定）

**2. 本論 (Body) [全体の70〜80%]**
- 問いに対する調査・実験結果、分析、自分の主張
- ※「事実（データ）」と「意見（考察）」は明確に分けること！
- ※主張には必ず根拠（先行研究や文献）を添える。

**3. 結論 (Conclusion) [全体の10〜15%]**
- 本論で得られた結論の要約
- 今後の課題や展望

**4. 参考文献 (References)**
- 本文で引用した書籍、Webサイトのリスト（著者名, タイトル, 出版年など）
---

**💡 先輩からのアドバイス:**
Webのコピペは厳禁！参考文献は必ず正しく記載しよう。
APIキーを設定すれば、君が書いたレポートの下書きを私が具体的に添削することもできるよ！`;
  }

  // 5. 選択中の授業がある場合、その情報に基づくテスト対策
  if (currentSubjectInfo) {
    const s = currentSubjectInfo;
    if (p.includes('テスト') || p.includes('試験') || p.includes('対策') || p.includes('評価')) {
      return `✏️ **【${s.subject}】のテスト対策・評価情報だよ！**

- **担当教員**: ${s.teacher}
- **評価方法**: ${s.evaluation}
- **対策アドバイス**:
  ${s.testStrategy}

これを意識して、早めに対策を始めようね！応援してるよ！`;
    }
    if (p.includes('授業') || p.includes('シラバス') || p.includes('内容') || p.includes('何をする')) {
      return `📖 **【${s.subject}】の講義概要だよ！**

- **教室**: ${s.room}
- **担当**: ${s.teacher}
- **シラバス内容（全15回）**:
  ${s.weeks.map((w, i) => `第${i+1}回: ${w}`).join('\n  ')}

気になる週の内容や、詳しい対策はチャットで何でも聞いてね！`;
    }
  }

  // 6. シラバスデータベース内のキーワード検索
  for (const year of Object.keys(syllabusData)) {
    for (const grade of Object.keys(syllabusData[year])) {
      for (const key of Object.keys(syllabusData[year][grade])) {
        const item = syllabusData[year][grade][key];
        if (p.includes(item.subject.toLowerCase()) || p.includes(item.teacher.split(' ')[0].toLowerCase())) {
          return `📖 **シラバスデータから「${item.subject}」を見つけたよ！**
- **担当**: ${item.teacher}
- **教室**: ${item.room}
- **評価割合**: ${item.evaluation}
- **テスト対策**: ${item.testStrategy}

何か具体的な質問（レポートの書き方やプログラムの解説など）があれば、APIキーを設定するとさらに詳しく答えられるよ！`;
        }
      }
    }
  }

  // 7. デフォルトの応答
  return `🤖 **こちらは「OECU在学生サポートAI（デモモード）」です！**

現在、Gemini APIキーが設定されていないため、事前登録された学内情報（シャトルバス、Wi-Fi、学食、主要科目のテスト対策）のみに回答できます。

**💡 試してみてほしいこと:**
- 「シャトルバスの時間を教えて」
- 「Wi-Fiの繋ぎ方は？」
- 「プログラミング基礎Iのテスト対策は？」
- 右上の「設定⚙️」からGemini APIキーを入力すると、本当のAIと自由におしゃべりや課題の添削（画像・ファイルの解析も含む）ができるようになります！`;
}

// ファイル添付のテキスト情報をプロンプトに追加するための処理
function formatFileContext(attachedFiles) {
  if (!attachedFiles || attachedFiles.length === 0) return '';
  
  let context = '\n\n【ユーザーが添付したファイル情報】\n';
  attachedFiles.forEach(file => {
    context += `- ファイル名: ${file.name} (種類: ${file.type}, サイズ: ${file.size}bytes)\n`;
    if (file.textData) {
      context += `  [ファイル内容テキストの抜粋]:\n"""\n${file.textData.substring(0, 1000)}\n"""\n`;
    }
  });
  return context;
}

// メインのAI応答取得処理
export async function askGemini(prompt, apiKey, options = {}) {
  const { currentSubjectInfo, attachedFiles } = options;

  // APIキーがない場合はデモモードで応答
  if (!apiKey || apiKey.trim() === '') {
    // 擬似的な読み込み遅延（1秒）
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getDemoResponse(prompt, currentSubjectInfo);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: oecuKnowledge.systemPrompt
    });

    // 添付ファイルとシラバスのコンテキスト情報を構築
    let finalPrompt = '';
    
    // 選択されている授業情報があればコンテキストとして追加
    if (currentSubjectInfo) {
      finalPrompt += `【現在選択されている授業情報】\n`;
      finalPrompt += `- 科目名: ${currentSubjectInfo.subject}\n`;
      finalPrompt += `- 担当教員: ${currentSubjectInfo.teacher}\n`;
      finalPrompt += `- 教室: ${currentSubjectInfo.room}\n`;
      finalPrompt += `- 評価方法: ${currentSubjectInfo.evaluation}\n`;
      finalPrompt += `- テスト対策・傾向: ${currentSubjectInfo.testStrategy}\n`;
      finalPrompt += `- 講義計画(全15回):\n  ${currentSubjectInfo.weeks.map((w, idx) => `第${idx+1}回: ${w}`).join('\n  ')}\n\n`;
    }

    // 添付ファイルの内容を追加
    finalPrompt += formatFileContext(attachedFiles);

    // ユーザー本来の質問を追加
    finalPrompt += `【ユーザーからの質問】\n${prompt}`;

    // 画像ファイルが添付されている場合のマルチモーダル対応
    const imageParts = [];
    if (attachedFiles && attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type.startsWith('image/') && file.base64Data) {
          // base64データからプレフィックス（data:image/png;base64,）を取り除く
          const base64Content = file.base64Data.split(',')[1];
          imageParts.push({
            inlineData: {
              data: base64Content,
              mimeType: file.type
            }
          });
        }
      }
    }

    const contents = [finalPrompt, ...imageParts];
    const result = await model.generateContent(contents);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `❌ **AIとの通信中にエラーが発生したよ。**
エラー原因: ${error.message}
APIキーが正しいか、インターネット接続に問題がないか確認してみてね。`;
  }
}
