import fallback from "@/data/progress.json";
import type { Progress } from "@/lib/types";

const cfg = () => ({
  token: process.env.GITHUB_TOKEN,
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  branch: process.env.GITHUB_BRANCH || "main",
  path: process.env.GITHUB_PROGRESS_PATH || "data/progress.json",
});

const headers = (token?:string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
});

export async function readProgress(): Promise<{progress:Progress; source:"github"|"fallback"; sha?:string}> {
  const c=cfg();
  if(!c.token || !c.owner || !c.repo) return {progress:fallback as Progress, source:"fallback"};
  const url=`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.path}?ref=${c.branch}`;
  const res=await fetch(url,{headers:headers(c.token),cache:"no-store"});
  if(!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const body=await res.json();
  const text=Buffer.from(body.content.replace(/\n/g,""),"base64").toString("utf8");
  return {progress:JSON.parse(text),source:"github",sha:body.sha};
}

export async function writeProgress(progress:Progress): Promise<void> {
  const c=cfg();
  if(!c.token || !c.owner || !c.repo) throw new Error("GitHub sync environment variables are not configured.");
  const current=await readProgress();
  const url=`https://api.github.com/repos/${c.owner}/${c.repo}/contents/${c.path}`;
  const payload={message:`chore(progress): sync ${new Date().toISOString()}`,content:Buffer.from(JSON.stringify(progress,null,2)).toString("base64"),sha:current.sha,branch:c.branch};
  const res=await fetch(url,{method:"PUT",headers:headers(c.token),body:JSON.stringify(payload)});
  if(!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
}
