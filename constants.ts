import { QuestionData, Gender } from './types';

// Helper type for internal data definition
type GenderVariant = { m: string; f: string };
type RawQuestionData = Omit<QuestionData, 'question' | 'answer'> & {
  question: string | GenderVariant;
  answer: string | GenderVariant;
};

const RAW_QUESTIONS: RawQuestionData[] = [
  {
    id: 1,
    question: "Кто твой оте́ц?",
    answer: "Мой оте́ц — инжене́р. Он рабо́тает на заво́де.",
    questionZh: "你的父亲是谁？",
    answerZh: "我的父亲是工程师。他在工厂工作。"
  },
  {
    id: 2,
    question: "Что стои́т на столе́?",
    answer: "На столе́ стоя́т краси́вые цветы́.",
    questionZh: "桌子上放着什么？",
    answerZh: "桌子上放着漂亮的花。"
  },
  {
    id: 3,
    question: "Что ты чита́ешь?",
    answer: "Я чита́ю кни́гу и газе́ту.",
    questionZh: "你在读什么？",
    answerZh: "我在读一本书和一份报纸。"
  },
  {
    id: 4,
    question: "Что де́лала И́нна вчера́ ве́чером?",
    answer: "Вчера́ ве́чером она́ смотре́ла телеви́зор.",
    questionZh: "Inna 昨天晚上在做什么？",
    answerZh: "昨天晚上她在看电视。"
  },
  {
    id: 5,
    question: "Како́й язы́к ты зна́ешь?",
    answer: "Я зна́ю кита́йский, англи́йский и ру́сский языки́.",
    questionZh: "你会什么语言？",
    answerZh: "我会汉语、英语和俄语。"
  },
  {
    id: 6,
    question: "Который час сейча́с?",
    answer: "Сейча́с два часа́.",
    questionZh: "现在几点了？",
    answerZh: "现在两点。"
  },
  {
    id: 7,
    question: "Куда́ они́ е́дут?",
    answer: "Они́ е́дут в Москву́.",
    questionZh: "他们去哪儿？",
    answerZh: "他们去莫斯科。"
  },
  {
    id: 8,
    question: "Когда́ ты встаёшь у́тром ка́ждый день?",
    answer: "Ка́ждый день у́тром я встаю́ в шесть часо́в.",
    questionZh: "你每天早上什么时候起床？",
    answerZh: "我每天早上六点起床。"
  },
  {
    id: 9,
    question: "Где Ми́ша учи́лся ра́ньше?",
    answer: "Ра́ньше он учи́лся в Санкт-Петербу́рге.",
    questionZh: "Misha 以前在哪里上学？",
    answerZh: "以前他在圣彼得堡上学。"
  },
  {
    id: 10,
    question: "Где Ви́ктор был вчера́?",
    answer: "Вчера́ он был в институ́те.",
    questionZh: "Viktor 昨天在哪里？",
    answerZh: "昨天他在学院里。"
  },
  {
    id: 11,
    question: "Чья э́то маши́на?",
    answer: "Э́то моя́ маши́на.",
    questionZh: "这是谁的车？",
    answerZh: "这是我的车。"
  },
  {
    id: 12,
    question: "Како́й сего́дня день?",
    answer: "Сего́дня понеде́льник.",
    questionZh: "今天是星期几？",
    answerZh: "今天是星期一。"
  },
  {
    id: 13,
    question: "Почему́ А́нна мно́го рабо́тает?",
    answer: "Она́ хо́чет учи́ться в Росси́и.",
    questionZh: "为什么 Anna 工作很努力？",
    answerZh: "她想去俄罗斯留学。"
  },
  {
    id: 14,
    question: "Како́е вре́мя го́да ты лю́бишь?",
    answer: "Я люблю́ весну́ и зи́му.",
    questionZh: "你喜欢什么季节？",
    answerZh: "我喜欢春天和冬天。"
  },
  {
    id: 15,
    question: "Где у́чится твой брат?",
    answer: "Мой брат у́чится в МГУ.",
    questionZh: "你的兄弟在哪里上学？",
    answerZh: "我的兄弟在莫斯科国立大学（莫大）上学。"
  },
  {
    id: 16,
    question: "Ребя́та хорошо́ зна́ют о тебе́?",
    answer: "Да, они́ хорошо́ зна́ют обо мне.",
    questionZh: "伙计们很了解你吗？",
    answerZh: "是的，他们很了解我。"
  },
  {
    id: 17,
    question: "О чём вы разгова́риваете?",
    answer: "Мы разгова́риваем об учёбе и о жи́зни в университе́те.",
    questionZh: "你们在谈论什么？",
    answerZh: "我们在谈论学习和大学生活。"
  },
  {
    id: 18,
    question: "О ком расска́зывал ваш преподава́тель сего́дня на уро́ке?",
    answer: "Сего́дня на уро́ке он расска́зывал о вели́ком ру́сском поэ́те Пу́шкине.",
    questionZh: "今天课上你们的老师讲了谁？",
    answerZh: "今天课上他讲了伟大的俄罗斯诗人普希金。"
  },
  {
    id: 19,
    question: "В како́м го́роде ты живёшь?",
    answer: "Я живу́ в большо́м и краси́вом го́роде Шанха́е.",
    questionZh: "你住在哪个城市？",
    answerZh: "我住在大而美丽的上海。"
  },
  {
    id: 20,
    question: "Где вы родили́сь?",
    // Original had separate cities for examples, preserving that logic but splitting by gender
    answer: {
      m: "Я роди́лся в Ки́еве.",
      f: "Я родила́сь в Москве́."
    },
    questionZh: "您在哪里出生？",
    answerZh: "我出生在基辅（男）/ 莫斯科（女）。"
  },
  {
    id: 21,
    question: "Где вы учи́лись ра́ньше?",
    answer: "Ра́ньше мы учи́лись в шко́ле.",
    questionZh: "你们以前在哪里学习？",
    answerZh: "以前我们在学校学习。"
  },
  {
    id: 22,
    question: "Како́й язы́к они́ учи́ли в шко́ле?",
    answer: "В шко́ле они́ учи́ли англи́йский язы́к.",
    questionZh: "他们在学校学了什么语言？",
    answerZh: "他们在学校学了英语。"
  },
  {
    id: 23,
    question: "Как вы говори́те по-ру́сски?",
    answer: "Мы говори́м по-ру́сски о́чень хорошо́.",
    questionZh: "你们俄语说得怎么样？",
    answerZh: "我们俄语说得很好。"
  },
  {
    id: 24,
    question: "Где обы́чно занима́ются студе́нты?",
    answer: "Они́ обы́чно занима́ются в аудито́риях и библиоте́ках.",
    questionZh: "学生们通常在哪里学习？",
    answerZh: "他们通常在教室和图书馆学习。"
  },
  {
    id: 25,
    question: "Како́й язы́к изуча́ет Ви́ктор?",
    answer: "Он изуча́ет кита́йский язы́к.",
    questionZh: "Viktor 在学什么语言？",
    answerZh: "他在学汉语。"
  },
  {
    id: 26,
    question: {
      m: "Что ты де́лал вчера́ ве́чером?",
      f: "Что ты де́лала вчера́ ве́чером?"
    },
    answer: {
      m: "Вчера́ ве́чером я слу́шал му́зыку, чита́л кни́гу, писа́л но́вые слова́ и смотре́л телеви́зор.",
      f: "Вчера́ ве́чером я слу́шала му́зыку, чита́ла кни́гу, писа́ла но́вые слова́ и смотре́ла телеви́зор."
    },
    questionZh: "你昨天晚上做了什么？",
    answerZh: "昨天晚上我听了音乐，读了书，写了生词，还看了电视。"
  },
  {
    id: 27,
    question: "Кто тако́й Анто́н?",
    answer: "Анто́н — хоро́ший преподава́тель, весёлый и до́брый челове́к.",
    questionZh: "Anton 是谁？",
    answerZh: "Anton 是个好老师，一个开朗善良的人。"
  },
  {
    id: 28,
    question: "Како́й ваш родно́й го́род?",
    answer: "Мой родно́й го́род — Пеки́н.",
    questionZh: "你的家乡是哪里？",
    answerZh: "我的家乡是北京。"
  },
  {
    id: 29,
    question: "Ты лю́бишь изуча́ть ру́сский язы́к?",
    answer: "Да, я люблю́ изуча́ть ру́сский язы́к.",
    questionZh: "你喜欢学俄语吗？",
    answerZh: "是的，我喜欢学俄语。"
  },
  {
    id: 30,
    question: "Когда́ у вас уро́ки ру́сского языка́?",
    answer: "У нас уро́ки ру́сского языка́ во вто́рник и в пя́тницу.",
    questionZh: "你们什么时候有俄语课？",
    answerZh: "我们在周二和周五有俄语课。"
  }
];

export const getQuestions = (gender: Gender): QuestionData[] => {
  return RAW_QUESTIONS.map(q => {
    const questionText = typeof q.question === 'string' ? q.question : q.question[gender.toLowerCase() as 'm' | 'f'];
    const answerText = typeof q.answer === 'string' ? q.answer : q.answer[gender.toLowerCase() as 'm' | 'f'];
    
    return {
      ...q,
      question: questionText,
      answer: answerText
    };
  });
};

// Deprecated: use getQuestions instead. 
// Kept for initial load in some components before they are fully refactored, 
// but we will update all components to receive props.
export const QUESTIONS = getQuestions('M'); 
