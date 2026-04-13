const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateLyrics = async (req, res) => {
  const { genre, mood, theme, title } = req.body;

  if (!genre || !mood || !theme) {
    return res.status(400).json({ success: false, message: "Genre, mood, and theme are required." });
  }

  const prompt = `You are a professional songwriter. Write original song lyrics with the following details:
- Genre: ${genre}
- Mood: ${mood}
- Theme: ${theme}${title ? `\n- Title: ${title}` : ""}

Format the lyrics with clearly labeled sections like [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro] etc.
Make the lyrics creative, authentic to the genre, and emotionally fitting for the mood.
Only output the lyrics, nothing else.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });

    const lyrics = completion.choices[0].message.content;
    res.json({ success: true, lyrics });
  } catch (error) {
    console.error("Lyrics generation error:", error.message);
    res.status(500).json({ success: false, message: "Failed to generate lyrics. Please try again." });
  }
};

module.exports = { generateLyrics };
