/* Thai lunisolar arithmetic adapted from thai_lunar.dart / pythaidate.
 * MIT Copyright 2026 MaIII; Copyright 2023 Mark Hollow.
 * Full licenses and provenance: docs/thai-calendar-LICENSE.txt.
 * Calculated calendar dates are not cabinet announcements. */
(function(){
  'use strict';
  var DAY=86400000, EPOCH=1954167, cache=new Map();
  var cumulative={A:[0,29,59,88,118,147,177,206,236,265,295,324,354,383],B:[0,29,59,89,119,148,178,207,237,266,296,325,355,384],C:[0,29,59,88,118,148,177,207,236,266,295,325,354,384]};
  var slots={A:[5,6,7,8,9,10,11,12,1,2,3,4,15,16],B:[5,6,7,8,9,10,11,12,1,2,3,4,15,16],C:[5,6,7,8,88,9,10,11,12,1,2,3,4,15]};
  function raw(y){
    var h=Math.floor((y*292207+373)/800)+1,k=800-(y*292207+373)%800,a=(h*11+650)%692||692,t=(Math.floor((h*11+650)/692)+h)%30;
    if(a===692)t--;
    var hn=Math.floor(((y+1)*292207+373)/800)+1,tn=(Math.floor((hn*11+650)/692)+hn)%30;
    var lang=Math.max(1,t),n=lang<6?lang+29:lang,nyd=(h%7-n+36)%7,leap=k<=207,type='A';
    if(t>24||t<6)type='C';if(t===25&&tn===5)type='A';
    if((leap&&a<=126)||(!leap&&a<=137))type=type==='C'?'c':'B';
    return {h:h,t:t,lang:lang,nyd:nyd,next:(nyd+(type==='A'?4:type==='B'?5:6))%7,type:type,offset:false};
  }
  function year0(y){
    var ys=[-2,-1,0,1,2].map(function(n){return raw(y+n)});
    if(ys[2].t===24&&ys[3].t===6)ys.forEach(function(v){v.type='C';v.next=(v.next+2)%7});
    [1,2,3].forEach(function(i){if(ys[i].type==='c'){var j=ys[i].nyd===ys[i-1].next?1:-1;ys[i+j].type='B';ys[i+j].next=(ys[i+j].next+1)%7}});
    [1,2,3].forEach(function(i){var v=ys[i];if(ys[i-1].next!==v.nyd&&v.next!==ys[i+1].nyd){v.offset=true;v.lang++;v.nyd=(v.nyd+6)%7;v.next=(v.next+6)%7}});
    var c=ys[2];if(c.type==='c')c.type='C';c.days=c.lang;if(c.days<6+(c.offset?1:0))c.days+=29;return c;
  }
  function lunarDays(y){
    var moons={},yearCache={},start=Date.UTC(y,0,1),end=Date.UTC(y+1,0,1);
    for(var ms=start;ms<end;ms+=DAY){
      var hk=Math.round(ms/DAY)+2440588-EPOCH,cy=Math.floor((hk*800-373)/292207),elapsed=undefined;
      if(hk%292207===95333){cy--;elapsed=365}
      var c=yearCache[cy]||(yearCache[cy]=year0(cy));if(elapsed===undefined)elapsed=hk-c.h;
      var total=c.days+elapsed,cs=cumulative[c.type],ss=slots[c.type];
      for(var j=cs.length-1;j>=0;j--){if(total>cs[j]){if(total-cs[j]===15&&!moons[ss[j]])moons[ss[j]]=ms;break}}
    }
    var extra=!!moons[88];
    return {makha:moons[extra?4:3],visakha:moons[extra?7:6],asalha:moons[88]||moons[8]};
  }
  function iso(ms){return new Date(ms).toISOString().slice(0,10)}
  function build(y){
    y=Number(y);if(!Number.isInteger(y)||y<1600||y>9998)return [];
    if(cache.has(y))return cache.get(y).map(function(r){return Object.assign({},r)});
    var all=[];
    function add(yr,m,d,name,icon,group){all.push({ms:Date.UTC(yr,m-1,d),name:name,icon:icon,group:group||name,scope:'national',calculated:true})}
    // Include adjacent years so a Dec 31 substitution can land in January.
    [y-1,y,y+1].forEach(function(yr){
      add(yr,1,1,'วันขึ้นปีใหม่','spark','newyear');
      add(yr,4,6,'วันจักรี','temple');
      [13,14,15].forEach(function(d){add(yr,4,d,'วันสงกรานต์','water','songkran')});
      if(yr>=2019)add(yr,5,4,'วันฉัตรมงคล','temple');else if(yr>=1950&&yr<=2016)add(yr,5,5,'วันฉัตรมงคล','temple');
      if(yr>=2019)add(yr,6,3,'วันเฉลิมพระชนมพรรษา\nพระราชินี','temple');
      if(yr>=2017)add(yr,7,28,'วันเฉลิมพระชนมพรรษา\nรัชกาลที่ 10','temple');
      add(yr,8,12,'วันแม่แห่งชาติ','flower');
      if(yr>=2017)add(yr,10,13,yr>=2023?'วันนวมินทรมหาราช':'วันคล้ายวันสวรรคต\nรัชกาลที่ 9','temple');
      add(yr,10,23,'วันปิยมหาราช','temple');
      add(yr,12,5,'วันพ่อแห่งชาติ / วันชาติ','flower');
      add(yr,12,10,'วันรัฐธรรมนูญ','book');add(yr,12,31,'วันสิ้นปี','spark','newyear');
      var moons=lunarDays(yr);
      [['makha','วันมาฆบูชา'],['visakha','วันวิสาขบูชา'],['asalha','วันอาสาฬหบูชา']].forEach(function(pair){if(moons[pair[0]]){var dt=new Date(moons[pair[0]]);add(yr,dt.getUTCMonth()+1,dt.getUTCDate(),pair[1],'lotus',pair[0]==='asalha'?'buddhist-lent':pair[0])}});
      if(moons.asalha){var phansa=new Date(moons.asalha+DAY);add(yr,phansa.getUTCMonth()+1,phansa.getUTCDate(),'วันเข้าพรรษา','lotus','buddhist-lent')}
    });
    // Government rule: one substitute per consecutive holiday block.
    // Cabinet-specific exceptions are supplied by the verified year overrides.
    all.sort(function(a,b){return a.ms-b.ms});var occupied=new Set(all.map(function(r){return r.ms})),sub=[];
    for(var i=0;i<all.length;){var block=[all[i++]],last=block[0].ms;while(i<all.length&&all[i].ms<=last+DAY){last=all[i].ms;block.push(all[i++])}
      var weekends=block.filter(function(r){return [0,6].includes(new Date(r.ms).getUTCDay())});if(!weekends.length)continue;
      var target=last+DAY;while([0,6].includes(new Date(target).getUTCDay())||occupied.has(target))target+=DAY;
      var names=Array.from(new Set(weekends.map(function(r){return r.name.replace(/\n/g,' ')})));
      sub.push({ms:target,name:'ชดเชย'+names.join(' / '),icon:weekends[0].icon,scope:'national',calculated:true,substitute:true});occupied.add(target);
    }
    var result=all.concat(sub).filter(function(r){return new Date(r.ms).getUTCFullYear()===y}).map(function(r){return {date:iso(r.ms),name:r.name,icon:r.icon,scope:r.scope,calculated:true,substitute:!!r.substitute}}).sort(function(a,b){return a.date.localeCompare(b.date)});
    if(cache.size>=20)cache.delete(cache.keys().next().value);cache.set(y,result);return result.map(function(r){return Object.assign({},r)});
  }
  window.rbThaiHolidayCalendar=Object.freeze({forYear:build,lunarDays:lunarDays});
})();
