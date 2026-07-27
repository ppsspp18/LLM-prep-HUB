# LLM Quiz Generator

A lightweight, static HTML/CSS/JS tool for generating and taking quizzes or interview-style Q&A sessions using any LLM (ChatGPT, Claude, Gemini, etc.) as the question/answer engine.

## How it works

1. **Configure** your topic, concept, difficulty, number of questions, and (optionally) any additional description/instructions.
2. Click **📋 Copy Prompt** — this copies a ready-made prompt to your clipboard.
3. Paste that prompt into your favorite LLM chat.
4. Copy the JSON the LLM returns and paste it into the **Paste JSON Response** box.
5. Click **Generate** to render the quiz or interview questions.
6. For MCQ quizzes: answer the questions and click **Submit Quiz** to see your score.
   - Use **📋 Copy Response for Knowledge Gap** to copy a prompt (containing only the questions you got wrong or skipped) back to the LLM for a focused theory explanation of your mistakes.
 7. For Interview mode: type your answers, then use **📋 Copy Feedback Prompt** to get AI-graded feedback, and paste the returned JSON to view detailed feedback per question.


## Features

- MCQ quiz mode and open-ended Interview Q&A mode
- Optional 80/20 (Pareto) rule toggle to focus on high-yield concepts
- Optional additional description field for custom instructions to the LLM
- Proper rendering of multi-line questions/options (e.g. code snippets) using `\n` in the JSON
- Knowledge-gap prompt generation focused only on missed questions, requesting theory explanations
- Fully responsive UI

## Running locally

Because the app uses the Clipboard API, it works best served over `http://localhost` or `https://`, not opened directly as a `file://` URL in some browsers.

```bash
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

> **Tip:** If you update `script.js`/`styles.css` while the server is running and don't see changes, do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R) — some browsers aggressively cache static files served by simple dev servers.

## Project structure

```
index.html    - App markup/UI
script.js     - App logic (prompt generation, quiz rendering, scoring, speech input)
styles.css    - Styling
README.md     - This file
```
