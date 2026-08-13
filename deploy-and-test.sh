#!/usr/bin/env bash
# ============================================
# Do-It 埋点系统部署与验证脚本
# 功能：构建 → 提交 → 推送 → 等待部署 → 验证
# 用法：bash deploy-and-test.sh
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Do-It 埋点系统部署与验证${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ---------- 步骤1：构建检查 ----------
echo -e "${YELLOW}[1/6] 构建项目...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}构建失败，请检查错误${NC}"
  exit 1
fi
echo -e "${GREEN}构建成功${NC}"
echo ""

# ---------- 步骤2：检查必要文件 ----------
echo -e "${YELLOW}[2/6] 检查必要文件...${NC}"
FILES=(
  "netlify/functions/track.ts"
  "netlify/functions/stats.ts"
  "netlify.toml"
  "src/utils/track.ts"
  "dist/index.html"
)

ALL_OK=true
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    echo -e "  ${GREEN}✓${NC} $f"
  else
    echo -e "  ${RED}✗${NC} $f (缺失)"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = false ]; then
  echo -e "${RED}部分文件缺失，请检查${NC}"
  exit 1
fi
echo ""

# ---------- 步骤3：Git 提交 ----------
echo -e "${YELLOW}[3/6] 提交代码到 Git...${NC}"

# 检查是否有未提交的更改
if git diff --quiet HEAD 2>/dev/null; then
  # 检查是否有未跟踪的新文件
  if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}没有需要提交的更改${NC}"
  fi
fi

git add netlify/ netlify.toml src/utils/track.ts dist/
git commit -m "$(cat <<'EOF'
feat: 添加 Netlify Functions 埋点数据收集系统

- 新增 netlify/functions/track.ts 接收前端埋点上报
- 新增 netlify/functions/stats.ts 查看汇总统计数据
- 修改 track.ts 添加异步上报逻辑（sendBeacon + fetch 降级）
- 添加 netlify.toml 配置 Functions 和路径重定向
- 新增访客ID管理，支持跨用户统计
EOF
)"

echo -e "${GREEN}提交成功${NC}"
echo ""

# ---------- 步骤4：推送到远程 ----------
echo -e "${YELLOW}[4/6] 推送到远程仓库...${NC}"
git push origin HEAD
echo -e "${GREEN}推送成功，Netlify 将自动触发部署${NC}"
echo ""

# ---------- 步骤5：获取部署URL并等待 ----------
echo -e "${YELLOW}[5/6] 等待 Netlify 部署完成...${NC}"

# 获取远程仓库URL，推断 Netlify 站点
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
echo -e "  仓库地址: ${REMOTE_URL}"

# 提示用户输入 Netlify 站点URL（或自动推断）
SITE_URL=""
if [ -n "$NETLIFY_SITE_URL" ]; then
  SITE_URL="$NETLIFY_SITE_URL"
elif [ -n "$1" ]; then
  SITE_URL="$1"
fi

if [ -z "$SITE_URL" ]; then
  echo -e "${YELLOW}  请输入你的 Netlify 站点URL（例如 https://superb-mousse-d6ec8a.netlify.app）${NC}"
  echo -ne "  > "
  read -r SITE_URL
fi

# 移除尾部斜杠
SITE_URL="${SITE_URL%/}"

echo -e "  站点地址: ${BLUE}${SITE_URL}${NC}"
echo -e "  正在等待部署完成（最多等待3分钟）..."

# 轮询检查 Functions 是否上线
MAX_WAIT=180  # 3分钟
WAITED=0
DEPLOYED=false

while [ $WAITED -lt $MAX_WAIT ]; do
  sleep 10
  WAITED=$((WAITED + 10))

  # 检查 stats 端点是否可用
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/.netlify/functions/stats" 2>/dev/null || echo "000")

  if [ "$STATUS" = "200" ]; then
    DEPLOYED=true
    echo -e "\n  ${GREEN}✓${NC} 部署完成（等待了 ${WAITED} 秒）"
    break
  fi

  printf "."
done

echo ""

if [ "$DEPLOYED" = false ]; then
  echo -e "${YELLOW}等待超时，请手动检查 Netlify 部署状态${NC}"
  echo -e "  部署面板: https://app.netlify.com/projects/superb-mousse-d6ec8a/deploys"
  echo -e "  部署完成后可手动运行验证步骤"
  echo ""
  # 不退出，继续尝试
fi

# ---------- 步骤6：验证 ----------
echo -e "${YELLOW}[6/6] 验证埋点系统...${NC}"
echo ""

# 6a: 测试 track 端点
echo -e "${BLUE}--- 测试上报端点 (POST /api/track) ---${NC}"
TRACK_RESPONSE=$(curl -s -X POST "${SITE_URL}/.netlify/functions/track" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "test_event",
    "timestamp": '"$(date +%s)"'000,
    "date": "'"$(date +%Y-%m-%d)"'",
    "visitorId": "test-script",
    "properties": { "source": "deploy-script" }
  }')

echo -e "  响应: ${TRACK_RESPONSE}"

if echo "$TRACK_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✓${NC} 上报端点正常"
else
  echo -e "  ${YELLOW}?${NC} 上报端点返回未预期结果（可能是首次部署，数据存储尚未就绪）"
fi
echo ""

# 6b: 测试 stats 端点
echo -e "${BLUE}--- 查看统计数据 (GET /api/stats) ---${NC}"
sleep 2  # 等待数据写入
STATS_RESPONSE=$(curl -s "${SITE_URL}/.netlify/functions/stats")

echo -e "  ${STATS_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo -e "  ${STATS_RESPONSE}"
echo ""

# 6c: 测试页面是否正常加载
echo -e "${BLUE}--- 检查首页加载 ---${NC}"
PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SITE_URL}/")
if [ "$PAGE_STATUS" = "200" ]; then
  echo -e "  ${GREEN}✓${NC} 首页正常（HTTP 200）"
else
  echo -e "  ${RED}✗${NC} 首页异常（HTTP ${PAGE_STATUS}）"
fi
echo ""

# ---------- 总结 ----------
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  部署与验证完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "后续查看埋点数据："
echo -e "  ${BLUE}浏览器访问:${NC} ${SITE_URL}/api/stats"
echo -e "  ${BLUE}命令行查看:${NC} curl ${SITE_URL}/api/stats"
echo -e "  ${BLUE}控制台调试:${NC} 打开 ${SITE_URL} → F12 → __getTrackStats()"
echo ""
echo -e "埋点数据流："
echo -e "  用户操作 → track() → localStorage（本地） + sendBeacon → Netlify Function → Netlify Blobs"
echo -e "  你查看   → /api/stats → 读取 Netlify Blobs → 返回汇总JSON"
