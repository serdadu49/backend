export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { section, data } = req.body;
  const GROK_KEY = process.env.GROK_KEY;
  const GEMINI_KEY = process.env.GEMINI_KEY;

  const SYSTEM_PROMPT = `Kamu adalah Serdadu Strategist AI — analis politik paling akurat untuk PDI Perjuangan Puger Jember 2026. Fokus menang Pilkada & Pemilu. Konteks: pesisir nelayan, petani padi/tembakau, penambang pasir, pasca Pilkada 2024 kalah tipis, isu banjir Feb 2026. Rival utama: PKB, Gerindra, Golkar. Gunakan data JSON. Chain-of-Thought 5 langkah. Output HANYA teks biasa (bukan JSON).`;

  const userMsg = `Analisis section "${section}" dengan data berikut:\n${data}`;

  try {
    // Grok
    const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROK_KEY}` },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{role:"system", content: SYSTEM_PROMPT}, {role:"user", content: userMsg}],
        temperature: 0.2, max_tokens: 1800
      })
    });
    const grokData = await grokRes.json();
    let grokText = grokData.choices?.[0]?.message?.content || "Grok error";

    // Gemini
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + userMsg }] }] })
    });
    const geminiData = await geminiRes.json();
    let geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini error";

    const finalText = grokText.length > geminiText.length ? grokText : geminiText;

    res.status(200).json({ analysis: finalText });
  } catch (error) {
    res.status(500).json({ analysis: "❌ Error: " + error.message });
  }
}