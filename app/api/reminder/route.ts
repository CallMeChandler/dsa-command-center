import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import topics from "@/data/topics.json";
import { readProgress } from "@/lib/githubStore";

export const dynamic = "force-dynamic";

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}` || new URL(request.url).searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.GMAIL_TO;
  if (!user || !pass || !to) return NextResponse.json({ error: "Gmail environment variables are missing." }, { status: 500 });

  try {
    const { progress } = await readProgress();
    const pending = topics.flatMap((topic) => topic.questions
      .filter((q) => !progress.completed[`${topic.id}-${q.number}`])
      .map((q) => ({ ...q, topic: topic.name }))
    );
    const day = Math.floor(Date.now() / 86400000);
    const picks = pending.length ? Array.from({ length: Math.min(progress.dailyGoal || 2, pending.length) }, (_, i) => pending[(day * (progress.dailyGoal || 2) + i) % pending.length]) : [];
    const done = Object.keys(progress.completed).length;
    const total = topics.reduce((sum, topic) => sum + topic.questions.length, 0);

    const cards = picks.map((q, i) => `
      <a href="${q.url}" style="display:block;text-decoration:none;color:#f6f7f8;background:#151820;border:1px solid #2a2e38;border-radius:16px;padding:16px;margin-top:10px">
        <div style="font-size:10px;letter-spacing:.12em;color:#c7ff3d">REP ${i + 1} · ${q.topic.toUpperCase()}</div>
        <div style="font-size:16px;font-weight:700;margin-top:6px">#${q.number} · ${q.title}</div>
      </a>`).join("");

    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({
      from: `DSA Command Center <${user}>`,
      to,
      subject: picks.length ? `Your DSA mission: ${picks.map(q => `#${q.number}`).join(" + ")}` : "DSA mission complete",
      html: `<!doctype html><html><body style="margin:0;background:#07080b;font-family:Arial,sans-serif;color:#f6f7f8"><div style="max-width:620px;margin:auto;padding:34px 18px"><div style="background:linear-gradient(135deg,#c7ff3d,#8de45f);color:#0a0d08;border-radius:24px;padding:28px"><div style="font-size:10px;font-weight:700;letter-spacing:.18em">DSA COMMAND CENTER</div><h1 style="font-size:34px;line-height:1.05;margin:16px 0 10px">No passive learning.<br>Earn the pattern.</h1><p style="font-size:14px;opacity:.7;margin:0">${done} of ${total} questions completed. Open today’s reps, attempt them honestly, and update your portal.</p></div><div style="padding:18px 2px">${cards || '<div style="padding:20px;background:#151820;border-radius:16px">You have completed the entire roadmap. Revise weak patterns and timed sets.</div>'}</div><p style="color:#737987;font-size:11px;text-align:center">Attempt → dry run → code → complexity → mark complete</p></div></body></html>`
    });
    return NextResponse.json({ ok: true, sentTo: to, questions: picks.map(q => q.number) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Reminder failed" }, { status: 500 });
  }
}
