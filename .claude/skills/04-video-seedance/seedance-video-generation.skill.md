---
name: 04-video-seedance
version: 1.0.0
description: |
  即梦 Seedance 视频生成。通过 dreamina CLI 调用即梦网页API生成视频。
  触发场景：用户选择 Seedance 引擎、需要高质量视频生成。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# Seedance 视频生成

## 前置条件

```bash
curl -fsSL https://jimeng.jianying.com/cli | bash   # 安装
dreamina login                                        # 登录（浏览器OAuth）
dreamina user_credit                                  # 验证
```

## 命令

### 文生视频
```bash
dreamina text2video \
  --prompt="..." \
  --model_version=seedance2.0 \
  --duration=5 \
  --ratio=16:9 \
  --poll=120
```

### 图生视频
```bash
dreamina image2video \
  --image=./first.png \
  --prompt="..." \
  --model_version=seedance2.0 \
  --duration=5 \
  --poll=120
```

### 多模态视频（旗舰模式）
```bash
dreamina multimodal2video \
  --image ./ref1.png --image ./ref2.png \
  --audio ./music.mp3 \
  --prompt="..." \
  --model_version=seedance2.0 \
  --duration=10 \
  --ratio=16:9 \
  --poll=120
```

### 首尾帧视频
```bash
dreamina frames2video \
  --first=./start.png \
  --last=./end.png \
  --prompt="..." \
  --model_version=seedance2.0 \
  --duration=5
```

## 模型

| 模型 | 说明 |
|------|------|
| seedance2.0 | 高质量（默认推荐） |
| seedance2.0fast | 快速 |

## 限制

- 时长: 4~15 秒/片段
- 分辨率: 720p
- 比例: 1:1, 3:4, 16:9, 4:3, 9:16, 21:9
- 需要即梦高级会员

## 查询结果

```bash
dreamina query_result --submit_id=<id>
```

`gen_status`: querying → success / fail

## 关键代码

`src/lib/video/seedance.ts`

## 迭代记录

- v1.0.0: dreamina CLI 集成，text2video + image2video + 轮询
- 已验证: Seedance 2.0 生成 720p/5s 视频成功
