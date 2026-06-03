import { VocabularyItem, GrammarItem, KanjiItem, QuizQuestion } from "../types";

export const starterVocabulary: VocabularyItem[] = [
  // Greetings / Greetings & Essential
  {
    id: "vocab-1",
    word: "お早うございます",
    reading: "おはようございます",
    romaji: "ohayou gozaimasu",
    meaning: "Chào buổi sáng (lịch sự)",
    category: "Chủ đề 1: Chào hỏi",
    examples: [
      {
        japanese: "先生、お早うございます。",
        reading: "せんせい、おはようございます。",
        meaning: "Em chào thầy/cô buổi sáng ạ."
      }
    ]
  },
  {
    id: "vocab-2",
    word: "こんにちは",
    reading: "こんにちは",
    romaji: "konnichiha",
    meaning: "Chào buổi chiều / Xin chào",
    category: "Chủ đề 1: Chào hỏi",
    examples: [
      {
        japanese: "皆さん、こんにちは。",
        reading: "みなさん、こんにちは。",
        meaning: "Xin chào mọi người."
      }
    ]
  },
  {
    id: "vocab-3",
    word: "学生",
    reading: "がくせい",
    romaji: "gakusei",
    meaning: "Học sinh / Sinh viên",
    category: "Chủ đề 2: Trường học",
    examples: [
      {
        japanese: "私は日本語の学生です。",
        reading: "わたしはにほんごのがくせいです。",
        meaning: "Tôi là học sinh học tiếng Nhật."
      }
    ]
  },
  {
    id: "vocab-4",
    word: "日本語",
    reading: "にほんご",
    romaji: "nihongo",
    meaning: "Tiếng Nhật",
    category: "Chủ đề 2: Trường học",
    examples: [
      {
        japanese: "日本語を勉強します。",
        reading: "にほんごをべんきょうします。",
        meaning: "Tôi học tiếng Nhật."
      }
    ]
  },
  {
    id: "vocab-5",
    word: "食べる",
    reading: "たべる",
    romaji: "taberu",
    meaning: "Ăn",
    category: "Chủ đề 3: Đời sống",
    examples: [
      {
        japanese: "りんごを食べます。",
        reading: "りんごをたべます。",
        meaning: "Tôi ăn táo."
      }
    ]
  },
  {
    id: "vocab-6",
    word: "水",
    reading: "みず",
    romaji: "mizu",
    meaning: "Nước",
    category: "Chủ đề 3: Đời sống",
    examples: [
      {
        japanese: "水を飲んでください。",
        reading: "みずをのんでください。",
        meaning: "Hãy uống nước đi."
      }
    ]
  },
  {
    id: "vocab-7",
    word: "友達",
    reading: "ともだち",
    romaji: "tomodachi",
    meaning: "Bạn bè",
    category: "Chủ đề 1: Chào hỏi",
    examples: [
      {
        japanese: "彼は私の友達です。",
        reading: "かれはわたしのともだちです。",
        meaning: "Anh ấy là bạn của tôi."
      }
    ]
  }
];

export const starterGrammar: GrammarItem[] = [
  {
    id: "grammar-1",
    structure: "A は B です",
    meaning: "A là B",
    explanation: "Cấu trúc khẳng định cơ bản nhất trong tiếng Nhật, dùng để giới thiệu tên, nghề nghiệp, quốc tịch, v.v. 'は' là trợ từ chỉ chủ đề, đọc là 'wa'. 'です' ở cuối câu thể hiện thái độ lịch sự.",
    examples: [
      {
        japanese: "私は学生です。",
        reading: "わたしはがくせいです。",
        meaning: "Tôi là học sinh."
      },
      {
        japanese: "田中さんは先生です。",
        reading: "たなかさんはせんせいです。",
        meaning: "Anh Tanaka là giáo viên."
      }
    ],
    category: "Tuần 1 - Nhập môn"
  },
  {
    id: "grammar-2",
    structure: "V-てください",
    meaning: "Hãy làm V... (Yêu cầu lịch sự)",
    explanation: "Được dùng để đưa ra lời khuyên, đề nghị hoặc yêu cầu lịch sự với người nghe. Động từ chia ở thể て kết hợp với ください。",
    examples: [
      {
        japanese: "日本語で話してください。",
        reading: "にほんごではなしてください。",
        meaning: "Hãy nói bằng tiếng Nhật."
      },
      {
        japanese: "ここを読んでください。",
        reading: "ここをよんでください。",
        meaning: "Hãy đọc chỗ này."
      }
    ],
    category: "Tuần 2 - Hãy/Mệnh lệnh"
  },
  {
    id: "grammar-3",
    structure: "V-たいです",
    meaning: "Muốn làm V...",
    explanation: "Bày tỏ ước muốn, nguyện vọng làm một hành động nào đó của bản thân người nói (hoặc hỏi ước muốn của người nghe). Cách chia: Bỏ ます thêm たいです.",
    examples: [
      {
        japanese: "日本へ行きたいです。",
        reading: "にほんへいきたいです。",
        meaning: "Tôi muốn đi Nhật Bản."
      },
      {
        japanese: "お茶を飲みたいです。",
        reading: "おちゃをのみたいです。",
        meaning: "Tôi muốn uống trà."
      }
    ],
    category: "Tuần 3 - Nguyện vọng"
  }
];

export const starterKanji: KanjiItem[] = [
  {
    id: "kanji-1",
    character: "日",
    onyomi: "ニチ, ジツ",
    kunyomi: "ひ, -び, か",
    meaning: "Nhật (Mặt trời, Ngày)",
    examples: [
      {
        word: "日本",
        reading: "にほん",
        meaning: "Nhật Bản"
      },
      {
        word: "日曜日",
        reading: "にちようび",
        meaning: "Chủ nhật"
      }
    ]
  },
  {
    id: "kanji-2",
    character: "本",
    onyomi: "ホン",
    kunyomi: "moto",
    meaning: "Bản (Sách, Gốc rễ)",
    examples: [
      {
        word: "本",
        reading: "ほん",
        meaning: "Quyển sách"
      },
      {
        word: "日本語",
        reading: "にほんご",
        meaning: "Tiếng Nhật"
      }
    ]
  },
  {
    id: "kanji-3",
    character: "人",
    onyomi: "ジン, ニン",
    kunyomi: "ひと, -り, -to",
    meaning: "Nhân (Người)",
    examples: [
      {
        word: "日本人",
        reading: "にほんじん",
        meaning: "Người Nhật"
      },
      {
        word: "一人",
        reading: "ひとり",
        meaning: "Một người"
      }
    ]
  },
  {
    id: "kanji-4",
    character: "水",
    onyomi: "スイ",
    kunyomi: "みず",
    meaning: "Thủy (Nước)",
    examples: [
      {
        word: "水曜日",
        reading: "すいようび",
        meaning: "Thứ tư"
      },
      {
        word: "お水",
        reading: "おみず",
        meaning: "Nước"
      }
    ]
  },
  {
    id: "kanji-5",
    character: "学",
    onyomi: "ガク",
    kunyomi: "mana-bu",
    meaning: "Học (Học tập)",
    examples: [
      {
        word: "学生",
        reading: "がくせい",
        meaning: "Học sinh"
      },
      {
        word: "学校",
        reading: "がっこう",
        meaning: "Trường học"
      }
    ]
  }
];

export const starterQuizzes: QuizQuestion[] = [
  {
    id: "quiz-1",
    question: "Từ '学生' (Học sinh) đọc bằng Hiragana là gì?",
    options: ["がくせい", "がくせん", "げくせい", "かくせい"],
    answerIndex: 0,
    explanation: "学生 được đọc là がくせい (gakusei), nghĩa là học sinh/sinh viên.",
    type: "vocabulary"
  },
  {
    id: "quiz-2",
    question: "Chọn từ đúng điền vào chỗ trống: '私は学生_____ です。'",
    options: ["が", "を", "は", "に"],
    answerIndex: 2,
    explanation: "Trong câu giới thiệu chủ ngữ cơ bản, trợ từ 'は' (đọc là wa) được dùng để đánh dấu chủ đề nói tới.",
    type: "grammar"
  },
  {
    id: "quiz-3",
    question: "Chữ Hán '水' có âm đọc Kunyomi thuần Nhật là gì?",
    options: ["みず", "すい", "ひ", "ほん"],
    answerIndex: 0,
    explanation: "Chữ '水' (Thủy) có Kunyomi là みず (mizu) nghĩa là nước, còn Onyomi của nó là スイ (sui) ví dụ trong 水曜日.",
    type: "kanji"
  },
  {
    id: "quiz-4",
    question: "Cách chào 'こんにちは' (Konnichiwa) thích hợp nhất vào thời điểm nào trong ngày?",
    options: ["Buổi sáng sớm", "Buổi trưa - chiều", "Buổi tối đi ngủ", "Đêm muộn"],
    answerIndex: 1,
    explanation: "こんにちは là câu chào dùng khi gặp gỡ vào ban ngày, thường từ trưa cho đến chiều tối.",
    type: "vocabulary"
  }
];
