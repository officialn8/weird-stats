for (const exhibit of document.querySelectorAll('.php-exhibit')) {
  const disclosure=exhibit.querySelector('.php-open');
  const answer=exhibit.querySelector('.php-reveal');
  // The answer sits behind the same native reveal as other discoveries; report it like the chip and copper exhibits do.
  answer?.addEventListener('toggle',()=>{
    exhibit.dispatchEvent(new CustomEvent('discoveryreveal',{detail:{open:answer.open}}));
    if(answer.open)window.WeirdAnalytics?.reveal(exhibit.id);
  });
  const label=disclosure.querySelector('summary span');
  const figure=exhibit.querySelector('.php-visual');
  const reading=exhibit.querySelector('.php-reading');
  const live=exhibit.querySelector('.php-live');
  const steps=[...exhibit.querySelectorAll('.php-steps li')];
  const buttons=[];
  const captions=['Login put back.','Cutaway open. The request reaches PHP. Login code not started.','Workspace full, setup stopped. Temporary data not ready.','Cleanup uses the unfinished data. Login code not started.'];
  let focusFrame;
  function keepReadingVisible(control) {
    cancelAnimationFrame(focusFrame);
    focusFrame=requestAnimationFrame(()=>{
      if(!answer.open)return;
      const row=(control.closest('.php-steps li')??control).getBoundingClientRect();
      const image=figure.getBoundingClientRect();
      const imageStyle=getComputedStyle(figure);
      const overlaps=imageStyle.position==='sticky'&&image.left<row.right&&image.right>row.left;
      // Use the pinned position even when focus arrives before the figure has stuck.
      const pinnedTop=Math.min(image.top,parseFloat(imageStyle.top)||0);
      const top=overlaps?Math.max(16,pinnedTop+image.height+28):16;
      const bottom=innerHeight-16;
      // Preserve the selected explanation; never jump away to the illustration.
      const delta=row.top<top?row.top-top:row.bottom>bottom?Math.min(row.bottom-bottom,row.top-top):0;
      if(delta)window.scrollBy({top:delta,behavior:'instant'});
    });
  }
  reading.addEventListener('focusin',event=>keepReadingVisible(event.target));
  function show(value) {
    exhibit.dataset.step=String(value);
    buttons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index+1===value)));
    if(live)live.textContent=captions[value];
  }
  for(const item of steps) {
    const stage=Number(item.dataset.stage),heading=item.querySelector('h3'),text=item.querySelector('p');
    const button=document.createElement('button');
    button.type='button';button.className='php-step';
    button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-describedby',text.id);
    button.textContent=heading.textContent;
    heading.replaceChildren(button);buttons.push(button);
    button.addEventListener('click',()=>{show(stage);disclosure.open=true;keepReadingVisible(button);});
  }
  disclosure.addEventListener('toggle',()=>{
    exhibit.dataset.open=String(disclosure.open);
    label.textContent=disclosure.open?'Put the login back':'Look beneath the login';
    if(!disclosure.open)show(0);
    else if(exhibit.dataset.step==='0')show(1);
    if(reading.contains(document.activeElement))keepReadingVisible(document.activeElement);
  });
  window.addEventListener('resize',()=>{
    if(reading.contains(document.activeElement))keepReadingVisible(document.activeElement);
  });
  exhibit.classList.add('php-enhanced');
}
