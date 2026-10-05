'use strict';
document.querySelectorAll('.data-discovery').forEach(entry=>{
  const controls=entry.querySelector('.data-controls');
  if(!controls)return;
  controls.hidden=false;
  controls.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    controls.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    entry.querySelectorAll('.data-view').forEach(view=>view.hidden=view.id!==button.dataset.view);
    const active=entry.querySelector('.data-view:not([hidden])');
    entry.querySelector('.data-status').textContent=active.querySelector('.data-unit').textContent+'. '+active.querySelector('.data-axis').textContent;
  }));
});
