let interviewData;
let interviewAnswers = [];
let interviewFeedbackData;

const topicInput = document.getElementById("topic");
const conceptInput = document.getElementById("concept");
const difficultySelect = document.getElementById("difficulty");
const numQuestionsInput = document.getElementById("numQuestions");
const additionalDescriptionInput = document.getElementById("additionalDescription");
const paretoRuleCheckbox = document.getElementById("paretoRule");

const jsonInput = document.getElementById("jsonInput");
const quizContainer = document.getElementById("quiz");
const submitArea = document.getElementById("submitArea");
const result = document.getElementById("result");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const generateQuizBtn = document.getElementById("generateQuizBtn");
const promptTemplateSelect = document.getElementById("promptTemplate");
const exportQuizBtn = document.getElementById("exportQuizBtn");
const importQuizBtn = document.getElementById("importQuizBtn");
const importFileInput = document.getElementById("importFileInput");

const feedbackJsonCard = document.getElementById("feedbackJsonCard");
const feedbackJsonInput = document.getElementById("feedbackJsonInput");
const showFeedbackBtn = document.getElementById("showFeedbackBtn");

const PROMPT_TEMPLATES = {
  standard: { label: "Standard", instructions: "" },
  deepDive: {
    label: "Deep Dive Technical",
    instructions: "Focus on advanced technical depth: edge cases, trade-offs, and underlying mechanisms. Prefer questions that separate advanced learners from beginners."
  },
  fundamentals: {
    label: "Conceptual Fundamentals",
    instructions: "Focus on core concepts, definitions, intuition, and first principles. Prefer questions that establish strong foundational understanding."
  },
  codeHeavy: {
    label: "Code-Heavy",
    instructions: "Include code snippets, debugging, and 'how would you implement X' style questions. Keep code inside \\n escape sequences in the JSON."
  },
  realWorld: {
    label: "Real-World Scenarios",
    instructions: "Frame questions as realistic, practical scenarios or case studies that apply the concept to real production situations."
  },
  rapidFire: {
    label: "Rapid Fire",
    instructions: "Keep questions short, punchy, and quick to answer. Favor one-liner questions that test recall and speed."
  },
  systemDesign: {
    label: "System Design",
    instructions: "Focus on architecture, scalability, reliability, and trade-offs. Prefer questions about designing systems or choosing between architectural approaches."
  },
  behavioral: {
    label: "Behavioral / STAR",
    instructions: "Frame questions as behavioral interview questions about past experiences, teamwork, leadership, and conflict resolution. Encourage STAR-format (Situation, Task, Action, Result) answers."
  }
};

copyPromptBtn.addEventListener("click", copyPrompt);
generateQuizBtn.addEventListener("click", handleGenerate);
showFeedbackBtn.addEventListener("click", renderInterviewFeedback);
exportQuizBtn.addEventListener("click", exportInterview);
importQuizBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", handleImportFile);

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

window.setTopic = function(val) {
  topicInput.value = val;
  topicInput.focus();
};

window.setConcept = function(val) {
  conceptInput.value = val;
  conceptInput.focus();
};

function copyPrompt() {
  const t = topicInput.value.trim();
  const c = conceptInput.value.trim();
  const d = difficultySelect.value;
  const num = numQuestionsInput.value || 10;
  const usePareto = paretoRuleCheckbox.checked;
  const additionalDescription = additionalDescriptionInput.value.trim();

  let rules = `1. Return ONLY valid JSON.
2. Do not include markdown.
3. Do not include explanations.
4. Questions must be open-ended interview questions, not MCQs.
5. Questions should test conceptual understanding, practical thinking, and problem-solving.
6. Use simple English.
7. Make all questions unique.
8. If a question includes code or multi-line content, keep it inside the JSON string using \\n escape sequences (do not break the JSON with literal line breaks).`;

  if (usePareto) {
    rules += `\n9. Apply the 80/20 rule (Pareto principle): focus exclusively on the most frequently asked, fundamental, and high-yield questions for this topic.`;
  }

  let prompt = `You are an expert interview question generator.

Generate exactly ${num} interview-style questions.

Topic:
${t}

Concept:
${c}

Difficulty:
${d}`;

  if (additionalDescription) {
    prompt += `\n\nAdditional Instructions:\n${additionalDescription}`;
  }

  const template = PROMPT_TEMPLATES[promptTemplateSelect.value] || PROMPT_TEMPLATES.standard;
  if (template.instructions) {
    prompt += `\n\nPrompt Template (${template.label}):\n${template.instructions}`;
  }

  prompt += `

Rules:
${rules}

Return:
{
  "title": "Interview Question Set Title",
  "questions": [
    {
      "questionNo": 1,
      "question": "Explain linear regression in simple terms."
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok ? "Prompt copied! Paste it into your favorite LLM." : "Copy failed — please copy the prompt manually.",
      ok ? "success" : "error"
    );
  });
}

function handleGenerate() {
  loadInterviewQuestions();
}

function loadInterviewQuestions() {
  try {
    interviewData = JSON.parse(jsonInput.value);
  } catch (error) {
    showToast("Invalid JSON. Please check what you pasted.", "error");
    return;
  }

  if (!interviewData || !Array.isArray(interviewData.questions)) {
    showToast("Invalid interview JSON format — expected a JSON object with a \"questions\" array.", "error");
    return;
  }

  interviewAnswers = [];
  interviewFeedbackData = null;

  feedbackJsonCard.classList.add("hidden");
  result.innerHTML = "";
  quizContainer.innerHTML = `<h2>${escapeHtml(interviewData.title || "Interview Questions")}</h2>`;

  interviewData.questions.forEach((q, i) => {
    quizContainer.innerHTML += `
      <div class="question interview-question">
        <h3>Question ${q.questionNo}</h3>
        <div class="question-text">${escapeHtml(q.question)}</div>
        <label for="answer-${i}" class="answer-label">Your Answer</label>

        <textarea
          id="answer-${i}"
          class="answer-input"
          placeholder="Write your answer here..."
        ></textarea>
      </div>
    `;
  });

  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyInterviewFeedbackPromptBtn">📋 Copy Feedback Prompt</button>
    </div>
  `;

  document
    .getElementById("copyInterviewFeedbackPromptBtn")
    .addEventListener("click", copyInterviewFeedbackPrompt);
}

function copyInterviewFeedbackPrompt() {
  if (!interviewData || !Array.isArray(interviewData.questions)) {
    showToast("Load interview questions first.", "error");
    return;
  }

  interviewAnswers = interviewData.questions.map((q, i) => ({
    questionNo: q.questionNo,
    question: q.question,
    answer: document.getElementById(`answer-${i}`)?.value.trim() || ""
  }));

  const prompt = `You are an expert technical interviewer and feedback evaluator.

Evaluate the candidate's answers for each interview question.

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown.
3. Do not include any text outside JSON.
4. Provide feedback for every question.
5. Give practical, concise, useful feedback.
6. Score each answer out of 10.
7. Mention strengths, mistakes, missing points, and how to improve.
8. Also provide an ideal short answer.

Interview title:
${interviewData.title || "Interview Questions"}

Candidate responses:
${JSON.stringify(interviewAnswers, null, 2)}

Return JSON in this exact structure:
{
  "title": "Interview Feedback",
  "overallFeedback": "Short overall feedback for the candidate",
  "results": [
    {
      "questionNo": 1,
      "question": "Question text",
      "userAnswer": "Candidate answer",
      "score": 7,
      "feedback": "Detailed feedback",
      "strengths": "What was good",
      "improvements": "What needs to improve",
      "idealAnswer": "A strong sample answer"
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    if (!ok) {
      showToast("Copy failed — please copy the prompt manually.", "error");
      return;
    }
    feedbackJsonCard.classList.remove("hidden");
    showToast("Interview feedback prompt copied! Now paste the AI feedback JSON below.");
  });
}

function renderInterviewFeedback() {
  if (!interviewData || !Array.isArray(interviewData.questions)) {
    showToast("Load interview questions first.", "error");
    return;
  }

  try {
    interviewFeedbackData = JSON.parse(feedbackJsonInput.value);
  } catch (error) {
    showToast("Invalid feedback JSON. Please check what you pasted.", "error");
    return;
  }

  if (!interviewFeedbackData || !Array.isArray(interviewFeedbackData.results)) {
    showToast("Invalid interview feedback JSON format — expected a JSON object with a \"results\" array.", "error");
    return;
  }

  quizContainer.innerHTML = `<h2>${escapeHtml(interviewFeedbackData.title || "Interview Feedback")}</h2>`;

  interviewFeedbackData.results.forEach((item) => {
    quizContainer.innerHTML += `
      <div class="question interview-feedback-card">
        <h3>Question ${item.questionNo}</h3>
        <div class="question-text">${escapeHtml(item.question || "")}</div>

        <div class="feedback-block">
          <div class="feedback-heading">Your Answer</div>
          <div class="answer-preview">${formatMultilineText(item.userAnswer || "No answer provided.")}</div>
        </div>

        <div class="feedback-grid">
          <div class="feedback-pill">
            <span class="pill-label">Score</span>
            <span class="pill-value">${escapeHtml(String(item.score ?? "-"))}/10</span>
          </div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">AI Feedback</div>
          <div>${formatMultilineText(item.feedback || "No feedback provided.")}</div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">Strengths</div>
          <div>${formatMultilineText(item.strengths || "Not provided.")}</div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">Lacks/Improvements</div>
          <div>${formatMultilineText(item.improvements || "Not provided.")}</div>
        </div>

        <div class="feedback-block">
          <div class="feedback-heading">Ideal Answer</div>
          <div>${formatMultilineText(item.idealAnswer || "Not provided.")}</div>
        </div>
      </div>
    `;
  });

  result.innerHTML = "";

  if (interviewFeedbackData.overallFeedback) {
    result.innerHTML = `
    <div class="overall-feedback-card">
      <h3>Overall Feedback</h3>
      <p>${escapeHtml(interviewFeedbackData.overallFeedback)}</p>
    </div>
    `;
  }

  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyAdaptiveBtn">🚀 Generate Harder Follow-up Interview</button>
      <button id="reloadInterviewBtn">Load New Interview</button>
    </div>
  `;
  document.getElementById("copyAdaptiveBtn").addEventListener("click", copyAdaptivePrompt);
  document.getElementById("reloadInterviewBtn").addEventListener("click", resetApp);

  feedbackJsonCard.classList.add("hidden");
}

function copyAdaptivePrompt() {
  if (!interviewFeedbackData || !Array.isArray(interviewFeedbackData.results)) {
    showToast("Show interview feedback first.", "error");
    return;
  }

  const t = topicInput.value.trim() || "the topic";
  const c = conceptInput.value.trim() || "the core concepts";
  const d = difficultySelect.value;
  const num = numQuestionsInput.value || (interviewData && interviewData.questions.length) || 10;

  const weak = interviewFeedbackData.results.filter((item) => Number(item.score) < 7);
  const baseList = (weak.length > 0 ? weak : interviewFeedbackData.results)
    .map((item) => `Q${item.questionNo}: ${item.question}`)
    .join("\n");

  const focusNote = weak.length > 0
    ? "The candidate scored below 7/10 on the following questions."
    : "The candidate performed well on all questions (score 7+/10).";

  const prompt = `You are an expert technical interviewer creating an adaptive follow-up interview.

The candidate just completed a ${d} difficulty interview on ${t} - ${c}. ${focusNote}

Questions to build on:
${baseList}

Generate exactly ${num} NEW open-ended interview questions that go a level deeper into the same topics and concepts. They must be meaningfully HARDER than ${d} difficulty — probing edge cases, trade-offs, deeper understanding, and problem-solving under pressure. Do not repeat any of the questions above.

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown.
3. Do not include explanations.
4. Questions must be open-ended interview questions, not MCQs.
5. Questions should test conceptual understanding, practical thinking, and problem-solving.
6. Use simple English.
7. Make all questions unique.
8. If a question includes code or multi-line content, keep it inside the JSON string using \\n escape sequences (do not break the JSON with literal line breaks).

Return:
{
  "title": "Interview Question Set Title",
  "questions": [
    {
      "questionNo": 1,
      "question": "Explain linear regression in simple terms."
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok
        ? "Adaptive follow-up prompt copied! Paste it into the LLM, then paste the returned JSON below."
        : "Copy failed — please copy the prompt manually.",
      ok ? "success" : "error"
    );
  });
}

function exportInterview() {
  let payload;
  let filename = "interview.json";

  if (interviewData && Array.isArray(interviewData.questions)) {
    payload = JSON.stringify(interviewData, null, 2);
    const title = (interviewData.title || "interview").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    filename = `interview-${title || "interview"}.json`;
  } else if (jsonInput.value.trim()) {
    payload = jsonInput.value;
  } else {
    showToast("Nothing to export. Load or paste interview questions first.", "error");
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
    showToast("Interview file imported! Click Generate Interview Questions to render it.");
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

function resetApp() {
  location.reload();
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
