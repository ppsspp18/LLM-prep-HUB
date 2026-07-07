# LLM Quiz Generator

A lightweight HTML, CSS, and JavaScript application that converts AI-generated JSON into interactive quizzes or interview practice sessions.

The application itself does **not** call any LLM API. Instead, it generates prompts that can be copied into ChatGPT or any other Large Language Model (LLM). The returned JSON is then pasted into the application, which renders either:

- Multiple Choice Quiz
- Technical Interview Questions
- AI Interview Feedback

---

# Features

## MCQ Quiz Mode

- Generate an LLM prompt for quiz creation.
- Paste AI-generated JSON.
- Automatically render 10 multiple-choice questions.
- Submit answers.
- Instant scoring.
- Highlight correct and incorrect answers.
- Display final score.

---

## Interview Mode

- Generate an interview-question prompt.
- Paste interview-question JSON.
- Answer questions using:
  - Keyboard
  - Voice (Speech Recognition)
- Generate an AI feedback prompt containing all user answers.
- Paste AI feedback JSON.
- View detailed interview evaluation.

---

# Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Web Speech API (Speech Recognition)
- Clipboard API

No frameworks or external libraries are required.

---

# Project Structure

```
Quiz Generator HTML/
│
├── index.html
├── styles.css
├── script.js
└── README.md
```

---

# Application Workflow

The application has two independent workflows.

```
             User
               │
               ▼
       Select Mode
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
   MCQ Mode       Interview Mode
```

---

# MCQ Workflow

```
User
 │
 ▼
Enter Topic
Enter Concept
Select Difficulty
 │
 ▼
Copy Prompt
 │
 ▼
Paste prompt into ChatGPT
 │
 ▼
ChatGPT returns Quiz JSON
 │
 ▼
Paste JSON into application
 │
 ▼
Generate Quiz
 │
 ▼
Quiz Renderer
 │
 ▼
User Answers Questions
 │
 ▼
Submit Quiz
 │
 ▼
Score Calculation
 │
 ▼
Display Results
```

---

# Interview Workflow

```
User
 │
 ▼
Enter Topic
Enter Concept
Difficulty
 │
 ▼
Copy Interview Prompt
 │
 ▼
Paste into ChatGPT
 │
 ▼
Receive Interview JSON
 │
 ▼
Paste JSON
 │
 ▼
Generate Interview Questions
 │
 ▼
User Answers Questions
 │
 ▼
Typing OR Voice Input
 │
 ▼
Copy Feedback Prompt
 │
 ▼
Paste into ChatGPT
 │
 ▼
Receive Feedback JSON
 │
 ▼
Paste Feedback JSON
 │
 ▼
Render Interview Evaluation
```

---

# Technical Working

## 1. Prompt Generation

When the **Copy Prompt** button is pressed, JavaScript reads:

- Topic
- Concept
- Difficulty
- Selected Mode

Depending on the selected mode, it dynamically generates a prompt instructing an LLM to return JSON in a predefined structure.

The prompt is copied to the clipboard using the Clipboard API.

Example:

```
navigator.clipboard.writeText(prompt);
```

---

## 2. JSON Parsing

After the AI response is pasted, the application parses it using:

```
JSON.parse(jsonInput.value)
```

If parsing fails:

- Invalid JSON alert is shown.
- Rendering stops.

This guarantees that only valid JSON is processed.

---

## 3. Dynamic HTML Rendering

Questions are **not** hardcoded.

Instead, JavaScript loops through every question inside the JSON object and generates HTML dynamically.

Example flow:

```
questions[]
      │
      ▼
Loop
      │
      ▼
Create HTML
      │
      ▼
Insert into DOM
```

The rendered HTML includes:

- Question number
- Question text
- Options (MCQ mode)
- Answer textarea (Interview mode)

---

## 4. MCQ Evaluation

Each radio button stores its selected option.

When **Submit Quiz** is pressed:

- Every selected answer is compared with:

```
correctOption
```

inside the JSON.

Results are calculated as:

```
Selected Answer
        │
        ▼
Compare
        │
        ▼
correctOption
        │
 ┌──────┴──────┐
 │             │
Correct      Wrong
 │             │
 ▼             ▼
Score++   Highlight Correct Answer
```

Finally:

```
Final Score = Correct Answers / Total Questions
```

---

## 5. Interview Answer Collection

Every interview textarea has a unique ID.

Example:

```
answer-0
answer-1
answer-2
```

When generating the feedback prompt, JavaScript collects all answers into an array.

Example structure:

```
[
  {
    "questionNo":1,
    "question":"...",
    "answer":"..."
  }
]
```

This array is embedded directly into the prompt for the LLM.

---

## 6. Speech Recognition

Interview mode supports voice input using the browser's Web Speech API.

```
SpeechRecognition
```

or

```
webkitSpeechRecognition
```

depending on browser support.

Flow:

```
Start Speaking
      │
      ▼
Browser Microphone
      │
      ▼
Speech Recognition
      │
      ▼
Live Transcript
      │
      ▼
Textarea Updates
```

Features:

- Continuous recognition
- Interim results
- Final transcript
- Microphone status
- Error handling
- Permission handling

Only one microphone session can be active at a time.

---

## 7. Feedback Rendering

The AI-generated interview feedback is expected in JSON format.

The application renders:

- User Answer
- Score
- Feedback
- Strengths
- Improvements
- Ideal Answer

Every section is displayed inside a styled feedback card.

---

# JSON Formats

## MCQ JSON

```json
{
  "title": "Quiz Title",
  "questions": [
    {
      "questionNo": 1,
      "question": "Question",
      "options": [
        "A",
        "B",
        "C",
        "D"
      ],
      "correctOption": 2
    }
  ]
}
```

---

## Interview Questions JSON

```json
{
  "title": "Interview Questions",
  "questions": [
    {
      "questionNo": 1,
      "question": "Explain Linear Regression."
    }
  ]
}
```

---

## Interview Feedback JSON

```json
{
  "title": "Interview Feedback",
  "overallFeedback": "Good understanding.",
  "results": [
    {
      "questionNo": 1,
      "question": "...",
      "userAnswer": "...",
      "score": 8,
      "feedback": "...",
      "strengths": "...",
      "improvements": "...",
      "idealAnswer": "..."
    }
  ]
}
```

---

# Browser Compatibility

| Feature | Supported Browsers |
|----------|-------------------|
| HTML/CSS | All Modern Browsers |
| Clipboard API | Chrome, Edge, Firefox, Safari |
| Speech Recognition | Chrome, Edge |
| Dynamic Rendering | All Modern Browsers |

Speech Recognition may not be available in Firefox or Safari.

---

# Error Handling

The application validates user input and AI responses to avoid runtime errors.

Handled cases include:

- Invalid JSON
- Incorrect JSON structure
- Missing questions
- Missing options
- Missing microphone
- Microphone permission denied
- No speech detected
- Unsupported browser

---

# Security

To reduce the risk of HTML injection, all user-provided and AI-generated text is escaped before being inserted into the page.

The application converts special characters such as:

- `<`
- `>`
- `&`
- `'`
- `"`

into their corresponding HTML entities before rendering.

---

# Future Improvements

Possible enhancements include:

- Direct integration with OpenAI or other LLM APIs
- Export quiz results as PDF
- Timer-based quizzes
- Negative marking
- Question randomization
- Progress indicator
- Local storage for quiz history
- Dark mode
- Authentication and user profiles
- Result analytics and charts

---

# License

This project is intended for educational and learning purposes. You are free to modify and extend it according to your requirements.