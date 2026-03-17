const fs = require('fs');
const BASE = __dirname;

// Current TAXONOMY (latest from categories-data.js)
const TAXONOMY = [
  { id:'faith', name:'신앙·영성', subs:[
    {id:'faith-ai', keywords:['기독교 신앙생활에서 인공지능','기독교 신앙생활에서 ai','기독교 신앙생활에서 챗']},
    {id:'biblical-leadership', keywords:['다윗왕의 신앙','솔로몬의 순종','모세']},
    {id:'faith-practice', keywords:['십계명','성경이 가르치는','창세기','기독교 신앙','인성과 인생을 바꾸는 감사']},
  ]},
  { id:'art-culture', name:'예술·문화', subs:[
    {id:'ai-docent', keywords:['도슨트','docent']},
    {id:'ai-music', keywords:['ai뮤직','ai music','아트시네마','ai시네마','ai 시네마','뮤직','music','반고흐 ai','마군성','캐롤','아트뮤직']},
    {id:'korean-culture', keywords:['한복','암각화','경복궁','반구대','k컬처','k 컬처','반고흐 ai톡']},
    {id:'history', keywords:['삼국지','관우','제갈량','유비','장비','도원결의','조조의 단가행','조조 단가행','조조 다들','ai도슨트 조조','ai도슨트 제갈','ai도슨트 관우','ai도슨트 유비','돈스코이','워커 장군','워커 대장','워커 헌정','walker 3 pillars','a song for a general','장군과 약속','carrying on the leadership legacy']},
  ]},
  { id:'education', name:'교육·학습', subs:[
    {id:'ai-edu', keywords:['ai노벨문해력','ai노벨','큐지북','ai와 문해력','학원 경영','진로진학gpt','ai북튜터','노벨 영재 교육','노벨상 도전']},
    {id:'literacy', keywords:['문해력','독서법','한강 글쓰기','글쓰기','3색줄독서','오디오북','노벨문학상 수상자','노벨상 수상자','1% genius','gather the secret','book discussion']},
    {id:'gifted', keywords:['영재','질문수학','큐지매쓰','창의질문','15창의질문','영재교육']},
    {id:'future-jobs', keywords:['미래직업','미래 직업','프롬프트 엔지니어','인공지능 전문가','자율주행 자동차 엔지니어','빅데이터 전문가','로봇공학자','메타버스 기획자','홀로그램 전문가','ux 디자인 컨설턴트','해양 에너지 기술자','3d 프린팅 전문가']},
  ]},
  { id:'self-dev', name:'자기계발·심리', subs:[
    {id:'mindfulness', keywords:['마음챙김으로 행복','마음챙김','행복 찾기','행복은 강렬함']},
    {id:'gratitude', keywords:['감사의 힘','인성과 인생을 바꾸는','인성과 인생']},
    {id:'creativity', keywords:['창의적 기억력','기억력','두뇌건강','triz','창의력']},
    {id:'career', keywords:['커리어앵커','구직의 즐거움','취업비법','이력서']},
  ]},
  { id:'communication', name:'소통·관계', subs:[
    {id:'counseling', keywords:['치과병원의 상담','치과병원','화이트서울치과','상담 스킬','환자 중심 상담','덴탈클리닉파인더','qlrcq 기법','qlrcq','환자 상담','치과 상담','페이스올로지','치아가 아닌','동물병원']},
    {id:'comm-skills', keywords:['톡와이즈','talkwise','페이스북에서 만난 소통','6가지 질문 유형','소통의 신','톡스캔','소통진단']},
    {id:'coaching', keywords:['직원의 소프트 랜딩','직원의 온전성','입사 후 빠르게 핵심인재','온보딩']},
  ]},
  { id:'business', name:'비즈니스·경영', subs:[
    {id:'leadership', keywords:['변혁적 리더십','esg 경영','esg','군인정신 강화','군인정신','조조의 경영전략','리더십']},
    {id:'sales', keywords:['세일즈마케팅gpt','spin셀링','spin 셀링','인사이트셀링','세일즈스파크','세일즈','보험영업']},
    {id:'startup', keywords:['창업','사업 기획','a guide to starting your own business','guide to starting','전략 컨설팅','경영전략','케르비시아','수제맥주','융합상생','bj attao','the bj attao']},
    {id:'negotiation', keywords:['협상','설득의 종말','결정 프레임워크','설득이 아닌']},
  ]},
  { id:'ai-digital', name:'AI·디지털 역량', subs:[
    {id:'ai-biz', keywords:['ai선거솔루션','ai선거 솔루션','ai선거','선거솔루션','선거 솔루션','ａｉ선거솔루션','선거 참모','선거 비전','선거파워','선거 후보','ai 선거','ai튜터허브','ai소리펜','ai 소리펜','gpts로 나만의','퀀텀gpt','마이펫ai','ai펫캐에','ai톡허브','소셜허브 터널','ai 영업 파트너','보험영업 ai튜터']},
    {id:'future-tech', keywords:['블록체인','k사이언스','ops','제로존','특이점','초지능','알파폴드','영지식 증명','계산의 시대','점의 반란','k science','4차 산업혁명','기술적 특이점','양동봉','immersion technology','rebellion of the point','줄기세포','재생의료','양자컴퓨터','나노']},
    {id:'ai-tools', keywords:['chatgpt','claude','gpt','ai활용','ai에이전트','ai트레이너','rqtdw','사고법os','챗gpt','ai는 새로운 검색']},
    {id:'prompt', keywords:['프롬프트']},
  ]},
];

function classify(title) {
  var t = (title || '').toLowerCase();
  for (var i = 0; i < TAXONOMY.length; i++) {
    var main = TAXONOMY[i];
    for (var j = 0; j < main.subs.length; j++) {
      var sub = main.subs[j];
      for (var k = 0; k < sub.keywords.length; k++) {
        if (t.indexOf(sub.keywords[k].toLowerCase()) !== -1) {
          return { mainId: main.id, subId: sub.id };
        }
      }
    }
  }
  return { mainId: 'other', subId: 'other' };
}

var raw = fs.readFileSync(BASE + '/videos.csv', 'utf8').replace(/^\uFEFF/, '');
var lines = raw.split('\n').slice(1).filter(function(l){ return l.trim(); });

var otherTitles = [];
lines.forEach(function(row) {
  var parts = row.split(',');
  var title = (parts[1] || '').trim().replace(/^"|"$/g,'');
  if (!title) return;
  var cat = classify(title);
  if (cat.mainId === 'other') otherTitles.push(title);
});

// 단어 빈도 분석 (2글자 이상 한글 단어)
var wordFreq = {};
otherTitles.forEach(function(title) {
  var words = title.match(/[가-힣]{2,}/g) || [];
  words.forEach(function(w) {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });
  // 영문도 포함
  var engWords = title.match(/[a-zA-Z]{3,}/g) || [];
  engWords.forEach(function(w) {
    var lw = w.toLowerCase();
    wordFreq[lw] = (wordFreq[lw] || 0) + 1;
  });
});

// 빈도 기준 정렬
var sorted = Object.keys(wordFreq).sort(function(a,b){ return wordFreq[b] - wordFreq[a]; });
console.log('=== 미분류 영상 단어 빈도 TOP 80 ===');
sorted.slice(0, 80).forEach(function(w, i) {
  process.stdout.write(w + ':' + wordFreq[w] + '  ');
  if ((i+1) % 8 === 0) process.stdout.write('\n');
});
console.log('\n\n=== 미분류 영상 전체 목록 (' + otherTitles.length + '개) ===');
otherTitles.forEach(function(t, i) { console.log((i+1) + '. ' + t); });
