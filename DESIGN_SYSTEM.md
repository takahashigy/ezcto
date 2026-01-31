# EZCTO 设计系统规范

## 配色方案
- **背景色**: `#e8dcc4` (warm beige) - oklch(85% 0.02 60)
- **主色（终端绿）**: `#00FF41` - oklch(65% 0.25 145)
- **深色文字**: oklch(20% 0.01 60)
- **卡片背景**: oklch(88% 0.015 60)
- **边框**: oklch(70% 0.015 60)

## 按钮规范

### 主要按钮（Primary Button）
- **背景**: 深绿色渐变 `from-[#2d3e2d] to-[#4a5f4a]`
- **文字**: `#e8dcc4` (浅米色)
- **边框**: 2px solid 终端绿 + 发光效果
- **圆角**: `rounded-md` (0.375rem)
- **内边距**: `px-6 py-3`
- **字体**: `font-mono font-semibold`
- **Hover**: 发光效果增强

### 次要按钮（Secondary Button）
- **背景**: 透明
- **文字**: `#2d3e2d` (深绿)
- **边框**: 2px solid `#2d3e2d`
- **圆角**: `rounded-md`
- **内边距**: `px-6 py-3`
- **Hover**: 背景变为 `#2d3e2d/10`

### Ghost按钮
- **背景**: 透明
- **文字**: `#2d3e2d`
- **无边框**
- **Hover**: 背景变为 `#2d3e2d/5`

## 卡片规范
- **背景**: oklch(88% 0.015 60)
- **边框**: 2px solid oklch(70% 0.015 60)
- **圆角**: `rounded-lg` (0.5rem)
- **内边距**: `p-6`
- **阴影**: 无（保持扁平）
- **Hover**: 边框变为终端绿 + 轻微发光

## 表单规范
- **输入框背景**: 白色/浅米色
- **输入框边框**: 2px solid oklch(70% 0.015 60)
- **输入框圆角**: `rounded-md`
- **Label**: `font-mono font-semibold text-sm`
- **Placeholder**: 浅灰色

## 间距规范
- **Section间距**: `py-12` 或 `py-16`
- **元素间距**: `gap-4` 或 `gap-6`
- **按钮组间距**: `gap-3`

## 字体规范
- **主字体**: JetBrains Mono, Space Mono, Courier New (monospace)
- **标题**: `font-bold tracking-tight`
- **正文**: `font-normal`
- **按钮**: `font-semibold`
