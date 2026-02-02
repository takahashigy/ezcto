# EZCTO 网站生成系统 - 优化方案架构

## 一、基础设施建设（一次性工作）

```mermaid
flowchart LR
    subgraph Week1["📦 Week 1: 灵感库建设"]
        A1["收集 50-100 案例"]
        A2["来源: Awwwards / Dribbble"]
        A3["知名 Meme 项目官网"]
        A4["打标签 + 建档案"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph Week2["🧩 Week 2: 组件库扩展"]
        B1["5-8 种 Hero 变体"]
        B2["5-8 种 Feature 变体"]
        B3["引入 Aceternity UI"]
        B4["引入 Magic UI 动效"]
        B1 --> B2 --> B3 --> B4
    end

    subgraph Week3["🔧 Week 3: 流程改造"]
        C1["项目分析增强"]
        C2["Prompt 优化"]
        C3["匹配算法实现"]
        C4["测试迭代"]
        C1 --> C2 --> C3 --> C4
    end

    Week1 ==> Week2 ==> Week3

    subgraph Storage["💾 存储结构"]
        D1[("灵感库 JSON/DB")]
        D2[("组件模板库")]
    end

    Week1 --> D1
    Week2 --> D2
```

### 灵感库数据结构

```json
{
  "id": "pepe-001",
  "name": "Pepe Official",
  "tags": ["可爱", "卡通", "复古像素"],
  "layout": {
    "hero": "居中大图",
    "feature": "卡片网格"
  },
  "colors": {
    "primary": "#4CAF50",
    "background": "#FFFFFF"
  },
  "screenshot_url": "s3://...",
  "suitable_for": ["动物类", "可爱类", "经典Meme"]
}
```

### 组件清单

| 类型 | 组件名称 | 描述 |
|------|---------|------|
| Hero | `centered-hero` | 居中大图 + 底部文字 |
| Hero | `split-left` | 左文右图 |
| Hero | `split-right` | 右文左图 |
| Hero | `fullscreen-bg` | 全屏背景 + 居中内容 |
| Hero | `diagonal-cut` | 斜切分割式 |
| Feature | `card-grid` | 三列卡片网格 |
| Feature | `bento-grid` | Bento 不规则网格 |
| Feature | `timeline` | 时间线/路线图 |
| Feature | `alternating` | 左右交替图文 |
| CTA | `gradient-cta` | 渐变背景 + 动画按钮 |

---

## 二、用户生成流程（每次执行）

```mermaid
flowchart TB
    subgraph Input["👤 用户输入"]
        U1["项目名称"]
        U2["项目描述"]
        U3["角色图片"]
    end

    subgraph Step1["STEP 1: 项目分析"]
        S1A["AI 分析项目调性"]
        S1B["输出风格标签"]
        S1C["输出配色建议"]
        S1D["输出氛围关键词"]
        S1A --> S1B --> S1C --> S1D
    end

    subgraph Step2["STEP 2: 灵感匹配"]
        S2A[("灵感库\n50-100案例")]
        S2B["关键词/语义匹配"]
        S2C["输出 2-3 个参考案例"]
        S2A --> S2B --> S2C
    end

    subgraph Step3["STEP 3: 组件选择"]
        S3A[("组件库")]
        S3B["根据灵感案例\n选择组件组合"]
        S3C["确定布局结构"]
        S3A --> S3B --> S3C
    end

    subgraph Step4["STEP 4: 🍌 Nanobanana 图片生成"]
        direction TB
        S4A["构建精准 Prompt"]
        S4B["已知: 风格/配色/布局"]
        S4C["🍌 Nanobanana API"]
        S4D["生成 Hero 主图"]
        S4E["生成 Logo"]
        S4F["生成 Feature 图标"]
        S4G["生成 Banner"]
        
        S4A --> S4B --> S4C
        S4C --> S4D
        S4C --> S4E
        S4C --> S4F
        S4C --> S4G
    end

    subgraph Step5["STEP 5: 网站代码生成"]
        S5A["加载组件模板"]
        S5B["填充图片资源"]
        S5C["填充文案内容"]
        S5D["应用配色方案"]
        S5E["输出 HTML/CSS"]
        S5A --> S5B --> S5C --> S5D --> S5E
    end

    subgraph Output["🌐 部署发布"]
        O1["一键部署"]
        O2["绑定用户域名"]
    end

    Input ==> Step1
    Step1 ==> Step2
    Step2 ==> Step3
    Step3 ==> Step4
    Step4 ==> Step5
    Step5 ==> Output

    style Step4 fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 三、Nanobanana 图片生成详解

```mermaid
flowchart LR
    subgraph Context["📋 已知上下文"]
        C1["风格: 赛博朋克"]
        C2["配色: #00ff88"]
        C3["布局: 斜切分割"]
        C4["Hero图位置: 右侧"]
        C5["需要图标: 4个"]
    end

    subgraph Prompt["📝 构建 Prompt"]
        P1["风格描述"]
        P2["构图要求"]
        P3["配色协调"]
        P4["氛围关键词"]
    end

    subgraph Nanobanana["🍌 Nanobanana"]
        N1["图片生成 API"]
    end

    subgraph Results["🖼️ 生成结果"]
        R1["Hero 主图\n竖版/角色朝左"]
        R2["Logo\n风格统一"]
        R3["Feature 图标\n×4"]
        R4["Banner\n社交媒体用"]
    end

    Context --> Prompt
    Prompt --> Nanobanana
    Nanobanana --> Results
```

### 优化后的 Prompt 示例

```
生成赛博朋克风格角色图，
竖版构图，角色位于画面中央偏右，面朝左侧，
背景使用 #0a0a0f 到 #1a1a2e 渐变，
添加霓虹绿(#00ff88)光效，
整体氛围：未来感、数字化、神秘
```

---

## 四、关键改进点

```mermaid
flowchart LR
    subgraph Before["❌ 优化前"]
        B1["凭空生成布局"]
        B2["千篇一律"]
        B3["图片与布局不匹配"]
    end

    subgraph After["✅ 优化后"]
        A1["灵感驱动\n有参考有依据"]
        A2["组件化布局\n多种变体可选"]
        A3["上下文感知图片生成\n图片与布局完美配合"]
    end

    B1 -.->|改进| A1
    B2 -.->|改进| A2
    B3 -.->|改进| A3

    style After fill:#d4edda,stroke:#28a745
    style Before fill:#f8d7da,stroke:#dc3545
```

---

## 五、执行时间表

```mermaid
gantt
    title EZCTO 优化方案执行计划
    dateFormat  YYYY-MM-DD
    section 基础设施
    灵感库建设 (收集案例)     :a1, 2024-01-01, 7d
    组件库扩展 (Hero/Feature) :a2, after a1, 7d
    流程改造 (匹配算法)       :a3, after a2, 7d
    section 迭代优化
    测试与调优               :b1, after a3, 7d
    补充案例与组件           :b2, after b1, 14d
```

---

## 六、技术栈

| 模块 | 技术选型 |
|------|---------|
| 灵感库存储 | JSON / MySQL |
| 组件库 | Aceternity UI + Magic UI + 自定义 |
| 匹配算法 | 关键词匹配 → Embedding 语义匹配 |
| 图片生成 | Nanobanana API |
| 网站生成 | HTML/CSS + Tailwind |
| 部署 | Manus 托管 |
