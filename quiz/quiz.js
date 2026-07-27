let quizData;

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

copyPromptBtn.addEventListener("click", copyPrompt);
generateQuizBtn.addEventListener("click", handleGenerate);

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
4. Every question must have exactly four options.
5. Exactly one option must be correct.
6. correctOption must be an integer from 1 to 4.
7. Make questions unique.
8. Use simple English.
9. If a question or option includes code or multi-line content, keep it inside the JSON string using \\n escape sequences (do not break the JSON with literal line breaks).`;

  if (usePareto) {
    rules += `\n10. Apply the 80/20 rule (Pareto principle): focus exclusively on the most frequently asked, fundamental, and high-yield questions for this topic.`;
  }

  let prompt = `You are an expert quiz generator.

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

  navigator.clipboard.writeText(prompt);
  alert("Prompt copied!");
}

function handleGenerate() {
  loadQuiz();
}

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
