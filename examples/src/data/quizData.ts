import type { Stage, Question } from '../types';

// 新手村专用听音选词题库
const beginnerListenQuestions = [
  // 第一关 - 基础单词
  [
    {
      content: '听音选词',
      options: ['cat', 'cut', 'cot', 'cap'],
      correct_answer: 'cat',
      audio_text: 'cat',
      explanation: '正确发音是cat /kæt/'
    },
    {
      content: '听音选词',
      options: ['sun', 'son', 'sin', 'sum'],
      correct_answer: 'sun',
      audio_text: 'sun',
      explanation: '正确发音是sun /sʌn/'
    },
    {
      content: '听音选词',
      options: ['book', 'back', 'buck', 'bike'],
      correct_answer: 'book',
      audio_text: 'book',
      explanation: '正确发音是book /bʊk/'
    },
    {
      content: '听音选词',
      options: ['dog', 'dig', 'duck', 'door'],
      correct_answer: 'dog',
      audio_text: 'dog',
      explanation: '正确发音是dog /dɔːɡ/'
    },
    {
      content: '听音选词',
      options: ['pen', 'pan', 'pin', 'pun'],
      correct_answer: 'pen',
      audio_text: 'pen',
      explanation: '正确发音是pen /pen/'
    },
    {
      content: '听音选词',
      options: ['red', 'read', 'rid', 'rod'],
      correct_answer: 'red',
      audio_text: 'red',
      explanation: '正确发音是red /red/'
    }
  ],
  // 第二关 - 日常用语
  [
    {
      content: '听音选词',
      options: ['hello', 'yellow', 'hollow', 'follow'],
      correct_answer: 'hello',
      audio_text: 'hello',
      explanation: '正确发音是hello /həˈloʊ/'
    },
    {
      content: '听音选词',
      options: ['good', 'food', 'wood', 'mood'],
      correct_answer: 'good',
      audio_text: 'good',
      explanation: '正确发音是good /ɡʊd/'
    },
    {
      content: '听音选词',
      options: ['morning', 'warning', 'turning', 'burning'],
      correct_answer: 'morning',
      audio_text: 'morning',
      explanation: '正确发音是morning /ˈmɔːrnɪŋ/'
    },
    {
      content: '听音选词',
      options: ['thank', 'think', 'thick', 'thing'],
      correct_answer: 'thank',
      audio_text: 'thank',
      explanation: '正确发音是thank /θæŋk/'
    },
    {
      content: '听音选词',
      options: ['please', 'place', 'peace', 'piece'],
      correct_answer: 'please',
      audio_text: 'please',
      explanation: '正确发音是please /pliːz/'
    },
    {
      content: '听音选词',
      options: ['welcome', 'welcome', 'welcome', 'welcome'],
      correct_answer: 'welcome',
      audio_text: 'welcome',
      explanation: '正确发音是welcome /ˈwelkəm/'
    }
  ],
  // 第三关 - 常用动词
  [
    {
      content: '听音选词',
      options: ['have', 'half', 'hand', 'head'],
      correct_answer: 'have',
      audio_text: 'have',
      explanation: '正确发音是have /hæv/'
    },
    {
      content: '听音选词',
      options: ['like', 'lake', 'look', 'luck'],
      correct_answer: 'like',
      audio_text: 'like',
      explanation: '正确发音是like /laɪk/'
    },
    {
      content: '听音选词',
      options: ['home', 'hope', 'hole', 'hold'],
      correct_answer: 'home',
      audio_text: 'home',
      explanation: '正确发音是home /hoʊm/'
    },
    {
      content: '听音选词',
      options: ['family', 'finally', 'friendly', 'fairly'],
      correct_answer: 'family',
      audio_text: 'family',
      explanation: '正确发音是family /ˈfæməli/'
    },
    {
      content: '听音选词',
      options: ['school', 'skill', 'scale', 'score'],
      correct_answer: 'school',
      audio_text: 'school',
      explanation: '正确发音是school /skuːl/'
    },
    {
      content: '听音选词',
      options: ['friend', 'front', 'fresh', 'frame'],
      correct_answer: 'friend',
      audio_text: 'friend',
      explanation: '正确发音是friend /frend/'
    }
  ]
];

// 新手村填空题库 - 增加难度递进
const beginnerFillBlankQuestions = [
  // 第一关 - 简单词汇填空
  [
    {
      content: 'I like to eat ____.',
      options: ['apple', 'chair', 'jump', 'water'],
      correct_answer: 'apple',
      explanation: '根据上下文，like to eat（喜欢吃）后面应该接食物，apple（苹果）是正确答案'
    },
    {
      content: 'The ____ is yellow.',
      options: ['banana', 'table', 'run', 'happy'],
      correct_answer: 'banana',
      explanation: 'yellow（黄色）通常用来形容香蕉的颜色'
    },
    {
      content: 'She can ____ very well.',
      options: ['sing', 'book', 'red', 'chair'],
      correct_answer: 'sing',
      explanation: 'can后面接动词原形，sing well表示唱得好'
    },
    {
      content: 'I go to school by ____.',
      options: ['bus', 'cat', 'drink', 'happy'],
      correct_answer: 'bus',
      explanation: 'by后面接交通工具，bus（公交车）是合理的选择'
    },
    {
      content: 'The ____ is shining.',
      options: ['sun', 'book', 'chair', 'eat'],
      correct_answer: 'sun',
      explanation: 'shine（照耀）通常用来形容太阳'
    },
    {
      content: 'My ____ is blue.',
      options: ['car', 'run', 'happy', 'water'],
      correct_answer: 'car',
      explanation: '只有car（汽车）可以用blue（蓝色）来形容'
    }
  ],
  // 第二关 - be动词和疑问句
  [
    {
      content: 'How ____ you today?',
      options: ['are', 'is', 'am', 'be'],
      correct_answer: 'are',
      explanation: '对you提问用are，How are you是常用问候语'
    },
    {
      content: 'What ____ your favorite color?',
      options: ['is', 'are', 'am', 'be'],
      correct_answer: 'is',
      explanation: 'favorite color是单数概念，用is'
    },
    {
      content: 'Where ____ you from?',
      options: ['are', 'is', 'am', 'be'],
      correct_answer: 'are',
      explanation: '询问来自哪里用are you from'
    },
    {
      content: 'Nice to ____ you.',
      options: ['meet', 'meat', 'seat', 'beat'],
      correct_answer: 'meet',
      explanation: 'Nice to meet you是见面时的问候语'
    },
    {
      content: '____ a good day.',
      options: ['Have', 'Has', 'Had', 'Having'],
      correct_answer: 'Have',
      explanation: 'Have a good day表示祝你有美好的一天'
    },
    {
      content: 'See you ____.',
      options: ['later', 'water', 'letter', 'better'],
      correct_answer: 'later',
      explanation: 'See you later表示再见'
    }
  ],
  // 第三关 - 复杂语法结构
  [
    {
      content: 'She ____ a teacher at our school.',
      options: ['is', 'are', 'am', 'be'],
      correct_answer: 'is',
      explanation: 'She是第三人称单数，用is'
    },
    {
      content: 'They ____ playing football now.',
      options: ['are', 'is', 'am', 'be'],
      correct_answer: 'are',
      explanation: 'They是复数，现在进行时用are playing'
    },
    {
      content: 'We ____ very happy today.',
      options: ['are', 'is', 'am', 'be'],
      correct_answer: 'are',
      explanation: 'We是复数，用are'
    },
    {
      content: 'This ____ my new bicycle.',
      options: ['is', 'are', 'am', 'be'],
      correct_answer: 'is',
      explanation: 'This是单数，用is'
    },
    {
      content: 'I ____ learning English every day.',
      options: ['am', 'is', 'are', 'be'],
      correct_answer: 'am',
      explanation: 'I后面用am，现在进行时am learning'
    },
    {
      content: 'The children ____ in the playground.',
      options: ['are', 'is', 'am', 'be'],
      correct_answer: 'are',
      explanation: 'children是复数，用are'
    }
  ]
];

// 新手村翻译题库 - 增加难度递进
const beginnerTranslateQuestions = [
  // 第一关 - 简单句型
  [
    {
      content: '我喜欢苹果。',
      word_blocks: ['I', 'like', 'apples', 'school', 'very', 'the', 'quickly', 'red', 'happy'],
      correct_answer: 'I like apples',
      explanation: '正确的语序是：主语 + 动词 + 宾语'
    },
    {
      content: '她是老师。',
      word_blocks: ['She', 'is', 'a', 'teacher', 'student', 'happy', 'water', 'jump', 'green'],
      correct_answer: 'She is a teacher',
      explanation: 'She is a teacher表示"她是一位老师"'
    },
    {
      content: '这是我的书。',
      word_blocks: ['This', 'is', 'my', 'book', 'table', 'run', 'green', 'fast', 'very'],
      correct_answer: 'This is my book',
      explanation: 'This is表示"这是"，my book表示"我的书"'
    },
    {
      content: '他有一只狗。',
      word_blocks: ['He', 'has', 'a', 'dog', 'cat', 'happy', 'water', 'school', 'very'],
      correct_answer: 'He has a dog',
      explanation: '第三人称单数用has，a dog表示"一只狗"'
    },
    {
      content: '我们在学校。',
      word_blocks: ['We', 'are', 'at', 'school', 'home', 'book', 'fast', 'green', 'happy'],
      correct_answer: 'We are at school',
      explanation: 'at school表示"在学校"'
    },
    {
      content: '天气很好。',
      word_blocks: ['The', 'weather', 'is', 'nice', 'bad', 'book', 'run', 'water', 'fast'],
      correct_answer: 'The weather is nice',
      explanation: 'weather is nice表示"天气很好"'
    }
  ],
  // 第二关 - 问候和日常对话
  [
    {
      content: '你好吗？',
      word_blocks: ['How', 'are', 'you', 'today', 'happy', 'book', 'run', 'fast', 'green'],
      correct_answer: 'How are you',
      explanation: 'How are you是询问对方近况的常用语'
    },
    {
      content: '我很好，谢谢。',
      word_blocks: ['I', 'am', 'fine', 'thank', 'you', 'book', 'happy', 'water', 'school'],
      correct_answer: 'I am fine thank you',
      explanation: 'I am fine thank you是回答How are you的标准答语'
    },
    {
      content: '很高兴见到你。',
      word_blocks: ['Nice', 'to', 'meet', 'you', 'book', 'happy', 'run', 'water', 'fast'],
      correct_answer: 'Nice to meet you',
      explanation: 'Nice to meet you是初次见面的问候语'
    },
    {
      content: '我的名字是汤姆。',
      word_blocks: ['My', 'name', 'is', 'Tom', 'book', 'happy', 'water', 'run', 'fast'],
      correct_answer: 'My name is Tom',
      explanation: 'My name is...用来介绍自己的名字'
    },
    {
      content: '祝你有美好的一天。',
      word_blocks: ['Have', 'a', 'good', 'day', 'nice', 'book', 'happy', 'water', 'run', 'fast'],
      correct_answer: 'Have a good day',
      explanation: 'Have a good day是祝福用语'
    },
    {
      content: '再见。',
      word_blocks: ['Good', 'bye', 'see', 'later', 'book', 'happy', 'water', 'run', 'fast'],
      correct_answer: 'Good bye',
      explanation: 'Good bye是告别时的用语'
    }
  ],
  // 第三关 - 复杂句型和时态
  [
    {
      content: '他们正在踢足球。',
      word_blocks: ['They', 'are', 'playing', 'football', 'basketball', 'book', 'happy', 'water', 'run'],
      correct_answer: 'They are playing football',
      explanation: 'They are playing football表示"他们正在踢足球"，现在进行时'
    },
    {
      content: '我昨天去了图书馆。',
      word_blocks: ['I', 'went', 'to', 'the', 'library', 'yesterday', 'book', 'happy', 'water'],
      correct_answer: 'I went to the library yesterday',
      explanation: 'went是go的过去式，yesterday表示昨天'
    },
    {
      content: '她喜欢读书和听音乐。',
      word_blocks: ['She', 'likes', 'reading', 'books', 'and', 'listening', 'to', 'music', 'happy'],
      correct_answer: 'She likes reading books and listening to music',
      explanation: 'likes后面接动名词形式reading和listening'
    },
    {
      content: '我们明天要去公园。',
      word_blocks: ['We', 'will', 'go', 'to', 'the', 'park', 'tomorrow', 'book', 'happy'],
      correct_answer: 'We will go to the park tomorrow',
      explanation: 'will go表示将来时，tomorrow表示明天'
    },
    {
      content: '他会说三种语言。',
      word_blocks: ['He', 'can', 'speak', 'three', 'languages', 'book', 'happy', 'water', 'run'],
      correct_answer: 'He can speak three languages',
      explanation: 'can speak表示能够说，three languages表示三种语言'
    },
    {
      content: '这本书比那本更有趣。',
      word_blocks: ['This', 'book', 'is', 'more', 'interesting', 'than', 'that', 'one', 'happy'],
      correct_answer: 'This book is more interesting than that one',
      explanation: 'more interesting than表示比较级，"比...更有趣"'
    }
  ]
];

// 勇者试炼题库 - 中等难度
const intermediateQuestions = [
  // 第一关 - 时态和语态
  [
    {
      content: 'She ____ her homework when I called her.',
      options: ['was doing', 'did', 'does', 'has done'],
      correct_answer: 'was doing',
      explanation: 'when引导的时间状语从句，主句用过去进行时was doing'
    },
    {
      content: 'The letter ____ by him yesterday.',
      options: ['was written', 'wrote', 'writes', 'has written'],
      correct_answer: 'was written',
      explanation: '被动语态的过去时，letter是被写的'
    },
    {
      content: 'I ____ this book for two hours.',
      options: ['have been reading', 'read', 'am reading', 'will read'],
      correct_answer: 'have been reading',
      explanation: 'for two hours表示持续动作，用现在完成进行时'
    },
    {
      content: 'By the time you arrive, we ____ dinner.',
      options: ['will have finished', 'finish', 'finished', 'are finishing'],
      correct_answer: 'will have finished',
      explanation: 'by the time表示将来完成时，will have finished'
    },
    {
      content: 'If it ____ tomorrow, we will stay home.',
      options: ['rains', 'will rain', 'rained', 'is raining'],
      correct_answer: 'rains',
      explanation: 'if引导的条件句，从句用一般现在时表将来'
    },
    {
      content: 'She said she ____ to Paris before.',
      options: ['had been', 'has been', 'was', 'went'],
      correct_answer: 'had been',
      explanation: '过去完成时，表示过去的过去'
    }
  ],
  // 第二关 - 复杂语法结构
  [
    {
      content: 'The man ____ is standing there is my teacher.',
      options: ['who', 'which', 'what', 'where'],
      correct_answer: 'who',
      explanation: 'who引导定语从句，修饰人the man'
    },
    {
      content: 'I wish I ____ more time to study.',
      options: ['had', 'have', 'will have', 'am having'],
      correct_answer: 'had',
      explanation: 'wish后面的从句用虚拟语气，had表示与现在相反'
    },
    {
      content: '____ hard he tries, he cannot solve the problem.',
      options: ['However', 'Whatever', 'Whenever', 'Wherever'],
      correct_answer: 'However',
      explanation: 'However hard表示"无论多么努力"'
    },
    {
      content: 'Not only ____ English, but he also speaks French.',
      options: ['does he speak', 'he speaks', 'speaks he', 'he does speak'],
      correct_answer: 'does he speak',
      explanation: 'not only位于句首，主句要倒装'
    },
    {
      content: 'It was ____ difficult that nobody could solve it.',
      options: ['so', 'such', 'too', 'very'],
      correct_answer: 'so',
      explanation: 'so...that结构，so修饰形容词difficult'
    },
    {
      content: 'Would you mind ____ the window?',
      options: ['opening', 'to open', 'open', 'opened'],
      correct_answer: 'opening',
      explanation: 'mind后面接动名词opening'
    }
  ],
  // 第三关 - 高级词汇和表达
  [
    {
      content: 'The company has ____ significant progress this year.',
      options: ['made', 'done', 'taken', 'given'],
      correct_answer: 'made',
      explanation: 'make progress是固定搭配，表示取得进步'
    },
    {
      content: 'We need to ____ this problem immediately.',
      options: ['address', 'speak', 'talk', 'say'],
      correct_answer: 'address',
      explanation: 'address a problem表示解决问题'
    },
    {
      content: 'The new policy will ____ effect next month.',
      options: ['take', 'make', 'have', 'get'],
      correct_answer: 'take',
      explanation: 'take effect是固定搭配，表示生效'
    },
    {
      content: 'She has a ____ for learning languages.',
      options: ['talent', 'skill', 'ability', 'capacity'],
      correct_answer: 'talent',
      explanation: 'talent for表示在某方面有天赋'
    },
    {
      content: 'The meeting was ____ due to bad weather.',
      options: ['postponed', 'delayed', 'cancelled', 'stopped'],
      correct_answer: 'postponed',
      explanation: 'postpone表示推迟会议到以后'
    },
    {
      content: 'His explanation was very ____.',
      options: ['convincing', 'convinced', 'convince', 'convinces'],
      correct_answer: 'convincing',
      explanation: 'convincing表示令人信服的'
    }
  ]
];

// 流利殿堂题库 - 高级难度
const advancedQuestions = [
  // 第一关 - 高级语法和虚拟语气
  [
    {
      content: '____ he studied harder, he would have passed the exam.',
      options: ['Had', 'If', 'Should', 'Were'],
      correct_answer: 'Had',
      explanation: 'Had he studied是虚拟语气的倒装形式'
    },
    {
      content: 'The research ____ by the time the conference begins.',
      options: ['will have been completed', 'will complete', 'completes', 'is completing'],
      correct_answer: 'will have been completed',
      explanation: '将来完成时的被动语态'
    },
    {
      content: 'Scarcely ____ when it started to rain.',
      options: ['had we arrived', 'we arrived', 'did we arrive', 'we had arrived'],
      correct_answer: 'had we arrived',
      explanation: 'scarcely...when结构，主句要倒装'
    },
    {
      content: 'It is imperative that he ____ the meeting.',
      options: ['attend', 'attends', 'attended', 'will attend'],
      correct_answer: 'attend',
      explanation: 'imperative that后面用虚拟语气，动词原形'
    },
    {
      content: '____ the circumstances, we had no choice.',
      options: ['Given', 'Giving', 'To give', 'Give'],
      correct_answer: 'Given',
      explanation: 'given表示"考虑到"，过去分词作状语'
    },
    {
      content: 'The proposal ____ serious consideration.',
      options: ['merits', 'deserves', 'requires', 'needs'],
      correct_answer: 'merits',
      explanation: 'merit表示值得，更正式的表达'
    }
  ],
  // 第二关 - 商务和学术英语
  [
    {
      content: 'The company aims to ____ market share.',
      options: ['expand', 'extend', 'enlarge', 'increase'],
      correct_answer: 'expand',
      explanation: 'expand market share是商务常用表达'
    },
    {
      content: 'We need to ____ our competitive advantage.',
      options: ['leverage', 'use', 'apply', 'employ'],
      correct_answer: 'leverage',
      explanation: 'leverage表示充分利用，商务术语'
    },
    {
      content: 'The findings ____ our initial hypothesis.',
      options: ['corroborate', 'support', 'help', 'assist'],
      correct_answer: 'corroborate',
      explanation: 'corroborate是学术用语，表示证实'
    },
    {
      content: 'The data shows a ____ correlation.',
      options: ['significant', 'important', 'big', 'large'],
      correct_answer: 'significant',
      explanation: 'significant correlation是统计学术语'
    },
    {
      content: 'We must ____ the stakeholders.',
      options: ['engage', 'involve', 'include', 'participate'],
      correct_answer: 'engage',
      explanation: 'engage stakeholders是商务常用表达'
    },
    {
      content: 'The project requires ____ planning.',
      options: ['meticulous', 'careful', 'detailed', 'thorough'],
      correct_answer: 'meticulous',
      explanation: 'meticulous表示一丝不苟的，更高级的词汇'
    }
  ],
  // 第三关 - 文学和修辞表达
  [
    {
      content: 'The author ____ a vivid portrayal of urban life.',
      options: ['presents', 'shows', 'gives', 'offers'],
      correct_answer: 'presents',
      explanation: 'present a portrayal是文学分析用语'
    },
    {
      content: 'The novel ____ profound philosophical questions.',
      options: ['explores', 'examines', 'looks at', 'studies'],
      correct_answer: 'explores',
      explanation: 'explore questions是文学评论常用表达'
    },
    {
      content: 'The metaphor ____ the theme of isolation.',
      options: ['reinforces', 'strengthens', 'supports', 'helps'],
      correct_answer: 'reinforces',
      explanation: 'reinforce a theme是文学分析术语'
    },
    {
      content: 'The protagonist ____ internal conflict.',
      options: ['experiences', 'has', 'feels', 'goes through'],
      correct_answer: 'experiences',
      explanation: 'experience conflict是文学分析用语'
    },
    {
      content: 'The imagery ____ a sense of melancholy.',
      options: ['evokes', 'creates', 'makes', 'brings'],
      correct_answer: 'evokes',
      explanation: 'evoke表示唤起，文学术语'
    },
    {
      content: 'The narrative ____ between past and present.',
      options: ['alternates', 'changes', 'moves', 'switches'],
      correct_answer: 'alternates',
      explanation: 'alternate between表示在...之间交替'
    }
  ]
];

// 生成题目ID
const generateQuestionId = (stageId: string, levelId: number, type: string, index: number): string => {
  return `${stageId}_${levelId}_${type}_${index + 1}`;
};

// 随机打乱数组
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const stages: Stage[] = [
  {
    id: 'beginner',
    name: '新手村',
    title: 'Beginner Village',
    levels: [
      {
        id: 1,
        name: '基础词汇',
        completed: false,
        stars: 0,
        questions: [
          // 2道填空题
          ...beginnerFillBlankQuestions[0].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 1, 'fill_blank', i),
            type: 'fill_blank' as const,
            options: shuffleArray(q.options)
          })),
          // 2道翻译题
          ...beginnerTranslateQuestions[0].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 1, 'translate', i),
            type: 'translate' as const,
            word_blocks: shuffleArray(q.word_blocks)
          })),
          // 2道听音选词题
          ...beginnerListenQuestions[0].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 1, 'listen_choose', i),
            type: 'listen_choose' as const,
            options: shuffleArray(q.options)
          }))
        ]
      },
      {
        id: 2,
        name: '日常对话',
        completed: false,
        stars: 0,
        questions: [
          // 2道填空题
          ...beginnerFillBlankQuestions[1].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 2, 'fill_blank', i),
            type: 'fill_blank' as const,
            options: shuffleArray(q.options)
          })),
          // 2道翻译题
          ...beginnerTranslateQuestions[1].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 2, 'translate', i),
            type: 'translate' as const,
            word_blocks: shuffleArray(q.word_blocks)
          })),
          // 2道听音选词题
          ...beginnerListenQuestions[1].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 2, 'listen_choose', i),
            type: 'listen_choose' as const,
            options: shuffleArray(q.options)
          }))
        ]
      },
      {
        id: 3,
        name: '基础语法',
        completed: false,
        stars: 0,
        questions: [
          // 2道填空题
          ...beginnerFillBlankQuestions[2].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 3, 'fill_blank', i),
            type: 'fill_blank' as const,
            options: shuffleArray(q.options)
          })),
          // 2道翻译题
          ...beginnerTranslateQuestions[2].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 3, 'translate', i),
            type: 'translate' as const,
            word_blocks: shuffleArray(q.word_blocks)
          })),
          // 2道听音选词题
          ...beginnerListenQuestions[2].slice(0, 2).map((q, i) => ({
            ...q,
            id: generateQuestionId('beginner', 3, 'listen_choose', i),
            type: 'listen_choose' as const,
            options: shuffleArray(q.options)
          }))
        ]
      }
    ]
  },
  {
    id: 'intermediate',
    name: '勇者试炼',
    title: 'Warrior Trial',
    levels: [
      {
        id: 4,
        name: '时态练习',
        completed: false,
        stars: 0,
        questions: intermediateQuestions[0].map((q, i) => ({
          ...q,
          id: generateQuestionId('intermediate', 4, 'fill_blank', i),
          type: 'fill_blank' as const,
          options: shuffleArray(q.options)
        }))
      },
      {
        id: 5,
        name: '句型转换',
        completed: false,
        stars: 0,
        questions: intermediateQuestions[1].map((q, i) => ({
          ...q,
          id: generateQuestionId('intermediate', 5, 'fill_blank', i),
          type: 'fill_blank' as const,
          options: shuffleArray(q.options)
        }))
      },
      {
        id: 6,
        name: '词汇扩展',
        completed: false,
        stars: 0,
        questions: intermediateQuestions[2].map((q, i) => ({
          ...q,
          id: generateQuestionId('intermediate', 6, 'fill_blank', i),
          type: 'fill_blank' as const,
          options: shuffleArray(q.options)
        }))
      }
    ]
  },
  {
    id: 'advanced',
    name: '流利殿堂',
    title: 'Fluency Palace',
    levels: [
      {
        id: 7,
        name: '高级语法',
        completed: false,
        stars: 0,
        questions: advancedQuestions[0].map((q, i) => ({
          ...q,
          id: generateQuestionId('advanced', 7, 'fill_blank', i),
          type: 'fill_blank' as const,
          options: shuffleArray(q.options)
        }))
      },
      {
        id: 8,
        name: '商务英语',
        completed: false,
        stars: 0,
        questions: advancedQuestions[1].map((q, i) => ({
          ...q,
          id: generateQuestionId('advanced', 8, 'fill_blank', i),
          type: 'fill_blank' as const,
          options: shuffleArray(q.options)
        }))
      },
      {
        id: 9,
        name: '文学阅读',
        completed: false,
        stars: 0,
        questions: advancedQuestions[2].map((q, i) => ({
          ...q,
          id: generateQuestionId('advanced', 9, 'fill_blank', i),
          type: 'fill_blank' as const,
          options: shuffleArray(q.options)
        }))
      }
    ]
  }
];