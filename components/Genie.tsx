"use client";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Mic, Send, X } from "lucide-react";
import { Wheel } from "./Logo";
import { useApp } from "@/lib/store";
import { useT } from "@/lib/i18n";

type Msg = { from: "you" | "saarathi"; text: string };

// Demo replies. In production every message goes to the Genie agent (AgentFoundry) via FastAPI,
// which routes to the Job matcher, Learning curator or Prep planner and replies in the user's language.
const replies: { match: RegExp; en: string; hi: string }[] = [
  {
    match: /today|aaj|आज|do/i,
    en: "Today: finish NPTEL week 2 on arrays (45 min), take the arrays quiz, then one HR round in the interview room. Your Accenture application closes Sunday.",
    hi: "आज: NPTEL वीक 2 (ऐरे, 45 मिनट) पूरा करें, फिर ऐरे क्विज़, फिर इंटरव्यू रूम में एक HR राउंड। Accenture का आवेदन रविवार को बंद होगा।",
  },
  {
    match: /job|naukri|नौकरी/i,
    en: "3 new matches since yesterday. Best fit: Frontend Developer Intern at Razorpay, 78% match, because of your React project.",
    hi: "कल से 3 नई नौकरियाँ मिलीं। सबसे अच्छी: Razorpay में Frontend Developer Intern, 78% मैच, आपके React प्रोजेक्ट की वजह से।",
  },
  {
    match: /nervous|scared|give up|डर|घबरा/i,
    en: "That's a very normal feeling before interviews. Let's take three slow breaths together. If it feels heavy, Tele-MANAS is free and confidential at 14416.",
    hi: "इंटरव्यू से पहले घबराहट होना बिल्कुल सामान्य है। चलिए साथ में तीन धीमी साँसें लेते हैं। अगर बोझ भारी लगे, तो Tele-MANAS 14416 पर मुफ़्त बात कर सकते हैं।",
  },
];
const fallback = {
  en: "I can tell you what to do today, find new jobs, or explain a topic simply. Try one of the suggestions below.",
  hi: "मैं बता सकता हूँ कि आज क्या करना है, नई नौकरियाँ ढूँढ सकता हूँ, या कोई टॉपिक आसान भाषा में समझा सकता हूँ।",
};

export function Genie() {
  const lang = useApp((s) => s.lang);
  const t = useT();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const r = replies.find((x) => x.match.test(text));
    const answer = r ? r[lang] : fallback[lang];
    setMsgs((m) => [...m, { from: "you", text }, { from: "saarathi", text: answer }]);
    setInput("");
    // Placeholder voice. Replace with Sarvam/Bhashini TTS audio from the backend.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(answer);
      u.lang = lang === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };

  const suggestions = lang === "hi" ? ["आज मुझे क्या करना है?", "कोई नई नौकरी?", "मुझे घबराहट हो रही है"] : ["What do I do today?", "Any new jobs?", "I'm nervous about interviews"];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="genie-panel"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-pill bg-peacock-deep p-2 sm:pr-4 font-display font-semibold text-paper shadow-[0_6px_20px_rgba(10,63,76,0.35)] md:bottom-6 md:right-6"
      >
        <Wheel className="h-8 w-8" light />
        <span className="hidden sm:inline">{t("askGenie")}</span>
        <span className="sr-only sm:hidden">{t("askGenie")}</span>
      </button>

      {open && (
        <section
          id="genie-panel"
          aria-label="Saarathi assistant"
          className="fixed inset-x-3 bottom-36 z-30 flex max-h-[70vh] flex-col overflow-hidden rounded-[20px] border border-line bg-paper shadow-[0_18px_50px_rgba(20,33,43,0.22)] md:inset-x-auto md:bottom-24 md:right-6 md:w-[380px]"
        >
          <header className="flex items-center justify-between bg-peacock-deep px-4 py-3 text-paper">
            <p className="font-display text-[1.05rem] font-semibold">Saarathi</p>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-pill p-1 hover:bg-paper/10">
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {msgs.length === 0 && (
              <p className="text-ink-soft">
                {lang === "hi" ? "नमस्ते! हिंदी या अंग्रेज़ी में बोलें या लिखें।" : "Speak or type in English or Hindi. Telugu and Tamil are coming next."}
              </p>
            )}
            {msgs.map((m, i) => (
              <p
                key={i}
                className={clsx(
                  "max-w-[85%] rounded-[16px] px-3.5 py-2 text-[0.98rem]",
                  m.from === "you" ? "ml-auto bg-peacock text-paper" : "bg-mist text-ink"
                )}
              >
                {m.text}
              </p>
            ))}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-pill bg-peacock-wash px-3 py-1 text-[0.88rem] text-peacock-deep hover:bg-peacock hover:text-paper">
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-center gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <button type="button" aria-label="Speak (voice input)" className="rounded-pill bg-mist p-2.5 text-peacock-deep hover:bg-peacock-wash">
              <Mic className="h-5 w-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "hi" ? "कुछ भी पूछें…" : "Ask anything…"}
              className="min-w-0 flex-1 rounded-pill bg-mist px-4 py-2.5 outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-peacock"
              aria-label="Message"
            />
            <button type="submit" aria-label="Send" className="rounded-pill bg-peacock p-2.5 text-paper hover:bg-peacock-deep">
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
