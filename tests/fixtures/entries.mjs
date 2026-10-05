// Fictional content: editorial entries can be rejected or deleted without changing tests.
export function reviewFixture() {
  return {
    id:'fixture-comparison', title:'A fictional comparison', topic:'politics', status:'review', order:20,
    question:'Which sample is larger?', answer:'The north sample.', explanation:'Compare two fictional samples.',
    qualification:'Test data only.', whyCare:'A fixture exercises the disclosure.',
    evidence:{kind:'calculation',scope:'Fictional samples',dataAsOf:'Test period 2020',checkedAt:'2020-01-01',reviewDue:'2021-01-01',denominator:'Fictional sample counts',methodology:'Compare fixture totals.',sources:[
      {label:'Fixture source one',url:'https://example.org/one',primary:true},
      {label:'Fixture source two',url:'https://example.org/two',primary:true}
    ]},
    treatment:{kind:'bar',views:[
      {id:'counts',label:'Sample count',unit:'items',baseline:0,max:100,note:'Fictional values.',values:[{label:'Test North',value:100},{label:'Test South',value:25}]},
      {id:'groups',label:'Groups',unit:'groups',baseline:0,max:10,note:'Fictional groups.',values:[{label:'Test North',value:2},{label:'Test South',value:10}]}
    ]}
  };
}
export function publishedFixture() {
  return {...reviewFixture(),id:'fixture-published',status:'published',order:10,approval:{by:'Test fixture',at:'2020-01-01'},publishedAt:'2020-01-01T00:00:00Z'};
}
