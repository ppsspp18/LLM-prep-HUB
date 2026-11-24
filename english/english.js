let practiceData;
let testSubmitted = false;

const practiceTypeInput = document.getElementById("practiceType");
const practiceTypeButtons = document.querySelectorAll("#practiceTypeGroup .pill-btn");
const targetLevelInput = document.getElementById("targetLevel");
const targetLevelButtons = document.querySelectorAll("#targetLevelGroup .pill-btn");

const topicInput = document.getElementById("topic");
const numQuestionsInput = document.getElementById("numQuestions");
const additionalDescriptionInput = document.getElementById("additionalDescription");
const copyPromptBtn = document.getElementById("copyPromptBtn");

const jsonInput = document.getElementById("jsonInput");
const generateBtn = document.getElementById("generateBtn");

const practiceArea = document.getElementById("practiceArea");
const passageContainer = document.getElementById("passageContainer");
const questionsContainer = document.getElementById("questionsContainer");
const submitArea = document.getElementById("submitArea");
const result = document.getElementById("result");

const feedbackPasteCard = document.getElementById("feedbackPasteCard");
const feedbackTextInput = document.getElementById("feedbackTextInput");
const showFeedbackBtn = document.getElementById("showFeedbackBtn");
const feedbackViewArea = document.getElementById("feedbackViewArea");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

// Pill selection for practice type
practiceTypeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    practiceTypeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    practiceTypeInput.value = btn.dataset.value;
    // Adjust default question count
    if (btn.dataset.value.includes("Reading Comprehension")) {
      numQuestionsInput.value = 4;
    } else if (numQuestionsInput.value === "4") {
      numQuestionsInput.value = 6;
    }
  });
});

// Pill selection for target level
targetLevelButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    targetLevelButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    targetLevelInput.value = btn.dataset.value;
  });
});

copyPromptBtn.addEventListener("click", copyPrompt);
generateBtn.addEventListener("click", loadPractice);
if (showFeedbackBtn) {
  showFeedbackBtn.addEventListener("click", renderFeedback);
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

function updateStep(step) {
  [step1, step2, step3].forEach((el, i) => el.classList.toggle("active", i === step - 1));
}

function copyPrompt() {
  const mode = practiceTypeInput.value;
  const level = targetLevelInput.value;
  const topic = topicInput.value.trim() || "High-Yield CAT VARC & Modern Technology";
  const num = numQuestionsInput.value || (mode.includes("Reading Comprehension") ? 4 : 6);
  const additional = additionalDescriptionInput.value.trim();

  let isRC = mode.includes("Reading Comprehension");

  let prompt = `You are a premier CAT VARC mentor and executive technical communication coach.

Create an elite practice set designed to enhance verbal ability, critical reasoning, and reading comprehension for the CAT exam and top-tier tech job communication.

Practice Mode: ${mode}
Target Standard: ${level}
Topic / Domain: ${topic}
Number of Questions: ${num}`;

  if (additional) {
    prompt += `\nAdditional Focus / Directives:\n${additional}`;
  }

  if (isRC) {
    prompt += `

SPECIFIC INSTRUCTIONS FOR READING COMPREHENSION:
1. Provide a dense, intellectually stimulating, well-crafted passage (350 - 550 words) relevant to ${topic}. The prose should mirror the analytical style, vocabulary, and nuanced arguments found in CAT passages and premier tech/academic publications (Aeon, The Economist, ACM Queue, MIT Tech Review).
2. Generate exactly ${num} questions based strictly on the passage.
3. Questions must test:
   - Primary Purpose / Central Thesis
   - Subtle Inferences & Author's Attitude/Tone
   - Logical Extensions / Strengthening or Weakening Claims
   - Contextual meaning of key phrases
4. Distractors (wrong options) should be realistic CAT-style traps: partial truths, out-of-scope generalizations, extreme wording, or reversed causality.
5. Exactly one option must be unambiguously correct.`;
  } else {
    prompt += `

SPECIFIC INSTRUCTIONS FOR VERBAL ABILITY & TECH COMMUNICATION:
1. Generate exactly ${num} challenging questions testing:
   - Para Jumbles (logical sequence of 4-5 sentences with transitional links)
   - Critical Reasoning (identifying assumptions, paradoxes, flaws in logic)
   - Paragraph Summary / Completion
   - Technical Communication & Precision (eliminating ambiguity, grammatical parallelism, concise executive phrasing)
2. In each question, provide 4 options where exactly one is correct.`;
  }

  prompt += `

RULES FOR JSON:
1. Return ONLY valid JSON.
2. Do not include markdown code block syntax (like \`\`\`json).
3. Do not include explanations in this JSON response.
4. If multi-line content or code exists, keep it inside strings using \\n.
5. correctOption must be an integer from 1 to 4.

RETURN IN THIS EXACT JSON FORMAT:
{
  "title": "${mode} Practice: ${topic}",
  "type": "${isRC ? "rc" : "va"}",
  ${isRC ? '"passage": "Full passage text here...",' : ""}
  "questions": [
    {
      "questionNo": 1,
      "question": "Question text here",
      "options": [
        "A) Option A text",
        "B) Option B text",
        "C) Option C text",
        "D) Option D text"
      ],
      "correctOption": 1,
      "concept": "Specific concept tested (e.g. Primary Purpose, Inferences, Logical Flow, Parallelism)"
    }
  ]
}`;

  copyText(prompt).then((ok) => {
    showToast(
      ok ? "VARC Practice prompt copied! Paste it into your LLM." : "Copy failed — please copy manually.",
      ok ? "success" : "error"
    );
  });
}

function loadPractice() {
  let rawText = jsonInput.value.trim();
  if (!rawText) {
    showToast("Please paste the practice JSON first.", "error");
    return;
  }

  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    practiceData = JSON.parse(rawText);
  } catch (error) {
    showToast("Invalid JSON. Please ensure valid JSON without markdown wrapping.", "error");
    return;
  }

  if (!practiceData || !Array.isArray(practiceData.questions) || practiceData.questions.length === 0) {
    showToast("Invalid format — expected a JSON object with a 'questions' array.", "error");
    return;
  }

  testSubmitted = false;
  result.innerHTML = "";
  feedbackViewArea.innerHTML = "";
  feedbackPasteCard.classList.add("hidden");

  // Render Passage if present
  if (practiceData.passage) {
    passageContainer.innerHTML = `
      <div class="rc-passage-card">
        <div class="rc-passage-title">📖 Reading Comprehension Passage</div>
        <div class="rc-passage-body">${escapeHtml(practiceData.passage)}</div>
      </div>
    `;
    passageContainer.classList.remove("hidden");
  } else {
    passageContainer.innerHTML = "";
    passageContainer.classList.add("hidden");
  }

  // Render Questions
  questionsContainer.innerHTML = `<h2>${escapeHtml(practiceData.title || "Verbal Ability Practice")}</h2>`;

  practiceData.questions.forEach((q, i) => {
    let html = `
      <div class="question">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3>Question ${q.questionNo || i + 1}</h3>
          ${q.concept ? `<span class="concept-tag">${escapeHtml(q.concept)}</span>` : ""}
        </div>
        <div class="question-text">${escapeHtml(q.question)}</div>
    `;

    if (Array.isArray(q.options)) {
      q.options.forEach((opt, j) => {
        html += `
          <label class="option">
            <input type="radio" name="pq${i}" value="${j + 1}">
            <span class="option-content">
              <b>${String.fromCharCode(65 + j)}.</b> <span class="option-text">${escapeHtml(opt)}</span>
            </span>
          </label>
        `;
      });
    }

    html += `<div class="feedback"></div></div>`;
    questionsContainer.innerHTML += html;
  });

  submitArea.innerHTML = `<button id="submitTestBtn">Submit Test</button>`;
  document.getElementById("submitTestBtn").addEventListener("click", submitTest);

  practiceArea.classList.remove("hidden");
  updateStep(2);
  window.scrollTo({ top: practiceArea.offsetTop - 20, behavior: "smooth" });
  showToast(`${practiceData.questions.length} question(s) loaded! Read and answer.`);
}

function submitTest() {
  if (testSubmitted) return;
  testSubmitted = true;

  let score = 0;

  document.querySelectorAll("#questionsContainer .question").forEach((div, i) => {
    const q = practiceData.questions[i];
    const labels = div.querySelectorAll(".option");
    const feedback = div.querySelector(".feedback");

    labels.forEach((l) => l.classList.remove("correct-option", "wrong-option"));
    feedback.innerHTML = "";

    const selected = document.querySelector(`input[name="pq${i}"]:checked`);

    if (selected) {
      const selectedVal = Number(selected.value);
      if (selectedVal === q.correctOption) {
        score++;
        labels[selectedVal - 1].classList.add("correct-option");
        feedback.innerHTML = `<p class="correct">✔ Correct</p>`;
      } else {
        labels[selectedVal - 1].classList.add("wrong-option");
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

    div.querySelectorAll("input").forEach((inp) => (inp.disabled = true));
  });

  result.innerHTML = `🎯 Final Score: ${score} / ${practiceData.questions.length}`;

  submitArea.innerHTML = `
    <div class="action-buttons">
      <button id="copyVARCFeedbackPromptBtn">📋 Copy Concept & Knowledge Gap Prompt</button>
      <button id="reloadPracticeBtn" class="secondary-btn">Load New Practice</button>
    </div>
  `;

  document
    .getElementById("copyVARCFeedbackPromptBtn")
    .addEventListener("click", copyVARCFeedbackPrompt);
  document
    .getElementById("reloadPracticeBtn")
    .addEventListener("click", resetApp);

  feedbackPasteCard.classList.remove("hidden");
  updateStep(3);
  window.scrollTo({ top: result.offsetTop - 20, behavior: "smooth" });
}

function copyVARCFeedbackPrompt() {
  if (!practiceData || !Array.isArray(practiceData.questions)) return;

  const missedQuestions = [];

  practiceData.questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="pq${i}"]:checked`);
    let userAnswer = "Not Attempted";
    let wasCorrect = false;

    if (selected) {
      const selectedVal = Number(selected.value);
      userAnswer = q.options[selectedVal - 1] || "Option " + selectedVal;
      wasCorrect = selectedVal === q.correctOption;
    }

    if (!wasCorrect) {
      missedQuestions.push({
        questionNo: q.questionNo || i + 1,
        question: q.question,
        userAnswer,
        correctAnswer: q.options[q.correctOption - 1] || "Option " + q.correctOption,
        concept: q.concept || "Verbal / Reading Comprehension"
      });
    }
  });

  const title = practiceData.title || "VARC Practice";

  if (missedQuestions.length === 0) {
    const prompt = `I completed the practice set on "${title}" with 100% accuracy.
Please provide a single, sophisticated synthesis of advanced verbal nuance, critical reading tactics, and high-level rhetorical frameworks to further refine my comprehension for CAT and executive tech communication.`;
    copyText(prompt).then((ok) => {
      showToast(
        ok ? "100% score prompt copied! Paste into LLM for advanced refinement." : "Copy failed.",
        ok ? "success" : "error"
      );
    });
    return;
  }

  let prompt = `You are a master CAT VARC mentor and executive tech communication coach.

I just completed a Verbal Ability & Reading Comprehension practice set on "${title}". Below are the questions I got wrong or struggled with (out of ${practiceData.questions.length} total questions):

`;

  if (practiceData.passage) {
    prompt += `PASSAGE CONTEXT (Summary):
${practiceData.passage.slice(0, 400)}...

`;
  }

  missedQuestions.forEach((item) => {
    prompt += `Question ${item.questionNo} [Concept: ${item.concept}]:
${item.question}
My Answer: ${item.userAnswer}
Correct Answer: ${item.correctAnswer}

`;
  });

  prompt += `CRITICAL INSTRUCTIONS FOR YOUR FEEDBACK:
1. Single Unified Masterclass Response: Provide your entire feedback as ONE cohesive, unified master response. Do NOT output fragmented, isolated feedback for each question separately.
2. Teach the Concepts Forgotten / Rules Missed (Don't just point out mistakes):
   - Analyze the underlying reading comprehension principles, critical reasoning frameworks, or verbal/grammatical rules that I failed to apply across these questions.
   - Deeply explain each forgotten concept from first principles:
     * If Reading Comprehension: Explain how to accurately infer the author's primary argument, dissect tone/attitude without projecting assumptions, and spot CAT distractor traps (e.g. extreme language, scope distortion, reverse causality).
     * If Para Jumbles / Sentence Order: Explain transition markers, mandatory pairs, antecedent-pronoun consistency, and logical flow.
     * If Tech Communication / Grammar: Explain the rules of precision, parallelism, dangling modifiers, eliminating ambiguity, and concise corporate technical writing.
3. Diagnostic Analysis of My Thinking:
   - Explain why my chosen answers were tempting distractors and what cognitive bias, misinterpretation, or rush led to selecting them.
4. Unified Actionable Cheat-Sheet:
   - Conclude with a clear bulleted cheat-sheet of 3-5 golden rules and mental checklists to remember so I master these concepts and never make these mistakes again in the CAT exam or tech workplace.`;

  copyText(prompt).then((ok) => {
    showToast(
      ok
        ? "Concept & Knowledge Gap prompt copied! Paste into your LLM for a unified masterclass."
        : "Copy failed — please copy manually.",
      ok ? "success" : "error"
    );
  });
}

function renderFeedback() {
  const text = feedbackTextInput.value.trim();
  if (!text) {
    showToast("Please paste the AI feedback first.", "error");
    return;
  }

  feedbackViewArea.innerHTML = `
    <div class="unified-feedback-card">
      <h2>📚 AI Conceptual Masterclass & Verbal Mastery Guide</h2>
      <div class="unified-feedback-body">${formatFeedbackText(text)}</div>
    </div>
  `;

  feedbackPasteCard.classList.add("hidden");
  window.scrollTo({ top: feedbackViewArea.offsetTop - 20, behavior: "smooth" });
  showToast("Feedback rendered!");
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
