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

const feedbackJsonCard = document.getElementById("feedbackJsonCard");
const feedbackJsonInput = document.getElementById("feedbackJsonInput");
const showFeedbackBtn = document.getElementById("showFeedbackBtn");

copyPromptBtn.addEventListener("click", copyPrompt);
generateQuizBtn.addEventListener("click", handleGenerate);
showFeedbackBtn.addEventListener("click", renderInterviewFeedback);

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

  navigator.clipboard.writeText(prompt);
  alert("Prompt copied!");
}

function handleGenerate() {
  loadInterviewQuestions();
}

function loadInterviewQuestions() {
  try {
    interviewData = JSON.parse(jsonInput.value);
  } catch (error) {
    alert("Invalid JSON");
    return;
  }

  if (!interviewData || !Array.isArray(interviewData.questions)) {
    alert("Invalid interview JSON format");
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
    alert("Load interview questions first.");
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

  navigator.clipboard.writeText(prompt);
  feedbackJsonCard.classList.remove("hidden");
  alert("Interview feedback prompt copied! Now paste the AI feedback JSON below.");
}

function renderInterviewFeedback() {
  if (!interviewData || !Array.isArray(interviewData.questions)) {
    alert("Load interview questions first.");
    return;
  }

  try {
    interviewFeedbackData = JSON.parse(feedbackJsonInput.value);
  } catch (error) {
    alert("Invalid feedback JSON");
    return;
  }

  if (!interviewFeedbackData || !Array.isArray(interviewFeedbackData.results)) {
    alert("Invalid interview feedback JSON format");
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

  submitArea.innerHTML = `<button id="reloadInterviewBtn">Load New Interview</button>`;
  document.getElementById("reloadInterviewBtn").addEventListener("click", resetApp);

  feedbackJsonCard.classList.add("hidden");
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
