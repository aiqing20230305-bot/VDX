# 超级视频Agent 常见问题 (FAQ)

**版本**: v1.11.0  
**更新日期**: 2026-04-10

---

## 目录

1. [安装和配置](#安装和配置)
2. [使用问题](#使用问题)
3. [性能优化](#性能优化)
4. [错误排查](#错误排查)
5. [功能限制](#功能限制)
6. [API 相关](#api-相关)

---

## 安装和配置

### Q1: 支持哪些操作系统？

**A:** 支持以下操作系统：
- macOS 10.15+ (推荐)
- Windows 10/11
- Linux (Ubuntu 20.04+, Debian 11+)

> 💡 **提示**：macOS 上使用 Homebrew 安装依赖最方便。

---

### Q2: 如何获取 Claude API Key？

**A:** 步骤：
1. 访问 [https://claude.ai/api](https://claude.ai/api)
2. 注册 Anthropic 账号
3. 在控制台创建 API Key
4. 复制 Key 并添加到 `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

---

### Q3: 即梦 Dreamina 如何登录？

**A:** 两种方法：

**方法 1：命令行登录（推荐）**
```bash
dreamina login
# 会打开浏览器，扫码登录
```

**方法 2：手动配置 Token**
1. 浏览器访问 [即梦官网](https://jimeng.com)
2. F12 打开开发者工具 → Application → Cookies
3. 复制 `sessionid` 的值
4. 添加到 `.env.local`:
   ```bash
   JIMENG_API_TOKEN=your-sessionid
   ```

---

### Q4: Redis 是必需的吗？

**A:** 不是必需的，但推荐使用。

**不使用 Redis**：
- 所有任务同步执行
- 生成速度较慢
- 不支持长视频（>2分钟）

**使用 Redis**：
- 异步任务队列
- 支持并发生成
- 支持长视频分段生成
- 实时进度推送（SSE）

---

### Q5: FFmpeg 和 Whisper 是必需的吗？

**A:** 取决于你使用的功能。

| 功能 | FFmpeg | Whisper |
|------|--------|---------|
| 脚本生成 | ❌ 不需要 | ❌ 不需要 |
| 分镜编辑 | ❌ 不需要 | ❌ 不需要 |
| 视频导出 | ✅ 需要 | ❌ 不需要 |
| 字幕生成 | ❌ 不需要 | ✅ 需要 |
| 视频分析（二创） | ✅ 需要 | ✅ 需要 |

---

## 使用问题

### Q6: 如何修改已生成的分镜？

**A:** 有 3 种方法：

**方法 1：内联编辑**
- 点击场景描述文字，直接修改
- 点击时长数字，修改秒数

**方法 2：对话式修改**
- 在 Chat 界面说："把第 3 个场景改成猫咪跳跃"
- AI 会理解你的意图并修改

**方法 3：重新生成**
- 点击场景菜单 → "重新生成"
- 系统会基于原描述重新生成图片

---

### Q7: 如何删除或重排场景？

**A:** 

**删除单个场景**：
- 方法 1：点击场景右上角的删除按钮
- 方法 2：选中场景，按 <kbd>Delete</kbd> 或 <kbd>Backspace</kbd>

**批量删除**：
- 按住 <kbd>Cmd/Ctrl</kbd> 点击多个场景
- 点击"批量删除"按钮或按 <kbd>Delete</kbd>

**重排场景**：
- 在左侧列表中拖拽场景上下移动
- 在底部时间轴中拖拽场景左右移动

---

### Q8: 视频最长可以生成多长？

**A:** 当前限制：
- **最短**：10 秒
- **最长**：5 分钟（300 秒）
- **推荐**：30-60 秒（生成速度最快）

> ⚠️ **注意**：超过 2 分钟的视频需要启用 Redis 任务队列。

---

### Q9: 支持哪些画面比例？

**A:** 支持 3 种比例：

| 比例 | 分辨率 | 适用场景 |
|------|--------|----------|
| 16:9 | 1920×1080 | YouTube、电脑观看、风景展示 |
| 9:16 | 1080×1920 | TikTok、Instagram Reels、手机竖屏 |
| 1:1 | 1080×1080 | Instagram 帖子、微信朋友圈 |

---

### Q10: 如何添加背景音乐？

**A:** 在 Export Panel 中：

1. 点击 **选择音乐** 按钮
2. 选择预设音乐（8 首免费音乐）或上传自定义音频
3. 调整音量（0-100%）
4. 导出时会自动混合音频

**支持的音频格式**：MP3、WAV、AAC、M4A

---

### Q11: 字幕如何生成？

**A:** 两种方式：

**方式 1：ASR 自动生成**
1. 上传音频文件或视频
2. 点击"生成字幕"按钮
3. 系统自动识别语音并生成字幕

**方式 2：手动添加**
1. 点击"添加字幕轨道"
2. 手动输入字幕文字
3. 调整显示时间

**导出字幕**：
- 点击"导出 SRT"保存字幕文件
- 可用于其他视频编辑软件

---

### Q12: 如何保存和恢复项目？

**A:** 

**自动保存**：
- 每次编辑后 1 秒自动保存
- 保存到浏览器 localStorage
- 无需手动操作

**手动保存**：
- 按 <kbd>Cmd/Ctrl + S</kbd> 立即保存
- 看到"已保存"提示即成功

**恢复项目**：
- 左侧边栏 → 项目列表
- 点击项目名称即可恢复

**版本历史**：
- 点击"版本历史"按钮
- 查看最近 10 个版本
- 一键回退到任意版本

---

## 性能优化

### Q13: 生成速度很慢怎么办？

**A:** 优化建议：

**1. 减少场景数量**
- 30 秒视频建议 5-8 个场景
- 每个场景 3-5 秒

**2. 降低分辨率**
- 720p 比 1080p 快 30%
- 1080p 比 4K 快 60%

**3. 使用 Redis 任务队列**
- 异步生成，不阻塞界面
- 支持并发生成多个场景

**4. 关闭不必要的功能**
- 不需要字幕就不生成
- 不需要音频就不添加

---

### Q14: 导出视频很慢怎么办？

**A:** 

**优化导出速度**：

| 操作 | 效果 |
|------|------|
| 降低分辨率（4K → 1080p） | 快 60% |
| 降低帧率（60 → 30 FPS） | 快 40% |
| 减少场景数量 | 线性加速 |
| 关闭字幕生成 | 快 10% |

**预计导出时长**：
- 30秒视频（1080p/30fps）：~1 分钟
- 1分钟视频（1080p/30fps）：~2-3 分钟
- 2分钟视频（1080p/30fps）：~5-7 分钟

---

### Q15: 如何减少 API 调用费用？

**A:** 节省费用技巧：

**1. 使用预设模板**
- 跳过对话生成步骤
- 节省 50% Token

**2. 精简提示词**
- 避免冗长的描述
- 直接说重点

**3. 批量操作**
- 一次生成多个分镜
- 减少 API 调用次数

**4. 缓存复用**
- 已生成的图片会缓存
- 重新生成时可以复用

---

## 错误排查

### Q16: 报错"ANTHROPIC_API_KEY not found"

**A:** 原因和解决：

**原因 1**：未配置环境变量
```bash
# 创建 .env.local 文件
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env.local

# 重启服务器
npm run dev
```

**原因 2**：API Key 格式错误
- 确保以 `sk-ant-` 开头
- 没有多余空格或换行

---

### Q17: 图片生成失败怎么办？

**A:** 排查步骤：

**1. 检查即梦登录状态**
```bash
dreamina login --check
```

**2. 检查网络连接**
- 确保能访问 jimeng.com
- 尝试使用代理

**3. 检查提示词**
- 避免敏感词汇
- 提示词长度 < 500 字符

**4. 重试生成**
- 点击"重新生成"按钮
- 系统会自动重试 3 次

---

### Q18: 导出视频失败

**A:** 常见原因和解决：

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| "FFmpeg not found" | 未安装 FFmpeg | `brew install ffmpeg` |
| "Out of memory" | 视频太长或分辨率太高 | 降低分辨率或分段导出 |
| "Timeout" | 导出超时（>10分钟） | 减少场景数量或降低质量 |
| "Invalid frame" | 某个场景图片损坏 | 重新生成该场景图片 |

---

### Q19: 字幕生成失败

**A:** 排查：

**1. 检查音频文件**
- 格式正确（MP3/WAV/M4A）
- 文件大小 < 100 MB
- 音频清晰，无杂音

**2. 检查 ASR 引擎**
```bash
# 检查 Whisper 安装
whisper-cli --version

# 检查模型下载
ls ~/.cache/whisper/
```

**3. 尝试其他引擎**
```bash
# 在 .env.local 中切换引擎
ASR_ENGINES=openai  # 使用 OpenAI API
```

---

### Q20: 键盘快捷键不生效

**A:** 排查：

**1. 确保焦点不在输入框**
- 点击空白区域获取焦点
- <kbd>Esc</kbd> 键取消输入框焦点

**2. 检查快捷键冲突**
- Mac 系统快捷键可能冲突
- 浏览器扩展可能拦截

**3. 查看快捷键列表**
- 按 <kbd>Shift + ?</kbd> 查看所有快捷键
- 确认按键正确

---

## 功能限制

### Q21: 支持多人协作吗？

**A:** 当前版本**不支持**多人协作。

**当前状态**：
- 单用户模式
- 数据存储在浏览器本地（localStorage）
- 无法多设备同步

**未来计划**：
- v2.0 将支持团队协作
- 云端存储和同步
- 实时协作编辑

---

### Q22: 可以导入已有视频吗？

**A:** **部分支持**，取决于功能。

**支持的操作**：
- ✅ 视频分析（提取场景和字幕）
- ✅ 基于已有视频二创
- ✅ 提取音频作为背景音乐

**不支持的操作**：
- ❌ 直接编辑已有视频
- ❌ 替换已有视频中的场景

---

### Q23: 支持哪些视频格式导出？

**A:** 当前仅支持 MP4。

**导出格式**：
- 视频编码：H.264
- 音频编码：AAC
- 封装格式：MP4

**未来支持**：
- MOV（Apple ProRes）
- WebM
- GIF 动图

---

### Q24: 可以商用吗？

**A:** 取决于 API 服务条款。

**超级视频Agent 本身**：
- MIT 协议，可商用

**第三方服务**：
- **Claude API**：遵循 Anthropic 商用条款
- **即梦 Dreamina**：遵循即梦商用政策
- **预设音乐**：仅限非商用，商用需自行上传授权音乐

> ⚠️ **建议**：商用前请仔细阅读所有第三方服务条款。

---

## API 相关

### Q25: API 调用有速率限制吗？

**A:** 是的，有速率限制。

**限制**：
| 接口 | 限制 |
|------|------|
| `/api/chat` | 60 请求/分钟 |
| `/api/script` | 30 请求/分钟 |
| `/api/storyboard` | 10 请求/分钟 |
| `/api/analyze` | 5 请求/分钟 |

**超出限制后**：
- 返回 `429 Too Many Requests`
- 响应头包含 `Retry-After` 秒数
- 建议使用指数退避重试

---

### Q26: 如何查看 API 用量？

**A:** 

**方法 1：API 接口**
```bash
curl http://localhost:3000/api/usage
```

**方法 2：脚本监控**
```bash
npm run token-monitor
```

**方法 3：控制台（即将支持）**
- 未来版本会有可视化用量面板

---

### Q27: API 支持跨域吗？

**A:** 本地开发默认支持。

**本地开发**：
- Next.js 自动处理跨域
- 无需额外配置

**生产部署**：
- 需要配置 CORS 白名单
- 在 `next.config.js` 中设置

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
        ],
      },
    ]
  },
}
```

---

### Q28: 如何在自己的应用中集成 API？

**A:** 参考以下示例：

**JavaScript / TypeScript**:
```javascript
async function generateVideo(idea, duration) {
  // 1. 生成脚本
  const scriptRes = await fetch('http://localhost:3000/api/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, duration, aspectRatio: '16:9' })
  })
  const { script } = await scriptRes.json()

  // 2. 生成分镜（流式）
  const storyboardRes = await fetch('http://localhost:3000/api/storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, aspectRatio: '16:9' })
  })

  const frames = []
  const reader = storyboardRes.body.getReader()
  // ... 处理流式响应

  return frames
}
```

**Python**:
```python
import requests

def generate_video(idea, duration):
    # 1. 生成脚本
    script_res = requests.post('http://localhost:3000/api/script', json={
        'idea': idea,
        'duration': duration,
        'aspectRatio': '16:9'
    })
    script = script_res.json()['script']

    # 2. 生成分镜
    storyboard_res = requests.post('http://localhost:3000/api/storyboard', json={
        'script': script,
        'aspectRatio': '16:9'
    }, stream=True)

    frames = []
    # ... 处理流式响应

    return frames
```

---

## 联系方式

**问题未解决？**

- 📧 **技术支持**: support@tezign.com
- 💬 **社区论坛**: https://community.tezign.com
- 🐛 **Bug 反馈**: https://github.com/your-org/super-video-agent/issues
- 📚 **完整文档**: https://docs.tezign.com

---

**更新日期**: 2026-04-10  
**FAQ 版本**: v1.0.0
