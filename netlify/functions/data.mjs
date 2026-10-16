import { getStore } from '@netlify/blobs';

export default async (request) => {
  const pin = Netlify.env.get('GOALS_PIN');
  const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if (!pin) return reply({error:'GOALS_PIN fehlt in den Netlify-Umgebungsvariablen.'},503);
  if (request.headers.get('X-Goals-Pin') !== pin) return reply({error:'Zugangscode falsch.'},401);
  try {
    const store=getStore('personal-goals');
    if(request.method==='GET') {
      const value=await store.get('data',{type:'json'});
      return reply({data:value??{goals:[],todos:[],journal:[]},initialized:value!==null});
    }
    if(request.method==='PUT') {
      const raw=await request.text();
      if(raw.length>500000) return reply({error:'Datensatz zu groß.'},413);
      const data=JSON.parse(raw);
      if(!data || !['goals','todos','journal'].every(k=>Array.isArray(data[k]))) return reply({error:'Ungültige Daten.'},400);
      await store.setJSON('data',data);
      return reply({ok:true});
    }
    return reply({error:'Methode nicht erlaubt.'},405);
  }catch(e){console.error(e);return reply({error:'Speichern oder Laden fehlgeschlagen.'},500)}
};
export const config={path:'/api/data'};
