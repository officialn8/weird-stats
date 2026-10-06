// Coarse, finite categories only. Never retain or send raw referrers, queries or user agents.
const sources={google:'search',bing:'search',duckduckgo:'search',yahoo:'search',reddit:'social',facebook:'social',instagram:'social',twitter:'social',x:'social',linkedin:'social',bluesky:'social',mastodon:'social',newsletter:'email',email:'email',rss:'feed',feed:'feed'};
const campaigns=new Set(['launch','social','newsletter','community','feed']);
export function pageContext(location,referrer,width) {
  const params=new URLSearchParams(location.search);
  let source=sources[params.get('utm_source')?.toLowerCase()];
  if(!source&&referrer) {
    try {
      const ref=new URL(referrer);
      if(ref.origin===location.origin)source='internal';
      else if(/(^|\.)(google\.(com|co\.uk|ca|de|fr|com\.au|co\.jp|co\.in)|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(ref.hostname))source='search';
      else if(/(^|\.)(reddit\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|t\.co|linkedin\.com|bsky\.app)$/.test(ref.hostname))source='social';
      else source='referral';
    }catch{source='unknown';}
  }
  return {
    source_category:source??(params.has('utm_source')?'other_campaign':'direct_or_unknown'),
    campaign_code:campaigns.has(params.get('utm_campaign'))?params.get('utm_campaign'):'none',
    viewport_bucket:width<768?'narrow':width<1200?'medium':'wide',
  };
}
