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
