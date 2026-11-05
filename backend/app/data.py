"""Static data the agents reason over: the skill dictionary, the curated learning catalogue,
seed job listings, interview question banks, quiz banks and the psychometric test.

Everything here is real and free to link to. Job seeds are demo listings that keep the app useful
when the live job APIs are unreachable; live listings replace them as soon as a refresh succeeds.
"""
from __future__ import annotations

# ---------------------------------------------------------------- skills
# key -> (label shown to students as a gap, regex aliases found in CVs and job descriptions)
SKILLS: dict[str, tuple[str, list[str]]] = {
    "dsa": ("DSA: arrays and strings", [r"\bdsa\b", r"data structures?", r"algorithms?", r"leetcode", r"competitive programming"]),
    "oop": ("OOP interview questions", [r"\boops?\b", r"object[- ]oriented"]),
    "java": ("Java fundamentals", [r"\bjava\b(?!script)"]),
    "python": ("Python fundamentals", [r"\bpython\b"]),
    "cpp": ("C++ fundamentals", [r"\bc\+\+", r"\bcpp\b"]),
    "sql": ("SQL queries and joins", [r"\bsql\b", r"mysql", r"postgres", r"\boracle\b"]),
    "dbms": ("DBMS basics", [r"\bdbms\b", r"database management", r"normali[sz]ation"]),
    "os": ("Operating systems basics", [r"operating systems?", r"\bos concepts\b"]),
    "networks": ("Computer networks basics", [r"computer networks?", r"\btcp/?ip\b", r"networking"]),
    "javascript": ("JavaScript closures and async", [r"javascript", r"\bjs\b", r"typescript", r"es6"]),
    "react": ("React components and state", [r"\breact(\.js|js)?\b", r"next\.?js"]),
    "html_css": ("HTML and CSS layout", [r"\bhtml5?\b", r"\bcss3?\b", r"tailwind", r"bootstrap"]),
    "node": ("Node.js and REST APIs", [r"node\.?js", r"express\.?js", r"\brest(ful)? api", r"fastapi", r"django", r"flask", r"spring boot"]),
    "git": ("Git branching", [r"\bgit\b", r"github", r"gitlab", r"version control"]),
    "linux": ("Linux command line", [r"\blinux\b", r"\bbash\b", r"shell scripting", r"\bunix\b"]),
    "testing": ("Testing basics", [r"unit test", r"\bjest\b", r"pytest", r"\bjunit\b", r"selenium", r"\btesting\b"]),
    "excel": ("Excel pivot tables", [r"\bexcel\b", r"spreadsheets?", r"pivot"]),
    "statistics": ("Basic statistics", [r"statistics", r"probability", r"hypothesis"]),
    "pandas": ("Python pandas", [r"\bpandas\b", r"numpy", r"data analysis", r"power ?bi", r"tableau"]),
    "ml": ("Machine learning basics", [r"machine learning", r"\bml\b", r"scikit", r"tensorflow", r"pytorch", r"deep learning"]),
    "cloud": ("Cloud basics", [r"\baws\b", r"\bazure\b", r"\bgcp\b", r"docker", r"kubernetes", r"cloud"]),
    "aptitude": ("Quantitative aptitude", [r"aptitude", r"quantitative", r"logical reasoning"]),
    "communication": ("Communication: self-introduction", [r"communication", r"presentation skills", r"public speaking", r"english"]),
}

# Names to show on chips when a skill is found in a CV.
SKILL_DISPLAY = {
    "dsa": "DSA", "oop": "OOP", "java": "Java", "python": "Python", "cpp": "C++", "sql": "SQL", "dbms": "DBMS",
    "os": "Operating systems", "networks": "Networking", "javascript": "JavaScript", "react": "React",
    "html_css": "HTML/CSS", "node": "Backend APIs", "git": "Git", "linux": "Linux", "testing": "Testing",
    "excel": "Excel", "statistics": "Statistics", "pandas": "Data analysis", "ml": "Machine learning",
    "cloud": "Cloud", "aptitude": "Aptitude", "communication": "Communication",
}

# ---------------------------------------------------------------- learning catalogue
# Curated, free, linked (never re-hosted). YouTube entries are search links, so no video is invented.
def _yt(q: str) -> str:
    return "https://www.youtube.com/results?search_query=" + q.replace(" ", "+")


CATALOGUE: list[dict] = [
    # DSA
    dict(id="r1", skill="dsa", title="Programming, Data Structures and Algorithms using Python", provider="NPTEL", language="English, Hindi subtitles", format="Lecture", minutes=95, level="Beginner", url="https://swayam.gov.in/explorer?searchText=data%20structures%20algorithms%20python"),
    dict(id="r2", skill="dsa", title="JavaScript Algorithms and Data Structures", provider="freeCodeCamp", language="English", format="Practice", minutes=60, level="Beginner", url="https://www.freecodecamp.org/learn"),
    dict(id="r3", skill="dsa", title="Arrays and strings explained in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=50, level="Beginner", url=_yt("arrays strings dsa hindi")),
    dict(id="r4", skill="dsa", title="Introduction to Algorithms (6.006)", provider="MIT OpenCourseWare", language="English", format="Lecture", minutes=80, level="Intermediate", url="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/"),
    dict(id="r5", skill="dsa", title="Algorithms on Khan Academy", provider="Khan Academy", language="English, Hindi", format="Video course", minutes=45, level="Beginner", url="https://www.khanacademy.org/computing/computer-science/algorithms"),
    # OOP
    dict(id="r6", skill="oop", title="Object-oriented programming in Java, explained in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=55, level="Beginner", url=_yt("oops in java hindi")),
    dict(id="r7", skill="oop", title="Classes and objects: the official Java tutorial", provider="dev.java", language="English", format="Article", minutes=40, level="Beginner", url="https://dev.java/learn/"),
    dict(id="r8", skill="oop", title="Classes in Python", provider="Python docs", language="English", format="Article", minutes=30, level="Beginner", url="https://docs.python.org/3/tutorial/classes.html"),
    # languages
    dict(id="r9", skill="java", title="Learn Java from the official dev.java path", provider="dev.java", language="English", format="Article", minutes=60, level="Beginner", url="https://dev.java/learn/"),
    dict(id="r10", skill="java", title="Java full course in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=90, level="Beginner", url=_yt("java full course hindi")),
    dict(id="r11", skill="python", title="The Python Tutorial", provider="Python docs", language="English", format="Article", minutes=60, level="Beginner", url="https://docs.python.org/3/tutorial/"),
    dict(id="r12", skill="python", title="CS50's Introduction to Programming with Python", provider="CS50", language="English", format="Video course", minutes=90, level="Beginner", url="https://cs50.harvard.edu/python/"),
    dict(id="r13", skill="cpp", title="LearnCpp: C++ from the ground up", provider="LearnCpp", language="English", format="Article", minutes=60, level="Beginner", url="https://www.learncpp.com/"),
    # databases
    dict(id="r14", skill="sql", title="SQLBolt: interactive SQL lessons", provider="SQLBolt", language="English", format="Practice", minutes=45, level="Beginner", url="https://sqlbolt.com/"),
    dict(id="r15", skill="sql", title="SQL joins explained in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=35, level="Beginner", url=_yt("sql joins hindi")),
    dict(id="r16", skill="dbms", title="Database Management Systems", provider="NPTEL", language="English, Hindi subtitles", format="Lecture", minutes=90, level="Beginner", url="https://swayam.gov.in/explorer?searchText=database%20management%20system"),
    dict(id="r17", skill="dbms", title="DBMS for placements in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=60, level="Beginner", url=_yt("dbms placement hindi")),
    # CS core
    dict(id="r18", skill="os", title="Operating Systems: Three Easy Pieces (free book)", provider="OSTEP", language="English", format="Article", minutes=60, level="Intermediate", url="https://pages.cs.wisc.edu/~remzi/OSTEP/"),
    dict(id="r19", skill="os", title="Operating systems for interviews in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=60, level="Beginner", url=_yt("operating system interview hindi")),
    dict(id="r20", skill="networks", title="Computer networks full course", provider="YouTube", language="English", format="Video course", minutes=60, level="Beginner", url=_yt("computer networks full course")),
    # web
    dict(id="r21", skill="javascript", title="Asynchronous JavaScript guide", provider="MDN", language="English", format="Article", minutes=30, level="Intermediate", url="https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS"),
    dict(id="r22", skill="javascript", title="JavaScript closures", provider="MDN", language="English", format="Article", minutes=20, level="Intermediate", url="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"),
    dict(id="r23", skill="javascript", title="JavaScript in Hindi: promises and async/await", provider="YouTube", language="Hindi", format="Video course", minutes=40, level="Beginner", url=_yt("javascript promises async await hindi")),
    dict(id="r24", skill="react", title="Learn React (official tutorial)", provider="react.dev", language="English", format="Practice", minutes=60, level="Beginner", url="https://react.dev/learn"),
    dict(id="r25", skill="html_css", title="Learn CSS", provider="web.dev", language="English", format="Article", minutes=45, level="Beginner", url="https://web.dev/learn/css"),
    dict(id="r26", skill="html_css", title="Responsive Web Design certification", provider="freeCodeCamp", language="English", format="Practice", minutes=60, level="Beginner", url="https://www.freecodecamp.org/learn"),
    dict(id="r27", skill="node", title="Learn Node.js", provider="Node.js docs", language="English", format="Article", minutes=45, level="Beginner", url="https://nodejs.org/en/learn"),
    # tools
    dict(id="r28", skill="git", title="Learn Git Branching (interactive)", provider="learngitbranching", language="English, Hindi", format="Practice", minutes=30, level="Beginner", url="https://learngitbranching.js.org/"),
    dict(id="r29", skill="git", title="Pro Git book, chapters 1-3", provider="git-scm", language="English", format="Article", minutes=45, level="Beginner", url="https://git-scm.com/book/en/v2"),
    dict(id="r30", skill="linux", title="Linux Journey", provider="Linux Journey", language="English", format="Practice", minutes=40, level="Beginner", url="https://linuxjourney.com/"),
    dict(id="r31", skill="testing", title="Getting started with pytest", provider="pytest docs", language="English", format="Article", minutes=25, level="Beginner", url="https://docs.pytest.org/en/stable/getting-started.html"),
    dict(id="r32", skill="cloud", title="Docker getting-started guide", provider="Docker docs", language="English", format="Practice", minutes=45, level="Beginner", url="https://docs.docker.com/get-started/"),
    # data
    dict(id="r33", skill="excel", title="Excel pivot tables in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=30, level="Beginner", url=_yt("excel pivot table hindi")),
    dict(id="r34", skill="statistics", title="Statistics and probability", provider="Khan Academy", language="English, Hindi", format="Video course", minutes=60, level="Beginner", url="https://www.khanacademy.org/math/statistics-probability"),
    dict(id="r35", skill="pandas", title="pandas getting-started tutorials", provider="pandas docs", language="English", format="Article", minutes=45, level="Beginner", url="https://pandas.pydata.org/docs/getting_started/intro_tutorials/"),
    dict(id="r36", skill="ml", title="Machine Learning Crash Course", provider="Google", language="English", format="Video course", minutes=90, level="Intermediate", url="https://developers.google.com/machine-learning/crash-course"),
    # placement skills
    dict(id="r37", skill="aptitude", title="Aptitude practice questions", provider="IndiaBIX", language="English", format="Practice", minutes=40, level="Beginner", url="https://www.indiabix.com/aptitude/questions-and-answers/"),
    dict(id="r38", skill="aptitude", title="Quantitative aptitude tricks in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=45, level="Beginner", url=_yt("quantitative aptitude placement hindi")),
    dict(id="r39", skill="communication", title="Structuring answers with the STAR method", provider="YouTube", language="English", format="Video course", minutes=20, level="Beginner", url=_yt("STAR method interview answers")),
    dict(id="r40", skill="communication", title="Tell me about yourself: a 60-second answer, in Hindi", provider="YouTube", language="Hindi", format="Video course", minutes=15, level="Beginner", url=_yt("tell me about yourself fresher hindi")),
]

# ---------------------------------------------------------------- seed jobs (demo, used offline)
SEED_JOBS: list[dict] = [
    dict(id="j1", title="Associate Software Engineer", company="Accenture", location="Hyderabad", salary="₹4.5–6 LPA", skills=["java", "sql", "dsa", "oop", "communication"], level="fresher", source="Careers page", posted_days_ago=2, apply_url="https://www.accenture.com/in-en/careers", round=["Online assessment", "Technical interview", "HR interview"]),
    dict(id="j2", title="Frontend Developer Intern", company="Razorpay", location="Bengaluru · Hybrid", salary="₹30k/month", skills=["javascript", "react", "html_css", "git"], level="intern", source="Careers page", posted_days_ago=1, apply_url="https://razorpay.com/jobs/", round=["Take-home task", "Technical interview"]),
    dict(id="j3", title="Graduate Engineer Trainee", company="Tata Consultancy Services", location="Pan-India", salary="₹3.6–7 LPA", skills=["aptitude", "communication", "dsa", "java"], level="fresher", source="Careers page", posted_days_ago=4, apply_url="https://www.tcs.com/careers/india", round=["National qualifier test", "Technical + HR interview"]),
    dict(id="j4", title="Junior Data Analyst", company="Swiggy", location="Remote", salary=None, skills=["sql", "excel", "statistics", "pandas"], level="fresher", source="Careers page", posted_days_ago=6, apply_url="https://careers.swiggy.com/", round=["SQL test", "Case discussion"]),
    dict(id="j5", title="Software Engineer Trainee", company="Infosys", location="Mysuru", salary="₹3.6–4.5 LPA", skills=["python", "java", "sql", "aptitude", "communication"], level="fresher", source="Careers page", posted_days_ago=3, apply_url="https://www.infosys.com/careers/", round=["Online test", "Technical interview", "HR interview"]),
    dict(id="j6", title="Backend Developer (Python)", company="Zoho", location="Chennai", salary="₹5–8 LPA", skills=["python", "node", "sql", "dsa", "git"], level="fresher", source="Careers page", posted_days_ago=5, apply_url="https://www.zoho.com/careers/", round=["Written programming test", "Technical rounds", "HR"]),
    dict(id="j7", title="QA Engineer, Fresher", company="Wipro", location="Pune", salary="₹3.5 LPA", skills=["testing", "java", "sql", "linux"], level="fresher", source="Careers page", posted_days_ago=8, apply_url="https://careers.wipro.com/", round=["Aptitude test", "Technical interview"]),
    dict(id="j8", title="Data Science Intern", company="Freshworks", location="Chennai · Hybrid", salary="₹35k/month", skills=["python", "pandas", "statistics", "ml"], level="intern", source="Careers page", posted_days_ago=2, apply_url="https://www.freshworks.com/company/careers/", round=["Assignment", "Technical interview"]),
    dict(id="j9", title="Systems Engineer", company="HCLTech", location="Noida", salary="₹4 LPA", skills=["linux", "networks", "os", "communication"], level="fresher", source="Careers page", posted_days_ago=7, apply_url="https://www.hcltech.com/careers", round=["Online test", "Technical + HR interview"]),
    dict(id="j10", title="Full Stack Developer, Junior", company="Postman", location="Remote", salary=None, skills=["javascript", "react", "node", "git", "testing"], level="fresher", source="Careers page", posted_days_ago=3, apply_url="https://www.postman.com/company/careers/", round=["Coding round", "System design basics", "Culture fit"]),
]

# ---------------------------------------------------------------- interview question banks
# kind drives the hint (never the answer) and which follow-up the Interviewer may ask.
QUESTIONS: dict[str, list[dict]] = {
    "hr": [
        dict(q="Hello {name}, please have a seat. To begin, tell me a little about yourself.", kind="intro", keywords=["project", "college", "skill", "interest"]),
        dict(q="Why do you want to start your career with a company like {company}?", kind="motivation", keywords=["learn", "grow", "product", "team", "customers"]),
        dict(q="Tell me about a time a project did not go to plan. What did you do?", kind="behavioural", keywords=["situation", "decided", "result", "learned", "team"]),
        dict(q="What is one weakness you are working on right now?", kind="self", keywords=["working on", "improve", "practice", "feedback"]),
        dict(q="Where do you see yourself in three years?", kind="future", keywords=["skills", "responsibility", "lead", "learn"]),
        dict(q="Do you have any questions for me?", kind="close", keywords=["team", "role", "training", "expect"]),
    ],
    "technical": [
        dict(q="Let's start simple. What is the difference between an array and a linked list?", kind="concept", keywords=["contiguous", "memory", "index", "pointer", "insert", "o(1)", "o(n)"]),
        dict(q="How would you find the first repeating character in a string?", kind="problem", keywords=["hash", "set", "map", "loop", "o(n)", "visited"]),
        dict(q="Explain inheritance with an example from your own project.", kind="concept", keywords=["parent", "child", "class", "extends", "reuse", "override"]),
        dict(q="What happens when you type a URL into the browser and press enter?", kind="concept", keywords=["dns", "tcp", "http", "server", "request", "response", "render"]),
        dict(q="What is the difference between an INNER JOIN and a LEFT JOIN?", kind="concept", keywords=["matching", "rows", "null", "left table", "all"]),
        dict(q="Walk me through the hardest bug you fixed recently.", kind="behavioural", keywords=["bug", "debug", "log", "cause", "fixed", "test"]),
    ],
}

HINTS: dict[str, str] = {
    "intro": "Keep it to about a minute: who you are, one project you're proud of, and what you want to do next. Look up at her as you start.",
    "motivation": "Connect something real about the company to something real about you. One specific reason beats three general ones.",
    "behavioural": "Try STAR: one line on the situation, what you had to do, what you did, and the result. A number in the result helps.",
    "self": "Pick a real weakness that doesn't block the job, then say exactly what you're doing about it.",
    "future": "Talk about skills and responsibility you want to grow into, not a job title.",
    "close": "Ask about the work itself: what the first three months look like, or how the team reviews code.",
    "concept": "Start with a one-line definition, then compare on one or two points, then give a tiny example.",
    "problem": "Say the simplest approach out loud first, then how you'd make it faster. It's fine to ask a clarifying question.",
}

FOLLOW_UPS: dict[str, str] = {
    "short": "Could you say a bit more? Give me one specific example.",
    "result": "And what was the result in the end?",
    "complexity": "What is the time complexity of that approach?",
    "example": "Can you give me a small example of that?",
}

FILLERS = ["basically", "actually", "like", "you know", "um", "uh", "matlab", "so yeah", "i mean", "kind of", "sort of"]

# ---------------------------------------------------------------- quizzes (offline bank)
QUIZZES: dict[str, list[dict]] = {
    "dsa": [
        dict(q="What is the time complexity of accessing arr[i] in an array?", options=["O(1)", "O(log n)", "O(n)", "O(n²)"], answer=0),
        dict(q="Which structure gives O(1) average lookup to check whether a character was seen before?", options=["Stack", "Hash set", "Linked list", "Queue"], answer=1),
        dict(q="Two pointers moving toward each other is a common way to…", options=["Sort a linked list", "Check if a string is a palindrome", "Build a heap", "Hash a string"], answer=1),
        dict(q="Reversing a string of length n in place takes…", options=["O(1) time", "O(log n) time", "O(n) time", "O(n log n) time"], answer=2),
        dict(q="A sliding window is most useful for…", options=["Longest substring without repeating characters", "Binary search", "Tree traversal", "Matrix multiplication"], answer=0),
    ],
    "oop": [
        dict(q="Hiding internal state and exposing methods is called…", options=["Inheritance", "Encapsulation", "Polymorphism", "Abstraction"], answer=1),
        dict(q="Method overriding is an example of…", options=["Compile-time polymorphism", "Run-time polymorphism", "Encapsulation", "Composition"], answer=1),
        dict(q="In Java, a class can extend how many classes?", options=["One", "Two", "Any number", "None"], answer=0),
        dict(q="An interface in Java mainly defines…", options=["Fields with values", "A contract of methods", "A constructor", "A package"], answer=1),
        dict(q="\"A Car has an Engine\" describes…", options=["Inheritance", "Composition", "Overloading", "Abstraction"], answer=1),
    ],
    "sql": [
        dict(q="Which clause filters groups after GROUP BY?", options=["WHERE", "HAVING", "ORDER BY", "LIMIT"], answer=1),
        dict(q="A LEFT JOIN returns…", options=["Only matching rows", "All rows from the left table", "All rows from the right table", "A Cartesian product"], answer=1),
        dict(q="Which keyword removes duplicate rows from a result?", options=["UNIQUE", "DISTINCT", "DROP", "TRIM"], answer=1),
        dict(q="COUNT(*) counts…", options=["Non-null values in a column", "All rows", "Distinct rows", "Columns"], answer=1),
        dict(q="A primary key must be…", options=["Unique and not null", "A number", "Indexed only", "A foreign key"], answer=0),
    ],
    "javascript": [
        dict(q="A closure is a function that…", options=["Has no name", "Remembers variables from where it was created", "Runs immediately", "Cannot return values"], answer=1),
        dict(q="What does `await` do inside an async function?", options=["Blocks the whole browser", "Pauses that function until the promise settles", "Creates a thread", "Cancels the promise"], answer=1),
        dict(q="`typeof null` returns…", options=["\"null\"", "\"object\"", "\"undefined\"", "\"number\""], answer=1),
        dict(q="Which runs first?", options=["setTimeout(fn, 0)", "A resolved promise's .then", "They run together", "It's random"], answer=1),
        dict(q="`===` differs from `==` because it…", options=["Is faster only", "Doesn't convert types", "Compares references only", "Works only on strings"], answer=1),
    ],
    "git": [
        dict(q="Which command creates a new branch and switches to it?", options=["git branch -d x", "git checkout -b x", "git merge x", "git push x"], answer=1),
        dict(q="`git pull` is roughly…", options=["fetch + merge", "commit + push", "clone + init", "stash + pop"], answer=0),
        dict(q="Where do changes go after `git add`?", options=["Remote", "Staging area", "Stash", "Another branch"], answer=1),
        dict(q="Which is safer for undoing a pushed commit?", options=["git reset --hard", "git revert", "git rm", "git clean"], answer=1),
    ],
    "aptitude": [
        dict(q="A train covers 120 km in 2 hours. Its speed in m/s is about…", options=["16.7", "33.3", "60", "120"], answer=0),
        dict(q="If 5 workers finish a job in 12 days, 10 workers finish it in…", options=["24 days", "6 days", "10 days", "12 days"], answer=1),
        dict(q="20% of 250 is…", options=["25", "50", "75", "125"], answer=1),
        dict(q="Next in the series 2, 6, 12, 20, …", options=["28", "30", "32", "26"], answer=1),
    ],
    "communication": [
        dict(q="In STAR, the R stands for…", options=["Reason", "Result", "Review", "Role"], answer=1),
        dict(q="A good self-introduction for a fresher lasts about…", options=["10 seconds", "1 minute", "5 minutes", "As long as needed"], answer=1),
        dict(q="When you don't know an answer, the best move is to…", options=["Guess confidently", "Stay silent", "Say what you do know and how you'd find out", "Change the topic"], answer=2),
        dict(q="Where should you look while answering in a video interview?", options=["At your own video", "At the camera / interviewer's face", "At your notes", "Away from the screen"], answer=1),
    ],
    "python": [
        dict(q="What does `len([1, [2, 3]])` return?", options=["1", "2", "3", "Error"], answer=1),
        dict(q="Which is immutable?", options=["list", "dict", "tuple", "set"], answer=2),
        dict(q="`[x*x for x in range(3)]` gives…", options=["[1, 4, 9]", "[0, 1, 4]", "[0, 1, 2]", "[0, 2, 4]"], answer=1),
        dict(q="Dictionary lookup by key is on average…", options=["O(1)", "O(log n)", "O(n)", "O(n²)"], answer=0),
    ],
    "java": [
        dict(q="Which keyword prevents a class from being subclassed?", options=["static", "final", "abstract", "private"], answer=1),
        dict(q="Strings in Java are…", options=["Mutable", "Immutable", "Primitive", "Arrays"], answer=1),
        dict(q="Which collection keeps keys unique?", options=["ArrayList", "HashMap", "LinkedList", "Array"], answer=1),
        dict(q="The JVM runs…", options=["Java source code", "Bytecode", "Machine code only", "Python"], answer=1),
    ],
}

# ---------------------------------------------------------------- psychometric test
# RIASEC interests (2 each), Mini-IPIP (public domain, 20 items, r = reverse-keyed), 5 situational items.
RIASEC_ITEMS = [
    ("R", "I enjoy fixing or building things with my hands or tools."),
    ("R", "I like setting up computers, networks or devices."),
    ("I", "I enjoy fixing something until it works exactly right."),
    ("I", "I like solving puzzles and figuring out why things happen."),
    ("A", "I enjoy designing how something looks or feels."),
    ("A", "I like writing, drawing or making videos."),
    ("S", "I enjoy helping a friend understand a difficult topic."),
    ("S", "I like working with people more than working alone."),
    ("E", "I feel comfortable explaining my ideas to a group."),
    ("E", "I like leading a team or organising an event."),
    ("C", "I like keeping things organised in lists and spreadsheets."),
    ("C", "I prefer clear instructions and well-defined tasks."),
]
IPIP_ITEMS = [
    ("E", False, "I am the life of the party."), ("A", False, "I sympathise with others' feelings."),
    ("C", False, "I get chores done right away."), ("N", False, "I have frequent mood swings."),
    ("O", False, "I have a vivid imagination."), ("E", True, "I don't talk a lot."),
    ("A", True, "I am not interested in other people's problems."), ("C", True, "I often forget to put things back in their proper place."),
    ("N", True, "I am relaxed most of the time."), ("O", True, "I am not interested in abstract ideas."),
    ("E", False, "I talk to a lot of different people at parties."), ("A", False, "I feel others' emotions."),
    ("C", False, "I like order."), ("N", False, "I get upset easily."),
    ("O", True, "I have difficulty understanding abstract ideas."), ("E", True, "I keep in the background."),
    ("A", True, "I am not really interested in others."), ("C", True, "I make a mess of things."),
    ("N", True, "I seldom feel blue."), ("O", True, "I do not have a good imagination."),
]
SJT_ITEMS = [
    dict(q="Your teammate missed a deadline the night before a demo. What do you do first?", options=["Finish their part myself", "Call them to understand what happened", "Tell the mentor right away", "Cut the feature from the demo"], best=1, trait="teamwork"),
    dict(q="In an interview you're asked something you don't know. What do you say?", options=["Make up an answer", "Say \"I don't know\" and wait", "Explain what you do know and how you'd find out", "Ask to skip"], best=2, trait="honesty"),
    dict(q="Your code works but a senior says it's hard to read. You…", options=["Explain it works so it's fine", "Ask what would make it clearer and refactor", "Ignore it", "Rewrite everything from scratch"], best=1, trait="coachability"),
    dict(q="You have three assignments due and one free evening. You…", options=["Start with the easiest", "List them by deadline and impact, then start", "Ask for extensions on all", "Do a bit of each randomly"], best=1, trait="planning"),
    dict(q="You got rejected after a final interview. Next you…", options=["Stop applying for a while", "Ask for feedback and practise the weak part", "Apply only to easier roles", "Blame the interviewer"], best=1, trait="resilience"),
]
SCALE = ["Not like me", "A little", "Somewhat", "Mostly", "Very much like me"]

# RIASEC code -> skills that roles for this interest usually lean on (used to nudge matching).
RIASEC_SKILLS = {
    "R": {"linux", "networks", "os", "cloud"},
    "I": {"dsa", "python", "ml", "statistics", "java", "cpp"},
    "A": {"html_css", "react", "javascript"},
    "S": {"communication", "testing"},
    "E": {"communication", "node"},
    "C": {"sql", "excel", "testing", "pandas"},
}

DEMO_USER = dict(
    name="Ananya", city="Hyderabad", languages=["English", "Hindi"], minutesPerDay=90,
    skills=["java", "sql", "react", "git", "html_css", "javascript"], education="B.Tech CSE, 2026", projects=3,
    psych=dict(riasec={"R": 2.0, "I": 4.0, "A": 3.0, "S": 3.0, "E": 2.5, "C": 3.5}, big5={}, sjt=3, top="I"),
    shortlist=["j1"], done=[], quiz={"oop": 40}, readiness=[48, 62], streak=4, lastActive=None,
    onboarded=False,
)
