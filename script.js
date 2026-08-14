// ---------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------
// "Continue building" jumps into the user's own Pascal editor deployment
// (this repo's apps/editor — NOT editor.pascal.app, which is a separate,
// unrelated hosted product) at /step1?data=..., which builds a fresh,
// fully-connected scene from the exact module list the visitor picked
// (or the style's starter preset) and opens it ready to edit. Update
// EDITOR_ORIGIN if the editor's production domain ever changes.
const EDITOR_ORIGIN = 'https://editor-editor-f4ec.vercel.app';

function buildStep1Url(modules, marketCode) {
  const payload = { market: marketCode, modules, furnish: true };
  return `${EDITOR_ORIGIN}/step1?data=${encodeURIComponent(JSON.stringify(payload))}`;
}

// Server-side AI parsing endpoint (apps/editor/app/api/parse-request/route.ts)
// — turns the visitor's free-text room description into a { modules,
// unmapped } module list using the site owner's own DeepSeek key, never
// one collected from the visitor. See handleInstantGenerate() below.
const PARSE_REQUEST_URL = `${EDITOR_ORIGIN}/api/parse-request`;

// n8n "Factory RFQ Broadcast" workflow's webhook (Quote Request Submitted
// node) — fired when a visitor submits the email-capture modal opened from
// a factory card's "Get quote" button (see openCustomModal(factory) /
// handleModalSubmit() below). Left BLANK on purpose: paste in the
// workflow's PRODUCTION webhook URL from n8n once it's ready to go live —
// not the "Test URL" shown while the canvas is open and listening, which
// only fires once and stops working the moment you close that panel. The
// webhook node also needs CORS enabled for this site's origin (n8n's
// webhook node has an "Allowed Origins (CORS)" field — without it the
// browser blocks the request silently). sendFactoryRfq() below no-ops
// whenever this is empty, so leaving it blank never breaks the modal —
// the visitor's email is still captured locally either way.
// / n8n "Factory RFQ Broadcast" 工作流的 webhook 地址（Quote Request
// Submitted 节点）——访客在工厂卡片点"Get quote"打开邮箱收集弹窗并提交时
// 触发（见下面 openCustomModal(factory) / handleModalSubmit()）。故意留空：
// 等这个工作流准备好正式上线，把 n8n 里的 PRODUCTION webhook URL 填进来——
// 不是画布打开、处于监听状态时显示的那个 "Test URL"，那个只能触发一次，
// 关掉面板就失效。webhook 节点还需要给这个网站的域名开 CORS（n8n webhook
// 节点有个 "Allowed Origins (CORS)" 字段——不设置的话浏览器会静默拦截这个
// 请求）。下面 sendFactoryRfq() 在这里留空的情况下什么都不做，所以留空
// 不会导致弹窗坏掉——访客的邮箱依然会正常保存在本地。
const FACTORY_RFQ_WEBHOOK_URL = 'https://sihanchen.app.n8n.cloud/webhook/factory-rfq-broadcast';

// Fires the n8n RFQ broadcast for the factory the visitor requested a
// quote from. Best-effort and silent on failure — same fallback pattern as
// buildPersistentStep1Url() above: this is a bonus real action layered on
// top of the modal, never something the visitor's "Submitted" screen
// should be blocked on or fail because of.
async function sendFactoryRfq(factory, requests) {
  if (!FACTORY_RFQ_WEBHOOK_URL || !factory || !requests) return;
  try {
    await fetch(FACTORY_RFQ_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modules: requests,
        market: selectedMarket || null,
        selectedFactoryIds: [factory.id],
      }),
    });
  } catch {
    // Network error, CORS misconfiguration, workflow not active, etc. —
    // the visitor already sees a successful "Submitted" screen from the
    // local save; this is a secondary real-world side effect, not the
    // thing the UI's success state depends on.
  }
}

// Persistent draft endpoint (apps/editor/app/api/spec-requests/route.ts).
// buildStep1Url() above crams the whole module list into the URL — anyone
// who opens that link re-triggers scene generation and gets their OWN new
// scene, so a customer and a factory "sharing the same link" never
// actually land on the same record. buildPersistentStep1Url() instead
// saves the spec server-side first and returns a short /step1?draftId=<id>
// link that resolves to that one saved record every time. Falls back to
// the old data= link on any failure (network error, non-2xx, or the
// editor's Supabase not being configured yet) so this can never block the
// core "see my generated house" flow.
// / 持久化草稿接口。上面的 buildStep1Url() 是把整段模块列表塞进 URL——
// 谁打开这个链接都会重新触发一次场景生成，各自拿到自己的新场景，"分享
// 同一个链接"实际上双方看到的不是同一份东西。buildPersistentStep1Url()
// 会先把这份 spec 存到服务端，再返回一个短链接 /step1?draftId=<id>，
// 每次打开都指向同一条记录。任何原因失败(网络错误、非 2xx、或者 editor
// 那边 Supabase 还没配置好)都会退回旧的 data= 链接，保证核心的"看到生成
// 的房子"流程不会被这一步卡住。
async function buildPersistentStep1Url(modules, marketCode, furnish = true) {
  const fallback = buildStep1Url(modules, marketCode);
  try {
    const res = await fetch(`${EDITOR_ORIGIN}/api/spec-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market: marketCode || null, modules, furnish }),
    });
    if (!res.ok) return fallback;
    const saved = await res.json();
    if (!saved || typeof saved.id !== 'string') return fallback;
    return `${EDITOR_ORIGIN}/step1?draftId=${encodeURIComponent(saved.id)}`;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------
// Module catalog — mirrors apps/editor/lib/prefab/catalog.ts
// ---------------------------------------------------------------------
const MODULE_CATALOG = [
  { id: 'bedroom-std', control: 'stepper', max: 6, i18nKey: 'bedroomStd', sub: '6m x 3m' },
  { id: 'bedroom-master', control: 'stepper', max: 2, i18nKey: 'bedroomMaster', sub: '6m x 3.6m' },
  { id: 'bathroom-std', control: 'stepper', max: 6, i18nKey: 'bathroomStd', sub: '2.5m x 2m' },
  { id: 'kitchen-open', control: 'toggle', i18nKey: 'kitchenOpen', sub: '4m x 3m' },
  { id: 'living-room', control: 'toggle', i18nKey: 'livingRoom', sub: '6m x 4m' },
  { id: 'porch-covered', control: 'toggle', i18nKey: 'porchCovered', sub: '3m x 1.5m' },
  { id: 'storage-loft', control: 'toggle', i18nKey: 'storageLoft', sub: 'Pitched roof only' },
];
const MAX_MODULES = 6;

// ---------------------------------------------------------------------
// Budget slider — 3 fixed price-per-m² tiers, applied to whatever
// footprint the visitor's current module picks add up to (see
// moduleAreaSqm/totalSelectedAreaSqm/updateBudgetEstimate below). Rates
// come from an Alibaba light-steel-villa market-price sanity check done
// for this project (basic prefab ~$150/m², mid ~$220/m², higher-end
// light-steel with a 10-year structural warranty ~$280/m²) — an estimate,
// not a quote from any specific factory.
// ---------------------------------------------------------------------
const BUDGET_TIERS = [
  { ratePerSqm: 150, i18nKey: 'budgetLow' },
  { ratePerSqm: 220, i18nKey: 'budgetMid' },
  { ratePerSqm: 280, i18nKey: 'budgetHigh' },
];
let budgetTierIndex = 1; // default to the middle (Standard) tier

// ---------------------------------------------------------------------
// Markets — extend this list freely, the grid is fully data-driven
// ---------------------------------------------------------------------
const MARKETS = [
  { code: 'us', flag: '🇺🇸', zh: '美国', en: 'United States', styleId: 'modern-open' },
  { code: 'ca', flag: '🇨🇦', zh: '加拿大', en: 'Canada', styleId: 'modern-open' },
  { code: 'sg', flag: '🇸🇬', zh: '新加坡', en: 'Singapore', styleId: 'tropical' },
  { code: 'my', flag: '🇲🇾', zh: '马来西亚', en: 'Malaysia', styleId: 'tropical' },
  { code: 'th', flag: '🇹🇭', zh: '泰国', en: 'Thailand', styleId: 'tropical' },
  { code: 'br', flag: '🇧🇷', zh: '巴西', en: 'Brazil', styleId: 'tropical' },
  { code: 'mx', flag: '🇲🇽', zh: '墨西哥', en: 'Mexico', styleId: 'tropical' },
  { code: 'au', flag: '🇦🇺', zh: '澳大利亚', en: 'Australia', styleId: 'tropical' },
  { code: 'jp', flag: '🇯🇵', zh: '日本', en: 'Japan', styleId: 'japanese' },
];

// Each style below carries a `showcaseUrl` pointing at one of the three
// hand-authored replica houses in the editor repo
// (apps/editor/lib/prefab/replica-apartment-{1,2,3}.ts), reached via
// /step1?replica=<id> rather than the dynamic /step1?data=... flow that
// buildStep1Url() produces from a visitor's own module picks. handleSubmit()
// below prefers this fixed URL when present, so "Continue building" for
// these three styles always opens that style's dedicated house instead of
// a freshly assembled one from the Quick Start selection.
const STYLES = [
  {
    id: 'modern-open',
    zh: '现代开放简约', en: 'Modern Open Minimalist',
    desc: { zh: '开放式厨房+客厅是核心，暖白墙面配浅木色', en: 'Open kitchen-to-living core, warm white walls with light wood tones' },
    photo: 'images/style-modern-open.jpg',
    showcaseUrl: `${EDITOR_ORIGIN}/step1?replica=apartment-3`,
    starter: { modules: [{ id: 'bedroom-master', qty: 1 }, { id: 'bathroom-std', qty: 1 }, { id: 'kitchen-open', qty: 1 }, { id: 'living-room', qty: 1 }],
      note: { zh: '开放式厨房+客厅是当地主流，主卧套间是近两年的热门升级', en: 'Open kitchen-to-living is the norm; a primary suite is a top 2026 upgrade' } },
  },
  {
    id: 'tropical',
    zh: '热带度假风', en: 'Tropical Resort',
    desc: { zh: '室内外连通，门廊是第二客厅，藤编+浅木质感', en: 'Indoor-outdoor connection, porch as a second living space, rattan and light wood' },
    photo: 'images/style-tropical.jpg',
    showcaseUrl: `${EDITOR_ORIGIN}/step1?replica=apartment-2`,
    starter: { modules: [{ id: 'bedroom-std', qty: 1 }, { id: 'bathroom-std', qty: 1 }, { id: 'kitchen-open', qty: 1 }, { id: 'porch-covered', qty: 1 }],
      note: { zh: '热带气候，紧凑户型+带顶门廊是常见配置', en: 'Tropical climate — compact layout plus a covered porch is typical' } },
  },
  {
    id: 'japanese',
    zh: '日式精工极简', en: 'Japanese Precision Minimalist',
    desc: { zh: '高定制、低饱和度木色，收纳优先于外露家具', en: 'Highly customized, muted wood tones, built-in storage over exposed furniture' },
    photo: 'images/style-japanese.png',
    showcaseUrl: `${EDITOR_ORIGIN}/step1?replica=apartment-1`,
    starter: { modules: [{ id: 'bedroom-std', qty: 1 }, { id: 'bathroom-std', qty: 1 }, { id: 'kitchen-open', qty: 1 }, { id: 'storage-loft', qty: 1 }],
      note: { zh: '当地预制房走精致、高定制路线，紧凑+高效收纳是特色', en: 'Japanese prefab leans premium and highly customized — compact and storage-efficient' } },
  },
];

let expandedStyles = new Set([STYLES[0].id]);

// ---------------------------------------------------------------------
// Factory capability profiles — powers "Compare across factories" below.
//
// IMPORTANT — read before trusting these numbers: these are declared
// capability profiles for this demo, NOT live quotes from connected
// factory accounts. There is no factory-side login/response system built
// yet — a real "broadcast this spec, get real responses back" flow needs
// factories to have accounts and actually submit numbers. Until that
// exists, this is a same-integrity stand-in as BUDGET_TIERS above (a
// sanity-checked estimate, not a specific quote) — extended across
// several named profiles instead of one blended rate, so a visitor can
// see *why* one factory fits and another doesn't, without opening four
// separate private chats to find out. The UI labels this explicitly
// (factoryCompareDisclaimer i18n key) so it's never mistaken for a real
// quote.
// / 工厂能力画像——"多工厂比价"功能的数据来源。
//
// 重要提示：这些是本演示声明的能力画像，不是已接入工厂账号发回的实时报价。
// 目前还没有工厂端登录/响应系统——真正的"广播这份 spec、收到真实回复"需要
// 工厂方有账号并且真的提交数字。在这个系统建成之前，这份数据和上面的
// BUDGET_TIERS 是同一套诚实标准（合理性估算，不是具体报价）——只是从一个
// 混合费率拆成了几个具名画像，让访客能看出"为什么这家合适、那家不合适"，
// 不用真的打开四个私聊窗口一个个问。UI 上会明确标注这一点
// （factoryCompareDisclaimer 这个 i18n key），不会被误认成真实报价。
// ---------------------------------------------------------------------
const FACTORIES = [
  {
    id: 'fj-modular',
    name: 'Fujian Modular Works',
    region: { zh: '中国·福建', en: 'Fujian, China' },
    rateMultiplier: 1.0,
    leadTimeDays: [30, 40],
    maxModules: 6,
    unsupportedModuleIds: [],
    certs: ['ISO 9001', 'CE'],
    note: {
      zh: '现代/日式产线经验最多，交期最稳定',
      en: 'Most experience on modern/Japanese-style lines — most predictable lead time',
    },
  },
  {
    id: 'gd-coastal',
    name: 'Guangdong Coastal Fab',
    region: { zh: '中国·广东', en: 'Guangdong, China' },
    rateMultiplier: 0.92,
    leadTimeDays: [35, 50],
    maxModules: 6,
    unsupportedModuleIds: ['storage-loft'],
    certs: ['ISO 9001', 'CE'],
    note: {
      zh: '热带风格线报价最低，但不支持阁楼储物（斜屋顶）模块',
      en: 'Lowest rate on tropical-style lines, but no pitched-roof loft-storage support',
    },
  },
  {
    id: 'js-precision',
    name: 'Jiangsu Precision Build',
    region: { zh: '中国·江苏', en: 'Jiangsu, China' },
    rateMultiplier: 1.15,
    leadTimeDays: [40, 55],
    maxModules: 4,
    unsupportedModuleIds: [],
    certs: ['ISO 9001', 'CE', 'IAS AC-ES (in progress)'],
    note: {
      zh: '单价最高，但认证进度走在最前面；单批次上限只有 4 个模块',
      en: 'Highest rate, but furthest along on certification; caps at 4 modules per batch',
    },
  },
  {
    id: 'zj-rapid',
    name: 'Zhejiang Rapid Assembly',
    region: { zh: '中国·浙江', en: 'Zhejiang, China' },
    rateMultiplier: 1.05,
    leadTimeDays: [22, 32],
    maxModules: 6,
    unsupportedModuleIds: [],
    certs: ['ISO 9001'],
    note: {
      zh: '交期最快，但目前还没有 CE 认证',
      en: 'Fastest lead time, but no CE marking yet',
    },
  },
];

// ---------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------
const I18N = {
  zh: {
    brandName: '定制预制房',
    eyebrow: '供应链能力演示',
    heroTitleMain: '规格一变，马上出新结果。',
    heroTitleSub: '几秒内自动对照真实工厂参数重新校验——不用再走一轮邮件。',
    heroCta: '立即试用 ↓',
    heroVisualCaption: '这是引擎生成的真实结果，不是效果图',
    positioningLabel: '正在推进认证的目标市场',
    positioningHint: '认证路线图',
    navDemo: '在线演示',
    navHowItFits: '使用场景',
    navSpecSheet: '规格表',
    navExamples: '示例',
    navMarkets: '目标市场',
    diffKicker: '为什么不一样',
    diff1Title: '自然语言需求解析',
    diff1Body: '用大白话描述你的需求，不用手动填表。',
    diff2Title: '紧凑空间排布引擎',
    diff2Body: '按"货架/行"分层排布，不是简单的单行模块拼接。',
    diff3Title: '每次改动都重新校验',
    diff3Body: '不是一次性的规格检查——每次编辑都会重新对照真实模块参数校验一遍。',
    demoTitle: '生成并重新校验一个户型',
    demoKicker: '在线演示',
    demoFraming: '每次需求变化时都可以用这个——不只是用一次。',
    demoDividerOr: '或者',
    marketHintLink: '选择目标市场 ↓',
    processTitle: '这个工具在你的流程里什么时候用',
    processKicker: '使用场景',
    processStep1: '规格变化',
    processStep2: '几秒内重新生成',
    processStep3: '对照工厂产能校验',
    processStep4: '做决定',
    specTitle: '工厂规格表',
    specKicker: '规格表',
    specTabDimensions: '尺寸',
    specTabCertification: '认证',
    specTabProduction: '生产',
    specDim1: '结构类型：轻钢龙骨模块化结构（部分产线可选钢混组合）',
    specDim2: '标准模块尺寸：长度 6m / 9m / 12m 可选，宽 3.6m（约 12 英尺，符合美国标准公路运输尺寸，无需特殊许可），净高 3.0m',
    specDim3: '堆叠：标准为单层；部分产线支持两层堆叠（需现场结构验证）',
    specVerifiedDim: '最近核实时间：2026-08-05',
    specCert1: '现有认证：ISO 9001（质量管理体系）、CE 认证（欧盟）',
    specCert2: '暂未覆盖：HUD Code 认证；无美国各州模块化标识（如 IAS AC-ES / ICC-ES）；抗震设计目前依据中国 GB 50011 标准，尚未与美国 ASCE 7（风载/抗震标准）交叉验证',
    specCert3: '出口记录：已有面向欧洲和东南亚的酒店/宿舍/养老项目交付；尚无北美住宅交付记录',
    specVerifiedCert: '最近核实时间：2026-08-05',
    specProd1: '标准批次交期：30–45 天，视订单量而定',
    specVerifiedProd: '最近核实时间：2026-08-05',
    examplesLabel: '示例输出',
    examplesHint: '由本引擎生成',
    featuredDiffLabel: '同一户型，改动一个参数',
    featuredBeforeTag: '改动前',
    featuredBeforeSpec: '1 间卧室 · 开放式厨房 · 客厅 · 卫浴',
    featuredAfterTag: '改动后 —— 卧室数量 1 → 2',
    featuredAfterSpec: '2 间卧室 · 开放式厨房 · 客厅 · 卫浴',
    featuredViewLink: '查看结果 →',
    featuredDiffNote: '规格表里只改了一个字段——户型、占地面积和工厂参数校验都自动重新跑了一遍。',
    examplesRunsLabel: '本次会话生成的记录',
    ctaKicker: '联系我们',
    ctaTitle: '聊聊怎么把这个工具接入你们的流程',
    ctaBody: '如果你们的规格表每周都在变，这个工具应该是你们评估制造合作方流程的一部分。',
    ctaButton: '开始对话',
    customRequestLabel: '🎨 或，描述你的需求',
    customRequestHint: 'AI 辅助定制设计',
    customRequestPlaceholder: '例如：想要一个连着餐厅的开放式厨房，再加一个小书房',
    customRequestBtn: '提交定制需求',
    customRequestSubHint: '我们会把定制方案发到你邮箱，通常在 48 小时内',
    customRequestNeedsText: '请先写一下你的需求',
    instantGenerateBtn: '⚡ AI 立即生成',
    instantGenerateBtnLoading: '生成中…',
    instantGenerateError: '生成失败，请稍后重试，或改用下方的人工定制申请',
    instantGenerateRateLimited: '请求太频繁了，请稍等一分钟再试',
    instantGenerateEmpty: 'AI 没能从描述里识别出房间，试着写得更具体些（比如"两间卧室、一个开放式厨房、一个卫生间"）',
    modalTitle: '还差一步',
    modalHint: '后续用哪个邮箱联系你？',
    modalEmailPlaceholder: 'you@email.com',
    modalAgree: '我同意被联系以跟进这次需求',
    modalSubmit: '提交需求',
    modalEmailError: '请填写一个有效的邮箱地址',
    modalAgreeError: '请先勾选同意',
    modalSuccessTitle: '提交成功',
    modalSuccessBody: '提交成功，我们会在 48 小时内发给你定制方案',
    modalDone: '好的',
    designSavedTitle: '设计已保存',
    designSavedBody: '你的设计图已经下载完成。要联系工厂了解生产吗？',
    contactFactoryBtn: '联系工厂',
    quickStartLabel: '⚡ 快速开始',
    quickStartHint: '勾选你需要的房间，最多 6 个模块，几秒钟出效果',
    recommendTitle: '本地区推荐配置',
    recommendApply: '一键套用',
    recommendViewBtn: '查看详情',
    modulesLabel: '个模块',
    generateBtn: '生成方案',
    resultLabel: '生成结果',
    copyBtn: '复制 JSON',
    resultSummaryAreaLabel: '总占地面积',
    resultSummaryEstimateLabel: '预估造价',
    viewRawJsonBtn: '查看原始数据 (JSON) ▾',
    hideRawJsonBtn: '收起原始数据 ▴',
    continueBtn: '继续搭建 →',
    footerNote: '生成结果仅供方案预览，具体尺寸以工厂确认为准。',
    recommended: '推荐',
    noProjects: '还没有项目 — 上面生成一个试试',
    selectMarketFirst: '请先选择所在地',
    overLimit: '超过 6 个模块，需要人工评估',
    autoAddedNote: '含 {n} 个系统自动添加的必需连接模块',
    deleteProject: '删除项目',
    confirmDelete: '确定要删除这个项目吗？',
    bedroomStd: '标准卧室',
    bedroomMaster: '主卧',
    bathroomStd: '卫浴',
    kitchenOpen: '开放式厨房',
    livingRoom: '客厅',
    porchCovered: '门廊',
    storageLoft: '阁楼储物',
    budgetLabel: '预算档位',
    budgetLow: '经济款',
    budgetMid: '标准款',
    budgetHigh: '高定款',
    budgetHint: '勾选房间后查看预估预算',
    factoryCompareBtn: '📋 多工厂比价',
    factoryCompareTitle: '同一份规格，对照多个工厂',
    factoryCompareDisclaimer: '这是本演示声明的能力画像，不是已接入工厂账号发回的实时报价。',
    factoryFeasible: '可生产',
    factoryNotFeasible: '暂不可行',
    factoryReasonOverCapacity: '超过该厂单批次 {max} 个模块的上限',
    factoryReasonUnsupported: '不支持：{modules}',
    factoryDays: '天',
    factoryCertsLabel: '认证',
    factoryQuoteBtn: '获取报价',
    modalFactoryContext: '正在为「{factory}」申请报价 —— 我们会人工跟进，帮你对接这家工厂的产能与价格，暂时还不是自动发送给工厂的实时报价。',
  },
  en: {
    brandName: 'Custom Prefab House',
    eyebrow: 'SUPPLY-CHAIN CAPABILITY DEMO',
    heroTitleMain: 'Every spec change, rendered instantly.',
    heroTitleSub: 'Checked against real factory constraints in seconds — not a new round of emails.',
    heroCta: 'Try it live ↓',
    heroVisualCaption: 'Generated by this engine — not a mockup',
    positioningLabel: "Markets we're evaluating for certification",
    positioningHint: 'CERTIFICATION ROADMAP',
    navDemo: 'Live demo',
    navHowItFits: 'How it fits',
    navSpecSheet: 'Spec sheet',
    navExamples: 'Examples',
    navMarkets: 'Markets',
    diffKicker: 'WHY THIS IS DIFFERENT',
    diff1Title: 'Natural-language requirement parsing',
    diff1Body: 'Describe what you need in plain language — no manual form-filling required.',
    diff2Title: 'Compact spatial-packing engine',
    diff2Body: 'Shelf/row-based layout generation — not a naive single-row module strip.',
    diff3Title: 'Re-verified on every change',
    diff3Body: 'Not a one-time spec check — every edit is re-checked against real module parameters.',
    demoTitle: 'Generate and re-check a layout',
    demoKicker: 'LIVE DEMO',
    demoFraming: 'Use this whenever a requirement shifts — not just once.',
    demoDividerOr: 'or',
    marketHintLink: 'Select target market ↓',
    processTitle: 'How this fits into your process',
    processKicker: 'WHERE THIS FITS',
    processStep1: 'Spec changes',
    processStep2: 'Re-generate in seconds',
    processStep3: 'Check against factory capacity',
    processStep4: 'Decide',
    specTitle: 'Factory spec sheet',
    specKicker: 'SPEC SHEET',
    specTabDimensions: 'Dimensions',
    specTabCertification: 'Certification',
    specTabProduction: 'Production',
    specDim1: 'Structure type: light-gauge steel frame modular (steel-concrete composite optional on select lines)',
    specDim2: 'Standard module sizes: 6m / 9m / 12m length options, 3.6m width (~12ft, fits standard US road transport without special permit), 3.0m clear height',
    specDim3: 'Stacking: single-story standard; select lines support two-story stacking (pending on-site structural verification)',
    specVerifiedDim: 'Last verified: 2026-08-05',
    specCert1: 'Current: ISO 9001 (quality management), CE marking (EU)',
    specCert2: 'Not yet covered: HUD Code certification; no US state modular insignia (e.g. IAS AC-ES / ICC-ES); seismic design currently per Chinese GB 50011, not yet cross-validated against ASCE 7 (US wind/seismic load standards)',
    specCert3: 'Export track record: hospitality/dormitory/senior-living projects to Europe and Southeast Asia; no North American residential delivery record yet',
    specVerifiedCert: 'Last verified: 2026-08-05',
    specProd1: 'Standard batch lead time: 30–45 days depending on order volume',
    specVerifiedProd: 'Last verified: 2026-08-05',
    examplesLabel: 'Example outputs',
    examplesHint: 'GENERATED BY THIS ENGINE',
    featuredDiffLabel: 'Same layout, one spec change',
    featuredBeforeTag: 'BEFORE',
    featuredBeforeSpec: '1 bedroom · open kitchen · living room · bathroom',
    featuredAfterTag: 'AFTER — bedroom count 1 → 2',
    featuredAfterSpec: '2 bedrooms · open kitchen · living room · bathroom',
    featuredViewLink: 'Open result →',
    featuredDiffNote: 'One field changed in the spec — the layout, footprint, and factory-constraint check all re-ran automatically.',
    examplesRunsLabel: 'Runs from this session',
    ctaKicker: "LET'S TALK",
    ctaTitle: 'Talk about integrating this into your workflow',
    ctaBody: 'If your spec sheet changes weekly, this should be part of how you evaluate manufacturing partners.',
    ctaButton: 'Start the conversation',
    customRequestLabel: '🎨 Or, describe what you need',
    customRequestHint: 'CUSTOM AI-ASSISTED DESIGN',
    customRequestPlaceholder: 'e.g. an open kitchen connected to the dining room, plus a small home office',
    customRequestBtn: 'Request custom design',
    customRequestSubHint: "We'll email you a bespoke design — usually within 48 hours",
    customRequestNeedsText: 'Tell us a bit about what you need first',
    instantGenerateBtn: '⚡ Generate now (AI)',
    instantGenerateBtnLoading: 'Generating…',
    instantGenerateError: 'Generation failed — please try again shortly, or use the manual request below',
    instantGenerateRateLimited: "That's too many requests — please wait a minute and try again",
    instantGenerateEmpty: "AI couldn't identify any rooms in that description — try being more specific (e.g. \"two bedrooms, an open kitchen, one bathroom\")",
    modalTitle: 'One more thing',
    modalHint: 'Where should we follow up?',
    modalEmailPlaceholder: 'you@email.com',
    modalAgree: 'I agree to be contacted about this request',
    modalSubmit: 'Submit request',
    modalEmailError: 'Please enter a valid email address',
    modalAgreeError: 'Please check the agreement box first',
    modalSuccessTitle: 'Submitted',
    modalSuccessBody: "Submitted — we'll email you a custom design within 48 hours.",
    modalDone: 'Done',
    designSavedTitle: 'Design saved',
    designSavedBody: 'Your design image has been downloaded. Ready to talk to a factory?',
    contactFactoryBtn: 'Contact factory',
    quickStartLabel: '⚡ Quick start',
    quickStartHint: 'Check the rooms you need — up to 6 modules, results in seconds',
    recommendTitle: 'Recommended for this market',
    recommendApply: 'Use this',
    recommendViewBtn: 'View details',
    modulesLabel: 'modules',
    generateBtn: 'Generate',
    resultLabel: 'Result',
    copyBtn: 'Copy JSON',
    resultSummaryAreaLabel: 'Total footprint',
    resultSummaryEstimateLabel: 'Estimated cost',
    viewRawJsonBtn: 'View raw data (JSON) ▾',
    hideRawJsonBtn: 'Hide raw data ▴',
    continueBtn: 'Continue building →',
    footerNote: 'Generated results are a preview only — final dimensions pending factory confirmation.',
    recommended: 'Recommended',
    noProjects: 'No projects yet — generate one above',
    selectMarketFirst: 'Pick a location first',
    overLimit: 'Over the 6-module limit — needs engineer review',
    autoAddedNote: 'includes {n} auto-added connector module(s)',
    deleteProject: 'Delete project',
    confirmDelete: 'Delete this project?',
    bedroomStd: 'Standard bedroom',
    bedroomMaster: 'Master bedroom',
    bathroomStd: 'Bathroom',
    kitchenOpen: 'Open kitchen',
    livingRoom: 'Living room',
    porchCovered: 'Covered porch',
    storageLoft: 'Loft storage',
    budgetLabel: 'Budget level',
    budgetLow: 'Basic',
    budgetMid: 'Standard',
    budgetHigh: 'Premium',
    budgetHint: 'Pick some rooms to see an estimate',
    factoryCompareBtn: '📋 Compare across factories',
    factoryCompareTitle: 'Same spec, multiple factories',
    factoryCompareDisclaimer: 'Illustrative capability profiles for this demo — not live quotes from connected factory accounts yet.',
    factoryFeasible: 'Feasible',
    factoryNotFeasible: 'Not feasible',
    factoryReasonOverCapacity: 'Over this factory’s {max}-module-per-batch limit',
    factoryReasonUnsupported: 'Not supported: {modules}',
    factoryDays: 'days',
    factoryCertsLabel: 'Certs',
    factoryQuoteBtn: 'Get quote',
    modalFactoryContext: "Requesting a quote from {factory} — we'll follow up manually to connect you with their capacity and pricing. This isn't an automated live quote sent to the factory yet.",
  },
};

let currentLang = 'zh';
let selectedMarket = null;
// Set by openCustomModal(factory) when the email-capture modal is opened
// from a factory card's "Get quote" button, so handleModalSubmit() can tag
// which factory the visitor asked about. null for every other entry point
// into this same modal (closing CTA, post-save contact button).
let quoteFactoryContext = null;
// The most recently generated, valid module list — set at the end of
// handleSubmit() below. sendFactoryRfq() needs this: by the time a visitor
// clicks "Get quote" on a factory card, Generate has already run, but
// nothing else keeps that spec around at module scope for the RFQ payload.
let lastGeneratedRequests = null;
const moduleState = {}; // moduleId -> quantity (0 or 1 for toggles)
MODULE_CATALOG.forEach((m) => { moduleState[m.id] = 0; });

function t(key) {
  return I18N[currentLang][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  renderMarkets();
  renderModuleForm();
  renderProjects();
  updateSelectedMarketLabel();
  updateRecommendCard();
  updateBudgetEstimate();
}

// ---------------------------------------------------------------------
// Markets grid
// ---------------------------------------------------------------------
function renderMarkets() {
  const grid = document.getElementById('marketGrid');
  grid.innerHTML = '';
  STYLES.forEach((style) => {
    const marketsInStyle = MARKETS.filter((m) => m.styleId === style.id);
    const isOpen = expandedStyles.has(style.id);

    const group = document.createElement('div');
    group.className = 'style-group' + (isOpen ? ' open' : '');

    const header = document.createElement('div');
    header.className = 'style-header';
    header.innerHTML = `
      <button type="button" class="style-toggle">
        <span class="style-chevron">▸</span>
        <span class="style-text">
          <span class="style-title">${currentLang === 'zh' ? style.zh : style.en}</span>
          <span class="style-desc">${style.desc[currentLang]}</span>
        </span>
      </button>
      <button type="button" class="style-recommend-btn">${t('recommendApply')}</button>
    `;
    header.querySelector('.style-toggle').addEventListener('click', () => {
      if (expandedStyles.has(style.id)) expandedStyles.delete(style.id);
      else expandedStyles.add(style.id);
      renderMarkets();
    });
    header.querySelector('.style-recommend-btn').addEventListener('click', () => {
      selectedMarket = marketsInStyle[0].code;
      expandedStyles.add(style.id);
      renderMarkets();
      updateSelectedMarketLabel();
      // updateRecommendCard() resets the photo slot before applyRecommendation()
      // fills it back in — order matters here. Reversing these two calls silently
      // drops the recommended-style photo (it briefly gets set, then wiped).
      updateRecommendCard();
      applyRecommendation();
      document.getElementById('quickStart').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    group.appendChild(header);

    const body = document.createElement('div');
    body.className = 'style-body';
    marketsInStyle.forEach((market) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'market-card' + (selectedMarket === market.code ? ' selected' : '');
      card.innerHTML = `
        <span class="market-flag">${market.flag}</span>
        <span class="market-name-zh">${currentLang === 'zh' ? market.zh : market.en}</span>
      `;
      card.addEventListener('click', () => {
        selectedMarket = market.code;
        renderMarkets();
        updateSelectedMarketLabel();
        updateRecommendCard();
        document.getElementById('quickStart').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      body.appendChild(card);
    });
    group.appendChild(body);

    grid.appendChild(group);
  });
}

function updateSelectedMarketLabel() {
  const label = document.getElementById('selectedMarketLabel');
  if (!selectedMarket) { label.textContent = ''; return; }
  const market = MARKETS.find((m) => m.code === selectedMarket);
  label.textContent = (currentLang === 'zh' ? market.zh : market.en);
}

function updateRecommendCard() {
  const card = document.getElementById('recommendCard');
  const market = MARKETS.find((m) => m.code === selectedMarket);
  const style = market && STYLES.find((s) => s.id === market.styleId);
  if (!style) { card.hidden = true; return; }
  document.getElementById('recommendNote').textContent = style.starter.note[currentLang];
  card.hidden = false;
  // Photo + view button only appear once "Use this" is actually clicked,
  // not just on market selection.
  document.getElementById('recommendPhotoWrap').hidden = true;
  document.getElementById('recommendPhoto').removeAttribute('src');
}

// Called after "Use this" is clicked (both the accordion header's quick
// button and the recommend-card's own button) — applies the module preset
// and reveals that style's interior photo below the card.
function applyRecommendation() {
  const market = MARKETS.find((m) => m.code === selectedMarket);
  const style = market && STYLES.find((s) => s.id === market.styleId);
  if (!style) return;
  MODULE_CATALOG.forEach((m) => { moduleState[m.id] = 0; });
  style.starter.modules.forEach(({ id, qty }) => { moduleState[id] = qty; });
  // Recommended presets always default to the Standard (middle) budget
  // tier — a visitor can still drag the slider afterward.
  budgetTierIndex = 1;
  const budgetSlider = document.getElementById('budgetSlider');
  if (budgetSlider) budgetSlider.value = 1;
  renderModuleForm();

  if (style.photo) {
    document.getElementById('recommendPhoto').src = style.photo;
    document.getElementById('recommendPhoto').alt = currentLang === 'zh' ? style.zh : style.en;
    document.getElementById('recommendPhotoWrap').hidden = false;
  }
}

// ---------------------------------------------------------------------
// Module form
// ---------------------------------------------------------------------
function totalModuleCount() {
  return Object.values(moduleState).reduce((sum, v) => sum + v, 0);
}

function updateCounter() {
  // Show the count that actually gets validated (finalTotal), not just the
  // visitor's manual picks (rawTotal) — buildModuleRequest() silently adds
  // a utility-mechanical module always, plus a hallway-connector whenever
  // both a bathroom and an open kitchen are picked. Those used to be
  // invisible here, so a visitor could see "6/6" and still get an
  // over-limit rejection because the real total (with auto-adds) was 8.
  // Showing finalTotal + a note keeps this number in sync with the one
  // referenced by the over-limit message down in the result panel.
  // / 这里显示的是真正参与校验的总数(finalTotal),而不是只统计手动勾选
  // 的数量(rawTotal)——buildModuleRequest() 会自动加一个"公用管线"模块,
  // 如果同时选了卫浴和开放式厨房还会再加一个"走廊连接"模块,这两个之前
  // 在这里是看不见的,导致有人明明看到"6/6"却仍然收到超限提示(因为算上
  // 自动添加的两个,实际是 8)。现在显示 finalTotal 并附一行说明,能和
  // 下方结果区的超限提示对上号。
  const { rawTotal, finalTotal } = buildModuleRequest();
  const counterEl = document.getElementById('moduleCount');
  counterEl.textContent = finalTotal;
  document.querySelector('.module-counter').classList.toggle('over', finalTotal > MAX_MODULES);

  const autoAdded = finalTotal - rawTotal;
  const noteEl = document.getElementById('counterAutoNote');
  if (noteEl) {
    if (autoAdded > 0) {
      noteEl.textContent = `(${t('autoAddedNote').replace('{n}', autoAdded)})`;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }
  }
  updateBudgetEstimate();
}

// ---------------------------------------------------------------------
// Budget estimate — live off whatever's currently checked/stepped in the
// Quick Start form, times the selected tier's rate. Re-run on every
// module change (via updateCounter above) and every slider move.
// ---------------------------------------------------------------------
function moduleAreaSqm(sub) {
  // MODULE_CATALOG's `sub` field is a dimension label like "6m x 3m" for
  // most modules; storage-loft's is "Pitched roof only" (no footprint of
  // its own — it rides on the roof, not counted as separate floor area).
  const match = /(\d+(?:\.\d+)?)\s*m\s*x\s*(\d+(?:\.\d+)?)\s*m/i.exec(sub);
  if (!match) return 0;
  return Number(match[1]) * Number(match[2]);
}

function totalSelectedAreaSqm() {
  return MODULE_CATALOG.reduce((sum, m) => sum + moduleAreaSqm(m.sub) * (moduleState[m.id] || 0), 0);
}

function updateBudgetEstimate() {
  const slider = document.getElementById('budgetSlider');
  if (!slider) return; // guard — this fn can fire before Init wiring runs

  const tier = BUDGET_TIERS[budgetTierIndex];
  const areaSqm = totalSelectedAreaSqm();
  const estimateEl = document.getElementById('budgetEstimate');
  if (areaSqm > 0) {
    const estimate = Math.round(areaSqm * tier.ratePerSqm);
    estimateEl.textContent = `$${estimate.toLocaleString('en-US')} · ${areaSqm}m²`;
  } else {
    estimateEl.textContent = t('budgetHint');
  }

  document.querySelectorAll('.budget-tick').forEach((tick) => {
    tick.classList.toggle('active', Number(tick.getAttribute('data-tier')) === budgetTierIndex);
  });

  // Fill the track up to the thumb (0 / 50 / 100%) — a plain range input
  // has no built-in "filled" segment, so this is done with an inline
  // gradient recomputed on every change.
  const fillPct = (budgetTierIndex / (BUDGET_TIERS.length - 1)) * 100;
  slider.style.background = `linear-gradient(to right, var(--emerald) 0%, var(--emerald) ${fillPct}%, var(--glass-bg-strong) ${fillPct}%, var(--glass-bg-strong) 100%)`;
}

function renderModuleForm() {
  const form = document.getElementById('moduleForm');
  form.innerHTML = '';
  MODULE_CATALOG.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'module-row';
    const labelHtml = `<div><span class="module-row-label">${t(m.i18nKey)}</span><span class="module-row-sub">${m.sub}</span></div>`;

    if (m.control === 'stepper') {
      row.innerHTML = `
        ${labelHtml}
        <div class="stepper">
          <button type="button" data-action="dec" data-id="${m.id}">-</button>
          <span class="stepper-value" id="value-${m.id}">${moduleState[m.id]}</span>
          <button type="button" data-action="inc" data-id="${m.id}">+</button>
        </div>`;
    } else {
      row.innerHTML = `
        ${labelHtml}
        <button type="button" class="toggle${moduleState[m.id] ? ' on' : ''}" id="toggle-${m.id}" data-id="${m.id}"></button>`;
    }
    form.appendChild(row);
  });

  form.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const spec = MODULE_CATALOG.find((m) => m.id === id);
      const delta = btn.getAttribute('data-action') === 'inc' ? 1 : -1;
      moduleState[id] = Math.max(0, Math.min(spec.max, moduleState[id] + delta));
      document.getElementById(`value-${id}`).textContent = moduleState[id];
      updateCounter();
    });
  });
  form.querySelectorAll('.toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      moduleState[id] = moduleState[id] ? 0 : 1;
      btn.classList.toggle('on', !!moduleState[id]);
      updateCounter();
    });
  });

  updateCounter();
}

// ---------------------------------------------------------------------
// Assembly check — mirrors lib/prefab/assembly.ts's limit + adjacency
// ---------------------------------------------------------------------
function buildModuleRequest() {
  const requests = [];
  MODULE_CATALOG.forEach((m) => {
    if (moduleState[m.id] > 0) requests.push({ moduleId: m.id, quantity: moduleState[m.id] });
  });
  const total = requests.reduce((sum, r) => sum + r.quantity, 0);

  // Auto-add rules, same as the Stage 1 -> Stage 2 conversion guide.
  const hasBath = moduleState['bathroom-std'] > 0;
  const hasKitchen = moduleState['kitchen-open'] > 0;
  if (hasBath && hasKitchen) {
    requests.push({ moduleId: 'hallway-connector', quantity: 1 });
  }
  requests.push({ moduleId: 'utility-mechanical', quantity: 1 });

  const finalTotal = requests.reduce((sum, r) => sum + r.quantity, 0);
  return { requests, valid: finalTotal <= MAX_MODULES, rawTotal: total, finalTotal };
}

// ---------------------------------------------------------------------
// Compare across factories — checks the SAME generated spec against every
// profile in FACTORIES at once (capacity limit, unsupported modules, and
// a price/lead-time estimate off that factory's own rate), instead of the
// visitor manually re-explaining the same requirement in N separate
// private chats. This is the direct answer to "why keep using the site
// instead of just moving to chat once you've generated a result" — a
// private 1:1 thread can't run this comparison, because it isn't a
// computation, it's a side-by-side across profiles the visitor doesn't
// individually maintain a relationship with yet.
// / 多工厂比价——把同一份生成的 spec 同时对照 FACTORIES 里的每个画像
// （产能上限、不支持的模块、按各自费率算出的价格/交期估算），不用访客
// 挨个在 N 个私聊窗口里重复解释同一个需求。这是"为什么要留在网站上、
// 而不是生成完就回到私聊"这个问题的直接答案——私聊做不了这种横向比较，
// 因为这不是"聊出来的"，是访客还没跟每一家都建立关系之前，就能同时拿到
// 的多方对比。
// ---------------------------------------------------------------------
function compareFactories(requests, finalTotal, areaSqm) {
  const tier = BUDGET_TIERS[budgetTierIndex];
  return FACTORIES.map((factory) => {
    const overCapacity = finalTotal > factory.maxModules;
    const unsupported = requests
      .map((r) => r.moduleId)
      .filter((id) => factory.unsupportedModuleIds.includes(id));
    const feasible = !overCapacity && unsupported.length === 0;
    const price = Math.round(areaSqm * tier.ratePerSqm * factory.rateMultiplier);
    return { factory, feasible, overCapacity, unsupported, price };
  });
}

function renderFactoryComparison() {
  const { requests, finalTotal } = buildModuleRequest();
  const areaSqm = totalSelectedAreaSqm();
  const results = compareFactories(requests, finalTotal, areaSqm);

  // Feasible options first, cheapest first within each group — the
  // comparison is only useful if the visitor doesn't have to hunt for
  // which rows are actually viable.
  results.sort((a, b) => {
    if (a.feasible !== b.feasible) return a.feasible ? -1 : 1;
    return a.price - b.price;
  });

  const grid = document.getElementById('factoryCompareResults');
  grid.innerHTML = '';
  results.forEach(({ factory, feasible, overCapacity, unsupported, price }) => {
    const card = document.createElement('div');
    card.className = 'factory-card' + (feasible ? '' : ' factory-card-infeasible');

    const reasonBits = [];
    if (overCapacity) {
      reasonBits.push(t('factoryReasonOverCapacity').replace('{max}', factory.maxModules));
    }
    if (unsupported.length) {
      const names = unsupported
        .map((id) => t((MODULE_CATALOG.find((m) => m.id === id) || {}).i18nKey || id))
        .join(currentLang === 'zh' ? '、' : ', ');
      reasonBits.push(t('factoryReasonUnsupported').replace('{modules}', names));
    }

    card.innerHTML = `
      <div class="factory-card-top">
        <div class="factory-card-name-wrap">
          <span class="factory-card-name">${factory.name}</span>
          <span class="factory-card-region">${factory.region[currentLang]}</span>
        </div>
        <span class="factory-status ${feasible ? 'ok' : 'warn'}">${feasible ? t('factoryFeasible') : t('factoryNotFeasible')}</span>
      </div>
      ${feasible ? `
        <div class="factory-card-metrics">
          <span class="factory-card-price">$${price.toLocaleString('en-US')}</span>
          <span class="factory-card-lead">${factory.leadTimeDays[0]}–${factory.leadTimeDays[1]} ${t('factoryDays')}</span>
        </div>
      ` : `<p class="factory-card-reason">${reasonBits.join(' · ')}</p>`}
      <p class="factory-card-note">${factory.note[currentLang]}</p>
      <p class="factory-card-certs">${t('factoryCertsLabel')}: ${factory.certs.join(', ')}</p>
      ${feasible ? `<button type="button" class="factory-quote-btn">${t('factoryQuoteBtn')}</button>` : ''}
    `;
    // Only feasible factories get a quote action — asking "Not feasible"
    // Jiangsu Precision Build for a quote makes no sense when the card
    // itself already says why it can't take this spec. Reuses the existing
    // email-capture modal (openCustomModal/handleModalSubmit) rather than
    // sending anything to the factory directly — there's no factory-side
    // account/response system yet (see the FACTORIES comment above), so
    // this stays a "we'll follow up manually" request, same honesty level
    // as everywhere else on the page.
    // / 只有 Feasible 的工厂才有报价按钮——"Not feasible" 的 Jiangsu Precision
    // Build 卡片本身已经说明了做不了，没道理让人点"获取报价"。复用现有的
    // 邮箱收集弹窗（openCustomModal/handleModalSubmit），不会直接把需求发给
    // 工厂——目前还没有工厂端账号/响应系统（见上面 FACTORIES 的注释），所以
    // 这里保持"我们人工跟进"的诚实程度，跟页面其他地方一致。
    if (feasible) {
      card.querySelector('.factory-quote-btn').addEventListener('click', () => openCustomModal(factory));
    }
    grid.appendChild(card);
  });
}

// ---------------------------------------------------------------------
// Recent projects (localStorage — this is a static site with no backend)
// ---------------------------------------------------------------------
const STORAGE_KEY = 'prefab_recent_projects';

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveProject(project) {
  const list = loadProjects();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  list.unshift({ id, ...project });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 12)));
}
function deleteProject(id) {
  const list = loadProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  renderProjects();
}
function renderProjects() {
  const grid = document.getElementById('projectGrid');
  const list = loadProjects();
  grid.innerHTML = '';
  if (list.length === 0) {
    grid.innerHTML = `<div class="project-empty">${t('noProjects')}</div>`;
    return;
  }
  list.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    const market = MARKETS.find((m) => m.code === p.market);
    const marketName = market ? (currentLang === 'zh' ? market.zh : market.en) : p.market;
    card.innerHTML = `
      <div class="project-card-top">
        <div class="project-card-title">${market ? market.flag + ' ' : ''}${marketName}</div>
        <button class="project-delete-btn" data-id="${p.id}" type="button" aria-label="${t('deleteProject')}">&times;</button>
      </div>
      <div class="project-card-meta">${p.moduleCount} ${t('modulesLabel')} · ${new Date(p.date).toLocaleDateString()}</div>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('.project-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (confirm(t('confirmDelete'))) deleteProject(btn.getAttribute('data-id'));
    });
  });
}

// ---------------------------------------------------------------------
// Result summary — human-readable version of the generated spec, shown
// above the raw JSON. A visitor evaluating this site cold (no verbal
// walkthrough) sees {"moduleId": "bedroom-master", "quantity": 1} and has
// no way to tell if that's actually what they asked for — this renders
// the same data as plain room names instead, with the raw JSON demoted to
// a collapsed "view raw data" toggle for anyone who wants to forward it to
// an engineering/procurement system. Modules not in MODULE_CATALOG
// (hallway-connector, utility-mechanical) are system-added, not something
// the visitor picked — folded into one count line instead of listed as
// rooms, reusing the same autoAddedNote wording already shown in the
// module counter above, so the two stay consistent.
// / 结果摘要——生成结果的人话版本，显示在原始 JSON 之上。一个没人在旁边讲解、
// 第一次看这个网站的访客，看到 {"moduleId": "bedroom-master", "quantity": 1}
// 根本判断不出这是不是自己要的东西——这里把同一份数据换成看得懂的房间名称，
// 原始 JSON 收进一个默认收起的"查看原始数据"里，留给需要转发给工程/采购系统
// 的人用。不在 MODULE_CATALOG 里的模块（hallway-connector、utility-mechanical）
// 是系统自动添加的，不是访客自己选的——合并成一行数量说明，而不是当成房间列出
// 来，措辞复用上面模块计数器已经用过的 autoAddedNote，保持两处一致。
// ---------------------------------------------------------------------
function renderResultSummary(requests, areaSqm) {
  const summaryEl = document.getElementById('resultSummary');
  const tier = BUDGET_TIERS[budgetTierIndex];

  const pickedLines = [];
  let autoAddedCount = 0;
  requests.forEach((r) => {
    const spec = MODULE_CATALOG.find((m) => m.id === r.moduleId);
    if (spec) {
      pickedLines.push(`<li>${r.quantity} × ${t(spec.i18nKey)} <span class="result-summary-sub">(${spec.sub})</span></li>`);
    } else {
      autoAddedCount += r.quantity;
    }
  });

  let html = `<ul class="result-summary-list">${pickedLines.join('')}</ul>`;
  if (areaSqm > 0) {
    const estimate = Math.round(areaSqm * tier.ratePerSqm);
    html += `<p class="result-summary-total"><span>${t('resultSummaryAreaLabel')}: ${areaSqm}m²</span><span>${t('resultSummaryEstimateLabel')}: $${estimate.toLocaleString('en-US')}</span></p>`;
  }
  if (autoAddedCount > 0) {
    html += `<p class="result-summary-auto">${t('autoAddedNote').replace('{n}', autoAddedCount)}</p>`;
  }
  summaryEl.innerHTML = html;
}

// ---------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------
function handleSubmit() {
  if (!selectedMarket) {
    alert(t('selectMarketFirst'));
    return;
  }
  const { requests, valid, finalTotal } = buildModuleRequest();

  const resultPanel = document.getElementById('resultPanel');
  const resultJson = document.getElementById('resultJson');
  const resultSummary = document.getElementById('resultSummary');
  const resultRawToggle = document.getElementById('resultRawToggle');
  const continueRow = document.getElementById('continueRow');
  const factoryCompareRow = document.getElementById('factoryCompareRow');
  const factoryComparePanel = document.getElementById('factoryComparePanel');

  resultPanel.hidden = false;
  resultJson.textContent = JSON.stringify(requests, null, 2);
  // A fresh Generate means the previous comparison (if any) is for a
  // different spec now — collapse it rather than leave a stale table
  // sitting under new results. Re-opening re-runs renderFactoryComparison()
  // against the current spec.
  factoryComparePanel.hidden = true;

  if (!valid) {
    // Over-limit is an error state, not a normal result — there's nothing
    // sensible to summarize in plain language, so skip renderResultSummary()
    // and show the raw detail (with the warning appended) directly instead
    // of leaving it collapsed behind the toggle.
    resultJson.textContent += `\n\n// ${t('overLimit')} (${finalTotal} / ${MAX_MODULES})`;
    resultJson.hidden = false;
    resultSummary.innerHTML = '';
    continueRow.hidden = true;
    factoryCompareRow.hidden = true;
    return;
  }

  // Collapsed by default — see renderResultSummary() above for why.
  resultJson.hidden = true;
  resultRawToggle.textContent = t('viewRawJsonBtn');
  renderResultSummary(requests, totalSelectedAreaSqm());
  lastGeneratedRequests = requests;

  factoryCompareRow.hidden = false;

  saveProject({ market: selectedMarket, moduleCount: finalTotal, date: Date.now(), requests });
  renderProjects();

  // Prefer the selected style's fixed showcase house (see the STYLES[]
  // comment above) when it has one; otherwise fall back to building the
  // visitor's *actual* module selection into a fresh, connected scene on
  // our own editor.
  const market = MARKETS.find((m) => m.code === selectedMarket);
  const style = market && STYLES.find((s) => s.id === market.styleId);
  const usesFixedShowcase = Boolean(style && style.showcaseUrl);
  document.getElementById('continueLink').href = usesFixedShowcase
    ? style.showcaseUrl
    : buildStep1Url(requests, selectedMarket);
  continueRow.hidden = false;

  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Upgrade the link to a persistent, shareable one once the server
  // confirms the draft was saved (see buildPersistentStep1Url() above).
  // Skipped for the fixed-showcase branch — that link isn't built from
  // this visitor's own requests, so there's nothing of theirs to save.
  if (!usesFixedShowcase) {
    buildPersistentStep1Url(requests, selectedMarket).then((url) => {
      document.getElementById('continueLink').href = url;
    });
  }
}

// ---------------------------------------------------------------------
// Custom design requests — static site, so this just saves to
// localStorage (same pattern as recent projects) instead of hitting a
// backend. In production, swap saveCustomRequest() for a real API call
// or a form-submission service.
// ---------------------------------------------------------------------
const CUSTOM_REQUEST_KEY = 'prefab_custom_requests';

function saveCustomRequest(entry) {
  try {
    const list = JSON.parse(localStorage.getItem(CUSTOM_REQUEST_KEY) || '[]');
    list.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...entry });
    localStorage.setItem(CUSTOM_REQUEST_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // localStorage unavailable (private browsing etc.) — request still
    // showed the success screen, it just won't persist. Not worth
    // blocking the user's flow over.
  }
}

// factory is optional — pass a FACTORIES entry when opening from a factory
// card's "Get quote" button (see renderFactoryComparison()) so the modal
// shows which factory this request is for. Omitted (default null) for the
// other buttons that reuse this same modal.
function openCustomModal(factory = null) {
  quoteFactoryContext = factory;
  document.getElementById('customModalForm').hidden = false;
  document.getElementById('customModalSuccess').hidden = true;
  document.getElementById('modalError').hidden = true;
  document.getElementById('customModalEmail').value = '';
  document.getElementById('customModalAgree').checked = false;
  const contextEl = document.getElementById('modalFactoryContext');
  if (factory) {
    contextEl.textContent = t('modalFactoryContext').replace('{factory}', factory.name);
    contextEl.hidden = false;
  } else {
    contextEl.hidden = true;
  }
  document.getElementById('customModalOverlay').hidden = false;
}

function closeCustomModal() {
  document.getElementById('customModalOverlay').hidden = true;
}

// Shown when a buyer arrives back from the Pascal editor's "Save image"
// button (see apps/editor's scene-loader.tsx), which redirects here with
// ?saved=1 after downloading their design PNG.
function maybeShowDesignSaved() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('saved') !== '1') return;
  document.getElementById('designSavedOverlay').hidden = false;
  // Drop the query param so a refresh/share of the URL doesn't re-trigger it.
  window.history.replaceState({}, '', window.location.pathname);
}

function closeDesignSaved() {
  document.getElementById('designSavedOverlay').hidden = true;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ---------------------------------------------------------------------
// Instant AI generate — the "自由输入房间数量/需求，AI解析成模块清单，
// 自动拼成户型" flow: sends the visitor's free text to our own
// /api/parse-request endpoint (server-side DeepSeek key, never the
// visitor's), turns the returned module list straight into a fresh
// editor scene via buildStep1Url(), and opens it in a new tab. Falls
// back to the manual "Request custom design" modal on any failure —
// this is a convenience shortcut, not a replacement for that path.
// ---------------------------------------------------------------------
async function handleInstantGenerate() {
  const text = document.getElementById('customRequestText').value.trim();
  if (!text) {
    alert(t('customRequestNeedsText'));
    return;
  }

  const btn = document.getElementById('instantGenerateBtn');
  const statusEl = document.getElementById('instantGenerateStatus');
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = t('instantGenerateBtnLoading');
  statusEl.hidden = true;
  statusEl.classList.remove('error');

  try {
    const res = await fetch(PARSE_REQUEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.status === 429) throw new Error(t('instantGenerateRateLimited'));
    if (!res.ok) throw new Error(t('instantGenerateError'));

    const result = await res.json();
    if (!Array.isArray(result.modules) || result.modules.length === 0) {
      throw new Error(t('instantGenerateEmpty'));
    }

    const url = await buildPersistentStep1Url(result.modules, selectedMarket);
    window.open(url, '_blank', 'noopener');
  } catch (err) {
    statusEl.textContent = (err && err.message) || t('instantGenerateError');
    statusEl.classList.add('error');
    statusEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

function handleCustomRequestSubmit() {
  const text = document.getElementById('customRequestText').value.trim();
  if (!text) {
    alert(t('customRequestNeedsText'));
    return;
  }
  openCustomModal();
}

function handleModalSubmit() {
  const email = document.getElementById('customModalEmail').value.trim();
  const agreed = document.getElementById('customModalAgree').checked;
  const errorEl = document.getElementById('modalError');

  if (!isValidEmail(email)) {
    errorEl.textContent = t('modalEmailError');
    errorEl.hidden = false;
    return;
  }
  if (!agreed) {
    errorEl.textContent = t('modalAgreeError');
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;

  saveCustomRequest({
    email,
    requirement: document.getElementById('customRequestText').value.trim(),
    market: selectedMarket,
    factoryId: quoteFactoryContext ? quoteFactoryContext.id : null,
    factoryName: quoteFactoryContext ? quoteFactoryContext.name : null,
    date: Date.now(),
  });

  // Real side effect, layered on top of the local save above — see
  // sendFactoryRfq()'s comment near FACTORY_RFQ_WEBHOOK_URL. No-ops until
  // that URL is filled in, so this is safe to leave wired up right now.
  if (quoteFactoryContext) {
    sendFactoryRfq(quoteFactoryContext, lastGeneratedRequests);
  }

  document.getElementById('customModalForm').hidden = true;
  document.getElementById('customModalSuccess').hidden = false;
}

// ---------------------------------------------------------------------
// Spec sheet tabs — plain show/hide, independent of language/state.
// (Section 5 of the B2B revision: Dimensions / Certification / Production.)
// / 规格表标签页切换——纯粹的显示/隐藏，跟语言、生成状态都无关。
// ---------------------------------------------------------------------
function initSpecTabs() {
  const tabs = document.querySelectorAll('.spec-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      document.querySelectorAll('.spec-panel').forEach((panel) => {
        panel.hidden = panel.getAttribute('data-panel') !== target;
      });
    });
  });
}

// ---------------------------------------------------------------------
// Featured before/after example (Section 6 of the B2B revision) — two
// REAL generated results built with the same buildStep1Url() used
// everywhere else on the page, not screenshots or fabricated images.
// Bedroom count is the only field that differs between the two payloads
// (1 → 2), directly demonstrating "one spec change, engine keeps up."
// / "改动前/改动后"示例——用的是页面别处同一个 buildStep1Url()，两个都是真实
// 可打开的生成结果，不是截图或编造的图片。两份数据只有卧室数量不同(1→2)。
// ---------------------------------------------------------------------
function renderFeaturedExample() {
  const baseModules = [
    { moduleId: 'kitchen-open', quantity: 1 },
    { moduleId: 'living-room', quantity: 1 },
    { moduleId: 'bathroom-std', quantity: 1 },
    { moduleId: 'utility-mechanical', quantity: 1 },
  ];
  const beforeLink = document.getElementById('featuredBeforeLink');
  const afterLink = document.getElementById('featuredAfterLink');
  if (beforeLink) beforeLink.href = buildStep1Url([{ moduleId: 'bedroom-std', quantity: 1 }, ...baseModules], null);
  if (afterLink) afterLink.href = buildStep1Url([{ moduleId: 'bedroom-std', quantity: 2 }, ...baseModules], null);
}

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------
document.getElementById('submitBtn').addEventListener('click', handleSubmit);
document.getElementById('recommendBtn').addEventListener('click', applyRecommendation);
document.getElementById('budgetSlider').addEventListener('input', (e) => {
  budgetTierIndex = Number(e.target.value);
  updateBudgetEstimate();
});
document.getElementById('customRequestBtn').addEventListener('click', handleCustomRequestSubmit);
document.getElementById('instantGenerateBtn').addEventListener('click', handleInstantGenerate);
document.getElementById('customModalSubmit').addEventListener('click', handleModalSubmit);
document.getElementById('customModalClose').addEventListener('click', closeCustomModal);
document.getElementById('customModalDone').addEventListener('click', closeCustomModal);
document.getElementById('customModalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'customModalOverlay') closeCustomModal();
});
document.getElementById('designSavedClose').addEventListener('click', closeDesignSaved);
document.getElementById('designSavedOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'designSavedOverlay') closeDesignSaved();
});
// Factory hand-off isn't built yet — reuse the existing "leave your email"
// modal as a stand-in so the button does something real in the meantime.
document.getElementById('designSavedContactBtn').addEventListener('click', () => {
  closeDesignSaved();
  openCustomModal();
});
// Closing CTA ("Talk about integrating this into your workflow") — same
// stand-in pattern as designSavedContactBtn above: reuses the existing
// email-capture modal rather than a new contact flow.
document.getElementById('ctaBtn').addEventListener('click', openCustomModal);
document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('resultJson').textContent);
});
document.getElementById('resultRawToggle').addEventListener('click', () => {
  const pre = document.getElementById('resultJson');
  const btn = document.getElementById('resultRawToggle');
  pre.hidden = !pre.hidden;
  btn.textContent = pre.hidden ? t('viewRawJsonBtn') : t('hideRawJsonBtn');
});
document.getElementById('factoryCompareBtn').addEventListener('click', () => {
  const panel = document.getElementById('factoryComparePanel');
  const opening = panel.hidden;
  if (opening) renderFactoryComparison(); // re-run each time it opens, so a slider move since Generate is reflected
  panel.hidden = !opening;
  if (opening) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => applyLanguage(btn.getAttribute('data-lang')));
});

const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
menuToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

initSpecTabs();
renderFeaturedExample();
applyLanguage('en');
maybeShowDesignSaved();
