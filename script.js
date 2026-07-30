// ---------------------------------------------------------------------
// Config — set this once Step 2 (the Pascal editor fork) is deployed.
// When set, "Generate" also shows a "Continue building →" link that
// hands the structured request off via a URL query param. When left
// empty, the site still works fully on its own — it just shows the
// generated JSON inline instead of a continue link.
// ---------------------------------------------------------------------
const STEP2_URL = 'https://editor-editor-sooty.vercel.app/step1';

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
// Markets — extend this list freely, the grid is fully data-driven
// ---------------------------------------------------------------------
const MARKETS = [
  { code: 'us', flag: '🇺🇸', zh: '美国', en: 'United States', region: '北美', regionEn: 'North America', recommended: true },
  { code: 'sg', flag: '🇸🇬', zh: '新加坡', en: 'Singapore', region: '东南亚', regionEn: 'Southeast Asia' },
  { code: 'ca', flag: '🇨🇦', zh: '加拿大', en: 'Canada', region: '北美', regionEn: 'North America' },
  { code: 'br', flag: '🇧🇷', zh: '巴西', en: 'Brazil', region: '南美', regionEn: 'South America' },
  { code: 'au', flag: '🇦🇺', zh: '澳大利亚', en: 'Australia', region: '大洋洲', regionEn: 'Oceania' },
  { code: 'gb', flag: '🇬🇧', zh: '英国', en: 'United Kingdom', region: '欧洲', regionEn: 'Europe' },
  { code: 'my', flag: '🇲🇾', zh: '马来西亚', en: 'Malaysia', region: '东南亚', regionEn: 'Southeast Asia' },
  { code: 'th', flag: '🇹🇭', zh: '泰国', en: 'Thailand', region: '东南亚', regionEn: 'Southeast Asia' },
  { code: 'jp', flag: '🇯🇵', zh: '日本', en: 'Japan', region: '东亚', regionEn: 'East Asia' },
  { code: 'de', flag: '🇩🇪', zh: '德国', en: 'Germany', region: '欧洲', regionEn: 'Europe' },
  { code: 'ae', flag: '🇦🇪', zh: '阿联酋', en: 'United Arab Emirates', region: '中东', regionEn: 'Middle East' },
  { code: 'mx', flag: '🇲🇽', zh: '墨西哥', en: 'Mexico', region: '北美', regionEn: 'North America' },
];

// ---------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------
const I18N = {
  zh: {
    brandName: '定制预制房',
    eyebrow: 'AI-POWERED PREFAB WORKSPACE',
    heroTitle: '定制预制房 · 启航全球',
    heroSubtitle: '选择目标市场，搭建你的房型，几分钟看到立体效果。',
    positioningLabel: '目标市场 · 客户定位',
    positioningHint: 'PRIORITY MARKETS',
    navMarket: '目标市场',
    navQuickStart: '快速开始',
    navRecent: '最近项目',
    quickStartLabel: '快速开始',
    quickStartHint: '勾选你需要的房间，最多 6 个模块',
    modulesLabel: '个模块',
    generateBtn: '生成方案',
    resultLabel: '生成结果',
    copyBtn: '复制 JSON',
    continueBtn: '继续搭建 →',
    recentLabel: '最近项目',
    recentHint: '本浏览器保存',
    footerNote: '生成结果仅供方案预览，具体尺寸以工厂确认为准。',
    recommended: '推荐',
    noProjects: '还没有项目 — 上面生成一个试试',
    selectMarketFirst: '请先选择目标市场',
    overLimit: '超过 6 个模块，需要人工评估',
    deleteProject: '删除项目',
    confirmDelete: '确定要删除这个项目吗？',
    bedroomStd: '标准卧室',
    bedroomMaster: '主卧',
    bathroomStd: '卫浴',
    kitchenOpen: '开放式厨房',
    livingRoom: '客厅',
    porchCovered: '门廊',
    storageLoft: '阁楼储物',
  },
  en: {
    brandName: 'Custom Prefab House',
    eyebrow: 'AI-POWERED PREFAB WORKSPACE',
    heroTitle: 'Custom Prefab · Go Global',
    heroSubtitle: 'Pick a target market, build your layout, see a 3D result in minutes.',
    positioningLabel: 'Target market · positioning',
    positioningHint: 'PRIORITY MARKETS',
    navMarket: 'Target Market',
    navQuickStart: 'Quick Start',
    navRecent: 'Recent Projects',
    quickStartLabel: 'Quick start',
    quickStartHint: 'Check the rooms you need — up to 6 modules',
    modulesLabel: 'modules',
    generateBtn: 'Generate',
    resultLabel: 'Result',
    copyBtn: 'Copy JSON',
    continueBtn: 'Continue building →',
    recentLabel: 'Recent projects',
    recentHint: 'saved in this browser',
    footerNote: 'Generated results are a preview only — final dimensions pending factory confirmation.',
    recommended: 'Recommended',
    noProjects: 'No projects yet — generate one above',
    selectMarketFirst: 'Pick a target market first',
    overLimit: 'Over the 6-module limit — needs engineer review',
    deleteProject: 'Delete project',
    confirmDelete: 'Delete this project?',
    bedroomStd: 'Standard bedroom',
    bedroomMaster: 'Master bedroom',
    bathroomStd: 'Bathroom',
    kitchenOpen: 'Open kitchen',
    livingRoom: 'Living room',
    porchCovered: 'Covered porch',
    storageLoft: 'Loft storage',
  },
};

let currentLang = 'zh';
let selectedMarket = null;
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
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  renderMarkets();
  renderModuleForm();
  renderProjects();
  updateSelectedMarketLabel();
}

// ---------------------------------------------------------------------
// Markets grid
// ---------------------------------------------------------------------
function renderMarkets() {
  const grid = document.getElementById('marketGrid');
  grid.innerHTML = '';
  MARKETS.forEach((market) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'market-card' + (selectedMarket === market.code ? ' selected' : '');
    card.innerHTML = `
      ${market.recommended ? `<span class="market-badge">${t('recommended')}</span>` : ''}
      <span class="market-region">${currentLang === 'zh' ? market.region : market.regionEn}</span>
      <span class="market-flag">${market.flag}</span>
      <span class="market-name-zh">${currentLang === 'zh' ? market.zh : market.en}</span>
      <span class="market-name-en">${currentLang === 'zh' ? market.en : market.zh}</span>
    `;
    card.addEventListener('click', () => {
      selectedMarket = market.code;
      renderMarkets();
      updateSelectedMarketLabel();
      document.getElementById('quickStart').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    grid.appendChild(card);
  });
}

function updateSelectedMarketLabel() {
  const label = document.getElementById('selectedMarketLabel');
  if (!selectedMarket) { label.textContent = ''; return; }
  const market = MARKETS.find((m) => m.code === selectedMarket);
  label.textContent = (currentLang === 'zh' ? market.zh : market.en);
}

// ---------------------------------------------------------------------
// Module form
// ---------------------------------------------------------------------
function totalModuleCount() {
  return Object.values(moduleState).reduce((sum, v) => sum + v, 0);
}

function updateCounter() {
  const total = totalModuleCount();
  const counterEl = document.getElementById('moduleCount');
  counterEl.textContent = total;
  document.querySelector('.module-counter').classList.toggle('over', total > MAX_MODULES);
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
  const continueRow = document.getElementById('continueRow');

  resultPanel.hidden = false;
  resultJson.textContent = JSON.stringify(requests, null, 2);

  if (!valid) {
    resultJson.textContent += `\n\n// ${t('overLimit')} (${finalTotal} / ${MAX_MODULES})`;
    continueRow.hidden = true;
    return;
  }

  saveProject({ market: selectedMarket, moduleCount: finalTotal, date: Date.now(), requests });
  renderProjects();

  if (STEP2_URL) {
    const query = encodeURIComponent(JSON.stringify({ market: selectedMarket, modules: requests }));
    document.getElementById('continueLink').href = `${STEP2_URL}?data=${query}`;
    continueRow.hidden = false;
  } else {
    continueRow.hidden = true;
  }

  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------
document.getElementById('submitBtn').addEventListener('click', handleSubmit);
document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('resultJson').textContent);
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

applyLanguage('en');
