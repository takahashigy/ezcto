# EZCTO Project TODO

## Phase 1: 数据库Schema设计与品牌资产整合
- [x] 设计数据库表结构（项目表、资产表、订单表、支付记录表）
- [x] 复制品牌视觉资产到项目public目录
- [x] 推送数据库迁移

## Phase 2: 全局主题系统与视觉风格配置
- [x] 配置Tailwind CSS暖色调主题（#d1c9b8背景色）
- [x] 添加等宽字体（JetBrains Mono/Space Mono）
- [x] 创建复古计算机美学UI组件库
- [x] 配置全局样式（扫描线效果、像素化边缘、网格纹理）

## Phase 3: 首页与品牌展示页面开发
- [x] 设计Hero区域（展示cyborg_cel_transparent.png）
- [x] 四大模块概览卡片（Launch引擎、SDN[Coming Soon]、IP供应链、商城[Coming Soon]）
- [x] 品牌介绍与价值主张展示
- [x] 响应式布局适配

## Phase 4: 用户认证与项目管理仪表板
- [x] 集成Manus OAuth认证流程
- [x] 用户个人仪表板页面
- [x] 项目列表展示（已创建项目）
- [x] 项目状态查看与资产下载

## Phase 5: Launch自动化引擎功能实现
- [x] 项目信息输入表单设计
- [x] 集成AI生成接口（Logo、Banner、PFP、海报）
-- [x] 文案生成（项目叙事、白皮书、推文））
- [x] 网站一键生成功能
- [ ] 生成资产存储与管理

## Phase 6: 周边设计对接与Stripe支付集成
- [x] 设计需求提交表单（集成到Launch流程）
- [ ] AI效果图生成展示
- [ ] 下单/报价功能
- [x] 集成Stripe支付系统- [x] 订阅计划与按需付费模式实现

## Phase 7: 管理员面板与角色权限系统
- [ ] 角色权限中间件（区分user/admin）
- [ ] 管理员仪表板（所有项目统计）
- [ ] 订单管理与统计
- [ ] 用户管理功能

## Phase 8: 测试、优化与首次部署交付
- [ ] 编写Vitest单元测试
- [ ] 响应式布局测试（移动端/平板/桌面）
- [ ] 性能优化
- [ ] 创建首次checkpoint
- [ ] 部署到生产环境


## 用户反馈修改
- [x] 替换首页Hero区域图片为Pearl.png
- [x] 替换Logo为Anniu.png
- [x] 设置favicon.png为网站图标
- [x] 在首页Hero区域添加PFP.png装饰图片
- [x] 将favicon.png填充到右上角绿框
- [x] 将PFP2.png填充到左下角绿框
- [x] 修改装饰框样式为与右下角PFP一致的效果

## Demo模版系统开发
- [x] 设计4种风格的配色方案和字体规范
- [x] 创建/templates页面展示模版卡片
- [ ] 开发Retro Gaming风格HTML/CSS模版
- [ ] 开发Cyberpunk风格HTML/CSS模版
- [ ] 开发Minimalist风格HTML/CSS模版
- [ ] 开发Pop Art风格HTML/CSS模版
- [ ] 实现模版预览功能（iframe或新标签页）
- [ ] 实现模版下载功能（打包HTML/CSS/assets）
- [ ] 在Launch表单中添加模版选择选项
- [ ] 集成模版风格参数到AI生成流程
- [ ] 测试Vercel部署兼容性
- [ ] 测试Manus部署兼容性
- [ ] 添加"更多模版开发中"占位区
