import type { Exercise, MuscleGroup, Equipment } from "./types";

// 预设动作库数据 - 每个部位15种动作
export const PRESET_EXERCISES: Omit<Exercise, "id">[] = [
  // ============ 胸部 (15个) ============
  { name: "杠铃平板卧推", muscleGroup: "chest", equipment: "barbell", description: "经典的胸部复合动作，主要锻炼胸大肌中束" },
  { name: "杠铃上斜卧推", muscleGroup: "chest", equipment: "barbell", description: "针对胸大肌上束，斜板角度30-45度" },
  { name: "杠铃下斜卧推", muscleGroup: "chest", equipment: "barbell", description: "针对胸大肌下束" },
  { name: "哑铃平板卧推", muscleGroup: "chest", equipment: "dumbbell", description: "比杠铃卧推有更大的运动幅度" },
  { name: "哑铃上斜卧推", muscleGroup: "chest", equipment: "dumbbell", description: "哑铃版上斜卧推，更好的肌肉拉伸" },
  { name: "哑铃飞鸟", muscleGroup: "chest", equipment: "dumbbell", description: "孤立动作，专注胸肌拉伸和收缩" },
  { name: "上斜哑铃飞鸟", muscleGroup: "chest", equipment: "dumbbell", description: "针对胸大肌上束的飞鸟动作" },
  { name: "绳索夹胸", muscleGroup: "chest", equipment: "cable", description: "恒定张力的胸肌孤立动作" },
  { name: "绳索上斜夹胸", muscleGroup: "chest", equipment: "cable", description: "从低位向上夹胸，针对上胸" },
  { name: "绳索下斜夹胸", muscleGroup: "chest", equipment: "cable", description: "从高位向下夹胸，针对下胸" },
  { name: "器械推胸", muscleGroup: "chest", equipment: "machine", description: "固定轨迹的推胸动作，适合新手" },
  { name: "蝴蝶机夹胸", muscleGroup: "chest", equipment: "machine", description: "器械版飞鸟动作" },
  { name: "俯卧撑", muscleGroup: "chest", equipment: "bodyweight", description: "经典自重训练动作" },
  { name: "双杠臂屈伸", muscleGroup: "chest", equipment: "bodyweight", description: "身体前倾时更多刺激胸肌下束" },
  { name: "窄距卧推", muscleGroup: "chest", equipment: "barbell", description: "同时锻炼胸肌和肱三头肌" },

  // ============ 背部 (15个) ============
  { name: "杠铃划船", muscleGroup: "back", equipment: "barbell", description: "经典的背部复合动作" },
  { name: "杠铃硬拉", muscleGroup: "back", equipment: "barbell", description: "全身性复合动作，强化整个后链" },
  { name: "哑铃单臂划船", muscleGroup: "back", equipment: "dumbbell", description: "单侧背部训练，可以用更大重量" },
  { name: "哑铃俯身划船", muscleGroup: "back", equipment: "dumbbell", description: "双臂同时进行的划船动作" },
  { name: "引体向上", muscleGroup: "back", equipment: "bodyweight", description: "背部训练之王，锻炼背阔肌" },
  { name: "宽握引体向上", muscleGroup: "back", equipment: "bodyweight", description: "更强调背阔肌宽度" },
  { name: "窄握引体向上", muscleGroup: "back", equipment: "bodyweight", description: "更强调背阔肌厚度和二头肌" },
  { name: "高位下拉", muscleGroup: "back", equipment: "cable", description: "引体向上的替代动作" },
  { name: "宽握高位下拉", muscleGroup: "back", equipment: "cable", description: "针对背阔肌宽度" },
  { name: "窄握高位下拉", muscleGroup: "back", equipment: "cable", description: "针对背阔肌厚度" },
  { name: "坐姿绳索划船", muscleGroup: "back", equipment: "cable", description: "恒定张力的划船动作" },
  { name: "直臂下压", muscleGroup: "back", equipment: "cable", description: "孤立背阔肌的动作" },
  { name: "T杠划船", muscleGroup: "back", equipment: "barbell", description: "针对背部中部的厚度" },
  { name: "器械划船", muscleGroup: "back", equipment: "machine", description: "固定轨迹的划船动作" },
  { name: "罗马尼亚硬拉", muscleGroup: "back", equipment: "barbell", description: "更强调腘绳肌和下背部" },

  // ============ 肩部 (15个) ============
  { name: "杠铃推举", muscleGroup: "shoulders", equipment: "barbell", description: "经典的肩部复合动作" },
  { name: "杠铃颈后推举", muscleGroup: "shoulders", equipment: "barbell", description: "更强调三角肌中束" },
  { name: "哑铃推举", muscleGroup: "shoulders", equipment: "dumbbell", description: "更大的运动幅度" },
  { name: "阿诺德推举", muscleGroup: "shoulders", equipment: "dumbbell", description: "旋转推举，全面刺激三角肌" },
  { name: "哑铃侧平举", muscleGroup: "shoulders", equipment: "dumbbell", description: "针对三角肌中束的孤立动作" },
  { name: "哑铃前平举", muscleGroup: "shoulders", equipment: "dumbbell", description: "针对三角肌前束" },
  { name: "哑铃俯身飞鸟", muscleGroup: "shoulders", equipment: "dumbbell", description: "针对三角肌后束" },
  { name: "绳索侧平举", muscleGroup: "shoulders", equipment: "cable", description: "恒定张力的侧平举" },
  { name: "绳索前平举", muscleGroup: "shoulders", equipment: "cable", description: "恒定张力的前平举" },
  { name: "绳索面拉", muscleGroup: "shoulders", equipment: "cable", description: "针对三角肌后束和上背" },
  { name: "器械推肩", muscleGroup: "shoulders", equipment: "machine", description: "固定轨迹的推肩动作" },
  { name: "杠铃耸肩", muscleGroup: "shoulders", equipment: "barbell", description: "针对斜方肌上束" },
  { name: "哑铃耸肩", muscleGroup: "shoulders", equipment: "dumbbell", description: "哑铃版耸肩动作" },
  { name: "直立划船", muscleGroup: "shoulders", equipment: "barbell", description: "复合动作，锻炼三角肌和斜方肌" },
  { name: "反向蝴蝶机", muscleGroup: "shoulders", equipment: "machine", description: "针对三角肌后束的器械动作" },

  // ============ 手臂 (15个) ============
  { name: "杠铃弯举", muscleGroup: "arms", equipment: "barbell", description: "经典的二头肌动作" },
  { name: "EZ杠弯举", muscleGroup: "arms", equipment: "barbell", description: "减少手腕压力的弯举" },
  { name: "哑铃弯举", muscleGroup: "arms", equipment: "dumbbell", description: "可以做旋转弯举" },
  { name: "哑铃锤式弯举", muscleGroup: "arms", equipment: "dumbbell", description: "针对肱肌和肱桡肌" },
  { name: "哑铃集中弯举", muscleGroup: "arms", equipment: "dumbbell", description: "孤立二头肌的动作" },
  { name: "绳索弯举", muscleGroup: "arms", equipment: "cable", description: "恒定张力的弯举" },
  { name: "牧师凳弯举", muscleGroup: "arms", equipment: "barbell", description: "固定上臂的弯举动作" },
  { name: "窄距杠铃卧推", muscleGroup: "arms", equipment: "barbell", description: "复合动作，强调肱三头肌" },
  { name: "仰卧臂屈伸", muscleGroup: "arms", equipment: "barbell", description: "针对肱三头肌长头" },
  { name: "哑铃颈后臂屈伸", muscleGroup: "arms", equipment: "dumbbell", description: "拉伸肱三头肌长头" },
  { name: "哑铃俯身臂屈伸", muscleGroup: "arms", equipment: "dumbbell", description: "针对肱三头肌外侧头" },
  { name: "绳索下压", muscleGroup: "arms", equipment: "cable", description: "经典的三头肌孤立动作" },
  { name: "绳索过顶臂屈伸", muscleGroup: "arms", equipment: "cable", description: "针对三头肌长头" },
  { name: "双杠臂屈伸", muscleGroup: "arms", equipment: "bodyweight", description: "复合动作，身体直立时更强调三头" },
  { name: "钻石俯卧撑", muscleGroup: "arms", equipment: "bodyweight", description: "窄距俯卧撑，强调三头肌" },

  // ============ 腿部 (15个) ============
  { name: "杠铃深蹲", muscleGroup: "legs", equipment: "barbell", description: "腿部训练之王" },
  { name: "杠铃前蹲", muscleGroup: "legs", equipment: "barbell", description: "更强调股四头肌" },
  { name: "哈克深蹲", muscleGroup: "legs", equipment: "machine", description: "固定轨迹的深蹲" },
  { name: "腿举", muscleGroup: "legs", equipment: "machine", description: "大重量腿部训练" },
  { name: "箭步蹲", muscleGroup: "legs", equipment: "dumbbell", description: "单腿训练，提高平衡性" },
  { name: "保加利亚分腿蹲", muscleGroup: "legs", equipment: "dumbbell", description: "高难度单腿训练" },
  { name: "腿屈伸", muscleGroup: "legs", equipment: "machine", description: "孤立股四头肌" },
  { name: "腿弯举", muscleGroup: "legs", equipment: "machine", description: "孤立腘绳肌" },
  { name: "罗马尼亚硬拉", muscleGroup: "legs", equipment: "barbell", description: "针对腘绳肌和臀部" },
  { name: "直腿硬拉", muscleGroup: "legs", equipment: "barbell", description: "更强调腘绳肌拉伸" },
  { name: "臀推", muscleGroup: "legs", equipment: "barbell", description: "针对臀大肌的孤立动作" },
  { name: "站姿提踵", muscleGroup: "legs", equipment: "machine", description: "针对小腿腓肠肌" },
  { name: "坐姿提踵", muscleGroup: "legs", equipment: "machine", description: "针对小腿比目鱼肌" },
  { name: "腿内收", muscleGroup: "legs", equipment: "machine", description: "针对大腿内侧" },
  { name: "腿外展", muscleGroup: "legs", equipment: "machine", description: "针对臀中肌和大腿外侧" },

  // ============ 核心 (15个) ============
  { name: "卷腹", muscleGroup: "core", equipment: "bodyweight", description: "基础腹肌动作" },
  { name: "仰卧举腿", muscleGroup: "core", equipment: "bodyweight", description: "针对下腹部" },
  { name: "悬垂举腿", muscleGroup: "core", equipment: "bodyweight", description: "高难度下腹动作" },
  { name: "平板支撑", muscleGroup: "core", equipment: "bodyweight", description: "核心稳定性训练" },
  { name: "侧平板支撑", muscleGroup: "core", equipment: "bodyweight", description: "针对腹斜肌" },
  { name: "俄罗斯转体", muscleGroup: "core", equipment: "bodyweight", description: "针对腹斜肌的旋转动作" },
  { name: "自行车卷腹", muscleGroup: "core", equipment: "bodyweight", description: "综合锻炼整个腹部" },
  { name: "登山者", muscleGroup: "core", equipment: "bodyweight", description: "动态核心训练" },
  { name: "死虫式", muscleGroup: "core", equipment: "bodyweight", description: "核心稳定性和协调性" },
  { name: "鸟狗式", muscleGroup: "core", equipment: "bodyweight", description: "核心稳定和脊柱中立" },
  { name: "绳索卷腹", muscleGroup: "core", equipment: "cable", description: "可加重的卷腹动作" },
  { name: "绳索伐木", muscleGroup: "core", equipment: "cable", description: "功能性旋转动作" },
  { name: "腹肌轮", muscleGroup: "core", equipment: "other", description: "高难度核心训练" },
  { name: "仰卧两头起", muscleGroup: "core", equipment: "bodyweight", description: "同时锻炼上下腹" },
  { name: "反向卷腹", muscleGroup: "core", equipment: "bodyweight", description: "针对下腹部的卷腹变式" },
];

// 预设训练模板
export const PRESET_TEMPLATES = [
  {
    name: "推拉腿三分化",
    description: "经典的三分化训练计划，适合中级训练者",
    days: [
      { dayIndex: 0, name: "推（胸肩三头）", exerciseNames: ["杠铃平板卧推", "哑铃上斜卧推", "绳索夹胸", "杠铃推举", "哑铃侧平举", "绳索下压"] },
      { dayIndex: 1, name: "拉（背二头）", exerciseNames: ["杠铃划船", "引体向上", "坐姿绳索划船", "杠铃弯举", "哑铃锤式弯举"] },
      { dayIndex: 2, name: "腿（股四腘绳臀）", exerciseNames: ["杠铃深蹲", "腿举", "腿屈伸", "腿弯举", "站姿提踵"] },
    ],
    isPreset: true,
  },
  {
    name: "上下肢两分化",
    description: "简单高效的两分化计划，适合新手",
    days: [
      { dayIndex: 0, name: "上肢", exerciseNames: ["杠铃平板卧推", "杠铃划船", "哑铃推举", "高位下拉", "杠铃弯举", "绳索下压"] },
      { dayIndex: 1, name: "下肢", exerciseNames: ["杠铃深蹲", "罗马尼亚硬拉", "腿举", "腿弯举", "站姿提踵", "卷腹"] },
    ],
    isPreset: true,
  },
  {
    name: "胸背肩腿臂五分化",
    description: "高级五分化计划，每个部位单独训练",
    days: [
      { dayIndex: 0, name: "胸", exerciseNames: ["杠铃平板卧推", "哑铃上斜卧推", "哑铃飞鸟", "绳索夹胸", "双杠臂屈伸"] },
      { dayIndex: 1, name: "背", exerciseNames: ["杠铃硬拉", "引体向上", "杠铃划船", "坐姿绳索划船", "直臂下压"] },
      { dayIndex: 2, name: "肩", exerciseNames: ["杠铃推举", "哑铃侧平举", "哑铃前平举", "哑铃俯身飞鸟", "杠铃耸肩"] },
      { dayIndex: 3, name: "腿", exerciseNames: ["杠铃深蹲", "腿举", "腿屈伸", "腿弯举", "臀推", "站姿提踵"] },
      { dayIndex: 4, name: "臂", exerciseNames: ["杠铃弯举", "哑铃锤式弯举", "牧师凳弯举", "绳索下压", "仰卧臂屈伸", "哑铃颈后臂屈伸"] },
    ],
    isPreset: true,
  },
  {
    name: "全身训练",
    description: "每次训练全身，适合每周2-3次训练",
    days: [
      { dayIndex: 0, name: "全身A", exerciseNames: ["杠铃深蹲", "杠铃平板卧推", "杠铃划船", "哑铃推举", "杠铃弯举", "平板支撑"] },
      { dayIndex: 1, name: "全身B", exerciseNames: ["杠铃硬拉", "哑铃上斜卧推", "引体向上", "哑铃侧平举", "绳索下压", "悬垂举腿"] },
    ],
    isPreset: true,
  },
];

// 生成带ID的动作列表
export function generateExercisesWithIds(): Exercise[] {
  return PRESET_EXERCISES.map((exercise, index) => ({
    ...exercise,
    id: `preset_${index + 1}`,
    isCustom: false,
  }));
}

// 根据动作名称获取ID
export function getExerciseIdByName(exercises: Exercise[], name: string): string | undefined {
  return exercises.find(e => e.name === name)?.id;
}
