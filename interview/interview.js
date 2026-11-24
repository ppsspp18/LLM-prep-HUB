let interviewData;
let interviewAnswers = [];

const topicInput = document.getElementById("topic");
const conceptInput = document.getElementById("concept");
const difficultyInput = document.getElementById("difficulty");
const difficultyButtons = document.querySelectorAll("#difficultyGroup .pill-btn");
const numQuestionsInput = document.getElementById("numQuestions");
const additionalDescriptionInput = document.getElementById("additionalDescription");

const jsonInput = document.getElementById("jsonInput");
const quizContainer = document.getElementById("quiz");
const submitArea = document.getElementById("submitArea");
const result = document.getElementById("result");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const generateQuizBtn = document.getElementById("generateQuizBtn");

const feedbackPasteCard = document.getElementById("feedbackPasteCard");
const feedbackTextInput = document.getElementById("feedbackTextInput");
const showFeedbackBtn = document.getElementById("showFeedbackBtn");
const feedbackViewArea = document.getElementById("feedbackViewArea");

// Difficulty pills
difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    difficultyButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    difficultyInput.value = btn.dataset.value;
  });
});

copyPromptBtn.addEventListener("click", copyPrompt);
generateQuizBtn.addEventListener("click", handleGenerate);
if (showFeedbackBtn) {
  showFeedbackBtn.addEventListener("click", renderInterviewFeedback);
}

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
  const t = topicInput.value.trim() || "Software Engineering";
  const c = conceptInput.value.trim() || "System Design & Architecture";
  const d = difficultyInput.value || "Medium";
  const num = numQuestionsInput.value || 5;
  const additional = additionalDescriptionInput.value.trim();

  let prompt = `You are a Principal Engineer and technical interviewer at a top technology company.

Generate exactly ${num} open-ended, realistic technical interview questions designed for a ${d} level candidate.

Role / Subject: ${t}
Core Focus: ${c}
Target Level: ${d}`;

  if (additional) {
    prompt += `\nAdditional Focus / Context:\n${additional}`;
  }

  prompt += `

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown code block formatting (like \`\`\`json).
3. Questions must be open-ended engineering questions that probe trade-offs, architecture, and practical experience (NOT multiple-choice).
4. Do not include answers or explanations in this JSON.
5. If code snippets are required, use \\n escape sequences.

Return format:
{
  "title": "${t} - Technical Interview",
  "questions": [
    {
      "questionNo": 1,
      "question": "Question text here..."
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok ? "Interview prompt copied! Paste it into your LLM." : "Copy failed.",
      ok ? "success" : "error"
    );
  });
}

function handleGenerate() {
  loadInterviewQuestions();
}

function loadInterviewQuestions() {
  let rawText = jsonInput.value.trim();
  if (!rawText) {
    showToast("Please paste the interview questions JSON first.", "error");
    return;
  }

  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    interviewData = JSON.parse(rawText);
  } catch (error) {
    showToast("Invalid JSON. Please check what you pasted.", "error");
    return;
  }

  if (!interviewData || !Array.isArray(interviewData.questions) || interviewData.questions.length === 0) {
    showToast("Invalid interview JSON — expected a 'questions' array.", "error");
    return;
  }

  interviewAnswers = [];
  feedbackPasteCard.classList.add("hidden");
  feedbackViewArea.innerHTML = "";
  result.innerHTML = "";
  quizContainer.innerHTML = `<h2>${escapeHtml(interviewData.title || "Technical Interview")}</h2>`;

  interviewData.questions.forEach((q, i) => {
    quizContainer.innerHTML += `
      <div class="question interview-question">
        <h3>Question ${q.questionNo || i + 1}</h3>
        <div class="question-text">${escapeHtml(q.question)}</div>
        <label for="answer-${i}" class="answer-label">Your Answer</label>
        <textarea
          id="answer-${i}"
          class="answer-input"
          placeholder="Type your structured technical answer (mention trade-offs, design choices, mechanisms)..."
        ></textarea>
      </div>
    `;
  });

  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyInterviewFeedbackPromptBtn">📋 Copy Comprehensive Feedback Prompt</button>
      <button id="reloadInterviewBtn" class="secondary-btn">Load New Questions</button>
    </div>
  `;

  document
    .getElementById("copyInterviewFeedbackPromptBtn")
    .addEventListener("click", copyInterviewFeedbackPrompt);
  document
    .getElementById("reloadInterviewBtn")
    .addEventListener("click", resetApp);

  window.scrollTo({ top: quizContainer.offsetTop - 20, behavior: "smooth" });
  showToast(`${interviewData.questions.length} question(s) loaded! Answer them and request feedback.`);
}

function copyInterviewFeedbackPrompt() {
  if (!interviewData || !Array.isArray(interviewData.questions)) {
    showToast("Load interview questions first.", "error");
    return;
  }

  interviewAnswers = interviewData.questions.map((q, i) => ({
    questionNo: q.questionNo || i + 1,
    question: q.question,
    answer: document.getElementById(`answer-${i}`)?.value.trim() || "(No answer provided)"
  }));

  const t = topicInput.value.trim() || interviewData.title || "Technical Interview";
  const c = conceptInput.value.trim() || "Technical Concepts";

  let prompt = `You are a Principal Engineer and technical interviewer evaluating candidate responses for a tech job interview on "${t}" (${c}).

Candidate responses to evaluate:
${JSON.stringify(interviewAnswers, null, 2)}

CRITICAL INSTRUCTIONS FOR YOUR FEEDBACK:
1. Single Unified Response: Provide your entire feedback as ONE cohesive, unified master evaluation. Do NOT output fragmented or separate responses for each individual question.
2. Teach the Concepts Forgotten / Gaps in Understanding:
   - Identify the fundamental architectural, system design, or engineering concepts that the candidate missed, forgot, or explained superficially across all their answers.
   - Deeply explain each forgotten concept from first principles with clear real-world engineering intuition, architectural trade-offs, and mental models.
3. Diagnostic Synthesis of Answers:
   - Synthesize the candidate's answers as a whole: point out strong areas, critical gaps in depth, missing non-functional requirements (e.g. latency, consistency, failure modes, scalability), and flawed assumptions.
4. Exemplary Architectural Frameworks:
   - Show how a Senior / Staff engineer structures the thought process for these challenges.
5. Actionable Roadmap & Rules:
   - Conclude with 3-5 core engineering heuristics and a targeted revision checklist so the candidate completely closes these conceptual gaps before their real interview.`;

  copyText(prompt).then((ok) => {
    if (!ok) {
      showToast("Copy failed — please copy manually.", "error");
      return;
    }
    feedbackPasteCard.classList.remove("hidden");
    window.scrollTo({ top: feedbackPasteCard.offsetTop - 20, behavior: "smooth" });
    showToast("Feedback prompt copied! Paste into your LLM, then paste the response below.");
  });
}

function renderInterviewFeedback() {
  const text = feedbackTextInput.value.trim();
  if (!text) {
    showToast("Please paste the AI feedback first.", "error");
    return;
  }

  feedbackViewArea.innerHTML = `
    <div class="unified-feedback-card">
      <h2>🎯 AI Technical Interview Evaluation & Conceptual Guide</h2>
      <div class="unified-feedback-body">${formatFeedbackText(text)}</div>
    </div>
  `;

  feedbackPasteCard.classList.add("hidden");
  window.scrollTo({ top: feedbackViewArea.offsetTop - 20, behavior: "smooth" });
  showToast("Interview feedback rendered!");
}

function formatFeedbackText(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/^### (.*$)/gim, "<h4>$1</h4>");
  safe = safe.replace(/^## (.*$)/gim, "<h3>$1</h3>");
  safe = safe.replace(/^# (.*$)/gim, "<h3>$1</h3>");
  safe = safe.replace(/^\s*[-*]\s+(.*$)/gim, "• $1");
  return safe.replace(/\n/g, "<br>");
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
