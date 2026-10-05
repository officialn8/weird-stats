'use strict';
(() => {
  function initialize(control) {
    const button=control.querySelector('[data-share-button]');
    const link=control.querySelector('[data-share-link]');
    const fallback=control.querySelector('[data-share-fallback]');
    const field=control.querySelector('input');
    const status=control.querySelector('[role="status"]');
    button.hidden=false;
    button.addEventListener('click',async()=>{
      button.disabled=true;status.textContent='';fallback.hidden=true;
      const url=control.dataset.shareUrl;
      try {
        if(typeof navigator.share==='function') {
          try {await navigator.share({title:control.dataset.shareTitle,url});status.textContent='Share sheet opened.';return;}
          catch(error){if(error.name==='AbortError')return;}
        }
        if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);status.textContent='Link copied';
      } catch {
        fallback.hidden=false;field.value=url;field.focus();field.select();
        status.textContent='Copy the selected link to share this discovery.';
      } finally {button.disabled=false;}
    });
    // The ordinary canonical link remains usable without JavaScript.
    link.href=control.dataset.shareUrl;
  }
  document.querySelectorAll('[data-share-url]').forEach(initialize);
})();
