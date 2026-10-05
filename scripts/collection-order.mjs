// First appearance determines recency; editing an older discovery does not bump it.
export function newestFirst(entries,{revisions=[],packets=[]}={}) {
 const firstRelease=new Map(),firstPreview=new Map();
 const remember=(map,id,value)=>{
  const time=Date.parse(value);
  if(Number.isFinite(time))map.set(id,Math.min(map.get(id)??Infinity,time));
 };
 for(const revision of revisions)if(revision.release?.authorizedBy)remember(firstRelease,revision.id,revision.release.at);
 for(const packet of packets)remember(firstPreview,packet.id,packet.createdAt);
 const time=entry=>firstRelease.get(entry.id)
  ?? (entry.publishedAt ? Date.parse(entry.publishedAt) : undefined)
  ?? firstPreview.get(entry.id)
  ?? (entry.createdAt ? Date.parse(entry.createdAt) : undefined)
  // Legacy unpacketized review entries belong ahead of the published collection.
  ?? Infinity;
 return [...entries].sort((a,b)=>(time(b)-time(a))||a.order-b.order||a.id.localeCompare(b.id));
}
