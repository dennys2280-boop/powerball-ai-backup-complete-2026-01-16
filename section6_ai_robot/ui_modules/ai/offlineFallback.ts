import { analyzePlay } from "./qualityAlerts";

function randInt(a:number,b:number){return a+Math.floor(Math.random()*(b-a+1));}

export function generateOfflinePack(n=10){
  const plays:any[]=[];
  for(let i=0;i<n;i++){
    const set=new Set<number>();
    while(set.size<5) set.add(randInt(1,69));
    const whites=Array.from(set).sort((a,b)=>a-b);
    const pb=randInt(1,26);
    plays.push({
      whites, powerball:pb,
      rationale_tags:["offline_mode"],
      why:["Modo offline: generación local aleatoria con alertas de calidad."],
      quality_alerts: analyzePlay(whites,pb),
      score:0, signals_used:{}
    });
  }
  return {status:"ok",mode:"offline",results_by_assistant:{offline:{suggestions:plays}}};
}
