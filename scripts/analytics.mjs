import {readFile,copyFile,mkdir} from 'node:fs/promises';
import {root} from './content.mjs';

export function analyticsHead(config,{drafts=false,entries=[],publicOrigin}={}) {
  if(drafts||!config?.enabled||!entries.length)return '';
  if(!/^phc_[A-Za-z0-9]+$/.test(config.projectToken))throw new Error('Invalid public PostHog project token');
  if(!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(config.apiHost))throw new Error('Unsupported PostHog ingestion host');
  if(config.publicOrigin!==publicOrigin)throw new Error('Analytics origin must match the public site origin');
  const payload={...config,entries:entries.map(e=>({id:e.id,revealable:e.treatment.kind!=='custom'||['crunch','copper'].includes(e.id)}))};
  const json=JSON.stringify(payload).replaceAll('<','\\u003c');
  return `<script type="application/json" id="analytics-config">${json}</script><script type="module" src="/analytics.js"></script>`;
}
export async function loadAnalyticsConfig(){return JSON.parse(await readFile(new URL('config/analytics.json',root),'utf8'));}
export async function copyAnalyticsSDK(output) {
  await mkdir(new URL('vendor/',output),{recursive:true});
  await copyFile(new URL('node_modules/posthog-js/dist/module.mjs',root),new URL('vendor/posthog.mjs',output));
  await copyFile(new URL('node_modules/posthog-js/LICENSE',root),new URL('vendor/posthog-LICENSE.txt',output));
}
