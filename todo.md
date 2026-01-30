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
- [x] 开发Retro Gaming风格HTML/CSS模版
- [x] 开发Cyberpunk风格HTML/CSS模版
- [x] 开发Minimalist风格HTML/CSS模版
- [x] 开发Pop Art风格HTML/CSS模版
- [x] 实现模版预览功能（iframe模态窗口）
- [ ] 实现模版下载功能（打包HTML/CSS/assets）
- [ ] 在Launch表单中添加模版选择选项
- [ ] 集成模版风格参数到AI生成流程
- [ ] 测试Vercel部署兼容性
- [ ] 测试Manus部署兼容性
- [ ] 添加"更多模版开发中"占位区

## UI优化
- [x] 将顶部导航"模版"按钮改为英文"Templates"
- [x] 为首页View Demo按钮添加跳转到/templates页面的链接

## 模版预览优化
- [x] 将模版卡片预览区域改为实时iframe预览，展示模版首页效果

## 基于参考图重新创建Demo模版
- [ ] 重新创建Retro Gaming模版（黄色网格透视地面+3D文字效果）
- [x] 重新创建Cyberpunk模版（红黑配色+原创赛博朋克角色）
- [x] 将Pop Art改为Internet Meme模版（手绘风格+卡通角色+飞落钱币动画）
- [x] 更新Templates页面的模版名称和描述

## Launch功能升级
- [x] Visual Style Template改为下拉选择组件（支持未来扩展）
- [ ] 集成真实AI生成网站功能（多个AI API轮询）
- [ ] 实现免费生成一次机制
- [ ] 生成结果保存到用户项目列表
- [ ] 加密货币支付集成（连接钱包功能）
- [ ] 付费后解锁部署/下载网站资产

## 模版优化和部署功能
- [x] 修改Cyberpunk模版去除固定项目名称（NEONVERSE、Kira等）
- [x] 修复Cyberpunk模版显示（占位符改为示例内容）
- [ ] 为所有模版添加占位符标记（便于AI替换）
- [x] 集成AI生成功能（Logo+Banner 1500x500+网站内容）
- [x] 实现付费墙（点击部署按钮弹出付费提示）
- [x] 实现一键部署功能（S3+CDN）
- [x] 生成的网站自动分配独立URL（projectname.ezcto.manus.space）

## 价格调整
- [x] 修改部署价格从$29改为$299

## Bug修复
- [x] 调试并修夏项目生成失败问题（修复undefined检查）
- [x] 修复View Details按钮跳转404问题（创建ProjectDetails页面并注册路由）
- [x] 添加生成成功通知弹窗（toast通知+自动轮询）
- [x] 添加通知声音效果（Web Audio API生成和弦音效）

## ProjectDetails页面优化
- [x] 添加付费/发布状态显示（Success/Failed/Progress + 是否已付费/已发布）
- [x] 修复Banner预览框比例为1500:500（不是1:1）
- [x] 去掉Profile Picture展示
- [x] 调整布局：Logo和Poster为1:1框，排版在Banner下面
- [x] 为所有图片资产添加水印（付费后才能下载无水印版本）
- [x] 添加一键打包ZIP下载按钮（使用jszip+file-saver）

## React Hooks错误修复
- [x] 修复ProjectDetails页面的Hooks调用顺序错误（downloadZipMutation移到组件顶部）

## 水印和付费墙优化
- [x] 增强水印显示（增大字体、增加不透明度、对角线重复、阴影效果）
- [x] 修复Download All Assets按钮的付费墙检查（未付费时弹出付费墙）
- [x] 添加网站发布状态按钮（未付费显示"Publish Website"，已发布显示"Visit Website"）

## tRPC API错误修复
- [x] 诊断tRPC API返回HTML而不是JSON的错误原因
- [x] 修复服务器路由配置或错误处理

## Stripe价格ID错误修复
- [x] 检查当前Stripe产品和价格配置
- [x] 在Stripe中创建deployment产品（$299）
- [x] 添加STRIPE_PRICE_DEPLOYMENT环境变量
- [x] 测试付费墙和checkout流程

## UI优化 - Coming Soon状态
- [x] 将IP实体化供应链按钮改为"Coming Q3 2026"灰色禁用状态

## 模版重做 - 复刻成功Meme网站风格
- [x] 优化Retro Gaming为Terminal Hacker风格（Fartcoin）
  - [x] 添加动态背景文字流
  - [x] 虚线边框终端窗口
  - [x] 简化布局为极简信息
  - [x] 闪烁光标效果
  - [x] 合约地址一键复制
- [x] 简化Internet Meme为Clicker Minimal风格（Popcat）
  - [x] 改为大图布局（角色升70%屏幕）
  - [x] 温暖纯色背景
  - [x] 删除多余区块
  - [x] 圆角设计
  - [x] 合约地址一键复制
- [x] 替换Crypto Professional为Comic Book风格（Wojak）
  - [x] 鲜艳单色背景
  - [x] 手绘装饰元素（云朵、星星、硬币）
  - [x] 漫画式粗体文字
  - [x] How to Buy教程区块
  - [x] 合约地址一键复制
- [x] 替换Minimalist Clean为Brutalist Minimal风格
  - [x] 纯黑或纯白背景
  - [x] 超大粗体字
  - [x] 强烈对比色
  - [x] 极简几何图形
  - [x] 合约地址一键复制
- [x] 测试所有4个模版的响应式和视觉效果

## 模版优化 - 用户反馈
- [x] Internet Meme模版完全复刻Wojak网站设计（保留原网站图片、名称、布局）
- [x] 更新首页Templates区域的4个模版卡片信息（名称和描述）
  - [x] Terminal Hacker卡片
  - [x] Comic Book卡片
  - [x] Brutalist Minimal卡片
  - [x] Wojak Style卡片

## Labubu风格模版开发
- [x] 分析Labubu设计图的所有设计元素
- [x] 重写Internet Meme模版HTML/CSS为Labubu风格
  - [x] 深色背景 + 白色主画布
  - [x] 虚线网格分割系统
  - [x] 黄色像素方块装饰
  - [x] 蓝色像素化大字
  - [x] 黑色粗体项目名称
  - [x] 右侧导航菜单
  - [x] 左侧黄色描述卡片
  - [x] 黄色+蓝色底部滚动条
  - [x] 黄色Buy Now按钮
- [x] 测试模版响应式和视觉效果

## 素材图片更新和模版完善
- [x] 复制Wojak素材到项目目录
- [x] 复制Labubu素材到项目目录
- [x] 将Minimalist模版替换为Wojak风格（天蓝色背景+手绘装饰）
- [x] 完善Labubu模版的图片路径
- [x] 更新Templates页面的Wojak Style卡片信息
- [x] 测试所有模版的视觉效果

## 模版优化 - 用户反馈2
- [x] 替换Labubu新图片（三只Labubu和单只Labubu PNG）
- [x] 更新Labubu模版的图片路径
- [x] 将所有4个模版的占位符（{{PROJECT_NAME}}等）改为"MEMES"
- [x] 测试所有模版的视觉效果

## 模版预览窗口优化
- [x] 使用Selenium截取4个模版的真实截图（1200x800）
- [x] 替换Templates页面iframe预览为真实截图
- [x] 添加图片加载失败的fallback机制
- [x] 测试Wojak和Labubu预览窗口显示效果

## 基于用户图片的AI二创生成功能
- [x] 在Launch表单添加图片上传组件
- [x] 实现前端图片预览功能
- [x] 创建图片上传到S3的tRPC路由
- [x] 更新projects表添加userImageUrl字段
- [x] 重构launch.ts支持基于用户图片的生成
- [x] 为每个资产类型优化Prompt（Logo/Banner/PFP/Poster）
- [x] 添加风格适配系统（根据模版调整生成风格）
- [x] 测试完整的上传和生成流程
- [x] 添加错误处理和加载状态
- [x] 编写vitest测试

## 高级功能：背景移除、多图上传、进度推送
- [x] 研究Manus内置背景移除API（如果没有则使用remove.bg）
- [x] 实现图片背景移除功能（上传后自动处理）
- [x] 在AI生成时自动判断是否需要背景移除
- [x] 更新Launch表单支持多张图片上传（2-3张）
- [x] 更新数据库schema存储多张图片URL
- [x] 更新AI生成逻辑支持多张参考图
- [x] 实现Server-Sent Events (SSE)进度推送
- [x] 创建进度推送API端点
- [x] 更新launch.ts在生成过程中发送进度事件
- [x] 前端实现SSE监听和进度显示UI
- [x] 测试所有功能的完整流程
- [x] 编写vitest测试

## AI生成逻辑优化和生成历史记录
- [x] 优化AI生成逻辑：多图综合生成（第一张生成Logo，第二张生成Banner等）
- [x] 更新launch.ts支持多图分配策略
- [x] 设计生成历史记录数据结构（generation_history表）
- [x] 创建数据库migration添加generation_history表
- [x] 实现生成历史记录的CRUD操作
- [x] 在launch.ts中记录每次生成的开始时间、结束时间、耗时
- [x] 在Dashboard添加Generation History区域UI
- [x] 实现历史记录列表展示（时间、项目名、状态、耗时）
- [ ] 添加历史记录详情查看功能
- [ ] 添加历史记录对比功能
- [x] 测试完整流程
- [x] 编写vitest测试

## 首页未来愿景模块
- [x] 在首页添加“炼丹计划”模块（Coming Q4 2026，灰色禁用状态）
- [x] 在首页添加“Lora炼制工坊”模块（Coming Soon，灰色禁用状态）
- [x] 设计合适的图标和描述文案
- [x] 测试响应式布局

## 更新正向飞轮生态区域
- [x] 将炼丹计划融入飞轮逻辑（提升启动资产质量）
- [x] 将Lora炼制工坊融入飞轮逻辑（延长IP生命周期）
- [x] 更新飞轮步骤文案
- [x] 测试视觉效果

## 添加Pay Meme公式展示
- [x] 在Hero区域下方添加公式Section
- [x] 使用极简主义设计（等宽字体、大字号）
- [x] 配色：灰色 vs 绿色对比
- [x] 确保不影响主角色IP布局
- [x] 测试响应式效果

## 统一Templates页面绿色
- [x] 检查首页按钮使用的绿色值
- [x] 更新Templates页面所有绿色元素（按钮、文字、边框）
- [x] 确保与首页视觉一致性
- [x] 测试所有绿色元素

## 创建IP实体化供应链和EZSTORE页面
- [x] 设计IP实体化供应链页面内容和布局
- [x] 创建Supply页面组件
- [x] 设计EZSTORE页面内容和布局
- [x] 创建Store页面组件
- [x] 在App.tsx添加路由
- [x] 在首页调整模块顺序（IP实体化→EZSTORE→社交分发网络）
- [x] 更新导航链接
- [x] 测试页面跳转和布局

## 修复导航和按钮样式
- [x] 在首页顶部导航菜单添加Supply入口
- [x] 在首页顶部导航菜单添加Store入口
- [x] 更新IP实体化供应链卡片的按钮为可点击的绿色样式
- [x] 更新EZSTORE官方商城卡片的按钮为可点击的绿色样式
- [x] 测试所有导航链接和按钮

## 修复UI问题和实现语言切换
- [x] 修复Pay Meme公式的换行问题（数字2不应该换行）
- [x] 点亮IP实体化供应链卡片的图标（从灰色改为绿色）
- [x] 点亮EZSTORE官方商城卡片的图标（从灰色改为绿色）
- [x] 创建语言切换Context和Hook
- [x] 在右上角添加中英文切换按钮
- [x] 创建中英文翻译文件
- [ ] 更新所有页面使用翻译系统（分阶段）
  - [x] Phase 1: 导航栏、Hero区域、Pay Meme公式
  - [ ] Phase 2: “打破三大枷锁”区域
  - [ ] Phase 3: Core Modules区域
  - [ ] Phase 4: 正向飞轮生态区域
  - [ ] Phase 5: Templates页面
  - [ ] Phase 6: Supply页面
  - [ ] Phase 7: Store页面
  - [ ] Phase 8: Dashboard页面
  - [ ] Phase 9: Launch页面
- [ ] 测试每个Phase的功能

## Launch页面UI修复
- [x] 修复Launch页面Cancel按钮被遮挡的排版问题

## 供应链定制页面开发
- [x] 设计供应链定制页面结构和内容
- [x] 创建CustomOrder页面组件
- [x] 添加中英文翻译内容
- [x] 实现定制表单（产品类型、数量、需求描述、联系方式）
- [x] 添加产品类型选择（周边、包装、定制生产等）
- [x] 实现文件上传功能（设计稿、参考图）
- [x] 创建后端API处理定制订单
- [x] 添加订单提交成功提示
- [x] 在App.tsx注册路由
- [x] 更新Supply页面的按钮链接
- [x] 测试完整流程

## Supply页面按钮链接修复
- [x] 检查Supply页面“开始定制”按钮的实际链接
- [x] 修复按钮链接，确保指向/custom-order而非/launch
- [x] 测试按钮跳转功能

## 定制订单功能增强
- [x] 实现文件上传到S3功能
  - [x] 在CustomOrder页面集成storagePut上传文件
  - [x] 更新tRPC API接收实际的S3文件URL
  - [x] 测试文件上传和存储
- [x] 添加订单提交通知功能
  - [x] 在订单创建成功后调用notifyOwner
  - [x] 发送包含订单详情的通知给管理员
  - [x] 测试通知发送
- [x] 创建Dashboard订单管理页面
  - [x] 在Dashboard添加“我的订单”标签
  - [x] 显示用户的所有定制订单列表
  - [x] 显示订单状态和详细信息
  - [x] 添加中英文翻译支持
  - [x] 测试订单列表显示

## AI驱动网站自动生成功能
- [x] 更新数据库Schema添加AI分析结果字段
- [x] 简化Launch页面表单（只保留核心字段）
- [x] 创建AI分析引擎（图像识别+LLM分析）
- [x] 创建基础HTML模板系统（单一灵活模板）
- [x] 实现资产生成器（Banner、多尺寸Logo）
- [x] 实现网站组装逻辑（动态区块注入）
- [x] 创建tRPC API路由（generateWebsite）
- [x] 集成前后端完整流程
- [x] 测试端到端生成功能
- [x] 保存checkpoint

## 实时预览功能
- [x] 创建AI分析预览API（不生成实际资产，只返回分析结果）
- [x] 创建预览HTML生成API（基于用户调整的配色和风格）
- [x] 实现配色调整逻辑（允许用户修改AI推荐的配色）
- [x] 实现风格切换逻辑（在4种布局风格间切换）
- [x] 创建预览UI组件（显示AI分析结果）
- [x] 创建配色编辑器组件（颜色选择器）
- [x] 创建风格切换器组件（4种风格的可视化选择）
- [x] 创建实时预览iframe组件
- [x] 集成完整的两步流程（1.预览+调整 2.确认生成）
- [x] 更新Launch页面UI支持预览模式
- [x] 测试完整预览和生成流程
- [x] 保存checkpoint

## 发布网站功能
- [x] 更新数据库Schema添加subdomain和deploymentStatus字段
- [x] 创建子域名可用性检查API
- [x] 创建发布网站API（设置子域名并部署）
- [x] 创建发布Modal组件（包含3个选项）
- [x] 实现免费子域名选项（完整功能）
- [x] 实现自定义域名占位UI（显示“即将推出”）
- [x] 实现购买域名占位UI（显示“即将推出”）
- [x] 调整生成流程（生成后不自动部署）
- [x] 在Dashboard添加“发布”按钮
- [x] 集成发布Modal到Dashboard
- [x] 测试完整发布流程
- [x] 保存checkpoint

## 子域名编辑功能
- [x] 更新PublishModal支持编辑模式（isEdit prop）
- [x] 在编辑模式下显示当前子域名
- [x] 在编辑模式下允许修改子域名
- [x] 更新publishWebsite API支持重新部署
- [x] 在项目metadata中记录子域名变更历史
- [x] 在Dashboard已发布项目旁添加“编辑子域名”按钮
- [x] 测试子域名编辑和重新部署流程
- [ ] 保存checkpoint
