# 灵感画廊国际化测试清单

## 测试目标
验证灵感画廊的中英文双语支持是否正常工作。

---

## 自动化验证（已完成 ✅）

1. ✅ **TypeScript 编译**
   - 构建成功，无类型错误
   - titleKey 类型定义正确

2. ✅ **翻译文件**
   - messages/zh.json 包含所有8个项目翻译
   - messages/en.json 包含所有8个项目翻译
   - 翻译键结构: inspirationGallery.items.*

3. ✅ **服务器渲染**
   - 中文默认渲染正常
   - 标题显示: "灵感画廊"
   - 项目标题: "咖啡店新品宣传"等

---

## 手动测试清单（待验证）

### 中文界面测试
1. [ ] 打开 http://localhost:3000
2. [ ] 确认"灵感画廊"标题显示正确
3. [ ] 悬停查看8个项目标题（中文）：
   - [ ] 咖啡店新品宣传 - 拿铁特调
   - [ ] AI耳机产品介绍视频
   - [ ] 创业品牌故事 - 从0到1
   - [ ] 5分钟快速妆容教程
   - [ ] 城市漫步Vlog - 上海外滩
   - [ ] 音乐节活动预告片
   - [ ] 健身房课程推广视频
   - [ ] 美食制作教程 - 红烧肉
4. [ ] 确认时长显示："15秒" (中文单位)

### 英文界面测试
1. [ ] 点击右上角语言切换器（或修改localStorage）
2. [ ] 切换到英文 (EN)
3. [ ] 确认"Inspiration Gallery"标题显示正确
4. [ ] 悬停查看8个项目标题（英文）：
   - [ ] Coffee Shop New Product - Latte Special
   - [ ] AI Headphone Product Video
   - [ ] Startup Brand Story - From Zero to One
   - [ ] 5-Minute Quick Makeup Tutorial
   - [ ] City Walk Vlog - Shanghai Bund
   - [ ] Music Festival Teaser
   - [ ] Gym Course Promotion Video
   - [ ] Cooking Tutorial - Braised Pork
5. [ ] 确认时长显示：英文单位（如果已翻译）

### 交互测试
1. [ ] 点击中文项目卡片
   - [ ] 跳转到Chat界面
   - [ ] 输入框填充中文标题
2. [ ] 切换到英文后点击项目卡片
   - [ ] 跳转到Chat界面
   - [ ] 输入框填充英文标题

---

## 翻译键映射

| ID | titleKey | 中文 | English |
|----|----------|------|---------|
| coffee-promo | inspirationGallery.items.coffeePromo | 咖啡店新品宣传 - 拿铁特调 | Coffee Shop New Product - Latte Special |
| tech-product | inspirationGallery.items.techProduct | AI耳机产品介绍视频 | AI Headphone Product Video |
| brand-story | inspirationGallery.items.brandStory | 创业品牌故事 - 从0到1 | Startup Brand Story - From Zero to One |
| makeup-tutorial | inspirationGallery.items.makeupTutorial | 5分钟快速妆容教程 | 5-Minute Quick Makeup Tutorial |
| city-vlog | inspirationGallery.items.cityVlog | 城市漫步Vlog - 上海外滩 | City Walk Vlog - Shanghai Bund |
| event-promo | inspirationGallery.items.eventPromo | 音乐节活动预告片 | Music Festival Teaser |
| fitness-intro | inspirationGallery.items.fitnessIntro | 健身房课程推广视频 | Gym Course Promotion Video |
| food-recipe | inspirationGallery.items.foodRecipe | 美食制作教程 - 红烧肉 | Cooking Tutorial - Braised Pork |

---

## 技术实现

### 数据结构
```typescript
// src/lib/inspiration-gallery.ts
export interface InspirationItem {
  id: string
  titleKey: string // i18n translation key
  thumbnail: string
  duration: number
  category: 'product' | 'brand' | 'tutorial' | 'creative' | 'event'
}
```

### 组件使用
```typescript
// src/components/workspace/WelcomeHero.tsx
const translatedTitle = t(item.titleKey)
<h2>{t('welcome.inspirationGallery')}</h2>
<div>{translatedTitle}</div>
<div>{item.duration}{t('common.seconds')}</div>
```

---

## 已知问题

**无**

---

## 预期效果

- ✅ **中文用户**: 看到完整的中文标题和时长
- ✅ **英文用户**: 看到完整的英文标题和时长
- ✅ **动态切换**: 语言切换后立即更新标题
- ✅ **零性能影响**: 使用现有i18n基础设施

---

**创建时间**: 2026-04-11  
**Task ID**: #205  
**版本**: v1.0.5  
**状态**: 待手动验证
