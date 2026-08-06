let hinglishData;
let translations = [];
let feedbackData;

const descriptionInput = document.getElementById("description");
const numSentencesInput = document.getElementById("numSentences");
const difficultySelect = document.getElementById("difficulty");
const styleSelect = document.getElementById("style");
const copyPromptBtn = document.getElementById("copyPromptBtn");

const jsonInput = document.getElementById("jsonInput");
const generateBtn = document.getElementById("generateBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

const sentencesContainer = document.getElementById("sentences");
const translationSection = document.getElementById("translationSection");
const copyTranslationPromptBtn = document.getElementById("copyTranslationPromptBtn");
const feedbackJsonCard = document.getElementById("feedbackJsonCard");
const feedbackJsonInput = document.getElementById("feedbackJsonInput");
const showFeedbackBtn = document.getElementById("showFeedbackBtn");
const result = document.getElementById("result");
const feedbackContainer = document.getElementById("feedback");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

copyPromptBtn.addEventListener("click", copyPrompt);
generateBtn.addEventListener("click", loadHinglish);
exportBtn.addEventListener("click", exportData);
importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", handleImportFile);
copyTranslationPromptBtn.addEventListener("click", copyTranslationPrompt);
showFeedbackBtn.addEventListener("click", renderFeedback);

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeModalBtn = document.getElementById("closeModalBtn");

helpBtn.addEventListener("click", () => {
  helpModal.classList.add("active");
});

closeModalBtn.addEventListener("click", () => {
  helpModal.classList.remove("active");
});

helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) {
    helpModal.classList.remove("active");
  }
});

function updateStep(step) {
  [step1, step2, step3].forEach((el, i) => el.classList.toggle("active", i === step - 1));
}

function copyPrompt() {
  const description = descriptionInput.value.trim();
  const num = numSentencesInput.value || 8;
  const d = difficultySelect.value;
  const style = styleSelect.value;

  if (!description) {
    showToast("Please describe what sentences to generate first.", "error");
    descriptionInput.focus();
    return;
  }

  const prompt = `You are an expert English tutor for Hindi speakers.

Generate exactly ${num} Hinglish sentences to help the user practice translating Hinglish into proper English.

Hinglish means everyday Hindi sentences written in the Latin (English) alphabet, commonly mixed with English words.
Examples: "Aaj bahut thand hai, chai peelo.", "Kal office me meeting hai kya?"

Topic / Description:
${description}

Difficulty:
${d}

Style / Theme:
${style}

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown.
3. Do not include explanations.
4. Every sentence must be natural, everyday Hinglish.
5. Sentences must relate to the description above.
6. Do NOT include English translations of the sentences.
7. Make all sentences unique.
8. Avoid multi-line sentences.

Return:
{
  "title": "Hinglish Sentences Title",
  "sentences": [
    {
      "sentenceNo": 1,
      "sentence": "Aaj bahut thand hai, chai peelo."
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok ? "Hinglish prompt copied! Paste it into your favorite LLM." : "Copy failed — please copy the prompt manually.",
      ok ? "success" : "error"
    );
  });
}

function loadHinglish() {
  try {
    hinglishData = JSON.parse(jsonInput.value);
  } catch (error) {
    showToast("Invalid JSON. Please check what you pasted.", "error");
    return;
  }

  if (!hinglishData || !Array.isArray(hinglishData.sentences) || hinglishData.sentences.length === 0) {
    showToast("Invalid format — expected a JSON object with a \"sentences\" array.", "error");
    return;
  }

  translations = [];
  feedbackData = null;
  result.innerHTML = "";
  feedbackContainer.innerHTML = "";
  feedbackJsonCard.classList.add("hidden");

  sentencesContainer.innerHTML = `<h2>${escapeHtml(hinglishData.title || "Hinglish Sentences")}</h2>`;

  hinglishData.sentences.forEach((s, i) => {
    sentencesContainer.innerHTML += `
      <div class="question translation-item">
        <h3>Sentence ${escapeHtml(String(s.sentenceNo ?? i + 1))}</h3>
        <div class="question-text">${escapeHtml(s.sentence || "")}</div>
        <label for="translation-${i}" class="answer-label">Your English Translation</label>
        <textarea
          id="translation-${i}"
          class="answer-input"
          placeholder="Translate this sentence into correct English..."
        ></textarea>
      </div>
    `;
  });

  translationSection.classList.remove("hidden");
  copyTranslationPromptBtn.classList.remove("hidden");
  updateStep(2);
  window.scrollTo({ top: translationSection.offsetTop - 20, behavior: "smooth" });
  showToast(`${hinglishData.sentences.length} Hinglish sentence(s) loaded! Translate each one to English.`);
}

function copyTranslationPrompt() {
  if (!hinglishData || !Array.isArray(hinglishData.sentences)) {
    showToast("Generate Hinglish sentences first.", "error");
    return;
  }

  translations = hinglishData.sentences.map((s, i) => ({
    sentenceNo: s.sentenceNo ?? i + 1,
    hinglishSentence: s.sentence || "",
    userTranslation: document.getElementById(`translation-${i}`)?.value.trim() || ""
  }));

  const empty = translations.filter((t) => !t.userTranslation);
  if (empty.length > 0) {
    showToast(`Please translate ${empty.length} sentence(s) before copying the response prompt.`, "error");
    return;
  }

  const prompt = `You are an expert English tutor for Hindi speakers learning English.

Below are Hinglish sentences and the user's English translations of them. Evaluate each translation carefully.

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown.
3. Do not include any text outside JSON.
4. Provide feedback for EVERY sentence.
5. Point out grammar mistakes, incorrect word choices, unnatural phrasing, missing or extra words, and punctuation issues.
6. Provide a correct, natural English translation for each sentence.
7. Give one practical tip the user can apply immediately.
8. Be encouraging — also mention what the user did well.

User's translations:
${JSON.stringify(translations, null, 2)}

Return JSON in this exact structure:
{
  "title": "English Learning Feedback",
  "overallFeedback": "Short overall feedback for the user",
  "results": [
    {
      "sentenceNo": 1,
      "hinglishSentence": "Original Hinglish sentence",
      "userTranslation": "User's translation",
      "correctTranslation": "Correct natural English translation",
      "mistakes": "Detailed explanation of the mistakes",
      "improvement": "How to improve this sentence"
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    if (!ok) {
      showToast("Copy failed — please copy the response prompt manually.", "error");
      return;
    }
    feedbackJsonCard.classList.remove("hidden");
    updateStep(3);
    window.scrollTo({ top: feedbackJsonCard.offsetTop - 20, behavior: "smooth" });
    showToast("Response prompt copied! Paste it into the LLM, then paste the feedback JSON below.");
  });
}

function renderFeedback() {
  if (!hinglishData || !Array.isArray(hinglishData.sentences)) {
    showToast("Generate Hinglish sentences first.", "error");
    return;
  }

  try {
    feedbackData = JSON.parse(feedbackJsonInput.value);
  } catch (error) {
    showToast("Invalid feedback JSON. Please check what you pasted.", "error");
    return;
  }

  if (!feedbackData || !Array.isArray(feedbackData.results) || feedbackData.results.length === 0) {
    showToast("Invalid feedback format — expected a JSON object with a \"results\" array.", "error");
    return;
  }

  feedbackContainer.innerHTML = `<h2>${escapeHtml(feedbackData.title || "English Learning Feedback")}</h2>`;

  feedbackData.results.forEach((item) => {
    feedbackContainer.innerHTML += `
      <div class="question interview-feedback-card">
        <h3>Sentence ${escapeHtml(String(item.sentenceNo ?? "?"))}</h3>
        <div class="question-text">${escapeHtml(item.hinglishSentence || "")}</div>

        <div class="feedback-block">
          <div class="feedback-heading">Your Translation</div>
          <div class="answer-preview">${formatMultilineText(item.userTranslation || "No answer provided.")}</div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">Correct Translation</div>
          <div class="correct-translation">${formatMultilineText(item.correctTranslation || "Not provided.")}</div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">Mistakes</div>
          <div class="answer-preview">${formatMultilineText(item.mistakes || "Not provided.")}</div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">How to Improve</div>
          <div class="answer-preview">${formatMultilineText(item.improvement || "Not provided.")}</div>
        </div>
      </div>
    `;
  });

  result.innerHTML = "";
  if (feedbackData.overallFeedback) {
    result.innerHTML = `
      <div class="overall-feedback-card">
        <h3>Overall Feedback</h3>
        <p>${escapeHtml(feedbackData.overallFeedback)}</p>
      </div>
    `;
  }

  feedbackJsonCard.classList.add("hidden");
  updateStep(3);
  window.scrollTo({ top: feedbackContainer.offsetTop - 20, behavior: "smooth" });
  showToast("Feedback rendered! Review your mistakes and improvements.");
}

function exportData() {
  let payload;
  let filename = "hinglish.json";

  if (hinglishData && Array.isArray(hinglishData.sentences)) {
    payload = JSON.stringify(hinglishData, null, 2);
    const title = (hinglishData.title || "hinglish")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    filename = `hinglish-${title || "hinglish"}.json`;
  } else if (jsonInput.value.trim()) {
    payload = jsonInput.value;
  } else {
    showToast("Nothing to export. Paste or load Hinglish sentences first.", "error");
    return;
  }

  downloadFile(filename, payload);
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    jsonInput.value = ev.target.result;
    showToast("File imported! Click Generate Sentences to render it.");
  };
  reader.readAsText(file);
  event.target.value = "";
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultilineText(text) {
  return escapeHtml(String(text)).replace(/\n/g, "<br>");
}
