/**
 * 灵感画廊 - 精选示例项目
 * 为首次用户提供创意灵感和快速入口
 *
 * 注意：标题使用 i18n 翻译键，在组件中使用 t() 函数翻译
 */

export interface InspirationItem {
  id: string
  titleKey: string // i18n translation key
  thumbnail: string // data URL 或渐变CSS
  duration: number // 秒
  category: 'product' | 'brand' | 'tutorial' | 'creative' | 'event'
}

/**
 * 精选示例项目
 * 使用CSS渐变作为缩略图，零外部依赖
 * titleKey对应 messages/{locale}.json 中的 inspirationGallery.items.{key}
 */
export const inspirationGallery: InspirationItem[] = [
  {
    id: 'coffee-promo',
    titleKey: 'inspirationGallery.items.coffeePromo',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    duration: 15,
    category: 'product',
  },
  {
    id: 'tech-product',
    titleKey: 'inspirationGallery.items.techProduct',
    thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    duration: 30,
    category: 'product',
  },
  {
    id: 'brand-story',
    titleKey: 'inspirationGallery.items.brandStory',
    thumbnail: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    duration: 45,
    category: 'brand',
  },
  {
    id: 'makeup-tutorial',
    titleKey: 'inspirationGallery.items.makeupTutorial',
    thumbnail: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    duration: 60,
    category: 'tutorial',
  },
  {
    id: 'city-vlog',
    titleKey: 'inspirationGallery.items.cityVlog',
    thumbnail: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    duration: 90,
    category: 'creative',
  },
  {
    id: 'event-promo',
    titleKey: 'inspirationGallery.items.eventPromo',
    thumbnail: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    duration: 20,
    category: 'event',
  },
  {
    id: 'fitness-intro',
    titleKey: 'inspirationGallery.items.fitnessIntro',
    thumbnail: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    duration: 25,
    category: 'product',
  },
  {
    id: 'food-recipe',
    titleKey: 'inspirationGallery.items.foodRecipe',
    thumbnail: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    duration: 120,
    category: 'tutorial',
  },
]

/**
 * 按类别筛选
 */
export function filterByCategory(category: InspirationItem['category']): InspirationItem[] {
  return inspirationGallery.filter(item => item.category === category)
}

/**
 * 获取推荐项目（前6个）
 */
export function getFeaturedItems(limit: number = 6): InspirationItem[] {
  return inspirationGallery.slice(0, limit)
}
