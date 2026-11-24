# LLM Prep Hub: Tech Jobs & CAT VARC

A lightweight, zero-dependency static web application designed to help learners prepare for **Top Tech Jobs** and the **CAT Exam (VARC Section)** using any LLM (ChatGPT, Claude, Gemini) as the reasoning engine without requiring API keys.

---

## 🎨 Theme Palette

Built with an elegant, focused, high-contrast light theme:
- **Background**: `#FBF8F3` (warm ivory)
- **Surface**: `#F1ECE4` (warm stone)
- **Primary**: `#5C534A` (slate charcoal / deep taupe)
- **Accent**: `#C8BBA8` (soft sand border & accent)
- **Text**: `#2A2520` (high-contrast dark espresso)

---

## 🚀 Modes

### 1. 📝 Technical Quiz Mode (`quiz/quiz.html`)
- Generate targeted technical multiple-choice questions on any engineering subject (System Design, DSA, Operating Systems, Networking, Cloud).
- Simple pill-based difficulty selection (no `<select>` dropdowns).
- Instant scoring and answer key breakdown.
- **Unified Concept Feedback**: Generates a prompt instructing the LLM to output a **single comprehensive response** covering all missed questions, explaining forgotten theory from first principles with mental models and a revision cheat-sheet.

### 2. 🎤 Tech Interview Mode (`interview/interview.html`)
- Practice realistic open-ended technical and architectural interview questions (Junior, Mid-Level, Senior/Staff).
- Type comprehensive answers detailing trade-offs, architecture, and edge cases.
- **Unified Interview Evaluation**: Requests a single holistic critique from the LLM that diagnoses conceptual blind spots, missing non-functional requirements, and architectural frameworks.

### 3. 📖 CAT VARC & Tech English Mode (`english/english.html`)
- Completely redesigned from translation to **Verbal Ability & Reading Comprehension**:
  - **Reading Comprehension (RC)**: Dense, analytical passages (350-550 words) on technology, economics, AI ethics, and cognitive science with CAT-standard inference and central thesis questions.
  - **Verbal Ability**: Para Jumbles (sentence rearrangement), Critical Reasoning, Paragraph Summary, and Technical Communication & Writing Precision.
  - **Single Masterclass Feedback**: Synthesizes all mistakes into fundamental reading/reasoning principles forgotten, distractor traps to avoid, and golden rules for the CAT exam and the tech workplace.

---

## ⚡ How It Works

1. **Configure & Copy Prompt**: Set your topic, difficulty, and question count, then click **📋 Copy Prompt**.
2. **Generate with Any LLM**: Paste the prompt into ChatGPT, Claude, Gemini, or DeepSeek.
3. **Render in App**: Paste the returned JSON into the app to take the test or answer questions.
4. **Learn from Forgotten Concepts**: Click **📋 Copy Concept & Knowledge Gap Prompt** to get a single unified masterclass explanation directly addressing your conceptual gaps.

---

## 💻 Running Locally

Serve over a local HTTP server:

```bash
# Python 3
python -m http.server 5500
```

Then visit [http://localhost:5500](http://localhost:5500) in your browser.
