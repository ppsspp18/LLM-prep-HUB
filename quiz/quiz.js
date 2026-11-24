let quizData;
let quizSubmitted = false;
let timerInterval = null;
let timeLeft = 0;

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
const enableTimerCheckbox = document.getElementById("enableTimer");
const timerMinutesInput = document.getElementById("timerMinutes");
const timerBar = document.getElementById("timerBar");

const feedbackPasteCard = document.getElementById("feedbackPasteCard");
const feedbackTextInput = document.getElementById("feedbackTextInput");
const renderFeedbackBtn = document.getElementById("renderFeedbackBtn");
const feedbackViewArea = document.getElementById("feedbackViewArea");

// Difficulty pill selector
difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    difficultyButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    difficultyInput.value = btn.dataset.value;
  });
});

copyPromptBtn.addEventListener("click", copyPrompt);
generateQuizBtn.addEventListener("click", handleGenerate);
if (renderFeedbackBtn) {
  renderFeedbackBtn.addEventListener("click", renderPastedFeedback);
}

enableTimerCheckbox.addEventListener("change", () => {
  timerMinutesInput.disabled = !enableTimerCheckbox.checked;
});
timerMinutesInput.disabled = true;

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
  const t = topicInput.value.trim() || "Computer Science Core";
  const c = conceptInput.value.trim() || "Key Concepts";
  const d = difficultyInput.value || "Medium";
  const num = numQuestionsInput.value || 10;
  const additional = additionalDescriptionInput.value.trim();

  let prompt = `You are an expert technical quiz generator.

Generate exactly ${num} high-quality multiple-choice questions to test deep technical understanding.

Topic: ${t}
Concept: ${c}
Difficulty: ${d}`;

  if (additional) {
    prompt += `\nAdditional Focus / Context:\n${additional}`;
  }

  prompt += `

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown code block syntax (like \`\`\`json).
3. Do not include explanations in the JSON.
4. Every question must have exactly four options.
5. Exactly one option must be correct.
6. correctOption must be an integer from 1 to 4.
7. Focus on conceptual clarity, real-world engineering trade-offs, and common pitfalls.
8. If code is needed, include it inside the question string using \\n escape sequences.

Return format:
{
  "title": "${t} - ${c} Quiz",
  "questions": [
    {
      "questionNo": 1,
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 1
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok ? "Prompt copied! Paste it into your LLM." : "Copy failed — please copy manually.",
      ok ? "success" : "error"
    );
  });
}

function handleGenerate() {
  loadQuiz();
}

function loadQuiz() {
  let rawText = jsonInput.value.trim();
  if (!rawText) {
    showToast("Please paste the quiz JSON first.", "error");
    return;
  }

  // Strip markdown code fences if LLM included them
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    quizData = JSON.parse(rawText);
  } catch (error) {
    showToast("Invalid JSON. Please ensure clean JSON without stray text.", "error");
    return;
  }

  if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    showToast("Invalid quiz format — expected a JSON object with a 'questions' array.", "error");
    return;
  }

  quizSubmitted = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerBar.classList.add("hidden");
  timerBar.classList.remove("timer-warning");

  result.innerHTML = "";
  feedbackViewArea.innerHTML = "";
  feedbackPasteCard.classList.add("hidden");
  quizContainer.innerHTML = `<h2>${escapeHtml(quizData.title || "Technical Quiz")}</h2>`;

  quizData.questions.forEach((q, i) => {
    let html = `<div class="question">
      <h3>Question ${q.questionNo || i + 1}</h3>
      <div class="question-text">${escapeHtml(q.question)}</div>`;

    if (!Array.isArray(q.options)) {
      html += `<p class="wrong">Invalid options data.</p></div>`;
      quizContainer.innerHTML += html;
      return;
    }

    q.options.forEach((option, j) => {
      html += `
        <label class="option">
          <input type="radio" name="q${i}" value="${j + 1}">
          <span class="option-content"><b>${String.fromCharCode(65 + j)}.</b> <span class="option-text">${escapeHtml(option)}</span></span>
        </label>
      `;
    });

    html += `<div class="feedback"></div></div>`;
    quizContainer.innerHTML += html;
  });

  submitArea.innerHTML = `<button id="submitQuizBtn">Submit Quiz</button>`;
  document.getElementById("submitQuizBtn").addEventListener("click", submitQuiz);

  if (enableTimerCheckbox.checked) {
    startTimer();
  }

  window.scrollTo({ top: quizContainer.offsetTop - 20, behavior: "smooth" });
  showToast(`${quizData.questions.length} questions loaded!`);
}

function submitQuiz() {
  if (quizSubmitted) return;
  quizSubmitted = true;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerBar.classList.add("hidden");

  let score = 0;

  document.querySelectorAll(".question").forEach((div, i) => {
    const q = quizData.questions[i];
    const labels = div.querySelectorAll(".option");
    const feedback = div.querySelector(".feedback");

    labels.forEach((label) => {
      label.classList.remove("correct-option", "wrong-option");
    });

    feedback.innerHTML = "";

    const selected = document.querySelector(`input[name="q${i}"]:checked`);

    if (selected) {
      const selectedValue = Number(selected.value);

      if (selectedValue === q.correctOption) {
        score++;
        labels[selectedValue - 1].classList.add("correct-option");
        feedback.innerHTML = `<p class="correct">✔ Correct</p>`;
      } else {
        labels[selectedValue - 1].classList.add("wrong-option");
        if (labels[q.correctOption - 1]) {
          labels[q.correctOption - 1].classList.add("correct-option");
        }
        feedback.innerHTML = `
          <p class="wrong">✘ Wrong</p>
          <p class="correct">Correct Answer: ${escapeHtml(q.options[q.correctOption - 1] || "")}</p>
        `;
      }
    } else {
      if (labels[q.correctOption - 1]) {
        labels[q.correctOption - 1].classList.add("correct-option");
      }
      feedback.innerHTML = `
        <p class="wrong">Not Attempted</p>
        <p class="correct">Correct Answer: ${escapeHtml(q.options[q.correctOption - 1] || "")}</p>
      `;
    }

    div.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
    });
  });

  const correctQuestions = [];
  quizData.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && Number(selected.value) === q.correctOption) {
      correctQuestions.push(q);
    }
  });

  result.innerHTML = `🎯 Final Score: ${score} / ${quizData.questions.length}`;
  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyKnowledgeGapBtn">📋 Copy Concept & Knowledge Gap Prompt</button>
      <button id="copyAdaptiveBtn" class="secondary-btn">🚀 Generate Harder Follow-up Quiz</button>
      <button id="reloadQuizBtn" class="secondary-btn">Load New Quiz</button>
    </div>
  `;

  document.getElementById("copyKnowledgeGapBtn").addEventListener("click", copyKnowledgeGapPrompt);
  document.getElementById("copyAdaptiveBtn").addEventListener("click", () => copyAdaptivePrompt(correctQuestions));
  document.getElementById("reloadQuizBtn").addEventListener("click", resetApp);

  feedbackPasteCard.classList.remove("hidden");
  window.scrollTo({ top: result.offsetTop - 20, behavior: "smooth" });
}

function copyKnowledgeGapPrompt() {
  if (!quizData || !Array.isArray(quizData.questions)) return;

  const t = topicInput.value.trim() || quizData.title || "the topic";
  const c = conceptInput.value.trim() || "the core concepts";

  const missedQuestions = [];

  quizData.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    let userAnswer = "Not Attempted";
    let wasCorrect = false;

    if (selected) {
      const selectedValue = Number(selected.value);
      userAnswer = q.options[selectedValue - 1] || "Selected option " + selectedValue;
      wasCorrect = selectedValue === q.correctOption;
    }

    if (!wasCorrect) {
      missedQuestions.push({
        questionNo: q.questionNo || i + 1,
        question: q.question,
        userAnswer,
        correctAnswer: q.options[q.correctOption - 1] || `Option ${q.correctOption}`
      });
    }
  });

  if (missedQuestions.length === 0) {
    const prompt = `I took a technical quiz on ${t} - ${c} and achieved 100% correct answers.
Please provide a single, concise synthesis of the advanced architectural nuances, edge cases, and next-level concepts I should explore to deepen my mastery.`;
    copyText(prompt).then((ok) => {
      showToast(
        ok ? "Perfect score prompt copied! Paste into LLM for advanced deep-dive." : "Copy failed.",
        ok ? "success" : "error"
      );
    });
    return;
  }

  let prompt = `You are an expert technical mentor.

I just took a technical quiz on "${t}" (${c}) and made mistakes on the following questions (out of ${quizData.questions.length} total):

`;

  missedQuestions.forEach((item) => {
    prompt += `Question ${item.questionNo}: ${item.question}\n`;
    prompt += `My Answer: ${item.userAnswer}\n`;
    prompt += `Correct Answer: ${item.correctAnswer}\n\n`;
  });

  prompt += `CRITICAL INSTRUCTIONS FOR YOUR FEEDBACK:
1. Single Unified Response: Provide your entire output as ONE cohesive, comprehensive response. Do NOT output separate, isolated answers for each question.
2. Teach the Forgotten Concepts (Don't just point out mistakes):
   - Identify the fundamental concepts, underlying principles, and mechanisms that I seem to have forgotten or misunderstood across these questions.
   - Explain each forgotten concept deeply and clearly from first principles with intuitive examples and mental models.
3. Diagnostic Pattern Analysis:
   - Explain the thinking traps, common misconceptions, or edge-case oversights that led to these errors.
4. Contextual Synthesis:
   - Tie the explanations directly back to why the correct answers make architectural/logical sense and why my choices fell short.
5. Actionable Rules to Remember:
   - Conclude with a clear bulleted cheat-sheet of 3-5 golden rules/heuristics to master these concepts and avoid repeating these mistakes in technical interviews and production.`;

  copyText(prompt).then((ok) => {
    showToast(
      ok
        ? "Concept & Knowledge Gap prompt copied! Paste it into your LLM for a unified explanation."
        : "Copy failed — please copy manually.",
      ok ? "success" : "error"
    );
  });
}

function copyAdaptivePrompt(correctQuestions) {
  if (!quizData || !Array.isArray(quizData.questions)) return;

  const t = topicInput.value.trim() || quizData.title || "the topic";
  const c = conceptInput.value.trim() || "the core concepts";
  const d = difficultyInput.value || "Medium";
  const num = numQuestionsInput.value || 10;

  const masteredList = correctQuestions
    .map((q, i) => `Q${q.questionNo || i + 1}: ${q.question}`)
    .join("\n");

  const prompt = `You are an expert technical quiz generator creating an adaptive follow-up quiz.

The user mastered the following questions on ${t} - ${c}:
${masteredList || "Basic concepts mastered."}

Generate exactly ${num} NEW multiple-choice questions that are meaningfully harder (advanced depth, edge cases, trade-offs, production scenarios). Do not repeat the questions above.

Rules:
1. Return ONLY valid JSON.
2. Do not include markdown code fences.
3. Exactly four options per question, exactly one correct.
4. correctOption must be 1 to 4.

Return:
{
  "title": "${t} - Advanced Adaptive Quiz",
  "questions": [
    {
      "questionNo": 1,
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctOption": 2
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok ? "Adaptive follow-up prompt copied! Paste it into your LLM." : "Copy failed.",
      ok ? "success" : "error"
    );
  });
}

function renderPastedFeedback() {
  const text = feedbackTextInput.value.trim();
  if (!text) {
    showToast("Please paste the AI feedback text first.", "error");
    return;
  }

  feedbackViewArea.innerHTML = `
    <div class="unified-feedback-card">
      <h2>🧠 AI Conceptual Feedback & Mastery Guide</h2>
      <div class="unified-feedback-body">${formatFeedbackText(text)}</div>
    </div>
  `;

  feedbackPasteCard.classList.add("hidden");
  window.scrollTo({ top: feedbackViewArea.offsetTop - 20, behavior: "smooth" });
  showToast("Feedback rendered!");
}

function formatFeedbackText(text) {
  let safe = escapeHtml(text);
  // Convert markdown bold **text** to <strong>
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Convert markdown headers ### to <h4> and ## to <h3>
  safe = safe.replace(/^### (.*$)/gim, "<h4>$1</h4>");
  safe = safe.replace(/^## (.*$)/gim, "<h3>$1</h3>");
  safe = safe.replace(/^# (.*$)/gim, "<h3>$1</h3>");
  // Convert bullet points
  safe = safe.replace(/^\s*[-*]\s+(.*$)/gim, "• $1");
  return safe.replace(/\n/g, "<br>");
}

function startTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  const minutes = parseInt(timerMinutesInput.value, 10) || 10;
  timeLeft = minutes * 60;
  timerBar.classList.remove("hidden");
  timerBar.classList.remove("timer-warning");
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 60) {
      timerBar.classList.add("timer-warning");
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (!quizSubmitted) {
        submitQuiz();
      }
    }
  }, 1000);
}

function updateTimerDisplay() {
  const remaining = Math.max(timeLeft, 0);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  timerBar.textContent = `⏱ Time Remaining: ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
