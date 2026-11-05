// Demo data used until the FastAPI backend is live (NEXT_PUBLIC_USE_MOCKS=true).
// Shapes match the API contract in docs/specs so pages don't change when the backend lands.

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  match: number; // 0–100, from the Job matcher agent
  reasons: string[]; // plain-language explanation of the match
  gaps: string[]; // skills the user still needs
  source: string; // Adzuna, JSearch, Jooble, Greenhouse, Lever, Remotive, Arbeitnow
  postedDaysAgo: number;
  applyUrl: string;
  round: string[]; // evaluation steps from the posting
};

export type Resource = {
  id: string;
  skill: string;
  title: string;
  provider: string; // NPTEL, freeCodeCamp, MIT OpenCourseWare, Khan Academy, CS50, YouTube, MDN, ...
  language: string;
  format: "Video course" | "Lecture" | "Article" | "Practice";
  minutes: number;
  level: "Beginner" | "Intermediate";
  url: string;
  why: string; // from the Learning curator agent
  skillKey?: string; // quiz id for this skill
};

export type Task = {
  id: string;
  kind: "learn" | "quiz" | "practice" | "interview" | "apply";
  title: string;
  detail: string;
  minutes: number;
  href: string;
  resource?: string; // learning item this task opens
};

export const user = {
  name: "Ananya",
  city: "Hyderabad",
  language: "English + Hindi",
  minutesPerDay: 90,
  readiness: 62,
  readinessLastWeek: 48,
  streak: 4,
};

export const jobs: Job[] = [
  {
    id: "j1",
    title: "Associate Software Engineer",
    company: "Accenture",
    location: "Hyderabad",
    salary: "₹4.5–6 LPA",
    match: 86,
    reasons: ["Java and SQL from your projects", "Freshers from 2025–26 batches", "Your test shows you like structured problem-solving"],
    gaps: ["DSA: arrays and strings", "OOP interview questions"],
    source: "Adzuna",
    postedDaysAgo: 2,
    applyUrl: "#",
    round: ["Online assessment", "Technical interview", "HR interview"],
  },
  {
    id: "j2",
    title: "Frontend Developer Intern",
    company: "Razorpay",
    location: "Bengaluru · Hybrid",
    salary: "₹30k/month",
    match: 78,
    reasons: ["Your React portfolio project", "Internship, no experience needed"],
    gaps: ["JavaScript closures and async", "Git branching"],
    source: "Lever",
    postedDaysAgo: 1,
    applyUrl: "#",
    round: ["Take-home task", "Technical interview"],
  },
  {
    id: "j3",
    title: "Graduate Engineer Trainee",
    company: "Tata Consultancy Services",
    location: "Pan-India",
    salary: "₹3.6–7 LPA",
    match: 74,
    reasons: ["B.Tech CSE, 2026 batch", "Aptitude-heavy selection suits your test results"],
    gaps: ["Quantitative aptitude", "Communication: self-introduction"],
    source: "JSearch",
    postedDaysAgo: 4,
    applyUrl: "#",
    round: ["National qualifier test", "Technical + HR interview"],
  },
  {
    id: "j4",
    title: "Junior Data Analyst",
    company: "Swiggy",
    location: "Remote",
    match: 61,
    reasons: ["SQL from your coursework", "Remote role"],
    gaps: ["Excel pivot tables", "Basic statistics", "Python pandas"],
    source: "Remotive",
    postedDaysAgo: 6,
    applyUrl: "#",
    round: ["SQL test", "Case discussion"],
  },
];

export const resources: Resource[] = [
  {
    id: "r1",
    skill: "DSA: arrays and strings",
    title: "Programming, Data Structures and Algorithms using Python — weeks 2–3",
    provider: "NPTEL",
    language: "English, Hindi subtitles",
    format: "Lecture",
    minutes: 95,
    level: "Beginner",
    url: "https://nptel.ac.in",
    why: "Asked in Accenture's online assessment. Hindi subtitles match your setting.",
  },
  {
    id: "r2",
    skill: "DSA: arrays and strings",
    title: "Two-pointer and sliding-window practice set",
    provider: "freeCodeCamp",
    language: "English",
    format: "Practice",
    minutes: 40,
    level: "Beginner",
    url: "https://www.freecodecamp.org",
    why: "Short practice right after the lecture, before your quiz.",
  },
  {
    id: "r3",
    skill: "OOP interview questions",
    title: "Object-oriented programming in Java, explained in Hindi",
    provider: "YouTube",
    language: "Hindi",
    format: "Video course",
    minutes: 55,
    level: "Beginner",
    url: "https://www.youtube.com",
    why: "Your quiz score on inheritance was 2/5. This series uses everyday examples.",
  },
  {
    id: "r4",
    skill: "JavaScript closures and async",
    title: "Asynchronous JavaScript guide",
    provider: "MDN",
    language: "English",
    format: "Article",
    minutes: 30,
    level: "Intermediate",
    url: "https://developer.mozilla.org",
    why: "Razorpay's take-home uses promises and fetch.",
  },
  {
    id: "r5",
    skill: "Communication: self-introduction",
    title: "Structuring answers with the STAR method",
    provider: "Khan Academy",
    language: "English",
    format: "Video course",
    minutes: 20,
    level: "Beginner",
    url: "https://www.khanacademy.org",
    why: "Your last interview opened with a long pause. Practise a 60-second introduction.",
  },
];

export const today: Task[] = [
  { id: "t1", kind: "learn", title: "Arrays and strings, NPTEL week 2", detail: "Lecture · Hindi subtitles", minutes: 45, href: "/learn" },
  { id: "t2", kind: "quiz", title: "Quiz: arrays", detail: "8 questions · unlocks week 3", minutes: 10, href: "/learn" },
  { id: "t3", kind: "interview", title: "HR round in the interview room", detail: "Focus: eye contact while answering", minutes: 15, href: "/interview" },
  { id: "t4", kind: "apply", title: "Apply to Accenture", detail: "Closes Sunday", minutes: 10, href: "/jobs" },
];

export const week = [
  { day: "Thu 5", focus: "Arrays + HR round", tasks: 4 },
  { day: "Fri 6", focus: "Strings + aptitude", tasks: 3 },
  { day: "Sat 7", focus: "OOP in Java", tasks: 3 },
  { day: "Sun 8", focus: "Mock OA (timed)", tasks: 2 },
  { day: "Mon 9", focus: "Technical round in the room", tasks: 3 },
  { day: "Tue 10", focus: "Revise weak topics", tasks: 3 },
  { day: "Wed 11", focus: "Final mock interview", tasks: 2 },
];

export const questions = {
  hr: [
    "Hello Ananya, please have a seat. To begin, tell me a little about yourself.",
    "Why do you want to start your career with a services company like ours?",
    "Tell me about a time a project did not go to plan. What did you do?",
    "Where do you see yourself in three years?",
    "Do you have any questions for me?",
  ],
  technical: [
    "Let's start simple. What is the difference between an array and a linked list?",
    "How would you find the first repeating character in a string?",
    "Explain inheritance with an example from your own project.",
    "What happens when you type a URL into the browser and press enter?",
    "Walk me through the hardest bug you fixed recently.",
  ],
};

export type Report = {
  id: string;
  round: string;
  date: string;
  overall: number;
  previous: number;
  headline?: string;
  summary?: string | null;
  scores: { label: string; value: number; previous: number; measured?: boolean }[];
  gaze: { label: string; value: number }[];
  gazeMeasured?: boolean;
  moments: { t: string; kind: string; text: string }[];
  fixes: { title: string; lesson: { id: string; title: string; minutes: number; url: string } | null }[];
  transcript?: { q: string; a: string; followUp?: string | null; followUpAnswer?: string | null; score: number }[];
};

export const report: Report = {
  id: "demo",
  round: "HR round · in-person room",
  date: "5 Nov 2026",
  overall: 64,
  previous: 51,
  scores: [
    { label: "Answer quality", value: 68, previous: 55 },
    { label: "Eye contact", value: 58, previous: 41 },
    { label: "Voice and pace", value: 71, previous: 60 },
    { label: "Posture", value: 66, previous: 62 },
    { label: "Confidence", value: 59, previous: 47 },
  ],
  gaze: [
    { label: "Interviewer", value: 58 },
    { label: "Notes on desk", value: 17 },
    { label: "Floor", value: 14 },
    { label: "Away", value: 11 },
  ],
  moments: [
    { t: "0:12", kind: "good", text: "Clear greeting and sat upright before speaking." },
    { t: "1:05", kind: "fix", text: "Looked at the floor for 6 seconds while describing your project." },
    { t: "2:40", kind: "fix", text: "11 filler words (\"basically\", \"like\") in one answer." },
    { t: "3:58", kind: "good", text: "Used a real example with a result: \"cut load time by half\"." },
    { t: "5:20", kind: "fix", text: "Ended without asking the interviewer a question." },
  ],
  fixes: [
    { title: "Hold eye contact through the first sentence of every answer", lesson: { id: "r5", title: "Structuring answers with the STAR method", minutes: 20, url: "https://www.khanacademy.org" } },
    { title: "Replace \"basically\" with a two-second pause", lesson: { id: "r5", title: "Structuring answers with the STAR method", minutes: 20, url: "https://www.khanacademy.org" } },
    { title: "Prepare two questions to ask at the end", lesson: { id: "r5", title: "Structuring answers with the STAR method", minutes: 20, url: "https://www.khanacademy.org" } },
  ],
};
