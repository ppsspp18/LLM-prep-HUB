let quizData;
let interviewData;
let interviewAnswers = [];
let interviewFeedbackData;

/* =========================
   SPEECH RECOGNITION STATE
========================= */
let activeRecognition = null;
let activeMicButton = null;
let activeAnswerInput = null;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const modeSelect = document.getElementById("mode");
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
const jsonSectionTitle = document.getElementById("jsonSectionTitle");

const feedbackJsonCard = document.getElementById("feedbackJsonCard");
const feedbackJsonInput = document.getElementById("feedbackJsonInput");
const showFeedbackBtn = document.getElementById("showFeedbackBtn");

copyPromptBtn.addEventListener("click", copyPrompt);
generateQuizBtn.addEventListener("click", handleGenerate);
modeSelect.addEventListener("change", updateModeUI);
showFeedbackBtn.addEventListener("click", renderInterviewFeedback);

updateModeUI();

function updateModeUI() {
  const mode = modeSelect.value;

  clearOutput();

  if (mode === "mcq") {
    jsonSectionTitle.textContent = "Paste JSON Response";
    generateQuizBtn.textContent = "Generate Quiz";
    jsonInput.placeholder = "Paste MCQ quiz JSON here...";
  } else {
    jsonSectionTitle.textContent = "Paste Interview Questions JSON";
    generateQuizBtn.textContent = "Generate Interview Questions";
    jsonInput.placeholder = "Paste interview questions JSON here...";
  }

  feedbackJsonCard.classList.add("hidden");
}

function clearOutput() {
  stopActiveRecognition();
  quizContainer.innerHTML = "";
  submitArea.innerHTML = "";
  result.innerHTML = "";
  feedbackJsonInput.value = "";
}

function copyPrompt() {
  const mode = modeSelect.value;
  const t = topicInput.value.trim();
  const c = conceptInput.value.trim();
  const d = difficultySelect.value;
  const num = numQuestionsInput.value || 10;
  const usePareto = paretoRuleCheckbox.checked;
  const additionalDescription = additionalDescriptionInput.value.trim();

  let prompt = "";

  if (mode === "mcq") {
    let rules = `1. Return ONLY valid JSON.
2. Do not include markdown.
3. Do not include explanations.
4. Every question must have exactly four options.
5. Exactly one option must be correct.
6. correctOption must be an integer from 1 to 4.
7. Make questions unique.
8. Use simple English.
9. If a question or option includes code or multi-line content, keep it inside the JSON string using \\n escape sequences (do not break the JSON with literal line breaks).`;

    if (usePareto) {
      rules += `\n10. Apply the 80/20 rule (Pareto principle): focus exclusively on the most frequently asked, fundamental, and high-yield questions for this topic.`;
    }

    prompt = `You are an expert quiz generator.

Generate exactly ${num} multiple-choice questions.

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
  "title": "Quiz Title",
  "questions": [
    {
      "questionNo": 1,
      "question": "Question",
      "options": ["A", "B", "C", "D"],
      "correctOption": 2
    }
  ]
}`;
  } else {
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

    prompt = `You are an expert interview question generator.

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
  }

  navigator.clipboard.writeText(prompt);
  alert("Prompt copied!");
}

function handleGenerate() {
  const mode = modeSelect.value;
  if (mode === "mcq") {
    loadQuiz();
  } else {
    loadInterviewQuestions();
  }
}

/* =========================
   MCQ QUIZ FLOW
========================= */

function loadQuiz() {
  try {
    quizData = JSON.parse(jsonInput.value);
  } catch (error) {
    alert("Invalid JSON");
    return;
  }

  if (!quizData || !Array.isArray(quizData.questions)) {
    alert("Invalid quiz format");
    return;
  }

  stopActiveRecognition();
  feedbackJsonCard.classList.add("hidden");
  result.innerHTML = "";
  quizContainer.innerHTML = `<h2>${escapeHtml(quizData.title || "Quiz")}</h2>`;

  quizData.questions.forEach((q, i) => {
    let html = `<div class="question">
      <h3>Question ${q.questionNo}</h3>
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
}

function submitQuiz() {
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

  result.innerHTML = `🎯 Final Score: ${score} / ${quizData.questions.length}`;
  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyKnowledgeGapBtn">📋 Copy Response for Knowledge Gap</button>
      <button id="reloadQuizBtn">Load New Quiz</button>
    </div>
  `;

  document.getElementById("copyKnowledgeGapBtn").addEventListener("click", copyKnowledgeGapPrompt);
  document.getElementById("reloadQuizBtn").addEventListener("click", resetApp);
}

function copyKnowledgeGapPrompt() {
  if (!quizData || !Array.isArray(quizData.questions)) return;

  const t = topicInput.value.trim() || "the topic";
  const c = conceptInput.value.trim() || "the core concepts";

  const missedQuestions = [];

  quizData.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    let userAnswer = "Not Attempted";
    let wasCorrect = false;

    if (selected) {
      const selectedValue = Number(selected.value);
      userAnswer = q.options[selectedValue - 1];
      wasCorrect = selectedValue === q.correctOption;
    }

    if (!wasCorrect) {
      missedQuestions.push({
        questionNo: q.questionNo,
        question: q.question,
        userAnswer,
        correctAnswer: q.options[q.correctOption - 1]
      });
    }
  });

  if (missedQuestions.length === 0) {
    const prompt = `I just took a multiple-choice quiz on ${t} - ${c} and answered every question correctly. Please give me a short, encouraging summary of the key concepts this quiz covered, and suggest 2-3 slightly more advanced or related topics I could explore next to deepen my understanding.`;
    navigator.clipboard.writeText(prompt);
    alert("Prompt copied! (You got a perfect score, so this asks for next-step topics instead.)");
    return;
  }

  let resultsText = `I just took a multiple-choice quiz on ${t} - ${c}. Below are ONLY the questions I got wrong or did not attempt, out of ${quizData.questions.length} total questions.\n\n`;

  missedQuestions.forEach((item) => {
    resultsText += `Q${item.questionNo}: ${item.question}\n`;
    resultsText += `My Answer: ${item.userAnswer}\n`;
    resultsText += `Correct Answer: ${item.correctAnswer}\n\n`;
  });

  resultsText += `Based on these mistakes, please act as an expert tutor and help me close my knowledge gaps. For each question above:
1. Explain the underlying theory/concept in simple, clear terms.
2. Explain specifically why my answer was wrong (if I attempted it) and why the correct answer is right.
3. Walk through any relevant code or logic step by step where applicable.
4. Point out common misconceptions that lead to this kind of mistake.

Then, at the end, give a short summary of the overall concepts I should review to master this topic.`;

  navigator.clipboard.writeText(resultsText);
  alert("Knowledge gap prompt copied! Paste this into the LLM to get an explanation focused on your mistakes.");
}

/* =========================
   INTERVIEW FLOW
========================= */

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

  stopActiveRecognition();
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

        <div class="answer-toolbar">
          <button
            type="button"
            class="mic-btn"
            data-answer-id="answer-${i}"
          >
            🎤 Start Speaking
          </button>
          <span class="mic-status" id="mic-status-${i}">Mic idle</span>
        </div>

        <textarea
          id="answer-${i}"
          class="answer-input"
          placeholder="Write your answer here or use the mic..."
        ></textarea>
      </div>
    `;
  });

  bindMicButtons();

  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyInterviewFeedbackPromptBtn">📋 Copy Feedback Prompt</button>
    </div>
  `;

  document
    .getElementById("copyInterviewFeedbackPromptBtn")
    .addEventListener("click", copyInterviewFeedbackPrompt);
}

function bindMicButtons() {
  const micButtons = document.querySelectorAll(".mic-btn");
  micButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const answerId = btn.dataset.answerId;
      const answerInput = document.getElementById(answerId);
      const statusEl = btn.parentElement.querySelector(".mic-status");

      toggleSpeechRecognition(answerInput, btn, statusEl);
    });
  });
}

function toggleSpeechRecognition(answerInput, micBtn, statusEl) {
  if (!SpeechRecognition) {
    alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
    return;
  }

  if (activeRecognition && activeMicButton === micBtn) {
    stopActiveRecognition();
    return;
  }

  if (activeRecognition) {
    stopActiveRecognition();
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  const originalText = answerInput.value.trim();
  let finalTranscript = "";

  activeRecognition = recognition;
  activeMicButton = micBtn;
  activeAnswerInput = answerInput;

  micBtn.classList.add("recording");
  micBtn.textContent = "⏹ Stop Speaking";
  if (statusEl) statusEl.textContent = "Listening...";

  recognition.onresult = (event) => {
    let interimTranscript = "";
    let confirmedTranscript = finalTranscript;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        confirmedTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    finalTranscript = confirmedTranscript;

    const combined = [originalText, confirmedTranscript.trim(), interimTranscript.trim()]
      .filter(Boolean)
      .join(originalText ? " " : " ")
      .trim();

    answerInput.value = combined;
  };

  recognition.onerror = (event) => {
    let message = "Speech recognition error.";
    if (event.error === "not-allowed") {
      message = "Microphone access was denied. Please allow mic permission and try again.";
    } else if (event.error === "no-speech") {
      message = "No speech detected. Please try speaking again.";
    } else if (event.error === "audio-capture") {
      message = "No microphone was found or microphone is unavailable.";
    }

    if (statusEl) statusEl.textContent = "Mic error";
    alert(message);
    stopActiveRecognition();
  };

  recognition.onend = () => {
    if (activeRecognition === recognition) {
      resetMicUI(statusEl);
    }
  };

  recognition.start();
}

function stopActiveRecognition() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (error) {
      // Ignore stop errors from browser speech engine
    }
  }
  resetMicUI();
}

function resetMicUI(statusEl = null) {
  if (activeMicButton) {
    activeMicButton.classList.remove("recording");
    activeMicButton.textContent = "🎤 Start Speaking";
  }

  if (statusEl) {
    statusEl.textContent = "Mic idle";
  } else if (activeMicButton) {
    const siblingStatus = activeMicButton.parentElement?.querySelector(".mic-status");
    if (siblingStatus) siblingStatus.textContent = "Mic idle";
  }

  activeRecognition = null;
  activeMicButton = null;
  activeAnswerInput = null;
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
      "improvements": "What needs improvement",
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

  stopActiveRecognition();
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
          <div class="feedback-heading">Improvements</div>
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

/* =========================
   HELPERS
========================= */

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
