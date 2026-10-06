// Original static adaptation of the article's four-way intersection.
// The same traffic state: 32 solo drivers and 60 bus passengers, plus its operator.
// Kept in the build renderer so no browser, network fetch or article JS is needed.
export function transportShareArt() {
 const colors=['#ded4c2','#8faaa5','#bfa184','#7d929b','#c9c4b4'];
 const cars=[];
 for(let arm=0;arm<4;arm++)for(let n=0;n<8;n++) {
  const slot=arm===0&&n===4?10:arm===0&&n===6?12:n;
  const lane=slot%2,row=Math.floor(slot/2);
  const [x,y,angle]=[
   [355-row*46,474+lane*45,0],[645+row*46,426-lane*45,180],
   [476-lane*45,305-row*40,90],[524+lane*45,595+row*40,-90]
  ][arm];
  cars.push(`<g data-share-car="" transform="translate(${x} ${y}) rotate(${angle}) scale(.62)" color="${colors[(arm*8+n)%5]}"><use href="#share-car"/><circle cx="4" cy="-5" r="4.35" fill="#fff4da"/></g>`);
 }
 const passengers=Array.from({length:60},(_,i)=>`<circle data-share-passenger="" cx="${-67+(i%15)*9.5}" cy="${-12+Math.floor(i/15)*8}" r="3.05" fill="#fff4da"/>`).join('');
 const crossings=Array.from({length:13},(_,i)=>`<path d="M384 ${368+i*14}h20 M596 ${368+i*14}h20 M${418+i*14} 334v20 M${418+i*14} 546v20"/>`).join('');
 return `<svg x="620" y="0" width="580" height="630" viewBox="85 0 830 900" preserveAspectRatio="xMidYMid slice">
 <defs><g id="share-car">
  <path fill="#232d29" d="M-23-18h12v5h-12z M12-18h12v5H12z M-23 13h12v5h-12z M12 13h12v5H12z"/>
  <path fill="currentColor" stroke="#291b10" stroke-width="1.4" d="M-25-15H20Q30-14 32-8V8Q30 14 20 15H-25Q-32 13-32 7V-7Q-32-13-25-15Z"/>
  <path fill="#577673" d="M10-12 18-10 20 10 10 12Z M-20-11-13-12V12L-20 11Z"/>
  <rect fill="#344b48" x="-11" y="-11" width="19" height="22" rx="3"/>
  <path fill="#577673" d="M-8-8h6v6h-6z M1-8h6v6H1z M-8 2h6v6h-6z M1 2h6v6H1z"/>
  <path fill="#fff4da" d="M28-10h3v5h-3z M28 5h3v5h-3z"/>
  <path fill="#ff681f" d="M-31-10h3v5h-3z M-31 5h3v5h-3z"/>
 </g><path id="share-arrow" d="M-19-3H8V-10L21 0 8 10V3H-19Z"/></defs>
 <path fill="#bda88a" d="M0 0H1000V900H0Z"/>
 <g fill="#d8c9ad" stroke="#eadfc7" stroke-width="4">
  <path d="M66 65H302V158H249V254H66Z M681 69H924V257H813V202H681Z M68 641H191V690H307V834H68Z M689 649H927V835H747V771H689Z"/>
 </g>
 <g fill="none" stroke="#bda88a" stroke-width="3">
  <path d="M80 79H288V144H235V240H80Z M695 83H910V243H827V188H695Z M82 655H177V704H293V820H82Z M703 663H913V821H761V757H703Z"/>
  <path d="M101 100h45v26h-45z M171 100h45v26h-45z M103 167h91v47h-91z M720 108h80v45h-80z M851 108h35v26h-35z M106 741h61v47h-61z M207 743h61v45h-61z M781 687h96v46h-96z"/>
 </g>
 <path fill="#291b10" stroke="#eadfc7" stroke-width="14" d="M-20 359H409V-20H591V359H1020V541H591V920H409V541H-20Z"/>
 <path fill="none" stroke="#bda88a" stroke-width="2" stroke-dasharray="14 18" d="M0 403H376 M0 497H376 M624 403H1000 M624 497H1000 M454 0V323 M546 0V323 M454 577V900 M546 577V900"/>
 <path fill="none" stroke="#f29a4a" stroke-width="2" d="M0 447H376 M0 453H376 M624 447H1000 M624 453H1000 M497 0V323 M503 0V323 M497 577V900 M503 577V900"/>
 <g fill="#ddd8c7" opacity=".7">
  <use href="#share-arrow" transform="translate(220 381) rotate(180)"/><use href="#share-arrow" transform="translate(270 426) rotate(180)"/>
  <use href="#share-arrow" transform="translate(730 474)"/><use href="#share-arrow" transform="translate(780 519)"/>
  <use href="#share-arrow" transform="translate(524 225) rotate(-90)"/><use href="#share-arrow" transform="translate(569 175) rotate(-90)"/>
  <use href="#share-arrow" transform="translate(431 725) rotate(90)"/><use href="#share-arrow" transform="translate(476 675) rotate(90)"/>
 </g>
 <g stroke="#ddd8c7" stroke-width="7">${crossings}</g>
 <path fill="none" stroke="#fff4da" stroke-width="6" d="M375 457V535 M625 365V443 M415 323H493 M507 577H585"/>
 ${[[370,560],[630,337],[391,318],[609,582]].map(([x,y])=>`<g transform="translate(${x} ${y})"><rect x="-7" y="-17" width="14" height="34" rx="4" fill="#273730"/><circle cy="-9" r="3.6" fill="#ef7351"/><circle r="3" fill="#697265"/><circle cy="9" r="3" fill="#697265"/></g>`).join('')}
 ${cars.join('')}
 <g data-share-bus="" transform="translate(217 474) scale(.62)">
  <path fill="#232d29" d="M-68-24h18v6h-18z M52-24h18v6H52z M-68 18h18v6h-18z M52 18h18v6H52z"/>
  <rect x="-91" y="-21" width="182" height="42" rx="6" fill="#ff681f" stroke="#291b10" stroke-width="1.5"/>
  <rect x="-75" y="-17" width="146" height="34" rx="3" fill="#344b48"/>
  <path fill="#577673" d="M76-17h10v34H76Z"/><circle cx="81" cy="-9" r="3" fill="#a7b9af"/>
  ${passengers}
  <path d="M88-16v7 M88 9v7" stroke="#fff3ce" stroke-width="3"/>
 </g></svg>`;
}
