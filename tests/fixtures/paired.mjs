import { reviewFixture } from './entries.mjs';
export function pairedFixture() {
  return {...reviewFixture(),id:'fictional-orchards',topic:'nature',question:'Which orchard has more baskets?',answer:'The smaller orchard.',explanation:'This is a fictional comparison for testing a visual form.',whyCare:'Compare fictional fruit and baskets.',
    guess:{choices:[{id:'east',label:'East orchard',feedback:'The west orchard has more baskets.'},{id:'west',label:'West orchard',feedback:'Yes, the west orchard has more baskets.'}]},
    treatment:{kind:'paired-comparison',transition:'But the baskets tell a different story.',views:[
      {id:'fruit',label:'Fruit harvested',unit:'fruit',display:'bars',baseline:0,max:200,note:'Fictional harvest totals.',values:[{label:'East orchard',value:160},{label:'West orchard',value:120}]},
      {id:'baskets',label:'Baskets available',unit:'baskets',display:'objects',object:'tile',baseline:0,max:12,note:'One tile is one basket.',values:[{label:'East orchard',value:3},{label:'West orchard',value:12}]}
    ]}};
}
