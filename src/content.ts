export type Direction = {
  id: string;
  title: string;
  short: string;
  category: 'sport' | 'languages' | 'creative';
  age: string;
  text: string;
  image: string;
  icon: string;
  theme: string;
};

export const directions: Direction[] = [
  {
    id: 'football', title: 'Академия футбола', short: 'Футбол', category: 'sport',
    age: 'От 2 до 11 лет',
    text: 'Знакомиться с мячом, играть в команде и расти в движении. Методика объединяет опыт разных футбольных школ, а среди тренеров — действующие игроки.',
    image: 'football.webp', icon: 'ball', theme: 'orange',
  },
  {
    id: 'junior', title: 'Надеждик Юниор', short: 'Юниор', category: 'sport',
    age: 'От 12 до 17 лет',
    text: 'Футбол для подростков. Делаем спорт доступнее и помогаем развиваться через тренировки, командную игру и движение вперёд.',
    image: 'football.webp', icon: 'ball', theme: 'blue',
  },
  {
    id: 'english', title: 'Английский язык', short: 'Английский', category: 'languages',
    age: 'English N club',
    text: 'Рисовать, петь, играть — и знакомиться с английским. Занятия и материалы подбираются по возрасту, а новый язык становится частью интересных ребёнку дел.',
    image: 'english.webp', icon: 'globe', theme: 'soft',
  },
  {
    id: 'dance', title: 'Хореография', short: 'Танцы', category: 'creative',
    age: 'Академия N DANCE',
    text: 'Открывать возможности своего тела с раннего возраста. Развиваем гибкость и подвижность с учётом этапов развития ребёнка.',
    image: 'dance.webp', icon: 'music', theme: 'orange',
  },
  {
    id: 'school', title: 'Подготовка к школе', short: 'Подготовка к школе', category: 'creative',
    age: 'Для дошкольников',
    text: 'Осваивать базовые знания и готовиться к новой школьной жизни. Уделяем внимание и развитию, и психологической готовности к обучению.',
    image: 'hero.webp', icon: 'book', theme: 'pale',
  },
  {
    id: 'chinese', title: 'Китайский язык', short: 'Китайский', category: 'languages',
    age: 'Языковое направление',
    text: 'Ещё один язык — ещё одна возможность узнать мир. Информацию о занятиях, возрасте и группах можно уточнить у администратора.',
    image: 'english.webp', icon: 'globe', theme: 'blue',
  },
];

export const nav = [
  ['#about', 'О нас'], ['#areas', 'Занятия'], ['#directions', 'Направления'], ['#family', 'Мы семья'],
];
