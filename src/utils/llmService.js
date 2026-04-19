// src/utils/llmService.js

// APIキーがない場合に表示される「事実に基づく」デモデータ
const DEMO_SUGGESTIONS = [
  {
    title: "「京都」を舞台とした歴史的転換点",
    reason: "平安京遷都(794年)から、池田屋事件(1864年)、坂本龍馬暗殺(1867年)に至るまで、1000年以上の時を隔てた出来事が「京都」という同一の地理的空間で発生しています。",
    tags: [{ text: "京都", logic: "OR" }, { text: "平安京", logic: "OR" }],
    eventIds: ["zdgiVbq", "bakumatsu_19", "bakumatsu_20", "bakumatsu_26", "bakumatsu_27", "bakumatsu_28"]
  },
  {
    title: "「万国博覧会」での思想の実装実験",
    reason: "バルセロナ・パビリオン(1929)、大阪万博(1970)、そして2025年のオランダパビリオン。これらは全て「万博」という特定のプラットフォーム上で、各時代の最先端の社会思想（モダニズム、メタボリズム、循環型経済）が試行されている共通点があります。",
    tags: [{ text: "万博", logic: "OR" }, { text: "パビリオン", logic: "OR" }],
    eventIds: ["ev_1711853600008", "FHOPr48", "WseT1Kn", "jsFLDCh"]
  },
  {
    title: "「1929年」：近代建築の頂点と世界経済の崩壊",
    reason: "バルセロナ・パビリオンが完成し近代建築がひとつの到達点に達した同じ1929年、米国での株価暴落を起点に世界恐慌が発生しました。文化の達成と経済の崩壊が同じ年に起きたという歴史的同期性があります。",
    tags: [{ text: "1929", logic: "OR" }, { text: "バルセロナ", logic: "OR" }, { text: "世界恐慌", logic: "OR" }],
    eventIds: ["ev_1711853600008", "ev_1711853600004", "rkc4Oh_"]
  }
];

export const fetchTimelineSuggestions = async (events) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // キーがない場合はデモデータを返してUIを動作させる
  if (!apiKey || apiKey === "あなたのOpenAI_APIキー") {
    console.info("AI提案: デモモードで動作中");
    return new Promise(resolve => setTimeout(() => resolve(DEMO_SUGGESTIONS), 1500));
  }

  const simplifiedEvents = events.map(e => ({
    id: e.id,
    date: e.date,
    title: e.title,
    description: e.description,
    tags: e.tags || []
  }));

  const systemPrompt = `
あなたは事象間の「客観的な事実」に基づいた繋がりを発見する専門家です。
「場所」「特定の年代」「同一のプロジェクト」「共通の人物・物質」といった事実にのみ基づき、新しい年表を3つ提案してください。抽象的なテーマ（「変革の時代」など）は禁止します。

【出力形式】
以下のJSON配列のみを返してください。
[
  {
    "title": "年表のタイトル",
    "reason": "客観的な事実に基づく具体的な理由",
    "tags": [{ "text": "検索タグ", "logic": "OR" }],
    "eventIds": ["関連するイベントIDの配列"]
  }
]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(simplifiedEvents) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return Array.isArray(content) ? content : (content.suggestions || []);
  } catch (error) {
    console.error("AI提案エラー:", error);
    return DEMO_SUGGESTIONS;
  }
};