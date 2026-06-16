import { PresetInscription } from "./types";

// All preset images are hosted on Wikimedia Commons (high-resolution canonical
// photos of each pilgrimage site). They are stable URLs without rate limits or
// hot-linking restrictions. PresetGallery pre-verifies each one on mount and
// silently drops any card whose image fails to load.
export const PRESET_INSCRIPTIONS: PresetInscription[] = [
  {
    id: "vatican-petrus",
    title: "성 베드로 대성당 천장 황금 비문",
    originalText: "TV ES PETRVS ET SVPER HANC PETRAM AEDIFICABO ECCLESIAM MEAM ET TIBI DABO CLAVES REGNI CAELORVM",
    location: "성 베드로 대성당 주 제단 돔 하단 모자이크",
    city: "로마 바티칸 (Vatican City)",
    imageAlt: "Basilica di San Pietro in Vaticano façade",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/800px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg",
    description: "성 베드로 광장과 대성당의 심장부에 울려 퍼지는 마태오 복음서 16장 18-19절 구절입니다. 베드로(반석) 위에 교회를 세우고 하늘나라의 열쇠를 주겠다는 약속이 새겨져 있습니다."
  },
  {
    id: "florence-portal",
    title: "피렌체 두오모 성당 정문 장식",
    originalText: "DOMINVS DEVS SABAOTH PLENI SVNT COELI ET TERRA GLORIA TVA",
    location: "산타 마리아 델 피오레 대성당 파사드 및 제단 상부",
    city: "피렌체 (Florence, Italy)",
    imageAlt: "Cattedrale di Santa Maria del Fiore — Duomo di Firenze",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Cattedrale_di_Santa_Maria_del_Fiore_%E2%80%93_Il_Duomo_di_Firenze.jpg/800px-Cattedrale_di_Santa_Maria_del_Fiore_%E2%80%93_Il_Duomo_di_Firenze.jpg",
    description: "가톨릭 미사의 거룩하시도다(Sanctus) 감사송 구절이며, 이사야서 6장 3절에 기원을 둡니다. 온 천지에 가득한 하느님의 영광을 기리는 찬미가 예배처 입구에 조각되어 있습니다."
  },
  {
    id: "santiago-gate",
    title: "산티아고 영광의 문 아치",
    originalText: "EGO SVM IANVA EST EST EST ET SALVABITVR INGREDIETVR ET EGREDIETVR ET PASCVA INVENIET",
    location: "산티아고 데 콤포스텔라 대성당 영광의 문 (Pórtico de la Gloria)",
    city: "산티아고 (Santiago, Spain)",
    imageAlt: "Santiago de Compostela Cathedral",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Santiago_cathedral_2021.jpg/800px-Santiago_cathedral_2021.jpg",
    description: "요한복음 10장 9절 말씀으로, 예수님께서 '나는 문이다. 누구든지 나를 통하여 들어오면 구원을 받고, 드나들며 풀밭을 찾아 얻을 것이다'라고 선포하시는 야고보 사도의 순례길 종착지 비문입니다."
  },
  {
    id: "assisi-peace",
    title: "아시시 성 프란치스코 성당 비문",
    originalText: "PAX ET BONVM",
    location: "성 프란치스코 바실리카 입구 및 정원 저택",
    city: "아시시 (Assisi, Italy)",
    imageAlt: "Basilica di San Francesco d'Assisi",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Assisi_San_Francesco_BW_2.JPG/800px-Assisi_San_Francesco_BW_2.JPG",
    description: "평화의 성자 에우제니오 프란치스코의 문장이자 프란치스코 수도회의 핵심 영성이 담긴 기도문입니다. 가난과 겸손 속에서 피어나는 '평화와 선(일)'을 온 세상을 향해 빕니다."
  },
  {
    id: "catacombs-sleep",
    title: "로마 산 칼리스토 카타콤베 묘비",
    originalText: "REQVIESCAT IN PACE",
    location: "로마 산 칼리스토 카타콤베 지하 묘역의 묘비",
    city: "로마 (Rome, Italy)",
    imageAlt: "Catacomb of Callixtus entrance, Rome",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Rom%2C_Calixtus-Katakombe%2C_Eingangstor_zum_Park_der_Katakombe.jpg/800px-Rom%2C_Calixtus-Katakombe%2C_Eingangstor_zum_Park_der_Katakombe.jpg",
    description: "전 세계 가톨릭 상장 예식과 비문에 새겨지는 대표적인 라틴어 위령구로 '주님, 그에게 영원한 안식을 주소서' 기도의 귀결점입니다. 오늘날 장례 문구인 'R.I.P.'의 기원입니다."
  },
  {
    id: "crucifix-inri",
    title: "십자가 고상 죄패 (Titulus)",
    originalText: "I N R I (IESVS NAZARENVS REX IVDAEORVM)",
    location: "유럽 대다수 제단 고상 또는 고딕 정문 십자가 상단",
    city: "전 유럽 성당 공통",
    imageAlt: "Crucifixion altarpiece, Deutschordenskirche, Vienna",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Wien_Deutschordenskirche_Fl%C3%BCgelaltar_Kreuzigung_01.jpg/800px-Wien_Deutschordenskirche_Fl%C3%BCgelaltar_Kreuzigung_01.jpg",
    description: "예수님이 십자가 처형을 당하실 때 빌라도 장독에 의해 히브리어, 그리스어, 라틴어로 적혔던 죄패에서 기원합니다. '유다인들의 왕 나자렛 예수'라는 구원사의 상징적 고백이 축약되어 있습니다."
  },
  {
    id: "lourdes-grotto",
    title: "루르드 성모 발현 동굴 명문",
    originalText: "EGO SVM IMMACVLATA CONCEPTIO",
    location: "마사비엘 동굴 (Grotte de Massabielle) 성모상 기단",
    city: "루르드 (Lourdes, France)",
    imageAlt: "Sanctuary of Our Lady of Lourdes Basilica",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Lourdes_basilique_vue_depuis_ch%C3%A2teau_%283%29.JPG/800px-Lourdes_basilique_vue_depuis_ch%C3%A2teau_%283%29.JPG",
    description: "1858년 3월 25일 성 베르나데트 수비루에게 발현하신 성모님께서 '나는 원죄 없는 잉태이다'라고 응답하신 라틴어 문구가 동굴의 성모상 발치에 새겨져 있습니다. 비오 9세의 무염시태 교의 선포(1854) 직후의 천상 응답이라는 점에서 영적 무게가 깊습니다."
  },
  {
    id: "montecassino-rule",
    title: "몬테카시노 베네딕도 수도원 회랑",
    originalText: "ORA ET LABORA",
    location: "몬테카시노 대수도원 정문 및 회랑 (성 베네딕토 묘소)",
    city: "몬테카시노 (Monte Cassino, Italy)",
    imageAlt: "Monte Cassino Abbey",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/MonteCassino_Abbey.jpg/800px-MonteCassino_Abbey.jpg",
    description: "529년 성 베네딕토가 직접 세운 서방 수도 영성의 모태입니다. 「베네딕도 규칙서」의 정수를 응축한 '기도하고 일하라'는 표어가 수도원 정문과 회랑 곳곳에 새겨져, 14세기 이상 이어진 수도자 일과의 호흡을 전해줍니다."
  },
  {
    id: "notredame-portal",
    title: "파리 노트르담 서쪽 정문 마리아 포털",
    originalText: "AVE MARIA GRATIA PLENA DOMINVS TECVM",
    location: "서쪽 정문 왼쪽 포털 (Portail de la Vierge) 마리아상 기단",
    city: "파리 (Paris, France)",
    imageAlt: "Notre-Dame de Paris western façade",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Notre-Dame_de_Paris%2C_4_October_2017.jpg/800px-Notre-Dame_de_Paris%2C_4_October_2017.jpg",
    description: "루카 복음 1장 28절, 천사 가브리엘이 성모님께 전한 인사를 그대로 옮긴 라틴어 명문입니다. '은총이 가득한 마리아여, 주께서 함께 계시도다.' 13세기 고딕 건축이 빚어낸 영적 정수가 서쪽 정문 마리아 포털의 핵심 메시지로 응축되어 있습니다."
  },
  {
    id: "czestochowa-mother",
    title: "체스토호바 야스나구라 검은 성모 제대",
    originalText: "MONSTRA TE ESSE MATREM",
    location: "야스나구라 (Jasna Góra) 수도원 본당 검은 성모 제대 상부",
    city: "체스토호바 (Częstochowa, Poland)",
    imageAlt: "Jasna Góra Monastery in Częstochowa",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Cz%C4%99stochowa_klasztor_Jasna_G%C3%B3ra-2162.jpg/800px-Cz%C4%99stochowa_klasztor_Jasna_G%C3%B3ra-2162.jpg",
    description: "폴란드 영적 수도의 심장. 찬가 「Ave Maris Stella」에서 가져온 '어머니이심을 보여주소서'가 검은 성모 제대 상부 명문으로 새겨져 있습니다. 파울리스타 수도회 본원이자 요한 바오로 2세 교황이 가장 자주 찾으신 마리아 성지입니다."
  }
];
