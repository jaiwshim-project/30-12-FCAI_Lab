/* ============================================================
   미래역량AI연구소 — categories-data.js
   대분류 7개 × 중분류 28개 키워드 기반 자동 분류 체계
   ============================================================ */
'use strict';

/* ── 분류 체계 (배열 순서 = 검사 우선순위) ─────────────── */
const TAXONOMY = [

  /* 1. 신앙·영성 — 고유 키워드 먼저 체크 */
  {
    id: 'faith', name: '신앙·영성', icon: '✝️', color: '#6D28D9',
    subs: [
      { id: 'faith-ai', name: 'AI와 영성', icon: '🙏',
        keywords: ['기독교 신앙생활에서 인공지능', '기독교 신앙생활에서 ai',
                   '기독교 신앙생활에서 챗'] },
      { id: 'biblical-leadership', name: '성경적 리더십', icon: '👑',
        keywords: ['다윗왕의 신앙', '솔로몬의 순종', '모세'] },
      { id: 'faith-practice', name: '신앙 실천', icon: '📿',
        keywords: ['십계명', '성경이 가르치는', '창세기', '기독교 신앙',
                   '인성과 인생을 바꾸는 감사'] },
    ]
  },

  /* 2. 예술·문화 */
  {
    id: 'art-culture', name: '예술·문화', icon: '🎨', color: '#DB2777',
    subs: [
      { id: 'ai-docent', name: 'AI 도슨트', icon: '🖼️',
        keywords: ['도슨트', 'docent', 'ai도슨'] },
      { id: 'ai-music', name: 'AI 음악·영상', icon: '🎵',
        keywords: ['ai뮤직', 'ai music', '아트시네마', 'ai시네마', 'ai 시네마', '뮤직', 'music',
                   '반고흐 ai', '마군성', '캐롤', '아트뮤직',
                   '반 고흐', 'van gogh', '고흐', 'bts', '방탄소년단', '강석진'] },
      { id: 'korean-culture', name: '한국 전통문화', icon: '🏯',
        keywords: ['한복', '암각화', '경복궁', '반구대', 'k컬처', 'k 컬처', '반고흐 ai톡',
                   '신윤복', '김홍도'] },
      { id: 'history', name: '역사·인문', icon: '📜',
        keywords: ['삼국지', '관우', '제갈량', '유비', '장비', '도원결의',
                   '조조의 단가행', '조조 단가행', '조조 다들',
                   'ai도슨트 조조', 'ai도슨트 제갈', 'ai도슨트 관우', 'ai도슨트 유비',
                   '돈스코이', '워커 장군', '워커 대장', '워커 헌정',
                   'walker 3 pillars', 'english podcast   walker',
                   'a song for a general', '장군과 약속', '워커 대장', 'carrying on the leadership legacy'] },
    ]
  },

  /* 3. 교육·학습 */
  {
    id: 'education', name: '교육·학습', icon: '📚', color: '#D97706',
    subs: [
      { id: 'ai-edu', name: 'AI 교육 솔루션', icon: '🎓',
        keywords: ['ai노벨문해력', 'ai노벨', '큐지북', 'ai와 문해력', '학원 경영',
                   '진로진학gpt', 'ai북튜터', '노벨 영재 교육', '노벨상 도전'] },
      { id: 'literacy', name: '문해력·독서법', icon: '📖',
        keywords: ['문해력', '독서법', '한강 글쓰기', '글쓰기', '3색줄독서',
                   '오디오북', '노벨문학상 수상자', '노벨상 수상자',
                   '1% genius', 'gather the secret', 'book discussion',
                   '영어 단기간 정복', '초등생 하버드대', '학위 논문', '글쓰기와 출판'] },
      { id: 'gifted', name: '영재·창의교육', icon: '⭐',
        keywords: ['영재', '질문수학', '큐지매쓰', '창의질문', '15창의질문', '영재교육',
                   '아이 재능과 적성', '내 아이 교육법', '수학을 단기간에', '학교 폭력'] },
      { id: 'future-jobs', name: '미래 직업', icon: '🔭',
        keywords: ['미래직업', '미래 직업', '프롬프트 엔지니어',
                   '인공지능 전문가', '자율주행 자동차 엔지니어', '빅데이터 전문가',
                   '로봇공학자', '메타버스 기획자', '홀로그램 전문가',
                   'ux 디자인 컨설턴트', '해양 에너지 기술자', '3d 프린팅 전문가',
                   '미래에 직업을 갖기', '고교생 대학 전공'] },
    ]
  },

  /* 4. 자기계발·심리 */
  {
    id: 'self-dev', name: '자기계발·심리', icon: '🌱', color: '#059669',
    subs: [
      { id: 'mindfulness', name: '마음챙김·행복', icon: '😊',
        keywords: ['마음챙김으로 행복', '마음챙김', '행복 찾기', '행복은 강렬함',
                   '회복탄력성', '행복 명언'] },
      { id: 'gratitude', name: '감사·인성', icon: '🙏',
        keywords: ['감사의 힘', '인성과 인생을 바꾸는', '인성과 인생'] },
      { id: 'creativity', name: '창의력·기억력', icon: '🧠',
        keywords: ['창의적 기억력', '기억력', '두뇌건강', 'triz', '창의력',
                   '몰입의 기술', '암기력을 높이는', '실행력 높이는'] },
      { id: 'career', name: '취업·커리어', icon: '💼',
        keywords: ['커리어앵커', '구직의 즐거움', '취업비법', '이력서',
                   '면접의 기술', '프리랜서가 경쟁에서', '커리어우먼의', '시니어 재취업'] },
    ]
  },

  /* 5. 소통·관계 */
  {
    id: 'communication', name: '소통·관계', icon: '💬', color: '#7C3AED',
    subs: [
      { id: 'counseling', name: '상담 스킬', icon: '🩺',
        keywords: ['치과병원의 상담', '치과병원', '화이트서울치과', '상담 스킬', '환자 중심 상담',
                   '덴탈클리닉파인더', 'qlrcq 기법', 'qlrcq', '환자 상담', '치과 상담',
                   '페이스올로지', '치아가 아닌', '동물병원'] },
      { id: 'comm-skills', name: '소통 스킬', icon: '🗣️',
        keywords: ['톡와이즈', 'talkwise', '페이스북에서 만난 소통',
                   '6가지 질문 유형', '소통의 신', '톡스캔', '소통진단', '고교생의 논쟁'] },
      { id: 'coaching', name: '코칭·멘토링', icon: '🌟',
        keywords: ['직원의 소프트 랜딩', '직원의 온전성', '입사 후 빠르게 핵심인재', '온보딩'] },
    ]
  },

  /* 6. 비즈니스·경영 */
  {
    id: 'business', name: '비즈니스·경영', icon: '💼', color: '#0F766E',
    subs: [
      { id: 'leadership', name: '리더십', icon: '🎯',
        keywords: ['변혁적 리더십', 'esg 경영', 'esg', '군인정신 강화', '군인정신',
                   '조조의 경영전략', '리더십', '미국 육군사관학교', 'mbti를 활용한'] },
      { id: 'sales', name: '영업·세일즈', icon: '💰',
        keywords: ['세일즈마케팅gpt', 'spin셀링', 'spin 셀링', '인사이트셀링',
                   '세일즈스파크', '세일즈', '보험영업'] },
      { id: 'startup', name: '창업·사업전략', icon: '🏢',
        keywords: ['창업', '사업 기획', 'a guide to starting your own business',
                   'guide to starting', '전략 컨설팅', '경영전략',
                   '케르비시아', '수제맥주', '융합상생', 'bj attao', 'the bj attao'] },
      { id: 'negotiation', name: '협상·설득', icon: '🤝',
        keywords: ['협상', '설득의 종말', '결정 프레임워크', '설득이 아닌'] },
    ]
  },

  /* 7. AI·디지털 역량 — generic AI 키워드는 가장 마지막 */
  {
    id: 'ai-digital', name: 'AI·디지털 역량', icon: '🤖', color: '#1D4ED8',
    subs: [
      { id: 'ai-biz', name: 'AI 비즈니스', icon: '🚀',
        keywords: ['ai선거솔루션', 'ai선거 솔루션', 'ai선거', '선거솔루션', '선거 솔루션',
                   'ａｉ선거솔루션', '선거 참모', '선거 비전', '선거파워', '선거 후보',
                   'ai 선거', 'ai튜터허브', 'ai소리펜', 'ai 소리펜', 'gpts로 나만의', '퀀텀gpt',
                   '마이펫ai', 'ai펫캐에', 'ai톡허브', '소셜허브 터널',
                   'ai 영업 파트너', '보험영업 ai튜터'] },
      { id: 'future-tech', name: '미래기술·과학', icon: '🔬',
        keywords: ['블록체인', 'k사이언스', 'ops', '제로존', '특이점', '초지능',
                   '알파폴드', '영지식 증명', '계산의 시대', '점의 반란',
                   'k science', '4차 산업혁명', '기술적 특이점',
                   '양동봉', 'immersion technology', 'rebellion of the point',
                   '줄기세포', '재생의료', '양자컴퓨터', '나노',
                   'k 사이언스', 'yang dong bong', '메타버스 트렌드', '글로벌 메가트렌드'] },
      { id: 'ai-tools', name: 'AI 도구 활용', icon: '💡',
        keywords: ['chatgpt', 'claude', 'gpt', 'ai활용', 'ai에이전트',
                   'ai트레이너', 'rqtdw', '사고법os', '챗gpt', 'ai는 새로운 검색'] },
      { id: 'prompt', name: '프롬프트·질문법', icon: '✍️',
        keywords: ['프롬프트'] },
    ]
  },
];

/* ── 분류 함수 ───────────────────────────────────────────── */
function getVideoCategory(title) {
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

function getMainById(id) {
  for (var i = 0; i < TAXONOMY.length; i++) {
    if (TAXONOMY[i].id === id) return TAXONOMY[i];
  }
  return null;
}

function getSubById(subId) {
  for (var i = 0; i < TAXONOMY.length; i++) {
    var main = TAXONOMY[i];
    for (var j = 0; j < main.subs.length; j++) {
      if (main.subs[j].id === subId) {
        return Object.assign({}, main.subs[j], {
          mainId: main.id, mainName: main.name, color: main.color
        });
      }
    }
  }
  return null;
}

/* renderVideoCard(common.js) 호환 */
function getCategoryById(id) {
  var sub = getSubById(id);
  if (sub) return sub;
  var main = getMainById(id);
  if (main) return main;
  return { id: 'other', name: '기타', icon: '📋', color: '#64748B' };
}

/* ── 분류된 영상 배열 (지연 생성) ──────────────────────── */
var _VIDEOS_CATEGORIZED = null;

function getCategorizedVideos() {
  if (_VIDEOS_CATEGORIZED) return _VIDEOS_CATEGORIZED;
  if (typeof VIDEOS_DATA === 'undefined') return [];
  _VIDEOS_CATEGORIZED = VIDEOS_DATA.map(function(v) {
    var cat = getVideoCategory(v.title);
    return Object.assign({}, v, {
      video_id     : v.id,
      published_at : v.date,
      view_count   : v.views   || 0,
      like_count   : v.likes   || 0,
      thumbnail_url: 'https://img.youtube.com/vi/' + v.id + '/mqdefault.jpg',
      category_id  : cat.subId,
      mainId       : cat.mainId,
      subId        : cat.subId,
    });
  });
  return _VIDEOS_CATEGORIZED;
}

/* ── 카운트 맵 (지연 생성) ──────────────────────────────── */
var _COUNTS = null;

function getCounts() {
  if (_COUNTS) return _COUNTS;
  var counts = { _total: 0 };
  TAXONOMY.forEach(function(main) {
    counts[main.id] = { _total: 0, subs: {} };
    main.subs.forEach(function(sub) { counts[main.id].subs[sub.id] = 0; });
  });
  counts.other = { _total: 0, subs: {} };

  getCategorizedVideos().forEach(function(v) {
    counts._total++;
    if (v.mainId === 'other') {
      counts.other._total++;
    } else if (counts[v.mainId]) {
      counts[v.mainId]._total++;
      if (counts[v.mainId].subs[v.subId] !== undefined) {
        counts[v.mainId].subs[v.subId]++;
      }
    }
  });
  _COUNTS = counts;
  return counts;
}

/* ── 시리즈 감지 및 그룹핑 ──────────────────────────────── */

/**
 * 제목에서 시리즈 정보 추출
 * 반환: { base: '시리즈명', num: 에피소드번호 } 또는 null
 */
function extractSeriesInfo(title) {
  var t = (title || '').trim();
  var patterns = [
    // "1  제목", "01. 제목", "1강 제목" — 맨 앞 번호
    [/^(\d+)\s*[\.강화편]?\s{1,3}(.{2,})$/, true],
    // "제목 1강", "제목 1화", "제목 1편", "제목 1부"
    [/^(.{2,}?)\s+(\d+)\s*[강화편부회차시절]$/, false],
    // "제목 - 1", "제목 – 01"
    [/^(.{2,}?)\s*[-–]\s*(\d+)$/, false],
    // "제목 (1)", "제목 [1]"
    [/^(.{2,}?)\s*[\(\[]\s*(\d+)\s*[\)\]]$/, false],
    // "제목 강의01", "제목 강의16" — 강의+숫자 suffix
    [/^(.{6,}?)\s+강의(\d+)$/, false],
    // "제목 01서브타이틀" — 2자리 숫자 뒤 바로 한글/영문 연결 (공백 없음)
    [/^(.{6,}?)\s+(\d{2})(?=[가-힣A-Za-z])/, false],
    // "제목 1" — 끝 숫자 (1~3자리)
    [/^(.{3,}?)\s+(\d{1,3})$/, false],
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = t.match(patterns[i][0]);
    if (!m) continue;
    var leadingNum = patterns[i][1];
    var num  = parseInt(leadingNum ? m[1] : m[2]);
    var base = (leadingNum ? m[2] : m[1]).trim();
    if (num >= 1 && num <= 999 && base.length >= 2) {
      return { base: base, num: num };
    }
  }
  return null;
}

/**
 * 영상 배열을 시리즈 단위로 그룹핑
 * 2개 이상 같은 base가 있으면 series 객체로 합침
 */
function groupVideosBySeries(videos) {
  var map = {};
  var noSeries = [];

  videos.forEach(function(v) {
    var info = extractSeriesInfo(v.title);
    if (info) {
      if (!map[info.base]) map[info.base] = [];
      map[info.base].push(Object.assign({}, v, { _episodeNum: info.num }));
    } else {
      noSeries.push(v);
    }
  });

  var result = [];
  Object.keys(map).forEach(function(base) {
    var eps = map[base];
    if (eps.length >= 2) {
      eps.sort(function(a, b) { return a._episodeNum - b._episodeNum; });
      var totalViews = eps.reduce(function(s, e) { return s + (e.view_count || e.views || 0); }, 0);
      var latestDate = eps.reduce(function(d, e) {
        var ed = e.published_at || e.date || '';
        return ed > d ? ed : d;
      }, '');
      var sid = 'sr-' + base.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 16);

      /* ── 부모 영상 탐색: base 포함 + 소개/개요/overview/intro 포함 → 시리즈 대표 카드로 승격 */
      var parentVideo = null;
      var baseLow = base.toLowerCase();
      for (var pi = noSeries.length - 1; pi >= 0; pi--) {
        var pv = noSeries[pi];
        var pvLow = (pv.title || '').toLowerCase();
        var hasBase = pvLow.indexOf(baseLow) !== -1;
        var isOverview = /소개|개요|overview|intro|introduction/.test(pvLow);
        if (hasBase && isOverview) {
          parentVideo = pv;
          noSeries.splice(pi, 1);
          break;
        }
      }

      var face = parentVideo || eps[0];
      result.push({
        _isSeries    : true,
        _seriesId    : sid,
        _parentTitle : parentVideo ? parentVideo.title : null,
        title        : parentVideo ? parentVideo.title : base,
        episodes     : eps,
        id           : face.video_id || face.id,
        video_id     : face.video_id || face.id,
        url          : face.url,
        thumbnail_url: face.thumbnail_url
                     || ('https://img.youtube.com/vi/' + (face.video_id || face.id) + '/mqdefault.jpg'),
        mainId       : eps[0].mainId,
        subId        : eps[0].subId,
        category_id  : eps[0].category_id,
        view_count   : totalViews,
        views        : totalViews,
        published_at : latestDate,
        date         : latestDate,
      });
    } else {
      noSeries.push(eps[0]);
    }
  });

  return result.concat(noSeries);
}

/* ── 전역 노출 ───────────────────────────────────────────── */
if (typeof window !== 'undefined') {
  window.TAXONOMY             = TAXONOMY;
  window.getCategoryById      = getCategoryById;
  window.getVideoCategory     = getVideoCategory;
  window.getCategorizedVideos = getCategorizedVideos;
  window.getCounts            = getCounts;
  window.getMainById          = getMainById;
  window.getSubById           = getSubById;
  window.extractSeriesInfo    = extractSeriesInfo;
  window.groupVideosBySeries  = groupVideosBySeries;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TAXONOMY, getVideoCategory, getCategoryById, getCategorizedVideos };
}
