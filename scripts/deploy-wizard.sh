#!/bin/bash

# 超级视频Agent - Vercel 部署向导
# 一键完成部署准备和执行

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}=================================================="
echo -e "  超级视频Agent - Vercel 部署向导"
echo -e "==================================================${NC}"
echo ""

# ============================================
# Step 1: 检查 Vercel CLI
# ============================================
echo -e "${YELLOW}Step 1: 检查 Vercel CLI${NC}"
echo "-------------------"

if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI 未安装${NC}"
    echo ""
    read -p "是否现在安装? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g vercel
        echo -e "${GREEN}✓ Vercel CLI 安装完成${NC}"
    else
        echo -e "${YELLOW}请手动安装: npm install -g vercel${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Vercel CLI 已安装${NC}"
fi

echo ""

# ============================================
# Step 2: 检查登录状态
# ============================================
echo -e "${YELLOW}Step 2: 检查登录状态${NC}"
echo "-------------------"

if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ 未登录 Vercel${NC}"
    echo ""
    echo "正在打开登录..."
    vercel login
    echo -e "${GREEN}✓ 登录成功${NC}"
else
    VERCEL_USER=$(vercel whoami 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ 已登录为: $VERCEL_USER${NC}"
fi

echo ""

# ============================================
# Step 3: 环境变量准备
# ============================================
echo -e "${YELLOW}Step 3: 环境变量准备${NC}"
echo "-------------------"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local 不存在${NC}"
    echo ""
    read -p "是否从 .env.production.template 创建? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.production.template .env.local
        echo -e "${GREEN}✓ 已创建 .env.local${NC}"
        echo -e "${YELLOW}请编辑 .env.local 填写实际的 API 密钥${NC}"
        read -p "按回车继续..." -r
    fi
else
    echo -e "${GREEN}✓ .env.local 已存在${NC}"
fi

# 检查必需变量
ENV_WARNINGS=0

if ! grep -q "ANTHROPIC_API_KEY=sk-ant" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠ ANTHROPIC_API_KEY 未配置${NC}"
    ((ENV_WARNINGS++))
fi

if ! grep -q "REDIS_URL=redis://" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠ REDIS_URL 未配置（任务队列将不可用）${NC}"
    ((ENV_WARNINGS++))
fi

if [ $ENV_WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}发现 $ENV_WARNINGS 个配置警告${NC}"
    echo "请确保 Vercel 环境变量已正确配置"
    echo ""
    read -p "继续部署? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ 环境变量配置正常${NC}"
fi

echo ""

# ============================================
# Step 4: 执行部署
# ============================================
echo -e "${YELLOW}Step 4: 执行部署${NC}"
echo "-------------------"

echo "部署选项:"
echo "1) 预览部署 (开发测试)"
echo "2) 生产部署 (正式上线)"
echo ""
read -p "请选择 (1/2): " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    echo ""
    echo -e "${CYAN}正在执行生产部署...${NC}"
    echo ""
    vercel --prod
    DEPLOY_TYPE="production"
else
    echo ""
    echo -e "${CYAN}正在执行预览部署...${NC}"
    echo ""
    vercel
    DEPLOY_TYPE="preview"
fi

echo ""
echo -e "${GREEN}✓ 部署完成！${NC}"
echo ""

# ============================================
# Step 5: 部署后指引
# ============================================
echo -e "${YELLOW}Step 5: 部署后指引${NC}"
echo "-------------------"

if [[ $DEPLOY_TYPE == "production" ]]; then
    echo -e "${GREEN}🎉 生产部署成功！${NC}"
    echo ""
    echo "下一步:"
    echo "1. 访问你的域名测试功能"
    echo "2. 在 Vercel Dashboard 配置环境变量:"
    echo "   https://vercel.com/dashboard → 你的项目 → Settings → Environment Variables"
    echo ""
    echo "必需变量:"
    echo "- ANTHROPIC_API_KEY"
    echo "- REDIS_URL (Upstash Redis 或 Vercel KV)"
    echo "- DREAMINA_API_KEY 或 KLING_ACCESS_KEY"
    echo "- OPENAI_API_KEY (ASR)"
    echo ""
    echo "3. 环境变量配置完成后，重新部署:"
    echo "   vercel --prod"
    echo ""
    echo "4. 启用监控:"
    echo "   - Vercel Analytics (Dashboard → Analytics)"
    echo "   - Sentry 错误追踪 (可选)"
else
    echo -e "${GREEN}✓ 预览部署成功！${NC}"
    echo ""
    echo "预览部署用于测试，不会影响生产环境"
    echo ""
    echo "测试通过后，运行生产部署:"
    echo "  vercel --prod"
fi

echo ""
echo -e "${CYAN}=================================================="
echo -e "  部署完成！感谢使用超级视频Agent"
echo -e "==================================================${NC}"
echo ""
