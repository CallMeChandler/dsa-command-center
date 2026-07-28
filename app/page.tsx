"use client";

import { useEffect, useMemo, useState } from "react";
import topicsData from "@/data/topics.json";
import fallbackProgress from "@/data/progress.json";
import type { Progress, Topic } from "@/lib/types";
import {
  ArrowSquareOut, CalendarBlank, Check, CheckCircle, CloudArrowUp,
  Fire, Funnel, MagnifyingGlass, MoonStars, Play, Sparkle, Target,
  TrendUp, Trophy, X
} from "@phosphor-icons/react";

const topics = topicsData as Topic[];
const STORAGE_KEY = "dsa-command-center-progress-v1";
const todayKey = () => new Date().toISOString().slice(0, 10);

function datesBetweenCompleted(progress: Progress) {
  const map = new Map<string, number>();
  Object.values(progress.completed).forEach((item) => {
    const day = item.completedAt.slice(0, 10);
    map.set(day, (map.get(day) || 0) + 1);
  });
  return map;
}

function calculateStreak(progress: Progress) {
  const days = datesBetweenCompleted(progress);
  let streak = 0;
  const cursor = new Date();
  if (!days.has(todayKey())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getDailyQuestions(progress: Progress, count: number) {
  const pending = topics.flatMap((topic) =>
    topic.questions
      .filter((q) => !progress.completed[`${topic.id}-${q.number}`])
      .map((q) => ({ ...q, topic: topic.name, topicId: topic.id }))
  );
  if (!pending.length) return [];
  const dayNumber = Math.floor(new Date(todayKey()).getTime() / 86400000);
  const start = (dayNumber * Math.max(1, count)) % pending.length;
  return Array.from({ length: Math.min(count, pending.length) }, (_, i) => pending[(start + i) % pending.length]);
}

export default function Home() {
  const [progress, setProgress] = useState<Progress>(fallbackProgress as Progress);
  const [activeTopic, setActiveTopic] = useState("All Topics");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"dashboard" | "calendar">("dashboard");
  const [syncState, setSyncState] = useState("Local");
  const [selectedNote, setSelectedNote] = useState<{ key:string; number:number } | null>(null);

  useEffect(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try { setProgress(JSON.parse(local)); } catch {}
    }
    fetch("/api/progress")
      .then((r) => r.json())
      .then((data) => {
        if (data.progress) {
          setProgress(data.progress);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.progress));
          setSyncState(data.source === "github" ? "Cloud synced" : "Local mode");
        }
      })
      .catch(() => setSyncState("Offline mode"));
  }, []);

  async function persist(next: Progress) {
    setProgress(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSyncState("Syncing…");
    try {
      const res = await fetch("/api/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      if (!res.ok) throw new Error();
      setSyncState("Cloud synced");
    } catch {
      setSyncState("Saved locally");
    }
  }

  function toggleQuestion(key: string, number: number, title: string, topic: string) {
    const completed = { ...progress.completed };
    if (completed[key]) delete completed[key];
    else completed[key] = { completedAt: new Date().toISOString(), title, topic };
    persist({ ...progress, completed, updatedAt: new Date().toISOString() });
  }

  const total = topics.reduce((sum, t) => sum + t.questions.length, 0);
  const done = Object.keys(progress.completed).length;
  const streak = calculateStreak(progress);
  const dailyQuestions = getDailyQuestions(progress, progress.dailyGoal || 2);
  const todayDone = Object.values(progress.completed).filter((x) => x.completedAt.startsWith(todayKey())).length;

  const filteredTopics = useMemo(() => topics
    .filter((t) => activeTopic === "All Topics" || t.name === activeTopic)
    .map((t) => ({ ...t, questions: t.questions.filter((q) => {
      const match = `${q.number} ${q.title}`.toLowerCase().includes(query.toLowerCase());
      const isDone = Boolean(progress.completed[`${t.id}-${q.number}`]);
      return match && (status === "all" || (status === "done" ? isDone : !isDone));
    }) }))
    .filter((t) => t.questions.length), [activeTopic, query, status, progress.completed]);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <aside className="sidebar glass">
        <div className="brand"><div className="brand-mark"><MoonStars weight="fill" /></div><div><b>DSA</b><span>COMMAND CENTER</span></div></div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><Sparkle /> Overview</button>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarBlank /> Activity calendar</button>
        </nav>
        <div className="topic-nav"><p>TOPIC FILTER</p><button className={activeTopic === "All Topics" ? "selected" : ""} onClick={() => setActiveTopic("All Topics")}>All Topics <span>{total}</span></button>{topics.map(t => <button key={t.id} className={activeTopic === t.name ? "selected" : ""} onClick={() => { setActiveTopic(t.name); setView("dashboard"); }}>{t.name}<span>{t.questions.length}</span></button>)}</div>
        <div className="sync-pill"><CloudArrowUp /><span>{syncState}</span></div>
      </aside>

      <section className="content">
        <header><div><p className="eyebrow">AIML • INTERNSHIP PREP</p><h1>Train the pattern.<br/><em>Own the interview.</em></h1></div><div className="header-badge"><Fire weight="fill"/><div><b>{streak} day streak</b><span>Keep the chain alive</span></div></div></header>

        {view === "dashboard" ? <>
          <section className="stats-grid">
            <article className="stat-card glass"><span>Overall progress</span><strong>{done}<small> / {total}</small></strong><div className="meter"><i style={{width:`${(done/total)*100}%`}}/></div><p>{Math.round((done/total)*100)}% complete</p></article>
            <article className="stat-card glass"><span>Today</span><strong>{todayDone}<small> / {progress.dailyGoal}</small></strong><div className="mini-row"><Target/><p>{todayDone >= progress.dailyGoal ? "Daily mission complete" : `${Math.max(0, progress.dailyGoal-todayDone)} question${progress.dailyGoal-todayDone===1?"":"s"} remaining`}</p></div></article>
            <article className="stat-card glass"><span>Topics touched</span><strong>{new Set(Object.values(progress.completed).map(x=>x.topic)).size}<small> / {topics.length}</small></strong><div className="mini-row"><TrendUp/><p>Build breadth, then depth</p></div></article>
          </section>

          <section className="mission-card">
            <div className="mission-copy"><span className="live-dot">TODAY'S MISSION</span><h2>Two focused reps.<br/>No solution peeking.</h2><p>Attempt, dry run, identify the pattern, then code. Mark complete only after you can explain the complexity.</p></div>
            <div className="mission-list">{dailyQuestions.map((q, i) => {
              const complete = Boolean(progress.completed[`${q.topicId}-${q.number}`]);
              return <article key={`${q.number}-${i}`} className={complete ? "mission-question complete" : "mission-question"}><button className="check" onClick={() => toggleQuestion(`${q.topicId}-${q.number}`,q.number,q.title,q.topic)}>{complete ? <Check/> : i+1}</button><div><span>{q.topic}</span><b>#{q.number} · {q.title}</b></div><a href={q.url} target="_blank" rel="noreferrer"><Play weight="fill"/></a></article>
            })}</div>
          </section>

          <section className="library-head"><div><p className="eyebrow">QUESTION LIBRARY</p><h2>{activeTopic}</h2></div><div className="controls"><label><MagnifyingGlass/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search number or title"/></label><div className="segmented"><button onClick={()=>setStatus("all")} className={status==="all"?"active":""}>All</button><button onClick={()=>setStatus("pending")} className={status==="pending"?"active":""}>Open</button><button onClick={()=>setStatus("done")} className={status==="done"?"active":""}>Done</button></div></div></section>

          <section className="topic-grid">{filteredTopics.map(topic => {
            const topicDone = topic.questions.filter(q=>progress.completed[`${topic.id}-${q.number}`]).length;
            return <article className="topic-card glass" key={topic.id}><div className="topic-title"><div><span>0{topic.id}</span><h3>{topic.name}</h3></div><b>{topicDone}/{topic.questions.length}</b></div><div className="topic-meter"><i style={{width:`${topic.questions.length ? (topicDone/topic.questions.length)*100 : 0}%`}}/></div><div className="question-list">{topic.questions.map(q => {
              const complete = Boolean(progress.completed[`${topic.id}-${q.number}`]);
              return <div className={complete?"question-row complete":"question-row"} key={q.number}><button className="tiny-check" onClick={()=>toggleQuestion(`${topic.id}-${q.number}`,q.number,q.title,topic.name)}>{complete?<CheckCircle weight="fill"/>:<span/>}</button><div><b>#{q.number}</b><p>{q.title}</p></div><button className="note-btn" onClick={()=>setSelectedNote({key:`${topic.id}-${q.number}`,number:q.number})} title="Add note">✦</button><a href={q.url} target="_blank" rel="noreferrer"><ArrowSquareOut/></a></div>
            })}</div></article>
          })}</section>
        </> : <CalendarView progress={progress}/>} 
      </section>

      {selectedNote !== null && <div className="modal-backdrop" onClick={()=>setSelectedNote(null)}><div className="note-modal glass" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelectedNote(null)}><X/></button><p className="eyebrow">PERSONAL NOTE</p><h2>Question #{selectedNote.number}</h2><textarea autoFocus value={progress.notes[selectedNote.key] || ""} onChange={e=>setProgress({...progress,notes:{...progress.notes,[selectedNote.key]:e.target.value}})} placeholder="Pattern, mistake, edge case, complexity..."/><button className="save-note" onClick={()=>{persist(progress);setSelectedNote(null)}}>Save note</button></div></div>}
    </main>
  );
}

function CalendarView({progress}:{progress:Progress}) {
  const counts = datesBetweenCompleted(progress);
  const days = Array.from({length: 84}, (_,i) => { const d=new Date(); d.setDate(d.getDate()-(83-i)); const key=d.toISOString().slice(0,10); return {key,count:counts.get(key)||0,label:d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}; });
  const history = Object.entries(progress.completed).sort((a,b)=>b[1].completedAt.localeCompare(a[1].completedAt));
  return <><section className="calendar-card glass"><div><p className="eyebrow">LAST 12 WEEKS</p><h2>Consistency map</h2></div><div className="heatmap">{days.map(d=><div key={d.key} title={`${d.label}: ${d.count} completed`} className={`heat heat-${Math.min(d.count,4)}`}/>)}</div><div className="heat-legend"><span>Less</span>{[0,1,2,3,4].map(x=><i key={x} className={`heat heat-${x}`}/>)}<span>More</span></div></section><section className="history-card glass"><div className="history-title"><div><p className="eyebrow">COMPLETED ARCHIVE</p><h2>Past questions</h2></div><Trophy weight="fill"/></div>{history.length ? history.map(([number,item])=><div className="history-row" key={number}><CheckCircle weight="fill"/><div><b>#{number.split("-").pop()} · {item.title}</b><span>{item.topic}</span></div><time>{new Date(item.completedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</time></div>) : <div className="empty">Complete your first question to start the archive.</div>}</section></>
}
