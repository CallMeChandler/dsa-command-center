export type Question = { number:number; title:string; slug:string; url:string };
export type Topic = { id:number; name:string; questions:Question[] };
export type Completion = { completedAt:string; topic:string; title:string };
export type Progress = { version:number; updatedAt:string|null; completed:Record<string,Completion>; notes:Record<string,string>; dailyGoal:number; streakFreeze:number };
