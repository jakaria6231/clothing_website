// ============================================================================
// 1. GITHUB REPOSITORY PERMANENT STORAGE CONFIGURATION
// ============================================================================
const GITHUB_CONFIG = {
  owner: 'jakaria6231',
  repo: 'clothing_website',
  branch: 'main',
  dataPath: 'data/store.json',
  mediaFolder: 'uploads'
};

function getGithubToken() {
  return localStorage.getItem('rr_wear_gh_token') || '';
}

function setGithubToken(token) {
  if (token) {
    localStorage.setItem('rr_wear_gh_token', token.trim());
  } else {
    localStorage.removeItem('rr_wear_gh_token');
  }
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUtf8(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function githubGetFile(path) {
  const token = getGithubToken();
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}&_t=${Date.now()}`;
  const res = await fetch(url, { headers, cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error (${res.status})`);
  return await res.json();
}

async function githubPutFile(path, base64Content, message) {
  const token = getGithubToken();
  if (!token) {
    throw new Error('GitHub Token not configured! Go to Owner Dashboard → Contact & Social Links to connect your GitHub Token.');
  }

  let sha = undefined;
  try {
    const existing = await githubGetFile(path);
    if (existing && existing.sha) sha = existing.sha;
  } catch (e) {}

  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
  const body = {
    message,
    content: base64Content,
    branch: GITHUB_CONFIG.branch
  };
  if (sha) body.sha = sha;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to save ${path} to GitHub (${res.status})`);
  }
  return await res.json();
}

async function uploadMediaToGithub(base64DataUrl, originalFileName = 'media.jpg') {
  const token = getGithubToken();
  if (!token) {
    throw new Error('Please connect your GitHub Token in Dashboard → Contact & Social Links first so files can save to your repo.');
  }
  const cleanName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${cleanName}`;
  const repoPath = `${GITHUB_CONFIG.mediaFolder}/${fileName}`;
  const pureBase64 = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;

  await githubPutFile(repoPath, pureBase64, `Upload ${fileName} from R&R WEAR Owner Dashboard`);
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${repoPath}`;
}

async function persistStoreToGithub(commitMsg = 'Update store data from Owner Dashboard') {
  const storePayload = {
    siteSettings: state.siteSettings,
    categories: state.categories,
    products: state.products,
    ownerAuthRecord: state.ownerAuthRecord || {
      email: 'owner@rrwear.com',
      passwordHash: await hashSecret('RRWear2026!'),
      updatedAt: Date.now()
    },
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem('rr_wear_store_backup', JSON.stringify(storePayload));
  } catch (e) {}

  const encoded = utf8ToBase64(JSON.stringify(storePayload, null, 2));
  await githubPutFile(GITHUB_CONFIG.dataPath, encoded, commitMsg);
}

// ============================================================================
// 2. CRYPTO, MEDIA & HTML ESCAPE HELPER UTILITIES
// ============================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function hashSecret(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function compressImageFile(file, maxWidth = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputType, quality));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readVideoFile(file) {
  return new Promise((resolve, reject) => {
    const maxBytes = 20 * 1024 * 1024; // Up to 20MB supported for GitHub repo storage
    if (file.size > maxBytes) {
      reject(
        new Error(
          `Video "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(
            2
          )}MB. Please upload an MP4/WebM clip under 20MB for GitHub repository storage.`
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read video file.'));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 3. CUSTOM BRAND SVG LOGO & OFFICIAL SOCIAL PLATFORM ICONS
// ============================================================================
function renderBrandLogo(logoUrl, brandName = 'R&R WEAR', size = 'md', darkText = true) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };
  const textSize =
    size === 'xl'
      ? 'text-2xl sm:text-3xl'
      : size === 'lg'
      ? 'text-xl'
      : size === 'sm'
      ? 'text-sm'
      : 'text-base sm:text-lg';
  const textColor = darkText ? 'text-[#0A0A0A]' : 'text-[#F8FAFC]';

  const mediaHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brandName)}" class="${iconSizes[size]} rounded-lg object-cover shadow-sm border border-black/10" />`
    : `<div class="${iconSizes[size]} rounded-lg bg-[#070B0E] flex items-center justify-center shadow-md border border-cyan-400/35 relative overflow-hidden shrink-0">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.32),transparent_70%)]"></div>
        <svg viewBox="0 0 100 100" class="w-[82%] h-[82%] relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rrCyanGrad" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#67F5FF" />
              <stop offset="50%" stop-color="#00D8F6" />
              <stop offset="100%" stop-color="#008DA8" />
            </linearGradient>
          </defs>
          <path d="M47 12L14 45L36 67V86L47 94V63L28 45L47 26V12Z" fill="url(#rrCyanGrad)" />
          <path d="M32 45L47 31V41L39 49L47 57V66L32 51V45Z" fill="url(#rrCyanGrad)" />
          <path d="M53 12L86 45L64 67V86L53 94V63L72 45L53 26V12Z" fill="url(#rrCyanGrad)" />
          <path d="M68 45L53 31V41L61 49L53 57V66L68 51V45Z" fill="url(#rrCyanGrad)" />
          <text x="50" y="55" text-anchor="middle" fill="#67F5FF" font-size="16" font-weight="800" font-family="Georgia, serif">&amp;</text>
        </svg>
      </div>`;

  return `
    <div class="inline-flex items-center gap-2.5 select-none">
      ${mediaHtml}
      <span class="font-display font-extrabold tracking-[-0.04em] uppercase ${textSize} ${textColor}">
        ${escapeHtml(brandName)}
      </span>
    </div>
  `;
}

function renderWhatsAppIcon(cls = 'w-5 h-5') {
  return `<svg viewBox="0 0 32 32" fill="currentColor" class="${cls}"><path d="M16.004 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.256.59 4.458 1.71 6.4L3.1 28.8l6.58-1.726a12.75 12.75 0 0 0 6.324 1.676h.006c7.058 0 12.796-5.74 12.796-12.8 0-3.42-1.332-6.636-3.75-9.054A12.715 12.715 0 0 0 16.004 3.2zm0 23.388h-.004a10.6 10.6 0 0 1-5.404-1.48l-.388-.23-3.904 1.024 1.042-3.806-.252-.402a10.576 10.576 0 0 1-1.622-5.644c0-5.854 4.764-10.618 10.624-10.618 2.836 0 5.502 1.106 7.506 3.112a10.553 10.553 0 0 1 3.11 7.51c0 5.856-4.764 10.622-10.612 10.622zm5.826-7.954c-.32-.16-1.89-.932-2.182-1.038-.292-.106-.506-.16-.718.16-.214.32-.824 1.038-1.01 1.252-.186.212-.372.24-.692.08-.32-.16-1.35-.498-2.572-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.492.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.214.052-.4-.028-.56-.08-.16-.718-1.732-.984-2.372-.26-.622-.524-.538-.718-.548l-.612-.01c-.214 0-.56.08-.852.4-.292.32-1.118 1.092-1.118 2.664s1.144 3.09 1.304 3.304c.16.212 2.252 3.438 5.456 4.822.762.328 1.356.524 1.82.672.766.244 1.462.21 2.012.128.614-.092 1.89-.772 2.156-1.518.266-.746.266-1.384.186-1.518-.08-.132-.292-.212-.612-.372z" /></svg>`;
}

function renderTelegramIcon(cls = 'w-5 h-5') {
  return `<svg viewBox="0 0 32 32" fill="currentColor" class="${cls}"><path d="M27.66 5.486a1.6 1.6 0 0 0-1.66-.244L4.236 13.79a1.6 1.6 0 0 0 .108 3.014l5.492 1.786 2.118 6.678a1.4 1.4 0 0 0 2.332.574l3.152-3.09 5.834 4.294a1.6 1.6 0 0 0 2.512-.956l3.32-19.01a1.6 1.6 0 0 0-1.444-1.594zM12.39 18.08l11.21-7.17-8.79 8.79-.42 4.13-1.69-5.32-.31-.43z" /></svg>`;
}

function renderMessengerIcon(cls = 'w-5 h-5') {
  return `<svg viewBox="0 0 32 32" fill="currentColor" class="${cls}"><path d="M16 3.2C8.82 3.2 3.2 8.46 3.2 15.24c0 3.74 1.72 7.06 4.44 9.26v4.3l4.06-2.24c1.36.38 2.8.58 4.3.58 7.18 0 12.8-5.26 12.8-12.04S23.18 3.2 16 3.2zm1.28 16.18-3.26-3.48-6.36 3.48 7-7.42 3.34 3.48 6.28-3.48-7 7.42z" /></svg>`;
}

// ============================================================================
// 4. DEFAULT SEED DATA (100% EDITABLE FROM OWNER DASHBOARD)
// ============================================================================
const DEFAULT_LOOKBOOK_CARDS = [
  {
    id: 'look-1',
    title: 'DUSK VIOLET LAYERED SET',
    tag: 'COMPRESSION + JOGGER',
    season: 'FALL / WINTER 2026',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
    linkedProductId: 'prod-1'
  },
  {
    id: 'look-2',
    title: 'STUDIO ASH FLEECE & SHORT',
    tag: 'HEAVYWEIGHT FLEECE',
    season: 'ALL-SEASON 2026',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85',
    linkedProductId: 'prod-2'
  },
  {
    id: 'look-3',
    title: 'STEALTH OBSIDIAN TECH KIT',
    tag: 'THERMAL SHELL + TIGHTS',
    season: 'WINTER PERFORMANCE',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85',
    linkedProductId: 'prod-5'
  },
  {
    id: 'look-4',
    title: 'CARGO HIGH RIB JOGGER',
    tag: 'HOODIE + CRIMSON CARGO',
    season: 'FALL / WINTER 2026',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
    linkedProductId: 'prod-3'
  }
];

const DEFAULT_SITE_SETTINGS = {
  brandName: 'R&R WEAR',
  logoUrl: '',
  footerTagline:
    'Engineered luxury sportswear and technical street silhouettes crafted for relentless movement.',
  footerCopyright: '© 2026 R&R WEAR. ALL RIGHTS RESERVED.',
  heroTitleLine1: 'GEAR UP EVERY SEASON',
  heroTitleLine2: 'EVERY WORKOUT!',
  heroPrimaryBtnText: 'SHOP NOW',
  heroSecondaryBtnText: 'EXPLORE ALL',
  heroDescription:
    'Stay agile without compromising your range of motion. Our technical athletic range is engineered for intense indoor & outdoor training.',
  heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85',
  heroThumb1: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
  heroThumb2: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80',
  heroThumb3: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=300&q=80',
  heroVideoPreviewImg: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  heroVideoPreviewTitle: 'LOOKBOOK FILM',
  showcaseWatermark: 'WORKOUT',
  showcaseLeftImg: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?auto=format&fit=crop&w=700&q=80',
  showcaseLeftCaption: 'Performance-driven gear for athletes—built for summer heat and winter cold.',
  showcaseCenterImg: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85',
  showcaseRightImg: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=700&q=80',
  showcaseRightCaption:
    'Stay warm, stay fit. Our winter workout wear blends insulation with flexibility to keep you going in the toughest conditions.',
  promoSectionTitleLine1: 'TOP WORKOUT GEAR FOR',
  promoSectionTitleLine2: 'PEAK PERFORMANCE!',
  promoSectionSubtitle: 'Discover the new season collection, designed to empower your workouts all year round.',
  promoCard1Title: 'TOP WORKOUT GEAR FOR PEAK PERFORMANCE!',
  promoCard1Tag: 'OUTERWEAR / 26',
  promoCard1Image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1100&q=85',
  promoCard2Title: 'LATEST STYLES AND INNOVATIONS IN WORKOUT GEAR',
  promoCard2Tag: 'TECHNICAL / GEAR',
  promoCard2Image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1100&q=85',
  featureBannerTag: 'LEVEL UP',
  featureBannerTitleLine1: 'WITH THE LATEST IN',
  featureBannerTitleLine2: 'WORKOUT WEAR.',
  featureBannerSubtext: 'Precision-cut technical layers engineered for athletes who train without limits.',
  featureBannerImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=85',
  catalogTitleLine1: 'FRESH FITS FOR YOUR',
  catalogTitleLine2: 'NEXT WORKOUT!',
  catalogSubtitle: 'NEW ARRIVAL',
  lookbookSectionTitle: 'SEASONAL LOOKBOOK ARCHIVE',
  lookbookCards: DEFAULT_LOOKBOOK_CARDS,
  whatsappNumber: '8801700000000',
  telegramUsername: 'rrwear_official',
  messengerUsername: 'rrwear.official'
};

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-men',
    name: 'MEN',
    description: 'Technical training layers, heavyweight hoodies, and tapered performance joggers.',
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80',
    banner: ''
  },
  {
    id: 'cat-women',
    name: 'WOMEN',
    description: 'Sculpted seamless compression sets, cropped shells, and studio essentials.',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=80',
    banner: ''
  },
  {
    id: 'cat-trending',
    name: 'TRENDING',
    description: 'Most-wanted seasonal drops and limited streetwear collaborations.',
    image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
    banner: ''
  },
  {
    id: 'cat-seasonal',
    name: 'SEASONAL',
    description: 'All-weather windbreakers, thermal fleeces, and breathable summer tanks.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    banner: ''
  },
  {
    id: 'cat-accessories',
    name: 'ACCESSORIES',
    description: 'Tactical crossbody bags, performance caps, and compression sleeves.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    banner: ''
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'R&R x Equinox Lycra Set',
    price: 160,
    categoryId: 'cat-men',
    visibility: 'published',
    description:
      'Engineered with 4-way stretch technical Lycra and matte-black brushed fleece. Designed for high-output conditioning and seamless street-to-gym transitions.',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85'
    ],
    videos: [],
    specifications: [
      { label: 'Fabric', value: '420GSM Cotton-Lycra Blend' },
      { label: 'Fit', value: 'Athletic Relaxed' },
      { label: 'Weather Rating', value: 'All-Season Breathable' },
      { label: 'Care', value: 'Cold Wash, Hang Dry' }
    ],
    createdAt: Date.now() - 80000
  },
  {
    id: 'prod-2',
    name: 'Desert Sand Heavy Hoodie',
    price: 128,
    categoryId: 'cat-trending',
    visibility: 'published',
    description:
      'Garment-dyed desert sand heavyweight pullover paired with breathable mesh training shorts. Features dropped shoulders and tonal R&R emblem embroidery.',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?auto=format&fit=crop&w=900&q=85'
    ],
    videos: [],
    specifications: [
      { label: 'Material', value: '100% Organic French Terry' },
      { label: 'Weight', value: '460 GSM Heavyweight' },
      { label: 'Fit', value: 'Boxy Street Fit' }
    ],
    createdAt: Date.now() - 70000
  },
  {
    id: 'prod-3',
    name: 'Stealth Olive Cargo Kit',
    price: 160,
    categoryId: 'cat-seasonal',
    visibility: 'published',
    description:
      'Water-repellent olive technical shell jacket and articulated cargo joggers built for outdoor cold-weather sessions and urban mobility.',
    images: [
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85'
    ],
    videos: [],
    specifications: [
      { label: 'Shell', value: 'DWR Coated Ripstop Nylon' },
      { label: 'Zippers', value: 'YKK AquaGuard Matte' },
      { label: 'Fit', value: 'Tapered Articulated' }
    ],
    createdAt: Date.now() - 60000
  },
  {
    id: 'prod-4',
    name: 'Aero Silver Quarter-Zip',
    price: 118,
    categoryId: 'cat-men',
    visibility: 'published',
    description:
      'Ultra-lightweight wind-resistant quarter-zip anorak in reflective mist grey with laser-perforated underarm ventilation zones.',
    images: ['https://images.unsplash.com/photo-1509942774463-acf339cf87d5?auto=format&fit=crop&w=900&q=85'],
    videos: [],
    specifications: [
      { label: 'Fabric', value: '88% Polyamide, 12% Elastane' },
      { label: 'Ventilation', value: 'Laser-Cut Mesh Panels' },
      { label: 'Fit', value: 'True to Size' }
    ],
    createdAt: Date.now() - 50000
  },
  {
    id: 'prod-5',
    name: 'Obsidian Compression Tee',
    price: 88,
    categoryId: 'cat-men',
    visibility: 'published',
    description:
      'Second-skin moisture-wicking training tee in deep obsidian with anti-odor silver-ion treatment and flatlock seams.',
    images: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85'],
    videos: [],
    specifications: [
      { label: 'Technology', value: 'DryCore Silver-Ion Weave' },
      { label: 'Stretch', value: '360° Recovery Stretch' }
    ],
    createdAt: Date.now() - 40000
  },
  {
    id: 'prod-6',
    name: 'Woodland Camo Tech Jacket',
    price: 155,
    categoryId: 'cat-trending',
    visibility: 'published',
    description:
      'Limited-edition tactical woodland camo windbreaker featuring storm hood, concealed zip pockets, and elastic drawcord hem.',
    images: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85'],
    videos: [],
    specifications: [
      { label: 'Edition', value: 'Limited Seasonal Drop' },
      { label: 'Lining', value: 'Breathable Micro-Mesh' }
    ],
    createdAt: Date.now() - 30000
  },
  {
    id: 'prod-7',
    name: 'Sculpt Studio Ribbed Set',
    price: 116,
    categoryId: 'cat-women',
    visibility: 'published',
    description:
      'High-waisted seamless compression leggings paired with a long-sleeve sculpted zip crop top in warm taupe.',
    images: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=85'],
    videos: [],
    specifications: [
      { label: 'Support', value: 'High-Compression Sculpt' },
      { label: 'Fabric', value: 'ButterSoft Seamless Knit' }
    ],
    createdAt: Date.now() - 20000
  },
  {
    id: 'prod-8',
    name: 'Tactical Crossbody Sling Rig',
    price: 85,
    categoryId: 'cat-accessories',
    visibility: 'published',
    description:
      'Weatherproof ballistic Cordura chest & crossbody sling bag with quick-release magnetic buckle and padded phone sleeve.',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85'],
    videos: [],
    specifications: [
      { label: 'Material', value: '1000D Ballistic Cordura' },
      { label: 'Hardware', value: 'Fidlock Magnetic Buckle' }
    ],
    createdAt: Date.now() - 10000
  }
];

function loadSavedBag() {
  try {
    const raw = localStorage.getItem('rr_wear_bag');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveBagToStorage(bag) {
  try {
    localStorage.setItem('rr_wear_bag', JSON.stringify(bag));
  } catch (e) {}
}

// ============================================================================
// 5. GLOBAL APPLICATION STATE
// ============================================================================
const state = {
  theme: 'light',
  isOwnerAuthenticated: sessionStorage.getItem('rr_wear_owner_auth') === 'true',
  ownerAuthRecord: null,
  siteSettings: { ...DEFAULT_SITE_SETTINGS },
  categories: [...DEFAULT_CATEGORIES],
  products: [...DEFAULT_PRODUCTS],
  isDataLoaded: false,
  isSavingToGithub: false,

  // Customer Shopping Bag State
  bag: loadSavedBag(),
  bagModalOpen: false,
  shopModalBagItems: null,

  // Storefront Routing & UI
  activeView: 'home', // 'home' | 'product-details' | 'login' | 'dashboard'
  selectedProductId: null,
  selectedMediaIndex: 0,
  selectedCategoryFilter: 'ALL',
  searchQuery: '',
  mobileMenuOpen: false,
  heroAnimPlayed: false,

  // Modals
  shopModalProduct: null,
  heroVideoOpen: false,

  // Login State
  loginForgotMode: false,
  loginResetSent: false,
  loginShowPassword: false,
  loginError: '',
  loginEmail: '',
  loginPassword: '',

  // Dashboard State
  dashboardTab: 'overview', // 'overview' | 'products' | 'categories' | 'add-product' | 'customization' | 'social'
  dashboardSidebarOpen: false,
  dashProductQuery: '',
  dashProductCatFilter: 'ALL',
  deleteProductTarget: null,

  // Product Form State
  editingProductId: null,
  prodForm: {
    name: '',
    price: '',
    categoryId: 'cat-men',
    visibility: 'published',
    description: '',
    images: [],
    videos: [],
    specifications: [
      { label: 'Material', value: '' },
      { label: 'Fit', value: '' }
    ]
  },

  // Category Form State
  editingCategoryId: null,
  catForm: {
    name: '',
    description: '',
    image: '',
    banner: ''
  },
  deleteCategoryModal: null,
  reassignCategoryId: '',

  // Customization Form State
  customSubTab: 'brand', // 'brand' | 'hero' | 'editorial' | 'lookbook'
  customForm: JSON.parse(JSON.stringify(DEFAULT_SITE_SETTINGS))
};

function getBagTotalCount() {
  return state.bag.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function getBagTotalAmount() {
  return state.bag.reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 1), 0);
}

function addToBag(product) {
  if (!product) return;
  const existing = state.bag.find((item) => item.id === product.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    state.bag.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image: product.images?.[0] || '',
      qty: 1
    });
  }
  saveBagToStorage(state.bag);
}

let toastTimer = null;
function showToast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  root.innerHTML = `
    <div class="fixed bottom-5 right-5 z-50 max-w-sm bg-[#0A0A0A] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-3 text-xs font-ui font-medium animate-modal-in">
      <span class="w-2 h-2 rounded-full shrink-0 ${type === 'error' ? 'bg-red-400' : 'bg-cyan-400'}"></span>
      <span class="flex-1">${escapeHtml(message)}</span>
      <button data-action="close-toast" class="text-white/60 hover:text-white">
        <i data-lucide="x" class="w-3.5 h-3.5 pointer-events-none"></i>
      </button>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    root.innerHTML = '';
  }, 4200);
}

// ============================================================================
// 6. LOAD LIVE STORE DATA FROM GITHUB REPOSITORY (PERMANENT ACROSS REFRESH)
// ============================================================================
function applyStorePayload(data) {
  if (!data || typeof data !== 'object') return;
  if (data.siteSettings) {
    state.siteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...data.siteSettings,
      lookbookCards:
        Array.isArray(data.siteSettings.lookbookCards) && data.siteSettings.lookbookCards.length > 0
          ? data.siteSettings.lookbookCards
          : DEFAULT_LOOKBOOK_CARDS
    };
    state.customForm = JSON.parse(JSON.stringify(state.siteSettings));
  }
  if (Array.isArray(data.categories) && data.categories.length > 0) {
    state.categories = data.categories;
  }
  if (Array.isArray(data.products)) {
    state.products = data.products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  if (data.ownerAuthRecord) {
    state.ownerAuthRecord = data.ownerAuthRecord;
  }
}

async function initStoreFromGithub() {
  try {
    // 1. Load directly from GitHub Raw / API so every visitor & page refresh sees permanent changes
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataPath}?_t=${Date.now()}`;
    let loaded = false;

    const rawRes = await fetch(rawUrl, { cache: 'no-store' });
    if (rawRes.ok) {
      const jsonData = await rawRes.json();
      applyStorePayload(jsonData);
      loaded = true;
    } else {
      // Fallback to GitHub Contents API (useful immediately after a commit before CDN refreshes)
      const apiFile = await githubGetFile(GITHUB_CONFIG.dataPath);
      if (apiFile && apiFile.content) {
        const jsonData = JSON.parse(base64ToUtf8(apiFile.content));
        applyStorePayload(jsonData);
        loaded = true;
      }
    }

    if (!loaded) {
      const backupRaw = localStorage.getItem('rr_wear_store_backup');
      if (backupRaw) {
        applyStorePayload(JSON.parse(backupRaw));
      }
    }
  } catch (err) {
    console.warn('GitHub store load notice:', err);
    try {
      const backupRaw = localStorage.getItem('rr_wear_store_backup');
      if (backupRaw) applyStorePayload(JSON.parse(backupRaw));
    } catch (e) {}
  } finally {
    state.isDataLoaded = true;
    render();
  }
}

// ============================================================================
// 7. ROUTING & NAVIGATION HELPERS
// ============================================================================
function handleHashChange() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('product/')) {
    state.selectedProductId = hash.replace('product/', '');
    state.selectedMediaIndex = 0;
    state.activeView = 'product-details';
  } else if (hash === 'login') {
    state.activeView = state.isOwnerAuthenticated ? 'dashboard' : 'login';
  } else if (hash === 'dashboard') {
    if (!state.isOwnerAuthenticated) {
      window.location.hash = 'login';
      state.activeView = 'login';
    } else {
      state.activeView = 'dashboard';
    }
  } else {
    state.activeView = 'home';
  }
  render();
}

function navigateTo(view, productId = null) {
  if (view === 'dashboard' && !state.isOwnerAuthenticated) {
    window.location.hash = 'login';
    state.activeView = 'login';
    render();
    return;
  }
  if (view === 'product-details' && productId) {
    state.selectedProductId = productId;
    state.selectedMediaIndex = 0;
    window.location.hash = `product/${productId}`;
    state.activeView = 'product-details';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (view === 'home') {
    state.heroAnimPlayed = false;
  }
  window.location.hash = view === 'home' ? '' : view;
  state.activeView = view;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToCatalog(categoryId = 'ALL') {
  state.selectedCategoryFilter = categoryId;
  if (state.activeView !== 'home') {
    navigateTo('home');
    setTimeout(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  } else {
    render();
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function getCategoryName(catId) {
  const found = state.categories.find((c) => c.id === catId);
  return found ? found.name : 'GENERAL';
}

// ============================================================================
// 8. STOREFRONT RENDERING
// ============================================================================
function renderProductCardHtml(product, categoryNameOverride = null) {
  const isDark = state.theme === 'dark';
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80';
  const hasVideo = product.videos && product.videos.length > 0;
  const catName = categoryNameOverride || getCategoryName(product.categoryId);

  return `
    <div class="group relative rounded-[26px] overflow-hidden aspect-[3/3.9] shadow-sm hover:shadow-2xl transition-all duration-500 border ${
      isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#EAECEF] border-black/5'
    }">
      <img
        src="${escapeHtml(primaryImage)}"
        alt="${escapeHtml(product.name)}"
        data-action="open-product"
        data-id="${escapeHtml(product.id)}"
        class="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      <div
        data-action="open-product"
        data-id="${escapeHtml(product.id)}"
        class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15 cursor-pointer"
      ></div>

      <!-- Top-Right Floating Pills -->
      <div class="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
        ${
          hasVideo
            ? `<span title="Includes Product Video" class="w-7 h-7 rounded-full bg-black/75 backdrop-blur-md text-cyan-300 flex items-center justify-center shadow-sm">
                <i data-lucide="video" class="w-3.5 h-3.5"></i>
              </span>`
            : ''
        }
        <span class="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#0A0A0A] font-ui text-[10px] font-bold uppercase tracking-wider shadow-sm">
          ${escapeHtml(catName)}
        </span>
        <button
          data-action="open-product"
          data-id="${escapeHtml(product.id)}"
          title="View Product Details"
          class="w-7 h-7 rounded-full bg-white/95 hover:bg-white text-[#0A0A0A] flex items-center justify-center shadow-sm transition-transform hover:scale-110"
        >
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <!-- Bottom Floating Frosted Glass Capsule -->
      <div class="absolute inset-x-3 bottom-3 z-10 backdrop-blur-xl rounded-2xl p-3 shadow-lg border flex items-center justify-between gap-2 transition-colors ${
        isDark
          ? 'bg-[#121216]/90 border-white/15 text-white'
          : 'bg-white/95 border-white text-[#0A0A0A]'
      }">
        <div data-action="open-product" data-id="${escapeHtml(product.id)}" class="min-w-0 cursor-pointer flex-1">
          <h3 class="font-ui text-xs font-bold truncate group-hover:underline">
            ${escapeHtml(product.name)}
          </h3>
          <p class="font-ui text-[11px] font-semibold mt-0.5 ${isDark ? 'text-cyan-400' : 'text-[#6E7378]'}">
            USD ${Number(product.price || 0).toFixed(2)}
          </p>
        </div>
        <button
          data-action="open-shop"
          data-id="${escapeHtml(product.id)}"
          class="font-ui text-[10px] font-bold uppercase tracking-[0.1em] px-3.5 py-2.5 rounded-xl inline-flex items-center gap-1 shrink-0 transition-all shadow-sm active:scale-95 ${
            isDark
              ? 'bg-white text-[#09090B] hover:bg-zinc-200'
              : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
          }"
        >
          SHOP
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `;
}

function renderProductDetailsView(publishedProducts) {
  const isDark = state.theme === 'dark';
  const product = state.products.find((p) => p.id === state.selectedProductId);
  if (!product) {
    navigateTo('home');
    return '';
  }

  const categoryName = getCategoryName(product.categoryId);
  const mediaItems = [];
  (product.images || []).forEach((url, idx) => mediaItems.push({ type: 'image', url, id: `img-${idx}` }));
  (product.videos || []).forEach((vid, idx) => {
    const url = typeof vid === 'string' ? vid : vid.url;
    const name = typeof vid === 'string' ? `Video ${idx + 1}` : vid.name || `Video ${idx + 1}`;
    mediaItems.push({ type: 'video', url, name, id: `vid-${idx}` });
  });
  if (mediaItems.length === 0) {
    mediaItems.push({
      type: 'image',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
      id: 'fallback'
    });
  }

  const safeIdx = Math.min(state.selectedMediaIndex, mediaItems.length - 1);
  const activeMedia = mediaItems[safeIdx];
  const relatedProducts = publishedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return `
    <div class="space-y-6 animate-modal-in">
      <!-- Breadcrumb Bar -->
      <div class="rounded-full px-5 py-3 flex items-center justify-between shadow-sm border ${
        isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-white'
      }">
        <button data-action="nav-home" class="inline-flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-wider hover:opacity-70 transition-opacity">
          <i data-lucide="arrow-left" class="w-4 h-4"></i>
          BACK TO STORE
        </button>
        <span class="font-ui text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
          ${escapeHtml(categoryName)} / ${escapeHtml(product.name)}
        </span>
      </div>

      <!-- Main Product Showcase -->
      <div class="rounded-[32px] p-5 sm:p-10 shadow-sm border grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ${
        isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-white'
      }">
        <!-- Left Gallery -->
        <div class="lg:col-span-7 space-y-4">
          <div class="relative rounded-[26px] overflow-hidden bg-[#141619] aspect-[4/4.3] flex items-center justify-center shadow-inner">
            ${
              activeMedia.type === 'video'
                ? `<video src="${escapeHtml(activeMedia.url)}" controls autoplay playsinline class="w-full h-full object-contain bg-black"></video>`
                : `<img src="${escapeHtml(activeMedia.url)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover transition-all duration-500" />`
            }
            ${
              mediaItems.length > 1
                ? `<button data-action="media-prev" data-len="${mediaItems.length}" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0A0A0A] flex items-center justify-center shadow-md">
                    <i data-lucide="chevron-left" class="w-5 h-5"></i>
                  </button>
                  <button data-action="media-next" data-len="${mediaItems.length}" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#0A0A0A] flex items-center justify-center shadow-md">
                    <i data-lucide="chevron-right" class="w-5 h-5"></i>
                  </button>`
                : ''
            }
            <span class="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white font-ui text-[10px] font-bold uppercase tracking-wider">
              ${activeMedia.type === 'video' ? 'PRODUCT VIDEO' : `PHOTO ${safeIdx + 1} / ${mediaItems.length}`}
            </span>
          </div>

          ${
            mediaItems.length > 1
              ? `<div class="flex items-center gap-3 overflow-x-auto pb-1">
                  ${mediaItems
                    .map(
                      (item, idx) => `
                    <button data-action="media-select" data-idx="${idx}" class="relative w-20 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                        idx === safeIdx
                          ? isDark
                            ? 'border-cyan-400 scale-[1.03] shadow-md'
                            : 'border-[#0A0A0A] scale-[1.03] shadow-md'
                          : 'border-transparent opacity-65 hover:opacity-100'
                      }">
                      ${
                        item.type === 'video'
                          ? `<div class="w-full h-full bg-[#0A0A0A] flex flex-col items-center justify-center text-white p-1">
                              <i data-lucide="play" class="w-5 h-5 fill-current text-cyan-400 mb-1"></i>
                              <span class="font-ui text-[9px] font-bold uppercase tracking-wider">VIDEO</span>
                            </div>`
                          : `<img src="${escapeHtml(item.url)}" alt="" class="w-full h-full object-cover" />`
                      }
                    </button>
                  `
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>

        <!-- Right Info -->
        <div class="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div class="space-y-5">
            <div class="flex items-center gap-2">
              <span class="px-3.5 py-1 rounded-full font-ui text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-white/10 text-white' : 'bg-[#F2F4F6] text-[#0A0A0A]'
              }">
                ${escapeHtml(categoryName)}
              </span>
              <span class="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 font-ui text-[10px] font-bold uppercase tracking-wider">
                IN STOCK
              </span>
            </div>

            <div>
              <h1 class="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-[-0.03em] leading-tight">
                ${escapeHtml(product.name)}
              </h1>
              <p class="font-ui text-xl sm:text-2xl font-bold mt-2 ${isDark ? 'text-cyan-400' : 'text-[#0A0A0A]'}">
                USD ${Number(product.price || 0).toFixed(2)}
              </p>
            </div>

            <p class="text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-[#525860]'}">
              ${escapeHtml(product.description)}
            </p>

            ${
              product.specifications && product.specifications.length > 0
                ? `<div class="pt-4 border-t space-y-2.5 ${isDark ? 'border-white/10' : 'border-black/10'}">
                    <h3 class="font-ui text-xs font-bold uppercase tracking-wider">TECHNICAL SPECIFICATIONS</h3>
                    <div class="rounded-2xl p-4 space-y-2.5 ${isDark ? 'bg-[#1B1B21]' : 'bg-[#F7F8F9]'}">
                      ${product.specifications
                        .map(
                          (spec) => `
                        <div class="flex items-center justify-between text-xs border-b last:border-0 pb-2 last:pb-0 ${
                          isDark ? 'border-white/5' : 'border-black/5'
                        }">
                          <span class="${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">${escapeHtml(spec.label)}</span>
                          <span class="font-ui font-bold">${escapeHtml(spec.value)}</span>
                        </div>
                      `
                        )
                        .join('')}
                    </div>
                  </div>`
                : ''
            }
          </div>

          <div class="pt-4 space-y-3">
            <button data-action="open-shop" data-id="${escapeHtml(product.id)}" class="w-full font-ui text-xs font-extrabold uppercase tracking-[0.12em] py-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
              isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
            }">
              SHOP NOW VIA SOCIAL MEDIA
              <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            </button>
            <p class="text-[11px] text-center ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
              Instant direct ordering via WhatsApp, Telegram, or Facebook Messenger.
            </p>
          </div>
        </div>
      </div>

      ${
        relatedProducts.length > 0
          ? `<div class="rounded-[32px] p-6 sm:p-10 border space-y-6 ${
              isDark ? 'bg-[#121216] border-white/10' : 'bg-[#F4F5F7] border-white'
            }">
              <h2 class="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-[-0.02em]">
                MORE PERFORMANCE GEAR
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                ${relatedProducts.map((rel) => renderProductCardHtml(rel, 'R&R GEAR')).join('')}
              </div>
            </div>`
          : ''
      }
    </div>
  `;
}

function renderStorefrontView() {
  const isDark = state.theme === 'dark';
  const s = state.siteSettings;
  const publishedProducts = state.products.filter((p) => p.visibility !== 'draft');
  const bagCount = getBagTotalCount();

  const filteredStoreProducts = publishedProducts.filter((prod) => {
    const matchesCat = state.selectedCategoryFilter === 'ALL' || prod.categoryId === state.selectedCategoryFilter;
    const q = state.searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      (prod.description && prod.description.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const lookbookCards = s.lookbookCards || DEFAULT_LOOKBOOK_CARDS;
  const cleanPhone = (s.whatsappNumber || '').replace(/[^0-9]/g, '');
  const rawTg = (s.telegramUsername || '').trim();
  const tgHref = rawTg.startsWith('http') ? rawTg : `https://t.me/${rawTg.replace(/^@/, '')}`;
  const rawMsg = (s.messengerUsername || '').trim();
  const msgHref = rawMsg.startsWith('http') ? rawMsg : `https://m.me/${rawMsg.replace(/^@/, '')}`;

  return `
    <div class="min-h-screen transition-colors duration-300 antialiased ${
      isDark
        ? 'bg-[#09090B] text-[#F8FAFC] selection:bg-cyan-400 selection:text-black'
        : 'bg-[#E9EEF1] text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-white'
    }">
      <div class="max-w-[1440px] mx-auto px-2.5 sm:px-5 py-2.5 sm:py-4 space-y-5 sm:space-y-7">
        <!-- STICKY ARCHITECTURAL HEADER -->
        <header class="sticky top-2.5 z-40 ${!state.heroAnimPlayed ? 'animate-nav-drop' : ''}">
          <div class="backdrop-blur-xl rounded-full px-4 sm:px-7 py-2.5 border flex items-center justify-between relative transition-colors duration-300 ${
            isDark
              ? 'bg-[#121216]/85 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
              : 'bg-white/85 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
          }">
            <nav class="hidden lg:flex items-center gap-6 font-ui text-[11px] font-semibold tracking-[0.1em] uppercase">
              <button data-action="nav-home" class="transition-colors ${
                state.activeView === 'home' && state.selectedCategoryFilter === 'ALL'
                  ? isDark
                    ? 'text-white underline underline-offset-4'
                    : 'text-[#0A0A0A] underline underline-offset-4'
                  : isDark
                  ? 'text-zinc-400 hover:text-white'
                  : 'text-[#525860] hover:text-black'
              }">
                HOME
              </button>
              <button data-action="filter-cat" data-cat="ALL" class="transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-[#525860] hover:text-black'
              }">
                SHOP
              </button>
              ${state.categories
                .slice(0, 3)
                .map(
                  (cat) => `
                <button data-action="filter-cat" data-cat="${escapeHtml(cat.id)}" class="transition-colors ${
                    state.selectedCategoryFilter === cat.id
                      ? isDark
                        ? 'text-cyan-400 font-bold'
                        : 'text-black font-bold'
                      : isDark
                      ? 'text-zinc-400 hover:text-white'
                      : 'text-[#525860] hover:text-black'
                  }">
                  ${escapeHtml(cat.name)}
                </button>
              `
                )
                .join('')}
            </nav>

            <!-- Mobile Hamburger -->
            <button data-action="toggle-mobile-menu" class="lg:hidden p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#0A0A0A]'
            }" aria-label="Toggle Menu">
              <i data-lucide="${state.mobileMenuOpen ? 'x' : 'menu'}" class="w-5 h-5"></i>
            </button>

            <!-- Center Brand Logo -->
            <button data-action="nav-home" class="lg:absolute lg:left-1/2 lg:-translate-x-1/2 flex items-center justify-center focus:outline-none">
              ${renderBrandLogo(s.logoUrl, s.brandName, 'md', !isDark)}
            </button>

            <!-- Right Controls -->
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="hidden xl:flex items-center gap-5 mr-2 font-ui text-[11px] font-semibold tracking-[0.1em] uppercase">
                ${state.categories
                  .slice(3, 5)
                  .map(
                    (cat) => `
                  <button data-action="filter-cat" data-cat="${escapeHtml(cat.id)}" class="transition-colors ${
                      state.selectedCategoryFilter === cat.id
                        ? isDark
                          ? 'text-cyan-400 font-bold'
                          : 'text-black font-bold'
                        : isDark
                        ? 'text-zinc-400 hover:text-white'
                        : 'text-[#525860] hover:text-black'
                    }">
                    ${escapeHtml(cat.name)}
                  </button>
                `
                  )
                  .join('')}
              </div>

              <button data-action="focus-search" title="Search Gear" class="w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#F1F3F5] hover:bg-black/10 text-[#0A0A0A]'
              }">
                <i data-lucide="search" class="w-4 h-4"></i>
              </button>

              <button data-action="toggle-theme" title="${isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}" class="w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
                isDark
                  ? 'bg-[#1B1B21] border-white/15 text-amber-300 hover:bg-white/15'
                  : 'bg-[#F1F3F5] border-black/5 text-[#0A0A0A] hover:bg-black/10'
              }">
                <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
              </button>

              <div class="flex items-center gap-1.5">
                <button data-action="nav-portal" class="font-ui text-[11px] font-bold tracking-[0.1em] uppercase px-4 sm:px-5 py-2.5 rounded-full transition-all shadow-sm active:scale-95 ${
                  isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                }">
                  ${state.isOwnerAuthenticated ? 'DASHBOARD' : 'LOGIN'}
                </button>
                <button data-action="open-bag" title="Your Shopping Bag" class="relative flex w-9 h-9 rounded-full items-center justify-center transition-all shadow-sm active:scale-95 ${
                  isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                }">
                  <i data-lucide="shopping-bag" class="w-4 h-4 pointer-events-none"></i>
                  ${
                    bagCount > 0
                      ? `<span id="header-bag-badge" class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-400 text-[#09090B] font-ui text-[10px] font-extrabold flex items-center justify-center shadow">
                          ${bagCount}
                        </span>`
                      : ''
                  }
                </button>
              </div>
            </div>
          </div>

          ${
            state.mobileMenuOpen
              ? `<div class="lg:hidden mt-2 backdrop-blur-xl rounded-3xl p-5 shadow-xl border space-y-3 animate-modal-in ${
                  isDark ? 'bg-[#121216]/95 border-white/10 text-white' : 'bg-white/95 border-black/5 text-[#0A0A0A]'
                }">
                  <div class="flex flex-wrap gap-2">
                    <button data-action="nav-home" class="px-4 py-2 rounded-full text-xs font-ui font-semibold uppercase ${
                      isDark ? 'bg-white/10 text-white' : 'bg-[#F3F5F6] text-[#0A0A0A]'
                    }">HOME</button>
                    <button data-action="filter-cat" data-cat="ALL" class="px-4 py-2 rounded-full text-xs font-ui font-semibold uppercase ${
                      isDark ? 'bg-white/10 text-white' : 'bg-[#F3F5F6] text-[#0A0A0A]'
                    }">ALL PRODUCTS</button>
                    ${state.categories
                      .map(
                        (cat) => `
                      <button data-action="filter-cat" data-cat="${escapeHtml(cat.id)}" class="px-4 py-2 rounded-full text-xs font-ui font-semibold uppercase ${
                          isDark ? 'bg-white/10 text-white' : 'bg-[#F3F5F6] text-[#0A0A0A]'
                        }">${escapeHtml(cat.name)}</button>
                    `
                      )
                      .join('')}
                  </div>
                </div>`
              : ''
          }
        </header>

        ${
          state.activeView === 'product-details'
            ? renderProductDetailsView(publishedProducts)
            : `
          <main class="space-y-5 sm:space-y-7">
            <!-- SECTION 1: HERO BANNER -->
            <section id="hero-section" class="relative rounded-[28px] sm:rounded-[36px] overflow-hidden border shadow-sm pt-10 sm:pt-14 px-5 sm:px-12 pb-0 min-h-[630px] sm:min-h-[710px] flex flex-col justify-between transition-colors duration-300 ${
              isDark
                ? 'bg-gradient-to-b from-[#171920] via-[#121216] to-[#0E0E12] border-white/10'
                : 'bg-gradient-to-b from-[#CFDBE0] via-[#E5ECEF] to-[#F5F7F8] border-white'
            }">
              <div class="relative z-20 text-center max-w-5xl mx-auto">
                <h1 class="font-display text-3xl sm:text-5xl md:text-[64px] font-extrabold uppercase tracking-[-0.04em] leading-[0.98] ${
                  isDark ? 'text-white' : 'text-[#0A0A0A]'
                }">
                  <span class="block overflow-hidden pb-1">
                    <span class="block animate-mask-line-1">${escapeHtml(s.heroTitleLine1)}</span>
                  </span>
                  <span class="block overflow-hidden pb-1 min-h-[1.05em]">
                    <span id="hero-typewriter-target">${state.heroAnimPlayed ? escapeHtml(s.heroTitleLine2) : ''}</span><span id="hero-typewriter-cursor" class="typewriter-cursor ${state.heroAnimPlayed ? 'hidden' : ''}"></span>
                  </span>
                </h1>

                <div class="mt-6 flex flex-wrap items-center justify-center gap-3 animate-hero-cta">
                  <button data-action="filter-cat" data-cat="ALL" class="font-ui text-[11px] font-bold uppercase tracking-[0.12em] px-8 py-3.5 rounded-full transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ${
                    isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#22252A]'
                  }">
                    ${escapeHtml(s.heroPrimaryBtnText || 'SHOP NOW')}
                  </button>
                  <button data-action="filter-cat" data-cat="ALL" class="font-ui text-[11px] font-bold uppercase tracking-[0.12em] px-8 py-3.5 rounded-full transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 border ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/15 text-white border-white/15 backdrop-blur-md'
                      : 'bg-white hover:bg-[#F8FAFB] text-[#0A0A0A] border-black/5'
                  }">
                    ${escapeHtml(s.heroSecondaryBtnText || 'EXPLORE ALL')}
                  </button>
                </div>
              </div>

              <div class="relative z-10 mt-6 sm:mt-4 grid grid-cols-1 lg:grid-cols-12 items-end gap-6">
                <!-- Bottom-Left Thumbnails -->
                <div class="lg:col-span-3 pb-7 sm:pb-10 order-2 lg:order-1 flex flex-col items-start animate-hero-left">
                  <div class="flex -space-x-2.5 mb-3">
                    ${[s.heroThumb1, s.heroThumb2, s.heroThumb3]
                      .map(
                        (thumb, idx) => `
                      <img src="${escapeHtml(thumb || DEFAULT_SITE_SETTINGS.heroThumb1)}" alt="Editorial ${idx + 1}" class="w-10 h-10 rounded-full object-cover border-2 shadow-sm transition-transform duration-300 hover:scale-110 hover:z-10 ${
                          isDark ? 'border-[#121216]' : 'border-white'
                        }" />
                    `
                      )
                      .join('')}
                  </div>
                  <p class="text-[11px] sm:text-xs leading-relaxed max-w-[250px] ${
                    isDark ? 'text-zinc-400' : 'text-[#4B5259]'
                  }">
                    ${escapeHtml(s.heroDescription)}
                  </p>
                </div>

                <!-- Center Foreground Model with Venetian Blind Wipe -->
                <div class="lg:col-span-6 order-1 lg:order-2 flex justify-center items-end animate-hero-model">
                  <div class="relative w-full max-w-[450px] h-[360px] sm:h-[450px] rounded-t-[32px] overflow-hidden">
                    <img src="${escapeHtml(s.heroImage)}" alt="${escapeHtml(s.brandName)}" class="w-full h-full object-cover object-top transition-transform duration-700 ease-out hover:scale-[1.04]" />
                    ${
                      !state.heroAnimPlayed
                        ? `<div class="hero-blinds-overlay" aria-hidden="true">
                            ${[0, 1, 2, 3, 4, 5, 6]
                              .map(
                                (i) =>
                                  `<div class="hero-blind-slat ${
                                    isDark ? 'bg-[#121216]' : 'bg-[#DCE5E9]'
                                  }" style="animation-delay: ${0.32 + i * 0.055}s;"></div>`
                              )
                              .join('')}
                          </div>`
                        : ''
                    }
                    <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t ${
                      isDark
                        ? 'from-[#0E0E12] via-[#0E0E12]/45 to-transparent'
                        : 'from-[#F5F7F8] via-[#F5F7F8]/45 to-transparent'
                    }"></div>
                  </div>
                </div>

                <!-- Bottom-Right Floating Lookbook Video Card -->
                <div class="lg:col-span-3 pb-7 sm:pb-10 order-3 flex lg:justify-end animate-hero-right">
                  <button data-action="open-hero-video" class="group relative w-full sm:w-56 h-32 rounded-2xl overflow-hidden bg-[#16181B] shadow-xl border text-left focus:outline-none ${
                    isDark ? 'border-white/15' : 'border-white/60'
                  }">
                    <img src="${escapeHtml(s.heroVideoPreviewImg)}" alt="${escapeHtml(s.heroVideoPreviewTitle || 'Campaign Film')}" class="w-full h-full object-cover opacity-75 group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div class="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div class="w-11 h-11 rounded-full bg-white/95 text-[#0A0A0A] flex items-center justify-center shadow-lg animate-play-pulse group-hover:scale-110 transition-transform">
                        <i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i>
                      </div>
                    </div>
                    <span class="absolute bottom-2.5 left-3 font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-white/95">
                      ${escapeHtml(s.heroVideoPreviewTitle || 'LOOKBOOK FILM')}
                    </span>
                  </button>
                </div>
              </div>
            </section>

           <!-- SECTION 2: 3-COLUMN STAGGERED EDITORIAL SHOWCASE -->
            <section id="showcase-section" class="relative rounded-[28px] sm:rounded-[36px] border p-6 sm:p-12 overflow-hidden transition-colors duration-300 ${
              isDark ? 'bg-[#121216] border-white/10' : 'bg-[#F4F5F7] border-white'
            }">
              <div aria-hidden="true" class="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <span id="showcase-watermark-text" class="font-display text-[19vw] font-extrabold uppercase tracking-[-0.04em] leading-none transition-transform duration-150 ease-out ${
                  isDark ? 'text-white/[0.03]' : 'text-[#E3E7EC]'
                }">
                  ${escapeHtml(s.showcaseWatermark || 'WORKOUT')}
                </span>
              </div>

              <div class="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center max-w-6xl mx-auto">
                <!-- Left Column -->
                <div id="showcase-col-left" class="md:col-span-3 flex flex-col gap-4 md:-mt-16 transition-transform duration-150 ease-out">
                  <div class="showcase-card-enter rounded-2xl overflow-hidden aspect-[4/5] shadow-sm group relative ${isDark ? 'bg-[#1B1B21]' : 'bg-[#EAECEF]'}" data-delay="60">
                    <img src="${escapeHtml(s.showcaseLeftImg)}" alt="Performance detail" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="showcase-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6]
                        .map(
                          (i) =>
                            `<div class="showcase-blind-slat ${isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'}" style="animation-delay: ${0.12 + i * 0.05}s;"></div>`
                        )
                        .join('')}
                    </div>
                  </div>
                  <p class="showcase-caption-enter text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}" data-delay="380">
                    ${escapeHtml(s.showcaseLeftCaption)}
                  </p>
                </div>

                <!-- Center Column -->
                <div id="showcase-col-center" class="md:col-span-6 flex justify-center">
                  <div class="showcase-card-enter w-full max-w-[360px] rounded-[28px] overflow-hidden aspect-[3/4] bg-[#1C1E21] shadow-lg group relative" data-delay="180">
                    <img src="${escapeHtml(s.showcaseCenterImg)}" alt="Monochrome athlete" class="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="showcase-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6, 7, 8]
                        .map(
                          (i) =>
                            `<div class="showcase-blind-slat ${isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'}" style="animation-delay: ${0.22 + i * 0.048}s;"></div>`
                        )
                        .join('')}
                    </div>
                  </div>
                </div>

                <!-- Right Column -->
                <div id="showcase-col-right" class="md:col-span-3 flex flex-col gap-4 md:mt-20 transition-transform duration-150 ease-out">
                  <p class="showcase-caption-enter text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}" data-delay="460">
                    ${escapeHtml(s.showcaseRightCaption)}
                  </p>
                  <div class="showcase-card-enter rounded-2xl overflow-hidden aspect-[4/5] shadow-sm group relative ${isDark ? 'bg-[#1B1B21]' : 'bg-[#EAECEF]'}" data-delay="300">
                    <img src="${escapeHtml(s.showcaseRightImg)}" alt="Compression fit" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div class="showcase-blinds-overlay" aria-hidden="true">
                      ${[0, 1, 2, 3, 4, 5, 6]
                        .map(
                          (i) =>
                            `<div class="showcase-blind-slat ${isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'}" style="animation-delay: ${0.32 + i * 0.05}s;"></div>`
                        )
                        .join('')}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- SECTION 3: 2-COLUMN PERFORMANCE EDITORIAL SPLIT -->
            <section id="promo-section" class="rounded-[28px] sm:rounded-[36px] border p-6 sm:p-12 transition-colors duration-300 ${
              isDark ? 'bg-[#121216] border-white/10' : 'bg-[#F4F5F7] border-white'
            }">
              <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7 sm:mb-9">
                <div>
                  <span class="block overflow-hidden mb-2">
                    <span class="promo-text-line block font-ui text-[10px] font-bold uppercase tracking-[0.16em] ${
                      isDark ? 'text-cyan-400' : 'text-[#6E7378]'
                    }" style="transition-delay: 0ms;">OUTERWEAR</span>
                  </span>
                  <h2 class="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-[-0.035em] leading-[1.03] ${
                    isDark ? 'text-white' : 'text-[#0A0A0A]'
                  }">
                    <span class="block overflow-hidden pb-0.5">
                      <span class="promo-text-line block" style="transition-delay: 90ms;">${escapeHtml(s.promoSectionTitleLine1)}</span>
                    </span>
                    <span class="block overflow-hidden pb-0.5">
                      <span class="promo-text-line block" style="transition-delay: 180ms;">${escapeHtml(s.promoSectionTitleLine2)}</span>
                    </span>
                  </h2>
                </div>
                <p class="promo-subtitle-fade text-xs max-w-[270px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}" style="transition-delay: 260ms;">
                  ${escapeHtml(s.promoSectionSubtitle)}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <!-- CARD 1 -->
                <div data-action="filter-cat" data-cat="ALL" class="group relative rounded-[28px] overflow-hidden aspect-[4/4.3] bg-[#22252A] cursor-pointer shadow-md">
                  <div class="w-full h-full grid grid-cols-5 group-hover:scale-105 transition-transform duration-700 ease-out">
                    ${renderPromoSlices(s.promoCard1Image, s.promoCard1Title, 120, 5)}
                  </div>
                  <div class="promo-overlay-fade absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/15" style="transition-delay: 720ms;"></div>
                  <span class="promo-tag-reveal absolute top-5 right-5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white font-ui text-[10px] font-bold uppercase tracking-[0.12em] border border-white/20" style="transition-delay: 820ms;">
                    ${escapeHtml(s.promoCard1Tag)}
                  </span>
                  <div class="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-4">
                    <div class="overflow-hidden max-w-[290px]">
                      <h3 class="promo-card-title font-display text-white text-xl sm:text-2xl font-extrabold uppercase tracking-[-0.03em] leading-tight" style="transition-delay: 900ms;">
                        ${escapeHtml(s.promoCard1Title)}
                      </h3>
                    </div>
                    <span class="promo-arrow-reveal shrink-0" style="transition-delay: 980ms;">
                      <span class="w-11 h-11 rounded-full bg-white text-[#0A0A0A] flex items-center justify-center transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-12 shadow-lg">
                        <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                      </span>
                    </span>
                  </div>
                </div>

                <!-- CARD 2 -->
                <div data-action="filter-cat" data-cat="ALL" class="group relative rounded-[28px] overflow-hidden aspect-[4/4.3] bg-[#1A1C1E] cursor-pointer shadow-md">
                  <div class="w-full h-full grid grid-cols-5 group-hover:scale-105 transition-transform duration-700 ease-out">
                    ${renderPromoSlices(s.promoCard2Image, s.promoCard2Title, 320, 5)}
                  </div>
                  <div class="promo-overlay-fade absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/15" style="transition-delay: 920ms;"></div>
                  <span class="promo-tag-reveal absolute top-5 right-5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white font-ui text-[10px] font-bold uppercase tracking-[0.12em] border border-white/20" style="transition-delay: 1020ms;">
                    ${escapeHtml(s.promoCard2Tag)}
                  </span>
                  <div class="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-4">
                    <div class="overflow-hidden max-w-[300px]">
                      <h3 class="promo-card-title font-display text-white text-xl sm:text-2xl font-extrabold uppercase tracking-[-0.03em] leading-tight" style="transition-delay: 1100ms;">
                        ${escapeHtml(s.promoCard2Title)}
                      </h3>
                    </div>
                    <span class="promo-arrow-reveal shrink-0" style="transition-delay: 1180ms;">
                      <span class="w-11 h-11 rounded-full bg-white text-[#0A0A0A] flex items-center justify-center transition-transform duration-500 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-12 shadow-lg">
                        <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <!-- SECTION 4: CENTERED FEATURE STATEMENT BANNER -->
            <section id="feature-banner-section" class="relative rounded-[28px] sm:rounded-[36px] border py-12 sm:py-16 px-5 overflow-hidden transition-colors duration-300 ${
              isDark ? 'bg-[#121216] border-white/10' : 'bg-[#F4F5F7] border-white'
            }">
              <div aria-hidden="true" class="pointer-events-none select-none absolute inset-0 flex flex-col items-center justify-center text-center leading-none overflow-hidden">
                <div id="feature-wm-top-track" class="will-change-transform">
                  <span class="feature-wm-top block font-display text-[11vw] font-extrabold uppercase tracking-[-0.04em] ${
                    isDark ? 'text-white/[0.03]' : 'text-[#E3E7EC]'
                  }">FRESH FITS</span>
                </div>
                <div id="feature-wm-bottom-track" class="mt-4 will-change-transform">
                  <span class="feature-wm-bottom block font-display text-[11vw] font-extrabold uppercase tracking-[-0.04em] ${
                    isDark ? 'text-white/[0.03]' : 'text-[#E3E7EC]'
                  }">YOUR WORKOUT</span>
                </div>
              </div>

              <div class="feature-card-shell relative z-10 max-w-md mx-auto">
                <div class="relative rounded-[30px] overflow-hidden aspect-[3/3.85] bg-[#16181B] shadow-2xl group">
                  <div class="feature-photo-zoom w-full h-full">
                    <img src="${escapeHtml(s.featureBannerImage)}" alt="${escapeHtml(s.featureBannerTitleLine1)}" class="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                  <div class="feature-card-shade absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/70"></div>

                  <div class="absolute top-6 inset-x-6 text-center text-white">
                    <div class="feature-logo-reveal flex justify-center mb-2">
                      ${renderBrandLogo(s.logoUrl, s.brandName, 'sm', false)}
                    </div>
                    <span class="feature-tag-reveal inline-block font-ui text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300 mb-1.5">
                      ${escapeHtml(s.featureBannerTag)}
                    </span>
                    <h2 class="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-[-0.03em] leading-tight">
                      <span class="block overflow-hidden pb-0.5">
                        <span class="feature-title-line feature-title-line-1 block">${escapeHtml(s.featureBannerTitleLine1)}</span>
                      </span>
                      <span class="block overflow-hidden pb-0.5">
                        <span class="feature-title-line feature-title-line-2 block">${escapeHtml(s.featureBannerTitleLine2)}</span>
                      </span>
                    </h2>
                    ${
                      s.featureBannerSubtext
                        ? `<p class="feature-subtext-reveal text-[11px] text-white/75 mt-2 max-w-xs mx-auto leading-relaxed">${escapeHtml(s.featureBannerSubtext)}</p>`
                        : ''
                    }
                  </div>

                  <div class="feature-cta-reveal absolute bottom-6 inset-x-0 flex justify-center">
                    <button data-action="filter-cat" data-cat="ALL" class="bg-white/95 hover:bg-white text-[#0A0A0A] font-ui text-[11px] font-bold uppercase tracking-[0.12em] px-6 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
                      EXPLORE COLLECTION
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- SECTION 5: PRODUCT CATALOG GRID -->
            <section id="catalog" class="rounded-[28px] sm:rounded-[36px] border p-6 sm:p-12 transition-colors duration-300 ${
              isDark ? 'bg-[#121216] border-white/10' : 'bg-[#F4F5F7] border-white'
            }">
              <div class="scroll-reveal reveal-rise flex flex-col md:flex-row items-center justify-between gap-4 mb-7">
                <span class="font-ui text-[10px] font-bold uppercase tracking-[0.16em] ${
                  isDark ? 'text-cyan-400' : 'text-[#6E7378]'
                }">
                  ${escapeHtml(s.catalogSubtitle || 'NEW ARRIVAL')}
                </span>
                <h2 class="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-[-0.035em] leading-[1.03] text-center ${
                  isDark ? 'text-white' : 'text-[#0A0A0A]'
                }">
                  ${escapeHtml(s.catalogTitleLine1 || 'FRESH FITS FOR YOUR')}<br />${escapeHtml(s.catalogTitleLine2 || 'NEXT WORKOUT!')}
                </h2>
                <button data-action="reset-catalog" class="font-ui text-[10px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#6E7378] hover:text-[#0A0A0A]'
                }">
                  ALL GEAR (${publishedProducts.length})
                </button>
              </div>

              <!-- Category Filter Pills + Search Input -->
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div class="flex flex-wrap items-center justify-center gap-2">
                  <button data-action="set-cat-filter" data-cat="ALL" class="px-4 py-2 rounded-full font-ui text-[11px] font-bold uppercase tracking-[0.08em] transition-all ${
                    state.selectedCategoryFilter === 'ALL'
                      ? isDark
                        ? 'bg-white text-[#09090B] shadow-sm'
                        : 'bg-[#0A0A0A] text-white shadow-sm'
                      : isDark
                      ? 'bg-[#1B1B21] text-zinc-300 hover:bg-white/10 border border-white/10'
                      : 'bg-white text-[#4A5056] hover:bg-black/5 border border-black/5'
                  }">
                    ALL (${publishedProducts.length})
                  </button>
                  ${state.categories
                    .map((cat) => {
                      const count = publishedProducts.filter((p) => p.categoryId === cat.id).length;
                      return `
                      <button data-action="set-cat-filter" data-cat="${escapeHtml(cat.id)}" class="px-4 py-2 rounded-full font-ui text-[11px] font-bold uppercase tracking-[0.08em] transition-all ${
                        state.selectedCategoryFilter === cat.id
                          ? isDark
                            ? 'bg-white text-[#09090B] shadow-sm'
                            : 'bg-[#0A0A0A] text-white shadow-sm'
                          : isDark
                          ? 'bg-[#1B1B21] text-zinc-300 hover:bg-white/10 border border-white/10'
                          : 'bg-white text-[#4A5056] hover:bg-black/5 border border-black/5'
                      }">
                        ${escapeHtml(cat.name)} (${count})
                      </button>
                    `;
                    })
                    .join('')}
                </div>

                <div class="relative w-full sm:w-64">
                  <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-zinc-400' : 'text-[#6E7378]'
                  }"></i>
                  <input
                    id="store-search-input"
                    type="text"
                    value="${escapeHtml(state.searchQuery)}"
                    placeholder="Search gear..."
                    class="w-full rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none transition-colors border ${
                      isDark
                        ? 'bg-[#1B1B21] border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-400'
                        : 'bg-white border-black/10 text-[#0A0A0A] placeholder:text-[#8C939A] focus:border-[#0A0A0A]'
                    }"
                  />
                </div>
              </div>

              <!-- 4-Column Product Grid -->
              <div id="catalog-grid-container">
                ${renderCatalogGridHtml(filteredStoreProducts)}
              </div>

              <div class="mt-9 flex items-center justify-center gap-1.5">
                <button data-action="reset-catalog" class="font-ui text-[11px] font-bold uppercase tracking-[0.1em] px-6 py-3 rounded-full transition-all shadow-sm ${
                  isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                }">
                  SEE ALL GEAR
                </button>
                <button data-action="reset-catalog" class="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                }" aria-label="See all gear">
                  <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                </button>
              </div>
            </section>

            <!-- SECTION 6: VERTICAL EDITORIAL LOOKBOOK STRIP -->
            <section class="relative rounded-[28px] sm:rounded-[36px] border p-6 sm:p-12 overflow-hidden transition-colors duration-300 ${
              isDark ? 'bg-[#121216] border-white/10' : 'bg-[#F4F5F7] border-white'
            }">
              <div class="scroll-reveal reveal-rise flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
                <div>
                  <span class="block font-ui text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5 ${
                    isDark ? 'text-cyan-400' : 'text-[#6E7378]'
                  }">LOOKBOOK / 2026</span>
                  <h2 class="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-[-0.035em] ${
                    isDark ? 'text-white' : 'text-[#0A0A0A]'
                  }">
                    ${escapeHtml(s.lookbookSectionTitle || 'SEASONAL LOOKBOOK ARCHIVE')}
                  </h2>
                </div>
                <span class="font-ui text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
                  Hover any fit to expand &amp; shop the look
                </span>
              </div>

              <div class="lookbook-strip flex flex-col lg:flex-row gap-4 lg:h-[520px]">
                ${lookbookCards
                  .map((card, idx) => {
                    const linkedProd =
                      publishedProducts.find((p) => p.id === card.linkedProductId) || publishedProducts[0];
                    return `
                    <div class="lookbook-card relative rounded-[26px] overflow-hidden bg-[#1B1B21] h-[380px] lg:h-full lg:flex-1 cursor-pointer group shadow-md">
                      <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25"></div>

                      <div class="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span class="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white font-ui text-[9px] font-bold uppercase tracking-[0.14em] border border-white/20">
                          ${escapeHtml(card.tag || 'SEASONAL FIT')}
                        </span>
                        <span class="font-ui text-[10px] font-bold text-white/80">0${idx + 1}</span>
                      </div>

                      <div class="absolute inset-x-5 bottom-5 flex flex-col items-start gap-3">
                        <div>
                          <span class="block font-ui text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-semibold">
                            ${escapeHtml(card.season || '2026 COLLECTION')}
                          </span>
                          <h3 class="font-display text-lg sm:text-xl font-extrabold uppercase tracking-[-0.02em] text-white leading-tight mt-0.5">
                            ${escapeHtml(card.title)}
                          </h3>
                        </div>
                        ${
                          linkedProd
                            ? `<button data-action="open-shop" data-id="${escapeHtml(linkedProd.id)}" class="lookbook-shop-btn bg-white hover:bg-zinc-100 text-[#0A0A0A] font-ui text-[10px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full shadow-lg inline-flex items-center gap-1.5 transition-all duration-500 lg:translate-y-3 lg:opacity-85">
                                SHOP THE LOOK
                                <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                              </button>`
                            : ''
                        }
                      </div>
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </section>
          </main>
        `
        }

        <!-- SECTION 7: MINIMALIST ARCHITECTURAL FOOTER -->
        <footer class="rounded-[28px] sm:rounded-[36px] border p-6 sm:p-12 shadow-sm transition-colors duration-300 ${
          isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-white'
        }">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b ${
            isDark ? 'border-white/10' : 'border-black/5'
          }">
            <div class="md:col-span-5 space-y-4">
              ${renderBrandLogo(s.logoUrl, s.brandName, 'lg', !isDark)}
              <p class="text-xs leading-relaxed max-w-sm ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">
                ${escapeHtml(s.footerTagline)}
              </p>
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366] hover:text-white font-ui text-[11px] font-bold transition-all">
                  ${renderWhatsAppIcon('w-3.5 h-3.5')}
                  WhatsApp
                </a>
                <a href="${escapeHtml(tgHref)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#229ED9]/15 text-[#229ED9] hover:bg-[#229ED9] hover:text-white font-ui text-[11px] font-bold transition-all">
                  ${renderTelegramIcon('w-3.5 h-3.5')}
                  Telegram
                </a>
                <a href="${escapeHtml(msgHref)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0084FF]/15 text-[#0084FF] hover:bg-[#0084FF] hover:text-white font-ui text-[11px] font-bold transition-all">
                  ${renderMessengerIcon('w-3.5 h-3.5')}
                  Messenger
                </a>
              </div>
            </div>

            <div class="md:col-span-4 space-y-2.5">
              <h4 class="font-ui text-[11px] font-bold uppercase tracking-[0.14em]">COLLECTIONS</h4>
              <div class="flex flex-wrap gap-2">
                ${state.categories
                  .map(
                    (cat) => `
                  <button data-action="filter-cat" data-cat="${escapeHtml(cat.id)}" class="font-ui text-xs px-3.5 py-1.5 rounded-full transition-colors ${
                      isDark ? 'bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white' : 'bg-[#F4F5F7] text-[#5C636A] hover:text-[#0A0A0A]'
                    }">
                    ${escapeHtml(cat.name)}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="md:col-span-3 space-y-2.5">
              <h4 class="font-ui text-[11px] font-bold uppercase tracking-[0.14em]">STORE ACCESS</h4>
              <ul class="space-y-2 text-xs ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">
                <li><button data-action="nav-home" class="hover:underline transition-colors">Home Storefront</button></li>
                <li><button data-action="filter-cat" data-cat="ALL" class="hover:underline transition-colors">All Products</button></li>
                <li>
                  <button data-action="nav-portal" class="hover:underline transition-colors inline-flex items-center gap-1.5">
                    <i data-lucide="lock" class="w-3 h-3"></i>
                    ${state.isOwnerAuthenticated ? 'Owner Dashboard' : 'Owner Portal Login'}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span class="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-[-0.04em]">
              ${escapeHtml(s.brandName)}
            </span>
            <span class="font-ui text-[11px] font-medium tracking-wider ${isDark ? 'text-zinc-500' : 'text-[#6E7378]'}">
              ${escapeHtml(s.footerCopyright)}
            </span>
          </div>
        </footer>
      </div>
    </div>
  `;
}

function renderCatalogGridHtml(filteredStoreProducts) {
  const isDark = state.theme === 'dark';
  if (filteredStoreProducts.length === 0) {
    return `
      <div class="text-center py-16 rounded-3xl border ${isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-white border-black/5'}">
        <p class="text-sm font-semibold">No products found in this category yet.</p>
        <button data-action="reset-catalog" class="mt-4 font-ui text-xs font-bold uppercase px-6 py-2.5 rounded-full ${
          isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
        }">
          SHOW ALL GEAR
        </button>
      </div>
    `;
  }
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      ${filteredStoreProducts
        .map(
          (product, index) => `
        <div class="scroll-reveal reveal-rise" style="transition-delay: ${(index % 4) * 85}ms;">
          ${renderProductCardHtml(product)}
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

// ============================================================================
// 9. MODALS RENDERING (SOCIAL ORDERING + SHOPPING BAG + HERO VIDEO)
// ============================================================================
function renderModals() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  const isDark = state.theme === 'dark';
  const s = state.siteSettings;
  let html = '';

  // 1. Shopping Bag Modal
  if (state.bagModalOpen) {
    const totalMoney = getBagTotalAmount();
    const totalItems = getBagTotalCount();

    html += `
      <div data-action="close-bag-modal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div data-action="modal-card" class="rounded-[30px] max-w-md w-full overflow-hidden shadow-2xl border animate-modal-in ${
          isDark ? 'bg-[#121216] border-white/10 text-white' : 'bg-white border-black/5 text-[#0A0A0A]'
        }">
          <div class="px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F7F8F9] border-black/5'
          }">
            <span class="font-ui text-xs font-extrabold uppercase tracking-[0.1em] inline-flex items-center gap-2">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              YOUR BAG (${totalItems})
            </span>
            <button type="button" data-action="close-bag-modal" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-black/5 text-[#0A0A0A]'
            }">
              <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
            </button>
          </div>

          <div class="p-6 space-y-5">
            ${
              state.bag.length === 0
                ? `<div class="py-10 text-center space-y-3">
                    <div class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                      isDark ? 'bg-white/10 text-zinc-400' : 'bg-[#F5F7F8] text-[#6E7378]'
                    }">
                      <i data-lucide="shopping-bag" class="w-6 h-6"></i>
                    </div>
                    <p class="font-ui text-sm font-bold">Your bag is empty</p>
                    <p class="text-xs ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
                      Click SHOP on any product and tap "Add to Your Bag" to build your order.
                    </p>
                  </div>`
                : `<div class="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                    ${state.bag
                      .map(
                        (item) => `
                      <div class="flex items-center gap-3.5 p-3 rounded-2xl border ${
                        isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F5F7F8] border-black/5'
                      }">
                        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-14 h-16 rounded-xl object-cover shrink-0 bg-black/10" />
                        <div class="flex-1 min-w-0">
                          <h4 class="font-ui text-xs font-extrabold truncate">${escapeHtml(item.name)}</h4>
                          <p class="font-ui text-[11px] font-bold mt-0.5 ${isDark ? 'text-cyan-400' : 'text-[#525860]'}">
                            USD ${(Number(item.price || 0) * (item.qty || 1)).toFixed(2)}
                          </p>
                          <div class="flex items-center gap-2 mt-2">
                            <button type="button" data-action="bag-dec" data-id="${escapeHtml(item.id)}" class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-black/10 text-[#0A0A0A]'
                            }">-</button>
                            <span class="font-ui text-xs font-bold min-w-[16px] text-center">${item.qty || 1}</span>
                            <button type="button" data-action="bag-inc" data-id="${escapeHtml(item.id)}" class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-black/10 text-[#0A0A0A]'
                            }">+</button>
                          </div>
                        </div>
                        <button type="button" data-action="bag-remove" data-id="${escapeHtml(item.id)}" title="Remove item" class="p-2 rounded-xl text-red-500 hover:bg-red-500/15 transition-colors">
                          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                        </button>
                      </div>
                    `
                      )
                      .join('')}
                  </div>

                  <div class="pt-4 border-t space-y-4 ${isDark ? 'border-white/10' : 'border-black/10'}">
                    <div class="flex items-center justify-between">
                      <span class="font-ui text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">TOTAL AMOUNT</span>
                      <span class="font-display text-xl font-extrabold ${isDark ? 'text-cyan-400' : 'text-[#0A0A0A]'}">
                        USD ${totalMoney.toFixed(2)}
                      </span>
                    </div>

                    <button type="button" data-action="bag-shop-now" class="w-full font-ui text-xs font-extrabold uppercase tracking-[0.12em] py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99] ${
                      isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                    }">
                      SHOP NOW
                      <i data-lucide="chevron-right" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                  </div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  // 2. Social Media Order Modal
  if (state.shopModalProduct || (state.shopModalBagItems && state.shopModalBagItems.length > 0)) {
    const isBagCheckout = Array.isArray(state.shopModalBagItems) && state.shopModalBagItems.length > 0;
    const product = state.shopModalProduct;
    let inquiryMessage = '';
    let selectedCardHtml = '';

    if (isBagCheckout) {
      const items = state.shopModalBagItems;
      const total = items.reduce((sum, it) => sum + Number(it.price || 0) * (it.qty || 1), 0);
      const itemLines = items
        .map((it, i) => {
          const url = `${window.location.origin}${window.location.pathname}#product/${it.id}`;
          return `${i + 1}. ${it.name} (x${it.qty || 1}) - USD ${(Number(it.price || 0) * (it.qty || 1)).toFixed(2)} (${url})`;
        })
        .join('\n');
      inquiryMessage = `Hello ${s.brandName}! I would like to order the following items from my bag:\n${itemLines}\nTotal: USD ${total.toFixed(2)}. Please provide more information.`;

      selectedCardHtml = `
        <div class="p-3.5 rounded-2xl space-y-2 ${isDark ? 'bg-[#1B1B21]' : 'bg-[#F5F7F8]'}">
          <div class="flex items-center justify-between">
            <span class="font-ui text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
              SELECTED BAG ITEMS (${items.reduce((sum, it) => sum + (it.qty || 1), 0)})
            </span>
            <span class="font-ui text-xs font-extrabold ${isDark ? 'text-cyan-400' : 'text-[#0A0A0A]'}">
              Total: USD ${total.toFixed(2)}
            </span>
          </div>
          <div class="max-h-24 overflow-y-auto space-y-1.5 pr-1">
            ${items
              .map(
                (it) => `
              <div class="flex items-center justify-between text-xs">
                <span class="font-ui font-bold truncate pr-2">${escapeHtml(it.name)} ×${it.qty || 1}</span>
                <span class="font-ui font-semibold shrink-0 opacity-80">USD ${(Number(it.price || 0) * (it.qty || 1)).toFixed(2)}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    } else {
      const productUrl = `${window.location.origin}${window.location.pathname}#product/${product.id}`;
      inquiryMessage = `Hello ${s.brandName}! I am interested in purchasing ${product.name}. Please provide more information. (${productUrl})`;

      selectedCardHtml = `
        <div class="flex items-center gap-4 p-3.5 rounded-2xl ${isDark ? 'bg-[#1B1B21]' : 'bg-[#F5F7F8]'}">
          <img src="${escapeHtml(product.images?.[0])}" alt="${escapeHtml(product.name)}" class="w-16 h-20 rounded-xl object-cover shrink-0" />
          <div class="min-w-0">
            <span class="font-ui text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">SELECTED ITEM</span>
            <h3 class="font-ui text-sm font-extrabold truncate">${escapeHtml(product.name)}</h3>
            <p class="font-ui text-xs font-bold mt-0.5 ${isDark ? 'text-cyan-400' : 'text-[#0A0A0A]'}">
              USD ${Number(product.price || 0).toFixed(2)}
            </p>
          </div>
        </div>
      `;
    }

    const cleanPhone = (s.whatsappNumber || '').replace(/[^0-9]/g, '');
    const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inquiryMessage)}`;
    const rawTg = (s.telegramUsername || '').trim();
    const telegramHref = rawTg.startsWith('http') ? rawTg : `https://t.me/${rawTg.replace(/^@/, '')}`;
    const rawMsg = (s.messengerUsername || '').trim();
    const messengerHref = rawMsg.startsWith('http') ? rawMsg : `https://m.me/${rawMsg.replace(/^@/, '')}`;

    html += `
      <div data-action="close-shop-modal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div data-action="modal-card" class="rounded-[30px] max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border animate-modal-in ${
          isDark ? 'bg-[#121216] border-white/10 text-white' : 'bg-white border-black/5 text-[#0A0A0A]'
        }">
          <div class="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-10 ${
            isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F7F8F9] border-black/5'
          }">
            <span class="font-ui text-xs font-extrabold uppercase tracking-[0.1em]">ORDER THROUGH SOCIAL MEDIA</span>
            <button type="button" data-action="close-shop-modal" aria-label="Close" class="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white hover:bg-black/5 text-[#0A0A0A]'
            }">
              <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            ${selectedCardHtml}

            <p class="text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-[#5C636A]'}">
              Choose your preferred platform below to connect directly with <strong class="${isDark ? 'text-white' : 'text-[#0A0A0A]'}">${escapeHtml(s.brandName)}</strong>:
            </p>

            <div class="space-y-2.5">
              <a href="${escapeHtml(whatsappHref)}" target="_blank" rel="noopener noreferrer" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-ui font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all">
                <span class="flex items-center gap-3">
                  ${renderWhatsAppIcon('w-5 h-5')}
                  <span>Order via WhatsApp</span>
                </span>
                <span class="text-[10px] bg-black/15 px-2.5 py-1 rounded-full">Auto-Filled</span>
              </a>

              <a href="${escapeHtml(telegramHref)}" target="_blank" rel="noopener noreferrer" data-action="copy-inquiry-silent" data-msg="${escapeHtml(inquiryMessage)}" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#229ED9] hover:bg-[#1E8EC4] text-white font-ui font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all">
                <span class="flex items-center gap-3">
                  ${renderTelegramIcon('w-5 h-5')}
                  <span>Order via Telegram</span>
                </span>
                <i data-lucide="external-link" class="w-4 h-4 opacity-85"></i>
              </a>

              <a href="${escapeHtml(messengerHref)}" target="_blank" rel="noopener noreferrer" data-action="copy-inquiry-silent" data-msg="${escapeHtml(inquiryMessage)}" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#0084FF] to-[#0066CC] hover:opacity-95 text-white font-ui font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all">
                <span class="flex items-center gap-3">
                  ${renderMessengerIcon('w-5 h-5')}
                  <span>Order via Messenger</span>
                </span>
                <i data-lucide="external-link" class="w-4 h-4 opacity-85"></i>
              </a>
            </div>

            ${
              !isBagCheckout && product
                ? `<div class="pt-1 space-y-2.5">
                    <div class="flex items-center gap-3">
                      <div class="h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}"></div>
                      <span class="font-ui text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">OR</span>
                      <div class="h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}"></div>
                    </div>

                    <button type="button" data-action="add-to-bag" data-id="${escapeHtml(product.id)}" class="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl font-ui font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.99] ${
                      isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                    }">
                      <span class="flex items-center gap-3">
                        <i data-lucide="shopping-bag" class="w-5 h-5 pointer-events-none"></i>
                        <span>Add to Your Bag</span>
                      </span>
                      <i data-lucide="plus" class="w-4 h-4 opacity-85 pointer-events-none"></i>
                    </button>
                  </div>`
                : ''
            }

            <div class="rounded-2xl p-3.5 border space-y-2 ${isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F7F8F9] border-black/5'}">
              <div class="flex items-center justify-between">
                <span class="font-ui text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">PREPARED INQUIRY MESSAGE</span>
                <button type="button" data-action="copy-inquiry" data-msg="${escapeHtml(inquiryMessage)}" class="inline-flex items-center gap-1 font-ui text-[10px] font-bold uppercase hover:underline">
                  <i data-lucide="copy" class="w-3 h-3 pointer-events-none"></i>
                  Copy
                </button>
              </div>
              <p class="text-[11px] leading-relaxed whitespace-pre-line ${isDark ? 'text-zinc-300' : 'text-[#4A5056]'}">${escapeHtml(inquiryMessage)}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (state.heroVideoOpen) {
    html += `
      <div data-action="close-hero-video" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div data-action="modal-card" class="bg-[#121216] rounded-3xl max-w-2xl w-full overflow-hidden border border-white/15 shadow-2xl animate-modal-in">
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/10">
            ${renderBrandLogo(s.logoUrl, s.brandName, 'sm', false)}
            <button data-action="close-hero-video" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">
              <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
            </button>
          </div>
          <div class="p-6 text-center space-y-5">
            <div class="relative rounded-2xl overflow-hidden aspect-video bg-black">
              <img src="${escapeHtml(s.heroVideoPreviewImg || s.heroImage)}" alt="Campaign" class="w-full h-full object-cover opacity-80" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col items-center justify-center p-6">
                <span class="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 font-ui text-[10px] font-bold uppercase tracking-widest mb-2">
                  2026 ATHLETIC CAMPAIGN
                </span>
                <h3 class="font-display text-white text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                  ${escapeHtml(s.heroTitleLine1)} ${escapeHtml(s.heroTitleLine2)}
                </h3>
                <p class="text-white/75 text-xs max-w-md mt-2">${escapeHtml(s.heroDescription)}</p>
              </div>
            </div>
            <button data-action="hero-video-shop" class="bg-white text-[#0A0A0A] font-ui text-xs font-bold uppercase tracking-wider px-7 py-3 rounded-full hover:bg-white/90 transition-all">
              SHOP THE COLLECTION
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.deleteProductTarget) {
    html += `
      <div class="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-modal-in ${
          isDark ? 'bg-[#121216] border border-white/10 text-white' : 'bg-white text-[#0A0A0A]'
        }">
          <div class="w-11 h-11 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </div>
          <h3 class="font-display text-base font-extrabold uppercase">DELETE PRODUCT?</h3>
          <p class="text-xs opacity-75 leading-relaxed">
            Are you sure you want to permanently delete <strong>${escapeHtml(state.deleteProductTarget.name)}</strong>? It will immediately disappear from the public storefront.
          </p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button data-action="cancel-delete-prod" class="px-4 py-2.5 rounded-full text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-[#F2F4F7]'}">Cancel</button>
            <button data-action="confirm-delete-prod" class="px-5 py-2.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white">Delete Permanently</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.deleteCategoryModal) {
    const targetCat = state.deleteCategoryModal;
    const linkedCount = state.products.filter((p) => p.categoryId === targetCat.id).length;
    html += `
      <div class="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-modal-in ${
          isDark ? 'bg-[#121216] border border-white/10 text-white' : 'bg-white text-[#0A0A0A]'
        }">
          <h3 class="font-display text-base font-extrabold uppercase">DELETE CATEGORY "${escapeHtml(targetCat.name)}"?</h3>
          ${
            linkedCount > 0
              ? `<div class="space-y-3">
                  <p class="text-xs opacity-75 leading-relaxed">
                    There are <strong>${linkedCount} product(s)</strong> currently inside this category. They will <strong>not</strong> be deleted—choose where to move them:
                  </p>
                  <select id="reassign-cat-select" class="w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                    isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/15'
                  }">
                    ${state.categories
                      .filter((c) => c.id !== targetCat.id)
                      .map((c) => `<option value="${escapeHtml(c.id)}" ${state.reassignCategoryId === c.id ? 'selected' : ''}>Move to: ${escapeHtml(c.name)}</option>`)
                      .join('')}
                    <option value="uncategorized" ${state.reassignCategoryId === 'uncategorized' ? 'selected' : ''}>Mark as Uncategorized</option>
                  </select>
                </div>`
              : `<p class="text-xs opacity-75">This category has no assigned products and can be safely removed.</p>`
          }
          <div class="flex items-center justify-end gap-2 pt-2">
            <button data-action="cancel-delete-cat" class="px-4 py-2 rounded-full text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-[#F2F4F7]'}">Cancel</button>
            <button data-action="confirm-delete-cat" class="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-bold">Confirm Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  root.innerHTML = html;
}

// ============================================================================
// 10. OWNER LOGIN PAGE RENDERING
// ============================================================================
function renderOwnerLoginView() {
  const isDark = state.theme === 'dark';
  const s = state.siteSettings;
  const storedEmail = state.ownerAuthRecord?.email || 'owner@rrwear.com';
  const isDefaultCreds = !state.ownerAuthRecord?.email || state.ownerAuthRecord?.email === 'owner@rrwear.com';

  return `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
      isDark ? 'bg-[#09090B] text-white' : 'bg-[#E9EEF1] text-[#0A0A0A]'
    }">
      <div class="w-full max-w-md rounded-[32px] p-7 sm:p-10 shadow-2xl border space-y-6 animate-modal-in ${
        isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-white'
      }">
        <div class="flex items-center justify-between">
          <button data-action="nav-home" class="inline-flex items-center gap-1.5 font-ui text-xs font-bold uppercase tracking-wider transition-colors ${
            isDark ? 'text-zinc-400 hover:text-white' : 'text-[#5C636A] hover:text-[#0A0A0A]'
          }">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Storefront
          </button>

          <div class="flex items-center gap-2">
            <button data-action="toggle-theme" class="w-8 h-8 rounded-full flex items-center justify-center border ${
              isDark ? 'bg-[#1B1B21] border-white/15 text-amber-300' : 'bg-[#F2F4F7] border-black/5 text-[#0A0A0A]'
            }">
              <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-3.5 h-3.5"></i>
            </button>
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0A0A0A] text-white font-ui text-[10px] font-bold uppercase tracking-wider border border-white/10">
              <i data-lucide="shield-check" class="w-3 h-3 text-cyan-400"></i>
              Owner Only
            </span>
          </div>
        </div>

        <div class="text-center space-y-2 pt-2">
          <div class="flex justify-center">
            ${renderBrandLogo(s.logoUrl, s.brandName, 'lg', !isDark)}
          </div>
          <h1 class="font-display text-xl font-extrabold uppercase tracking-[-0.02em] pt-2">
            ${state.loginForgotMode ? 'OWNER PASSWORD RECOVERY' : 'OWNER PORTAL LOGIN'}
          </h1>
          <p class="text-xs ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
            ${
              state.loginForgotMode
                ? 'Enter your authorized owner email to receive reset instructions.'
                : 'Sign in with your authorized owner credentials to manage products, banners, and settings.'
            }
          </p>
        </div>

        ${
          state.loginError
            ? `<div class="bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl p-3.5 flex items-start gap-2">
                <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0 mt-0.5"></i>
                <span>${escapeHtml(state.loginError)}</span>
              </div>`
            : ''
        }

        ${
          state.loginForgotMode
            ? `<form id="owner-forgot-form" class="space-y-4">
                <div>
                  <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Owner Email Address</label>
                  <input id="login-email-input" type="email" required value="${escapeHtml(state.loginEmail)}" placeholder="owner@rrwear.com" class="w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                    isDark ? 'bg-[#1B1B21] border-white/15 text-white focus:border-cyan-400' : 'bg-white border-black/15 text-[#0A0A0A] focus:border-[#0A0A0A]'
                  }" />
                </div>
                ${
                  state.loginResetSent
                    ? `<div class="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-2xl p-3">
                        If <strong>${escapeHtml(state.loginEmail)}</strong> matches the registered owner account, recovery instructions have been dispatched.
                      </div>`
                    : ''
                }
                <button type="submit" class="w-full font-ui text-xs font-bold uppercase tracking-wider py-3.5 rounded-full transition-all ${
                  isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
                }">SEND RESET LINK</button>
                <button type="button" data-action="toggle-forgot-mode" class="w-full text-center text-xs font-semibold opacity-70 hover:opacity-100">Back to Owner Login</button>
              </form>`
            : `<form id="owner-login-form" class="space-y-4">
                <div>
                  <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                  <input id="login-email-input" type="email" required value="${escapeHtml(state.loginEmail)}" placeholder="owner@rrwear.com" class="w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
                    isDark ? 'bg-[#1B1B21] border-white/15 text-white focus:border-cyan-400' : 'bg-white border-black/15 text-[#0A0A0A] focus:border-[#0A0A0A]'
                  }" />
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block font-ui text-[11px] font-bold uppercase tracking-wider">Password</label>
                    <button type="button" data-action="toggle-forgot-mode" class="text-[11px] font-semibold opacity-70 hover:opacity-100">Forgot password?</button>
                  </div>
                  <div class="relative">
                    <input id="login-password-input" type="${state.loginShowPassword ? 'text' : 'password'}" required value="${escapeHtml(state.loginPassword)}" placeholder="••••••••••••" class="w-full rounded-2xl border px-4 py-3 pr-11 text-sm focus:outline-none ${
                      isDark ? 'bg-[#1B1B21] border-white/15 text-white focus:border-cyan-400' : 'bg-white border-black/15 text-[#0A0A0A] focus:border-[#0A0A0A]'
                    }" />
                    <button type="button" data-action="toggle-password-vis" class="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-65 hover:opacity-100">
                      <i data-lucide="${state.loginShowPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>

                <button type="submit" class="w-full font-ui text-xs font-extrabold uppercase tracking-[0.12em] py-4 rounded-full transition-all shadow-md ${
                  isDark ? 'bg-white text-[#09090B] hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
                }">
                  LOGIN TO DASHBOARD
                </button>
              </form>`
        }
        
      </div>
    </div>
  `;
}

// ============================================================================
// 11. OWNER DASHBOARD VIEW & ALL 6 CMS TABS
// ============================================================================
function renderImageFieldControl(label, fieldPath, value, aspectClass = 'w-20 h-20', maxWidth = 1100) {
  const isDark = state.theme === 'dark';
  return `
    <div class="p-3.5 rounded-2xl border space-y-2.5 ${
      isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F8FAFB] border-black/5'
    }">
      <label class="block font-ui text-[11px] font-bold uppercase tracking-wider">${escapeHtml(label)}</label>
      <div class="flex items-center gap-3.5">
        <div class="${aspectClass} rounded-xl overflow-hidden shrink-0 border ${
          isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/10'
        }">
          ${
            value
              ? `<img src="${escapeHtml(value)}" alt="${escapeHtml(label)}" class="w-full h-full object-cover" />`
              : `<div class="w-full h-full flex items-center justify-center opacity-35"><i data-lucide="image" class="w-5 h-5"></i></div>`
          }
        </div>
        <div class="flex-1 min-w-0 space-y-2">
          <input
            type="url"
            data-img-url-field="${escapeHtml(fieldPath)}"
            value="${escapeHtml(value || '')}"
            placeholder="Paste image URL (https://...)"
            class="w-full rounded-xl border px-3 py-2 text-xs focus:outline-none ${
              isDark ? 'bg-[#121216] border-white/15 text-white focus:border-cyan-400' : 'bg-white border-black/15 text-[#0A0A0A] focus:border-[#0A0A0A]'
            }"
          />
          <label class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-ui text-[10px] font-bold uppercase cursor-pointer transition-colors ${
            isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
          }">
            <i data-lucide="upload" class="w-3 h-3"></i>
            Upload to Repo
            <input type="file" accept="image/*" data-img-file-field="${escapeHtml(fieldPath)}" data-max-width="${maxWidth}" class="hidden" />
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderDashboardView() {
  if (!state.isOwnerAuthenticated) return '';
  const isDark = state.theme === 'dark';
  const s = state.siteSettings;
  const publishedCount = state.products.filter((p) => p.visibility !== 'draft').length;
  const draftCount = state.products.filter((p) => p.visibility === 'draft').length;
  const hasToken = Boolean(getGithubToken());

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'layout-dashboard' },
    { id: 'products', label: 'Manage Products', icon: 'package' },
    { id: 'categories', label: 'Manage Categories', icon: 'folder-kanban' },
    { id: 'add-product', label: state.editingProductId ? 'Edit Product' : 'Add New Product', icon: 'plus-circle' },
    { id: 'customization', label: 'Website Customization', icon: 'palette' },
    { id: 'social', label: 'Contact & Social Links', icon: 'share-2' }
  ];

  const tokenWarningBanner = !hasToken
    ? `<div class="mb-6 rounded-2xl p-4 border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="text-xs">
          <strong class="block font-ui uppercase text-amber-500">GitHub Repository Sync Not Connected</strong>
          <span class="opacity-85">Connect your GitHub Personal Access Token so uploaded images/videos save to <code>/uploads/</code> and all changes save permanently to <code>jakaria6231/clothing_website</code>.</span>
        </div>
        <button data-action="dash-tab" data-tab="social" class="px-4 py-2 rounded-full bg-amber-500 text-black font-ui text-[11px] font-bold uppercase shrink-0">
          Connect GitHub Token
        </button>
      </div>`
    : '';

  let mainContent = '';

  if (state.dashboardTab === 'overview') {
    const stats = [
      { label: 'Total Products', value: state.products.length, accent: isDark ? 'bg-white text-[#09090B]' : 'bg-[#0A0A0A] text-white' },
      { label: 'Total Categories', value: state.categories.length, accent: isDark ? 'bg-[#121216] text-white' : 'bg-white text-[#0A0A0A]' },
      { label: 'Published Products', value: publishedCount, accent: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-900' },
      { label: 'Draft Products', value: draftCount, accent: isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-900' }
    ];

    mainContent = `
      <div class="space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[-0.02em]">DASHBOARD OVERVIEW</h1>
            <p class="text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">Real-time overview of your storefront catalog, categories, and GitHub media inventory.</p>
          </div>
          <button data-action="dash-new-product" class="inline-flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full shadow-sm ${
            isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
          }">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add New Product
          </button>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${stats
            .map(
              (st) => `
            <div class="${st.accent} rounded-3xl p-6 shadow-sm border ${isDark ? 'border-white/10' : 'border-black/5'} flex flex-col justify-between">
              <span class="font-ui text-[11px] font-bold uppercase tracking-wider opacity-75">${st.label}</span>
              <span class="font-display text-3xl sm:text-4xl font-extrabold mt-3">${st.value}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="rounded-3xl p-6 shadow-sm border space-y-4 ${isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'}">
          <div class="flex items-center justify-between">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">RECENTLY ADDED PRODUCTS</h2>
            <button data-action="dash-tab" data-tab="products" class="font-ui text-xs font-bold opacity-70 hover:opacity-100">View All →</button>
          </div>
          <div class="divide-y ${isDark ? 'divide-white/10' : 'divide-black/5'}">
            ${state.products
              .slice(0, 5)
              .map(
                (prod) => `
              <div class="py-3.5 flex items-center justify-between gap-4 flex-wrap">
                <div class="flex items-center gap-3.5 min-w-0">
                  <img src="${escapeHtml(prod.images?.[0])}" alt="${escapeHtml(prod.name)}" class="w-12 h-14 rounded-xl object-cover bg-black/10 shrink-0" />
                  <div class="min-w-0">
                    <h3 class="font-ui text-xs font-bold truncate">${escapeHtml(prod.name)}</h3>
                    <p class="text-[11px] ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">
                      ${escapeHtml(getCategoryName(prod.categoryId))} • USD ${Number(prod.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-full font-ui text-[10px] font-bold uppercase ${
                    prod.visibility === 'draft' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'
                  }">
                    ${prod.visibility === 'draft' ? 'Draft' : 'Published'}
                  </span>
                  <button data-action="dash-edit-product" data-id="${escapeHtml(prod.id)}" class="p-2 rounded-xl transition-colors ${
                    isDark ? 'bg-white/10 hover:bg-white hover:text-black' : 'bg-[#F2F4F7] hover:bg-[#0A0A0A] hover:text-white'
                  }" title="Edit Product">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  } else if (state.dashboardTab === 'products') {
    const filtered = state.products.filter((p) => {
      const matchCat = state.dashProductCatFilter === 'ALL' || p.categoryId === state.dashProductCatFilter;
      const matchQ = !state.dashProductQuery.trim() || p.name.toLowerCase().includes(state.dashProductQuery.trim().toLowerCase());
      return matchCat && matchQ;
    });

    mainContent = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[-0.02em]">MANAGE PRODUCTS (${state.products.length})</h1>
            <p class="text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">Edit details, toggle Published/Draft status, or remove items from your storefront.</p>
          </div>
          <button data-action="dash-new-product" class="inline-flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-full ${
            isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
          }">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add New Product
          </button>
        </div>

        <div class="rounded-2xl p-4 shadow-sm border flex flex-col sm:flex-row gap-3 ${isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'}">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 opacity-50 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
            <input id="dash-prod-search" type="text" value="${escapeHtml(state.dashProductQuery)}" placeholder="Search products by name..." class="w-full rounded-xl border pl-10 pr-4 py-2 text-xs focus:outline-none ${
              isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/10 text-[#0A0A0A]'
            }" />
          </div>
          <select id="dash-prod-cat-filter" class="rounded-xl border px-4 py-2 text-xs font-semibold focus:outline-none ${
            isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/10 text-[#0A0A0A]'
          }">
            <option value="ALL" ${state.dashProductCatFilter === 'ALL' ? 'selected' : ''}>All Categories</option>
            ${state.categories
              .map(
                (c) => `<option value="${escapeHtml(c.id)}" ${state.dashProductCatFilter === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
              )
              .join('')}
          </select>
        </div>

        <div class="rounded-3xl shadow-sm border overflow-hidden ${isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'}">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b font-ui text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-white/10 bg-[#1B1B21] text-zinc-400' : 'border-black/5 bg-[#F8FAFB] text-[#6E7378]'
                }">
                  <th class="py-3.5 px-5">Product</th>
                  <th class="py-3.5 px-4">Category</th>
                  <th class="py-3.5 px-4">Price</th>
                  <th class="py-3.5 px-4">Media</th>
                  <th class="py-3.5 px-4">Visibility</th>
                  <th class="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y text-xs ${isDark ? 'divide-white/10' : 'divide-black/5'}">
                ${filtered
                  .map(
                    (prod) => `
                  <tr class="${isDark ? 'hover:bg-white/5' : 'hover:bg-[#F9FAFB]'}">
                    <td class="py-3.5 px-5">
                      <div class="flex items-center gap-3">
                        <img src="${escapeHtml(prod.images?.[0])}" alt="${escapeHtml(prod.name)}" class="w-11 h-14 rounded-xl object-cover bg-black/10 shrink-0" />
                        <span class="font-ui font-bold">${escapeHtml(prod.name)}</span>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 opacity-75">${escapeHtml(getCategoryName(prod.categoryId))}</td>
                    <td class="py-3.5 px-4 font-ui font-bold">USD ${Number(prod.price || 0).toFixed(2)}</td>
                    <td class="py-3.5 px-4 text-[11px] opacity-65">${(prod.images || []).length} img • ${(prod.videos || []).length} vid</td>
                    <td class="py-3.5 px-4">
                      <button data-action="toggle-prod-visibility" data-id="${escapeHtml(prod.id)}" class="px-3 py-1 rounded-full font-ui text-[10px] font-bold uppercase transition-colors ${
                        prod.visibility === 'draft' ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25' : 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25'
                      }">
                        ${prod.visibility === 'draft' ? 'Draft' : 'Published'}
                      </button>
                    </td>
                    <td class="py-3.5 px-5 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        <button data-action="dash-edit-product" data-id="${escapeHtml(prod.id)}" class="p-2 rounded-xl transition-colors ${
                          isDark ? 'bg-white/10 hover:bg-white hover:text-black' : 'bg-[#F2F4F7] hover:bg-[#0A0A0A] hover:text-white'
                        }" title="Edit">
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                        <button data-action="prompt-delete-prod" data-id="${escapeHtml(prod.id)}" class="p-2 rounded-xl bg-red-500/15 text-red-500 hover:bg-red-600 hover:text-white transition-colors" title="Delete">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (state.dashboardTab === 'add-product') {
    const pf = state.prodForm;
    const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none ${
      isDark ? 'bg-[#1B1B21] border-white/15 text-white focus:border-cyan-400' : 'bg-white border-black/15 text-[#0A0A0A] focus:border-[#0A0A0A]'
    }`;
    const cardClass = `rounded-3xl p-6 shadow-sm border ${isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'}`;

    mainContent = `
      <form id="product-save-form" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[-0.02em]">
              ${state.editingProductId ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
            </h1>
            <p class="text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">Upload photos &amp; videos directly to your GitHub repo's /uploads/ folder and save permanently.</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" data-action="dash-tab" data-tab="products" class="px-5 py-2.5 rounded-full text-xs font-bold border ${
              isDark ? 'bg-white/10 border-white/10' : 'bg-white border-black/10'
            }">Cancel</button>
            <button type="submit" ${state.isSavingToGithub ? 'disabled' : ''} class="px-6 py-2.5 rounded-full font-ui text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50 ${
              isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
            }">
              ${state.isSavingToGithub ? 'SAVING TO GITHUB...' : state.editingProductId ? 'SAVE CHANGES' : 'PUBLISH PRODUCT'}
            </button>
          </div>
        </div>

        <div class="${cardClass} grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Product Name *</label>
            <input id="pf-name" type="text" required value="${escapeHtml(pf.name)}" placeholder="e.g., R&R Heavyweight Training Hoodie" class="${inputClass}" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Price (USD) *</label>
              <input id="pf-price" type="number" step="0.01" min="0" required value="${escapeHtml(pf.price)}" placeholder="120.00" class="${inputClass}" />
            </div>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Visibility</label>
              <select id="pf-visibility" class="${inputClass}">
                <option value="published" ${pf.visibility === 'published' ? 'selected' : ''}>Published (Live)</option>
                <option value="draft" ${pf.visibility === 'draft' ? 'selected' : ''}>Draft (Hidden)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Category *</label>
            <select id="pf-category" class="${inputClass}">
              ${state.categories
                .map(
                  (cat) => `<option value="${escapeHtml(cat.id)}" ${pf.categoryId === cat.id ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div>
            <label class="block font-ui text-[11px] font-bold uppercase tracking-wider mb-1.5">Product Description</label>
            <textarea id="pf-description" rows="3" placeholder="Describe fabric weight, fit, performance details..." class="${inputClass}">${escapeHtml(pf.description)}</textarea>
          </div>
        </div>

        <!-- Product Images -->
        <div class="${cardClass} space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="image" class="w-4 h-4"></i>
                PRODUCT IMAGES (${pf.images.length})
              </h2>
              <p class="text-[11px] opacity-65">Uploaded images are saved automatically inside the /uploads/ folder of your GitHub repository.</p>
            </div>
            <label class="inline-flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full cursor-pointer ${
              isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
            }">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              Upload Images to Repo
              <input id="pf-images-file" type="file" accept="image/*" multiple class="hidden" />
            </label>
          </div>

          <div class="flex gap-2">
            <input id="pf-img-url-input" type="url" placeholder="Or paste an external image URL (https://...)" class="flex-1 rounded-xl border px-3.5 py-2 text-xs focus:outline-none ${
              isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/10'
            }" />
            <button type="button" data-action="pf-add-img-url" class="px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white hover:text-black' : 'bg-[#F2F4F7] hover:bg-black hover:text-white'
            }">Add URL</button>
          </div>

          ${
            pf.images.length > 0
              ? `<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  ${pf.images
                    .map(
                      (imgUrl, idx) => `
                    <div class="relative rounded-2xl overflow-hidden border-2 ${
                      idx === 0 ? (isDark ? 'border-cyan-400' : 'border-[#0A0A0A]') : isDark ? 'border-white/10' : 'border-black/10'
                    }">
                      <img src="${escapeHtml(imgUrl)}" alt="" class="w-full aspect-[3/3.6] object-cover" />
                      ${idx === 0 ? `<span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#0A0A0A] text-white font-ui text-[9px] font-bold uppercase">PRIMARY</span>` : ''}
                      <div class="p-2 flex items-center justify-between gap-1 ${isDark ? 'bg-[#1B1B21]' : 'bg-white'}">
                        <div class="flex items-center gap-1">
                          <button type="button" data-action="pf-move-img" data-idx="${idx}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} class="p-1 rounded bg-black/10 disabled:opacity-30">
                            <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                          </button>
                          <button type="button" data-action="pf-move-img" data-idx="${idx}" data-dir="1" ${idx === pf.images.length - 1 ? 'disabled' : ''} class="p-1 rounded bg-black/10 disabled:opacity-30">
                            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                          </button>
                          ${
                            idx !== 0
                              ? `<button type="button" data-action="pf-primary-img" data-idx="${idx}" class="p-1 rounded bg-amber-500/15 text-amber-500" title="Make Primary">
                                  <i data-lucide="star" class="w-3.5 h-3.5"></i>
                                </button>`
                              : ''
                          }
                        </div>
                        <button type="button" data-action="pf-del-img" data-idx="${idx}" class="p-1 rounded bg-red-500/15 text-red-500" title="Delete">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>

        <!-- Product Videos -->
        <div class="${cardClass} space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="video" class="w-4 h-4"></i>
                PRODUCT VIDEOS (${pf.videos.length})
              </h2>
              <p class="text-[11px] opacity-65">Upload MP4/WebM clips (under 20MB) directly into your GitHub repo /uploads/ folder or paste a video link.</p>
            </div>
            <label class="inline-flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full cursor-pointer ${
              isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
            }">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              Upload Video to Repo
              <input id="pf-videos-file" type="file" accept="video/mp4,video/webm" multiple class="hidden" />
            </label>
          </div>

          <div class="flex gap-2">
            <input id="pf-vid-url-input" type="url" placeholder="Or paste a direct MP4/WebM video URL (https://...)" class="flex-1 rounded-xl border px-3.5 py-2 text-xs focus:outline-none ${
              isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/10'
            }" />
            <button type="button" data-action="pf-add-vid-url" class="px-4 py-2 rounded-xl text-xs font-bold ${
              isDark ? 'bg-white/10' : 'bg-[#F2F4F7]'
            }">Add Video URL</button>
          </div>

          ${
            pf.videos.length > 0
              ? `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  ${pf.videos
                    .map((vid, idx) => {
                      const vidUrl = typeof vid === 'string' ? vid : vid.url;
                      const vidName = typeof vid === 'string' ? `Video ${idx + 1}` : vid.name;
                      return `
                      <div class="rounded-2xl overflow-hidden border border-black/15 bg-black">
                        <video src="${escapeHtml(vidUrl)}" controls class="w-full aspect-video object-contain bg-black"></video>
                        <div class="p-3 flex items-center justify-between gap-2 ${isDark ? 'bg-[#1B1B21]' : 'bg-white'}">
                          <span class="text-xs font-semibold truncate">${escapeHtml(vidName)}</span>
                          <button type="button" data-action="pf-del-vid" data-idx="${idx}" class="p-1.5 rounded-lg bg-red-500/15 text-red-500">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </div>
                    `;
                    })
                    .join('')}
                </div>`
              : ''
          }
        </div>

        <!-- Specifications -->
        <div class="${cardClass} space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">TECHNICAL SPECIFICATIONS</h2>
            <button type="button" data-action="pf-add-spec" class="text-xs font-bold px-3.5 py-1.5 rounded-full ${
              isDark ? 'bg-white/10' : 'bg-[#F2F4F7]'
            }">+ Add Spec Row</button>
          </div>
          <div class="space-y-2.5">
            ${pf.specifications
              .map(
                (spec, idx) => `
              <div class="flex items-center gap-2">
                <input type="text" data-spec-label="${idx}" value="${escapeHtml(spec.label)}" placeholder="Spec Name (e.g., Fabric)" class="w-1/3 rounded-xl border px-3.5 py-2 text-xs ${
                  isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/10'
                }" />
                <input type="text" data-spec-value="${idx}" value="${escapeHtml(spec.value)}" placeholder="Value (e.g., 420GSM Heavyweight Terry)" class="flex-1 rounded-xl border px-3.5 py-2 text-xs ${
                  isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/10'
                }" />
                <button type="button" data-action="pf-del-spec" data-idx="${idx}" class="p-2 rounded-xl bg-red-500/15 text-red-500">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </form>
    `;
  } else if (state.dashboardTab === 'categories') {
    const cf = state.catForm;
    mainContent = `
      <div class="space-y-6">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[-0.02em]">MANAGE CATEGORIES (${state.categories.length})</h1>
          <p class="text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">Organize collections displayed in your navigation bar and catalog filters.</p>
        </div>

        <form id="category-save-form" class="rounded-3xl p-6 shadow-sm border space-y-4 ${
          isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'
        }">
          <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">
            ${state.editingCategoryId ? `EDIT CATEGORY: ${escapeHtml(cf.name)}` : 'ADD NEW CATEGORY'}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Category Name *</label>
              <input id="cf-name" type="text" required value="${escapeHtml(cf.name)}" placeholder="e.g., OUTERWEAR" class="w-full rounded-2xl border px-4 py-2.5 text-sm ${
                isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
            </div>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Description</label>
              <input id="cf-desc" type="text" value="${escapeHtml(cf.description)}" placeholder="Short collection description..." class="w-full rounded-2xl border px-4 py-2.5 text-sm ${
                isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
            </div>
            ${renderImageFieldControl('Category Image', 'catForm.image', cf.image, 'w-16 h-16', 800)}
            ${renderImageFieldControl('Optional Category Banner', 'catForm.banner', cf.banner, 'w-24 h-16', 1100)}
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="submit" class="px-6 py-2.5 rounded-full font-ui text-xs font-bold uppercase tracking-wider ${
              isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
            }">
              ${state.editingCategoryId ? 'Update Category' : 'Create Category'}
            </button>
            ${
              state.editingCategoryId
                ? `<button type="button" data-action="cf-cancel-edit" class="px-4 py-2.5 rounded-full text-xs font-bold ${isDark ? 'bg-white/10' : 'bg-[#F2F4F7]'}">Cancel Edit</button>`
                : ''
            }
          </div>
        </form>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${state.categories
            .map((cat) => {
              const count = state.products.filter((p) => p.categoryId === cat.id).length;
              return `
              <div class="rounded-3xl p-4 shadow-sm border flex flex-col justify-between gap-4 ${
                isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'
              }">
                <div class="flex items-center gap-3.5">
                  <img src="${escapeHtml(cat.image)}" alt="${escapeHtml(cat.name)}" class="w-14 h-16 rounded-2xl object-cover bg-black/10 shrink-0" />
                  <div class="min-w-0">
                    <h3 class="font-display text-sm font-extrabold uppercase truncate">${escapeHtml(cat.name)}</h3>
                    <p class="text-[11px] opacity-70 line-clamp-2">${escapeHtml(cat.description)}</p>
                    <span class="inline-block mt-1 font-ui text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-[#F2F4F7]'}">
                      ${count} Product(s)
                    </span>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-2 border-t pt-3 ${isDark ? 'border-white/10' : 'border-black/5'}">
                  <button data-action="cf-edit" data-id="${escapeHtml(cat.id)}" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${
                    isDark ? 'bg-white/10 hover:bg-white hover:text-black' : 'bg-[#F2F4F7] hover:bg-black hover:text-white'
                  }">Edit</button>
                  <button data-action="cf-delete" data-id="${escapeHtml(cat.id)}" class="px-3.5 py-1.5 rounded-full bg-red-500/15 text-red-500 hover:bg-red-600 hover:text-white text-[11px] font-bold">Delete</button>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  } else if (state.dashboardTab === 'customization') {
    const f = state.customForm;
    const inputClass = `w-full rounded-2xl border px-4 py-2.5 text-sm focus:outline-none ${
      isDark ? 'bg-[#1B1B21] border-white/15 text-white focus:border-cyan-400' : 'bg-white border-black/15 text-[#0A0A0A] focus:border-[#0A0A0A]'
    }`;
    const cardClass = `rounded-3xl p-6 shadow-sm border space-y-5 ${isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'}`;

    const subTabs = [
      { id: 'brand', label: 'Brand & Footer', icon: 'type' },
      { id: 'hero', label: 'Hero Section', icon: 'sparkles' },
      { id: 'editorial', label: 'Editorial Banners', icon: 'layout-template' },
      { id: 'lookbook', label: 'Lookbook & Sections', icon: 'layers' }
    ];

    let subTabHtml = '';
    if (state.customSubTab === 'brand') {
      subTabHtml = `
        <div class="${cardClass}">
          <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">BRAND IDENTITY &amp; FOOTER</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div class="space-y-4">
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1.5">Website Brand Name</label>
                <input type="text" data-custom-field="brandName" value="${escapeHtml(f.brandName)}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1.5">Footer Tagline</label>
                <textarea rows="2" data-custom-field="footerTagline" class="${inputClass}">${escapeHtml(f.footerTagline)}</textarea>
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1.5">Footer Copyright Notice</label>
                <input type="text" data-custom-field="footerCopyright" value="${escapeHtml(f.footerCopyright)}" class="${inputClass}" />
              </div>
            </div>
            <div class="space-y-4">
              <div class="p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F8FAFB] border-black/5'}">
                ${renderBrandLogo(f.logoUrl, f.brandName, 'lg', !isDark)}
                ${
                  f.logoUrl
                    ? `<button type="button" data-action="reset-custom-logo" class="text-xs font-bold text-red-500 hover:underline">Use Default R&amp;R Emblem</button>`
                    : ''
                }
              </div>
              ${renderImageFieldControl('Upload or Paste Custom Logo URL', 'customForm.logoUrl', f.logoUrl, 'w-16 h-16', 500)}
            </div>
          </div>
        </div>
      `;
    } else if (state.customSubTab === 'hero') {
      subTabHtml = `
        <div class="${cardClass}">
          <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">HERO HEADLINES, BUTTONS &amp; ALL HERO IMAGES</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Hero Headline Line 1</label>
              <input type="text" data-custom-field="heroTitleLine1" value="${escapeHtml(f.heroTitleLine1)}" class="${inputClass}" />
            </div>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Hero Headline Line 2</label>
              <input type="text" data-custom-field="heroTitleLine2" value="${escapeHtml(f.heroTitleLine2)}" class="${inputClass}" />
            </div>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Primary Button Text</label>
              <input type="text" data-custom-field="heroPrimaryBtnText" value="${escapeHtml(f.heroPrimaryBtnText)}" class="${inputClass}" />
            </div>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Secondary Button Text</label>
              <input type="text" data-custom-field="heroSecondaryBtnText" value="${escapeHtml(f.heroSecondaryBtnText)}" class="${inputClass}" />
            </div>
            <div class="md:col-span-2">
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Hero Editorial Blurb (Bottom-Left)</label>
              <textarea rows="2" data-custom-field="heroDescription" class="${inputClass}">${escapeHtml(f.heroDescription)}</textarea>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            ${renderImageFieldControl('Main Hero Model Image', 'customForm.heroImage', f.heroImage, 'w-20 h-24', 1200)}
            <div class="space-y-3">
              ${renderImageFieldControl('Bottom-Right Video Preview Card Image', 'customForm.heroVideoPreviewImg', f.heroVideoPreviewImg, 'w-24 h-16', 800)}
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Video Preview Card Label</label>
                <input type="text" data-custom-field="heroVideoPreviewTitle" value="${escapeHtml(f.heroVideoPreviewTitle || '')}" class="${inputClass}" />
              </div>
            </div>
          </div>

          <div class="pt-2 space-y-3">
            <h3 class="font-ui text-xs font-bold uppercase tracking-wider opacity-75">3 Bottom-Left Editorial Thumbnail Images</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${renderImageFieldControl('Thumbnail 1', 'customForm.heroThumb1', f.heroThumb1, 'w-14 h-14', 400)}
              ${renderImageFieldControl('Thumbnail 2', 'customForm.heroThumb2', f.heroThumb2, 'w-14 h-14', 400)}
              ${renderImageFieldControl('Thumbnail 3', 'customForm.heroThumb3', f.heroThumb3, 'w-14 h-14', 400)}
            </div>
          </div>
        </div>
      `;
    } else if (state.customSubTab === 'editorial') {
      subTabHtml = `
        <div class="space-y-6">
          <div class="${cardClass}">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">PERFORMANCE SPLIT SECTION (2-COLUMN EDITORIAL)</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Section Title Line 1</label>
                <input type="text" data-custom-field="promoSectionTitleLine1" value="${escapeHtml(f.promoSectionTitleLine1)}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Section Title Line 2</label>
                <input type="text" data-custom-field="promoSectionTitleLine2" value="${escapeHtml(f.promoSectionTitleLine2)}" class="${inputClass}" />
              </div>
              <div class="md:col-span-2">
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Section Subtitle</label>
                <input type="text" data-custom-field="promoSectionSubtitle" value="${escapeHtml(f.promoSectionSubtitle)}" class="${inputClass}" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div class="space-y-3">
                ${renderImageFieldControl('Left Editorial Card Image', 'customForm.promoCard1Image', f.promoCard1Image, 'w-20 h-24')}
                <input type="text" data-custom-field="promoCard1Title" value="${escapeHtml(f.promoCard1Title)}" placeholder="Left Card Title" class="${inputClass}" />
                <input type="text" data-custom-field="promoCard1Tag" value="${escapeHtml(f.promoCard1Tag)}" placeholder="Left Card Tag" class="${inputClass}" />
              </div>
              <div class="space-y-3">
                ${renderImageFieldControl('Right Editorial Card Image', 'customForm.promoCard2Image', f.promoCard2Image, 'w-20 h-24')}
                <input type="text" data-custom-field="promoCard2Title" value="${escapeHtml(f.promoCard2Title)}" placeholder="Right Card Title" class="${inputClass}" />
                <input type="text" data-custom-field="promoCard2Tag" value="${escapeHtml(f.promoCard2Tag)}" placeholder="Right Card Tag" class="${inputClass}" />
              </div>
            </div>
          </div>

          <div class="${cardClass}">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">CENTERED STATEMENT BANNER</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Top Eyebrow Tag</label>
                <input type="text" data-custom-field="featureBannerTag" value="${escapeHtml(f.featureBannerTag)}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Banner Subtext</label>
                <input type="text" data-custom-field="featureBannerSubtext" value="${escapeHtml(f.featureBannerSubtext || '')}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Headline Line 1</label>
                <input type="text" data-custom-field="featureBannerTitleLine1" value="${escapeHtml(f.featureBannerTitleLine1)}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Headline Line 2</label>
                <input type="text" data-custom-field="featureBannerTitleLine2" value="${escapeHtml(f.featureBannerTitleLine2)}" class="${inputClass}" />
              </div>
              <div class="md:col-span-2">
                ${renderImageFieldControl('Centered Statement Banner Image', 'customForm.featureBannerImage', f.featureBannerImage, 'w-24 h-28')}
              </div>
            </div>
          </div>

          <div class="${cardClass}">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">3-COLUMN STAGGERED SHOWCASE ("WORKOUT")</h2>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Background Watermark Word</label>
              <input type="text" data-custom-field="showcaseWatermark" value="${escapeHtml(f.showcaseWatermark || 'WORKOUT')}" class="${inputClass}" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                ${renderImageFieldControl('Left Card Image', 'customForm.showcaseLeftImg', f.showcaseLeftImg, 'w-16 h-20')}
                <input type="text" data-custom-field="showcaseLeftCaption" value="${escapeHtml(f.showcaseLeftCaption || '')}" placeholder="Left caption..." class="${inputClass}" />
              </div>
              ${renderImageFieldControl('Center Monochrome Image', 'customForm.showcaseCenterImg', f.showcaseCenterImg, 'w-16 h-20')}
              <div class="space-y-2">
                ${renderImageFieldControl('Right Card Image', 'customForm.showcaseRightImg', f.showcaseRightImg, 'w-16 h-20')}
                <input type="text" data-custom-field="showcaseRightCaption" value="${escapeHtml(f.showcaseRightCaption || '')}" placeholder="Right caption..." class="${inputClass}" />
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (state.customSubTab === 'lookbook') {
      const cards = f.lookbookCards || [];
      subTabHtml = `
        <div class="space-y-6">
          <div class="${cardClass}">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">PRODUCT CATALOG &amp; LOOKBOOK HEADINGS</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Catalog Title Line 1</label>
                <input type="text" data-custom-field="catalogTitleLine1" value="${escapeHtml(f.catalogTitleLine1 || '')}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Catalog Title Line 2</label>
                <input type="text" data-custom-field="catalogTitleLine2" value="${escapeHtml(f.catalogTitleLine2 || '')}" class="${inputClass}" />
              </div>
              <div>
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Catalog Eyebrow Subtitle</label>
                <input type="text" data-custom-field="catalogSubtitle" value="${escapeHtml(f.catalogSubtitle || '')}" class="${inputClass}" />
              </div>
              <div class="md:col-span-3">
                <label class="block font-ui text-[11px] font-bold uppercase mb-1">Vertical Lookbook Section Title</label>
                <input type="text" data-custom-field="lookbookSectionTitle" value="${escapeHtml(f.lookbookSectionTitle || '')}" class="${inputClass}" />
              </div>
            </div>
          </div>

          <div class="${cardClass}">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider">VERTICAL LOOKBOOK CARDS (${cards.length})</h2>
                <p class="text-[11px] opacity-65">Edit images, outfit titles, tags, or add/remove cards from the expanding lookbook strip.</p>
              </div>
              <button type="button" data-action="add-lookbook-card" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-ui text-xs font-bold uppercase ${
                isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
              }">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                Add Lookbook Card
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              ${cards
                .map(
                  (card, idx) => `
                <div class="p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#1B1B21] border-white/10' : 'bg-[#F8FAFB] border-black/5'}">
                  <div class="flex items-center justify-between">
                    <span class="font-ui text-xs font-extrabold uppercase">LOOKBOOK CARD #${idx + 1}</span>
                    ${
                      cards.length > 1
                        ? `<button type="button" data-action="remove-lookbook-card" data-idx="${idx}" class="p-1.5 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-600 hover:text-white" title="Remove Card">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>`
                        : ''
                    }
                  </div>
                  ${renderImageFieldControl('Outfit Photo', `lookbook.${idx}.image`, card.image, 'w-16 h-20')}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input type="text" data-lookbook-idx="${idx}" data-lookbook-field="title" value="${escapeHtml(card.title)}" placeholder="Outfit Title" class="${inputClass}" />
                    <input type="text" data-lookbook-idx="${idx}" data-lookbook-field="tag" value="${escapeHtml(card.tag)}" placeholder="Outfit Tag / Label" class="${inputClass}" />
                    <input type="text" data-lookbook-idx="${idx}" data-lookbook-field="season" value="${escapeHtml(card.season || '')}" placeholder="Season Label" class="${inputClass}" />
                    <select data-lookbook-idx="${idx}" data-lookbook-field="linkedProductId" class="${inputClass}">
                      <option value="">Link to Product (Shop the Look)</option>
                      ${state.products
                        .map(
                          (p) => `<option value="${escapeHtml(p.id)}" ${card.linkedProductId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
                        )
                        .join('')}
                    </select>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;
    }

    mainContent = `
      <form id="customization-save-form" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[-0.02em]">WEBSITE CUSTOMIZATION STUDIO</h1>
            <p class="text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">Edit every non-product image, banner, lookbook card, logo, and title across your live storefront.</p>
          </div>
          <button type="submit" class="px-6 py-3 rounded-full font-ui text-xs font-bold uppercase tracking-wider shadow-md shrink-0 ${
            isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-[#0A0A0A] text-white hover:bg-[#272A2E]'
          }">SAVE ALL CHANGES</button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          ${subTabs
            .map((t) => {
              const active = state.customSubTab === t.id;
              return `
              <button type="button" data-action="custom-subtab" data-subtab="${t.id}" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-ui text-xs font-bold uppercase tracking-wider transition-all ${
                active
                  ? isDark
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#0A0A0A] text-white shadow-sm'
                  : isDark
                  ? 'bg-[#121216] text-zinc-400 hover:text-white border border-white/10'
                  : 'bg-white text-[#525860] hover:text-black border border-black/5'
              }">
                <i data-lucide="${t.icon}" class="w-3.5 h-3.5"></i>
                ${t.label}
              </button>
            `;
            })
            .join('')}
        </div>

        ${subTabHtml}
      </form>
    `;
  } else if (state.dashboardTab === 'social') {
    const ownerEmail = state.ownerAuthRecord?.email || 'owner@rrwear.com';
    const currentToken = getGithubToken();
    mainContent = `
      <div class="space-y-6">
        <div>
          <h1 class="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-[-0.02em]">CONTACT, SOCIAL &amp; GITHUB REPO SYNC</h1>
          <p class="text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-[#6E7378]'}">Connect your GitHub repository for permanent storage and configure your social media ordering links.</p>
        </div>

        <form id="github-token-form" class="rounded-3xl p-6 shadow-sm border space-y-4 ${
          isDark ? 'bg-[#121216] border-cyan-400/30' : 'bg-white border-cyan-600/25'
        }">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="github" class="w-4 h-4"></i>
              GITHUB REPOSITORY PERMANENT SYNC (${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo})
            </h2>
            <span class="px-3 py-1 rounded-full font-ui text-[10px] font-bold uppercase ${
              currentToken ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
            }">
              ${currentToken ? 'Connected & Active' : 'Token Required'}
            </span>
          </div>
          <p class="text-xs opacity-75 leading-relaxed">
            Paste a GitHub Personal Access Token (with <strong>Contents: Read and write</strong> permission on <code>${GITHUB_CONFIG.repo}</code>). All uploaded images/videos will save inside <code>/${GITHUB_CONFIG.mediaFolder}/</code> and all store edits will save permanently to <code>/${GITHUB_CONFIG.dataPath}</code>.
          </p>
          <div class="flex flex-col sm:flex-row gap-3">
            <input id="gh-token-input" type="password" value="${escapeHtml(currentToken)}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..." class="flex-1 rounded-2xl border px-4 py-2.5 text-sm ${
              isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/15'
            }" />
            <button type="submit" class="px-6 py-2.5 rounded-full font-ui text-xs font-bold uppercase tracking-wider shadow-md ${
              isDark ? 'bg-cyan-400 text-black' : 'bg-[#0A0A0A] text-white'
            }">Save &amp; Sync Repo</button>
          </div>
        </form>

        <form id="social-links-form" class="rounded-3xl p-6 shadow-sm border space-y-5 ${
          isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'
        }">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 space-y-2">
              <div class="flex items-center gap-2 text-[#25D366] font-ui font-bold text-xs uppercase">
                ${renderWhatsAppIcon('w-4 h-4')}
                WhatsApp Number
              </div>
              <input id="social-whatsapp" type="text" value="${escapeHtml(s.whatsappNumber || '')}" placeholder="8801700000000" class="w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                isDark ? 'bg-[#121216] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
              <p class="text-[11px] opacity-70">Country code without + or spaces (e.g., 8801712345678).</p>
            </div>

            <div class="p-4 rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/25 space-y-2">
              <div class="flex items-center gap-2 text-[#229ED9] font-ui font-bold text-xs uppercase">
                ${renderTelegramIcon('w-4 h-4')}
                Telegram Username / Link
              </div>
              <input id="social-telegram" type="text" value="${escapeHtml(s.telegramUsername || '')}" placeholder="rrwear_official" class="w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                isDark ? 'bg-[#121216] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
              <p class="text-[11px] opacity-70">Enter Telegram username (without @) or full t.me link.</p>
            </div>

            <div class="p-4 rounded-2xl bg-[#0084FF]/10 border border-[#0084FF]/25 space-y-2">
              <div class="flex items-center gap-2 text-[#0084FF] font-ui font-bold text-xs uppercase">
                ${renderMessengerIcon('w-4 h-4')}
                Facebook Messenger Link
              </div>
              <input id="social-messenger" type="text" value="${escapeHtml(s.messengerUsername || '')}" placeholder="rrwear.official" class="w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                isDark ? 'bg-[#121216] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
              <p class="text-[11px] opacity-70">Enter Facebook Page username or full https://m.me/... URL.</p>
            </div>
          </div>

          <button type="submit" class="px-6 py-3 rounded-full font-ui text-xs font-bold uppercase tracking-wider shadow-md ${
            isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'
          }">SAVE CONTACT LINKS</button>
        </form>

        <form id="owner-security-form" class="rounded-3xl p-6 shadow-sm border space-y-4 ${
          isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'
        }">
          <h2 class="font-ui text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="lock" class="w-4 h-4"></i>
            OWNER LOGIN CREDENTIALS
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">Owner Login Email</label>
              <input id="sec-owner-email" type="email" required value="${escapeHtml(ownerEmail)}" class="w-full rounded-2xl border px-4 py-2.5 text-sm ${
                isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
            </div>
            <div>
              <label class="block font-ui text-[11px] font-bold uppercase mb-1">New Password (leave blank to keep current)</label>
              <input id="sec-new-pass" type="password" placeholder="Enter new password..." class="w-full rounded-2xl border px-4 py-2.5 text-sm ${
                isDark ? 'bg-[#1B1B21] border-white/15 text-white' : 'bg-white border-black/15'
              }" />
            </div>
          </div>
          <button type="submit" class="px-5 py-2.5 rounded-full font-ui text-xs font-bold uppercase tracking-wider transition-colors ${
            isDark ? 'bg-white/10 hover:bg-white hover:text-black' : 'bg-[#F2F4F7] hover:bg-[#0A0A0A] hover:text-white'
          }">Update Owner Credentials</button>
        </form>
      </div>
    `;
  }

  return `
    <div class="min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${
      isDark ? 'bg-[#09090B] text-[#F8FAFC]' : 'bg-[#F2F4F7] text-[#0A0A0A]'
    }">
      <!-- Mobile Top Bar -->
      <div class="lg:hidden border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30 ${
        isDark ? 'bg-[#121216] border-white/10' : 'bg-white border-black/5'
      }">
        ${renderBrandLogo(s.logoUrl, s.brandName, 'sm', !isDark)}
        <div class="flex items-center gap-2">
          <button data-action="toggle-theme" class="w-8 h-8 rounded-full flex items-center justify-center border ${
            isDark ? 'bg-white/10 border-white/10 text-amber-300' : 'bg-[#F2F4F7] border-black/5'
          }">
            <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
          </button>
          <button data-action="nav-home" class="px-3 py-1.5 rounded-full font-ui text-[11px] font-bold uppercase ${
            isDark ? 'bg-white/10 text-white' : 'bg-[#F2F4F7] text-[#0A0A0A]'
          }">Live Site</button>
          <button data-action="toggle-dash-sidebar" class="p-2 rounded-xl ${isDark ? 'bg-white text-black' : 'bg-[#0A0A0A] text-white'}">
            <i data-lucide="${state.dashboardSidebarOpen ? 'x' : 'menu'}" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <!-- Left Dashboard Sidebar -->
      <aside class="${state.dashboardSidebarOpen ? 'fixed inset-0 z-40 block' : 'hidden'} lg:block lg:w-72 bg-[#111315] text-white p-6 flex flex-col justify-between shrink-0 lg:min-h-screen border-r border-white/10">
        <div class="space-y-8">
          <div class="flex items-center justify-between">
            ${renderBrandLogo(s.logoUrl, s.brandName, 'md', false)}
            <button data-action="toggle-dash-sidebar" class="lg:hidden p-1.5 rounded-lg bg-white/10 text-white">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <nav class="space-y-1.5">
            ${sidebarItems
              .map((item) => {
                const isActive = state.dashboardTab === item.id;
                return `
                <button data-action="dash-tab" data-tab="${item.id}" class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-ui text-xs font-semibold transition-all ${
                  isActive ? 'bg-white text-[#0A0A0A] shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'
                }">
                  <i data-lucide="${item.icon}" class="w-4 h-4 shrink-0"></i>
                  <span>${item.label}</span>
                </button>
              `;
              })
              .join('')}

            <button data-action="owner-logout" class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-ui text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-4">
              <i data-lucide="log-out" class="w-4 h-4 shrink-0"></i>
              <span>Logout</span>
            </button>
          </nav>
        </div>

        <div class="pt-6 border-t border-white/10 space-y-2.5">
          <button data-action="toggle-theme" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-ui text-xs font-bold uppercase tracking-wider transition-all">
            <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4 ${isDark ? 'text-amber-300' : ''}"></i>
            ${isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button data-action="nav-home" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 font-ui text-xs font-bold uppercase tracking-wider transition-all">
            <i data-lucide="external-link" class="w-4 h-4"></i>
            View Live Store
          </button>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="flex-1 p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full">
        ${tokenWarningBanner}
        ${mainContent}
      </main>
    </div>
  `;
}

// ============================================================================
// 12. MASTER RENDER, INTERSECTION OBSERVER SCROLL REVEALS & SHOWCASE MOTION
// ============================================================================
let heroObserver = null;
let heroTypewriterTimer = null;
let heroStartTimer = null;

function runHeroTypewriter(fullText) {
  clearTimeout(heroStartTimer);
  clearInterval(heroTypewriterTimer);

  const targetEl = document.getElementById('hero-typewriter-target');
  const cursorEl = document.getElementById('hero-typewriter-cursor');
  if (!targetEl) return;

  targetEl.textContent = '';
  if (cursorEl) cursorEl.classList.remove('hidden');

  let charIdx = 0;
  heroStartTimer = setTimeout(() => {
    heroTypewriterTimer = setInterval(() => {
      charIdx += 1;
      targetEl.textContent = fullText.slice(0, charIdx);
      if (charIdx >= fullText.length) {
        clearInterval(heroTypewriterTimer);
        state.heroAnimPlayed = true;
        setTimeout(() => {
          const cur = document.getElementById('hero-typewriter-cursor');
          if (cur) cur.classList.add('hidden');
        }, 900);
      }
    }, 52);
  }, 1550);
}

function replayHeroAnimation() {
  const heroEl = document.getElementById('hero-section');
  if (!heroEl) return;
  const isDark = state.theme === 'dark';

  const animSelectors = [
    '.animate-hero-model',
    '.animate-hero-left',
    '.animate-hero-right',
    '.animate-mask-line-1',
    '.animate-hero-cta'
  ];
  animSelectors.forEach((sel) => {
    const el = heroEl.querySelector(sel);
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });

  const modelWrap = heroEl.querySelector('.animate-hero-model > div');
  if (modelWrap) {
    const oldBlinds = modelWrap.querySelector('.hero-blinds-overlay');
    if (oldBlinds) oldBlinds.remove();
    const overlay = document.createElement('div');
    overlay.className = 'hero-blinds-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = [0, 1, 2, 3, 4, 5, 6]
      .map(
        (i) =>
          `<div class="hero-blind-slat ${
            isDark ? 'bg-[#121216]' : 'bg-[#DCE5E9]'
          }" style="animation-delay: ${0.32 + i * 0.055}s;"></div>`
      )
      .join('');
    modelWrap.appendChild(overlay);
  }

  runHeroTypewriter(state.siteSettings.heroTitleLine2 || 'EVERY WORKOUT!');
}

function initHeroMotion() {
  if (heroObserver) heroObserver.disconnect();
  const heroEl = document.getElementById('hero-section');
  if (!heroEl || state.activeView !== 'home') return;

  let wasOutOfView = false;

  heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          wasOutOfView = true;
          clearTimeout(heroStartTimer);
          clearInterval(heroTypewriterTimer);
        } else if (wasOutOfView) {
          wasOutOfView = false;
          state.heroAnimPlayed = false;
          replayHeroAnimation();
        }
      });
    },
    { threshold: 0.2 }
  );

  heroObserver.observe(heroEl);

  if (!state.heroAnimPlayed) {
    runHeroTypewriter(state.siteSettings.heroTitleLine2 || 'EVERY WORKOUT!');
  }
}

let showcaseObserver = null;
let showcaseTimers = [];

function playShowcaseAnimation(sectionEl) {
  const isDark = state.theme === 'dark';
  showcaseTimers.forEach((t) => clearTimeout(t));
  showcaseTimers = [];

  sectionEl.querySelectorAll('.showcase-card-enter').forEach((card, cardIdx) => {
    const oldOverlay = card.querySelector('.showcase-blinds-overlay');
    if (oldOverlay) oldOverlay.remove();

    const slatCount = cardIdx === 1 ? 9 : 7;
    const baseDelay = cardIdx === 0 ? 0.12 : cardIdx === 1 ? 0.22 : 0.32;
    const overlay = document.createElement('div');
    overlay.className = 'showcase-blinds-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = Array.from({ length: slatCount })
      .map(
        (_, i) =>
          `<div class="showcase-blind-slat ${
            isDark ? 'bg-[#121216]' : 'bg-[#F4F5F7]'
          }" style="animation-delay: ${baseDelay + i * 0.05}s;"></div>`
      )
      .join('');
    card.appendChild(overlay);

    const delay = Number(card.getAttribute('data-delay') || 0);
    const timer = setTimeout(() => {
      card.classList.add('is-revealed');
    }, delay);
    showcaseTimers.push(timer);
  });

  sectionEl.querySelectorAll('.showcase-caption-enter').forEach((cap) => {
    const delay = Number(cap.getAttribute('data-delay') || 350);
    const timer = setTimeout(() => {
      cap.classList.add('is-revealed');
    }, delay);
    showcaseTimers.push(timer);
  });
}

function resetShowcaseAnimation(sectionEl) {
  showcaseTimers.forEach((t) => clearTimeout(t));
  showcaseTimers = [];
  sectionEl.querySelectorAll('.showcase-card-enter, .showcase-caption-enter').forEach((el) => {
    el.classList.remove('is-revealed');
  });
}

function initShowcaseMotion() {
  if (showcaseObserver) showcaseObserver.disconnect();
  const sectionEl = document.getElementById('showcase-section');
  if (!sectionEl || state.activeView !== 'home') return;

  showcaseObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          playShowcaseAnimation(sectionEl);
        } else {
          resetShowcaseAnimation(sectionEl);
        }
      });
    },
    { threshold: 0.18 }
  );

  showcaseObserver.observe(sectionEl);
}

let promoObserver = null;

function initPromoMotion() {
  if (promoObserver) promoObserver.disconnect();
  const promoEl = document.getElementById('promo-section');
  if (!promoEl || state.activeView !== 'home') return;

  promoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          promoEl.classList.add('is-promo-visible');
        } else {
          promoEl.classList.remove('is-promo-visible');
        }
      });
    },
    { threshold: 0.16 }
  );

  promoObserver.observe(promoEl);
}

let showcaseParallaxTicking = false;
window.addEventListener(
  'scroll',
  () => {
    if (showcaseParallaxTicking) return;
    showcaseParallaxTicking = true;
    requestAnimationFrame(() => {
      const sectionEl = document.getElementById('showcase-section');
      if (sectionEl && state.activeView === 'home') {
        const rect = sectionEl.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        if (rect.bottom > 0 && rect.top < vh) {
          const progress = ((vh * 0.5 - (rect.top + rect.height * 0.5)) / vh) * 2;
          const watermark = document.getElementById('showcase-watermark-text');
          const leftCol = document.getElementById('showcase-col-left');
          const rightCol = document.getElementById('showcase-col-right');

          if (watermark) {
            watermark.style.transform = `translate3d(${progress * -38}px, 0, 0)`;
          }
          if (leftCol && window.innerWidth >= 768) {
            leftCol.style.transform = `translate3d(0, ${progress * -18}px, 0)`;
          }
          if (rightCol && window.innerWidth >= 768) {
            rightCol.style.transform = `translate3d(0, ${progress * 18}px, 0)`;
          }
        }
      }
      showcaseParallaxTicking = false;
    });
  },
  { passive: true }
);

let scrollObserver = null;
function initScrollReveals() {
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );
  document.querySelectorAll('.scroll-reveal').forEach((el) => scrollObserver.observe(el));
}

function renderPromoSlices(imageUrl, altText, baseDelay = 0, sliceCount = 5) {
  return Array.from({ length: sliceCount }, (_, i) => {
    const delay = baseDelay + i * 75;
    const offsetPercent = -(i * 100);
    return `
      <div class="promo-slice relative h-full overflow-hidden" style="transition-delay: ${delay}ms;">
        <img
          src="${escapeHtml(imageUrl)}"
          alt="${i === 0 ? escapeHtml(altText) : ''}"
          aria-hidden="${i === 0 ? 'false' : 'true'}"
          class="absolute top-0 h-full object-cover max-w-none pointer-events-none select-none"
          style="width: ${sliceCount * 100}%; left: ${offsetPercent}%;"
        />
      </div>
    `;
  }).join('');
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;

  if (state.activeView === 'dashboard') {
    root.innerHTML = renderDashboardView();
  } else if (state.activeView === 'login') {
    root.innerHTML = renderOwnerLoginView();
  } else {
    root.innerHTML = renderStorefrontView();
  }

  renderModals();
  if (window.lucide) window.lucide.createIcons();
  initScrollReveals();
  initHeroMotion();
  initShowcaseMotion();
  initPromoMotion();
  initFeatureBannerMotion();
}

// ============================================================================
// SECTION 4: SCROLL-LINKED FEATURE BANNER ANIMATION (SCROLL UP & DOWN)
// ============================================================================
let featureBannerObserver = null;
let featureBannerScrollBound = false;

function updateFeatureBannerWatermarkParallax() {
  const sectionEl = document.getElementById('feature-banner-section');
  if (!sectionEl || state.activeView !== 'home') return;

  const rect = sectionEl.getBoundingClientRect();
  const vh = window.innerHeight || 800;
  if (rect.bottom <= 0 || rect.top >= vh) return;

  const progress = ((vh * 0.5 - (rect.top + rect.height * 0.5)) / vh) * 2;
  const topTrack = document.getElementById('feature-wm-top-track');
  const bottomTrack = document.getElementById('feature-wm-bottom-track');

  if (topTrack) {
    topTrack.style.transform = `translate3d(${progress * -45}px, 0, 0)`;
  }
  if (bottomTrack) {
    bottomTrack.style.transform = `translate3d(${progress * 45}px, 0, 0)`;
  }
}

function initFeatureBannerMotion() {
  if (featureBannerObserver) featureBannerObserver.disconnect();
  const sectionEl = document.getElementById('feature-banner-section');
  if (!sectionEl || state.activeView !== 'home') return;

  featureBannerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sectionEl.classList.add('is-feature-visible');
        } else {
          sectionEl.classList.remove('is-feature-visible');
        }
      });
    },
    { threshold: 0.18 }
  );

  featureBannerObserver.observe(sectionEl);

  if (!featureBannerScrollBound) {
    featureBannerScrollBound = true;
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updateFeatureBannerWatermarkParallax();
          ticking = false;
        });
      },
      { passive: true }
    );
  }
  updateFeatureBannerWatermarkParallax();
}

// ============================================================================
// 13. GLOBAL DELEGATED EVENT HANDLERS (CLICKS, INPUTS, FILE UPLOADS, FORMS)
// ============================================================================
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');

  if (action === 'close-toast') {
    document.getElementById('toast-root').innerHTML = '';
  } else if (action === 'toggle-theme') {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    render();
  } else if (action === 'toggle-mobile-menu') {
    state.mobileMenuOpen = !state.mobileMenuOpen;
    render();
  } else if (action === 'nav-home') {
    state.mobileMenuOpen = false;
    navigateTo('home');
  } else if (action === 'nav-portal') {
    navigateTo(state.isOwnerAuthenticated ? 'dashboard' : 'login');
  } else if (action === 'filter-cat') {
    state.mobileMenuOpen = false;
    scrollToCatalog(btn.getAttribute('data-cat') || 'ALL');
  } else if (action === 'set-cat-filter') {
    state.selectedCategoryFilter = btn.getAttribute('data-cat') || 'ALL';
    render();
  } else if (action === 'reset-catalog') {
    state.selectedCategoryFilter = 'ALL';
    state.searchQuery = '';
    render();
  } else if (action === 'focus-search') {
    scrollToCatalog('ALL');
    setTimeout(() => document.getElementById('store-search-input')?.focus(), 180);
  } else if (action === 'open-product') {
    navigateTo('product-details', btn.getAttribute('data-id'));
  } else if (action === 'open-shop') {
    const prod = state.products.find((p) => p.id === btn.getAttribute('data-id'));
    if (prod) {
      state.shopModalBagItems = null;
      state.shopModalProduct = prod;
      renderModals();
      if (window.lucide) window.lucide.createIcons();
    }
  } else if (action === 'close-shop-modal') {
    state.shopModalProduct = null;
    state.shopModalBagItems = null;
    renderModals();
  }
  // Shopping Bag Actions
  else if (action === 'add-to-bag') {
    const prod = state.products.find((p) => p.id === btn.getAttribute('data-id'));
    if (prod) {
      addToBag(prod);
      state.shopModalProduct = null;
      state.shopModalBagItems = null;
      render();
      showToast(`Added "${prod.name}" to your bag.`);
    }
  } else if (action === 'open-bag') {
    state.bagModalOpen = true;
    renderModals();
    if (window.lucide) window.lucide.createIcons();
  } else if (action === 'close-bag-modal') {
    state.bagModalOpen = false;
    renderModals();
  } else if (action === 'bag-inc') {
    const item = state.bag.find((it) => it.id === btn.getAttribute('data-id'));
    if (item) {
      item.qty = (item.qty || 1) + 1;
      saveBagToStorage(state.bag);
      render();
    }
  } else if (action === 'bag-dec') {
    const id = btn.getAttribute('data-id');
    const item = state.bag.find((it) => it.id === id);
    if (item) {
      if ((item.qty || 1) > 1) {
        item.qty -= 1;
      } else {
        state.bag = state.bag.filter((it) => it.id !== id);
      }
      saveBagToStorage(state.bag);
      render();
    }
  } else if (action === 'bag-remove') {
    const id = btn.getAttribute('data-id');
    state.bag = state.bag.filter((it) => it.id !== id);
    saveBagToStorage(state.bag);
    render();
  } else if (action === 'bag-shop-now') {
    if (state.bag.length > 0) {
      state.bagModalOpen = false;
      state.shopModalProduct = null;
      state.shopModalBagItems = [...state.bag];
      renderModals();
      if (window.lucide) window.lucide.createIcons();
    }
  } else if (action === 'copy-inquiry') {
    navigator.clipboard?.writeText(btn.getAttribute('data-msg') || '');
    showToast('Order message copied! Paste it in your chat.');
  } else if (action === 'copy-inquiry-silent') {
    navigator.clipboard?.writeText(btn.getAttribute('data-msg') || '');
  } else if (action === 'open-hero-video') {
    state.heroVideoOpen = true;
    renderModals();
    if (window.lucide) window.lucide.createIcons();
  } else if (action === 'close-hero-video') {
    state.heroVideoOpen = false;
    renderModals();
  } else if (action === 'hero-video-shop') {
    state.heroVideoOpen = false;
    renderModals();
    scrollToCatalog('ALL');
  } else if (action === 'media-prev') {
    const len = Number(btn.getAttribute('data-len') || 1);
    state.selectedMediaIndex = (state.selectedMediaIndex - 1 + len) % len;
    render();
  } else if (action === 'media-next') {
    const len = Number(btn.getAttribute('data-len') || 1);
    state.selectedMediaIndex = (state.selectedMediaIndex + 1) % len;
    render();
  } else if (action === 'media-select') {
    state.selectedMediaIndex = Number(btn.getAttribute('data-idx') || 0);
    render();
  }
  // Login Actions
  else if (action === 'toggle-forgot-mode') {
    state.loginForgotMode = !state.loginForgotMode;
    state.loginResetSent = false;
    state.loginError = '';
    render();
  } else if (action === 'toggle-password-vis') {
    state.loginShowPassword = !state.loginShowPassword;
    render();
  } else if (action === 'fill-demo-creds') {
    state.loginEmail = 'owner@rrwear.com';
    state.loginPassword = 'RRWear2026!';
    render();
  }
  // Dashboard Navigation & Actions
  else if (action === 'toggle-dash-sidebar') {
    state.dashboardSidebarOpen = !state.dashboardSidebarOpen;
    render();
  } else if (action === 'dash-tab') {
    const tab = btn.getAttribute('data-tab');
    if (tab !== 'add-product') state.editingProductId = null;
    state.dashboardTab = tab;
    state.dashboardSidebarOpen = false;
    render();
  } else if (action === 'owner-logout') {
    state.isOwnerAuthenticated = false;
    sessionStorage.removeItem('rr_wear_owner_auth');
    state.editingProductId = null;
    state.dashboardTab = 'overview';
    navigateTo('home');
    showToast('Logged out of Owner Dashboard.');
  } else if (action === 'dash-new-product') {
    state.editingProductId = null;
    state.prodForm = {
      name: '',
      price: '',
      categoryId: state.categories[0]?.id || 'cat-men',
      visibility: 'published',
      description: '',
      images: [],
      videos: [],
      specifications: [
        { label: 'Material', value: '' },
        { label: 'Fit', value: '' }
      ]
    };
    state.dashboardTab = 'add-product';
    render();
  } else if (action === 'dash-edit-product') {
    const prod = state.products.find((p) => p.id === btn.getAttribute('data-id'));
    if (prod) {
      state.editingProductId = prod.id;
      state.prodForm = {
        name: prod.name || '',
        price: prod.price ?? '',
        categoryId: prod.categoryId || state.categories[0]?.id || '',
        visibility: prod.visibility || 'published',
        description: prod.description || '',
        images: [...(prod.images || [])],
        videos: [...(prod.videos || [])],
        specifications: prod.specifications?.length
          ? prod.specifications.map((s) => ({ ...s }))
          : [{ label: 'Material', value: '' }, { label: 'Fit', value: '' }]
      };
      state.dashboardTab = 'add-product';
      render();
    }
  } else if (action === 'toggle-prod-visibility') {
    const id = btn.getAttribute('data-id');
    const prod = state.products.find((p) => p.id === id);
    if (prod) {
      const nextVis = prod.visibility === 'draft' ? 'published' : 'draft';
      prod.visibility = nextVis;
      render();
      try {
        await persistStoreToGithub(`Set ${prod.name} visibility to ${nextVis}`);
        showToast(`Product marked as ${nextVis} & saved to GitHub!`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  } else if (action === 'prompt-delete-prod') {
    state.deleteProductTarget = state.products.find((p) => p.id === btn.getAttribute('data-id')) || null;
    renderModals();
    if (window.lucide) window.lucide.createIcons();
  } else if (action === 'cancel-delete-prod') {
    state.deleteProductTarget = null;
    renderModals();
  } else if (action === 'confirm-delete-prod') {
    if (state.deleteProductTarget) {
      const target = state.deleteProductTarget;
      state.products = state.products.filter((p) => p.id !== target.id);
      state.deleteProductTarget = null;
      render();
      try {
        await persistStoreToGithub(`Delete product ${target.name}`);
        showToast(`Deleted "${target.name}" permanently from GitHub.`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }
  // Product Form Media/Specs Actions
  else if (action === 'pf-add-img-url') {
    const inp = document.getElementById('pf-img-url-input');
    if (inp && inp.value.trim()) {
      state.prodForm.images.push(inp.value.trim());
      render();
    }
  } else if (action === 'pf-move-img') {
    const idx = Number(btn.getAttribute('data-idx'));
    const dir = Number(btn.getAttribute('data-dir'));
    const target = idx + dir;
    if (target >= 0 && target < state.prodForm.images.length) {
      const arr = state.prodForm.images;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      render();
    }
  } else if (action === 'pf-primary-img') {
    const idx = Number(btn.getAttribute('data-idx'));
    if (idx > 0) {
      const [sel] = state.prodForm.images.splice(idx, 1);
      state.prodForm.images.unshift(sel);
      render();
      showToast('Set as primary product image.');
    }
  } else if (action === 'pf-del-img') {
    const idx = Number(btn.getAttribute('data-idx'));
    state.prodForm.images.splice(idx, 1);
    render();
  } else if (action === 'pf-add-vid-url') {
    const inp = document.getElementById('pf-vid-url-input');
    if (inp && inp.value.trim()) {
      state.prodForm.videos.push({ name: 'Product Video', url: inp.value.trim() });
      render();
    }
  } else if (action === 'pf-del-vid') {
    const idx = Number(btn.getAttribute('data-idx'));
    state.prodForm.videos.splice(idx, 1);
    render();
  } else if (action === 'pf-add-spec') {
    state.prodForm.specifications.push({ label: '', value: '' });
    render();
  } else if (action === 'pf-del-spec') {
    const idx = Number(btn.getAttribute('data-idx'));
    state.prodForm.specifications.splice(idx, 1);
    render();
  }
  // Category Actions
  else if (action === 'cf-edit') {
    const cat = state.categories.find((c) => c.id === btn.getAttribute('data-id'));
    if (cat) {
      state.editingCategoryId = cat.id;
      state.catForm = { name: cat.name, description: cat.description || '', image: cat.image || '', banner: cat.banner || '' };
      render();
    }
  } else if (action === 'cf-cancel-edit') {
    state.editingCategoryId = null;
    state.catForm = { name: '', description: '', image: '', banner: '' };
    render();
  } else if (action === 'cf-delete') {
    const cat = state.categories.find((c) => c.id === btn.getAttribute('data-id'));
    if (cat) {
      const otherCats = state.categories.filter((c) => c.id !== cat.id);
      state.reassignCategoryId = otherCats[0]?.id || 'uncategorized';
      state.deleteCategoryModal = cat;
      renderModals();
      if (window.lucide) window.lucide.createIcons();
    }
  } else if (action === 'cancel-delete-cat') {
    state.deleteCategoryModal = null;
    renderModals();
  } else if (action === 'confirm-delete-cat') {
    if (state.deleteCategoryModal) {
      const targetCat = state.deleteCategoryModal;
      const sel = document.getElementById('reassign-cat-select');
      const fallbackId = sel ? sel.value : state.reassignCategoryId || 'uncategorized';
      const associated = state.products.filter((p) => p.categoryId === targetCat.id);

      for (const prod of associated) {
        prod.categoryId = fallbackId;
      }
      state.categories = state.categories.filter((c) => c.id !== targetCat.id);
      state.deleteCategoryModal = null;
      render();
      try {
        await persistStoreToGithub(`Delete category ${targetCat.name}`);
        showToast(
          associated.length > 0
            ? `Category deleted and ${associated.length} product(s) reassigned & saved.`
            : 'Category deleted permanently.'
        );
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  }
  // Customization Sub-tabs & Lookbook Actions
  else if (action === 'custom-subtab') {
    state.customSubTab = btn.getAttribute('data-subtab');
    render();
  } else if (action === 'reset-custom-logo') {
    state.customForm.logoUrl = '';
    render();
  } else if (action === 'add-lookbook-card') {
    if (!state.customForm.lookbookCards) state.customForm.lookbookCards = [];
    state.customForm.lookbookCards.push({
      id: `look-${Date.now()}`,
      title: 'NEW SEASONAL FIT',
      tag: 'LIMITED EDITION',
      season: '2026 COLLECTION',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
      linkedProductId: state.products[0]?.id || ''
    });
    render();
  } else if (action === 'remove-lookbook-card') {
    const idx = Number(btn.getAttribute('data-idx'));
    state.customForm.lookbookCards.splice(idx, 1);
    render();
  }
});

// Input & Select Listeners
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id === 'store-search-input') {
    state.searchQuery = el.value;
    const publishedProducts = state.products.filter((p) => p.visibility !== 'draft');
    const filtered = publishedProducts.filter((prod) => {
      const matchesCat = state.selectedCategoryFilter === 'ALL' || prod.categoryId === state.selectedCategoryFilter;
      const q = state.searchQuery.trim().toLowerCase();
      return matchesCat && (!q || prod.name.toLowerCase().includes(q) || (prod.description && prod.description.toLowerCase().includes(q)));
    });
    const grid = document.getElementById('catalog-grid-container');
    if (grid) {
      grid.innerHTML = renderCatalogGridHtml(filtered);
      if (window.lucide) window.lucide.createIcons();
      initScrollReveals();
    }
  } else if (el.id === 'login-email-input') {
    state.loginEmail = el.value;
  } else if (el.id === 'login-password-input') {
    state.loginPassword = el.value;
  } else if (el.id === 'dash-prod-search') {
    state.dashProductQuery = el.value;
    render();
    const inp = document.getElementById('dash-prod-search');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  } else if (el.id === 'pf-name') state.prodForm.name = el.value;
  else if (el.id === 'pf-price') state.prodForm.price = el.value;
  else if (el.id === 'pf-description') state.prodForm.description = el.value;
  else if (el.hasAttribute('data-spec-label')) {
    const idx = Number(el.getAttribute('data-spec-label'));
    state.prodForm.specifications[idx].label = el.value;
  } else if (el.hasAttribute('data-spec-value')) {
    const idx = Number(el.getAttribute('data-spec-value'));
    state.prodForm.specifications[idx].value = el.value;
  } else if (el.id === 'cf-name') state.catForm.name = el.value;
  else if (el.id === 'cf-desc') state.catForm.description = el.value;
  else if (el.hasAttribute('data-custom-field')) {
    state.customForm[el.getAttribute('data-custom-field')] = el.value;
  } else if (el.hasAttribute('data-lookbook-idx')) {
    const idx = Number(el.getAttribute('data-lookbook-idx'));
    const field = el.getAttribute('data-lookbook-field');
    state.customForm.lookbookCards[idx][field] = el.value;
  } else if (el.hasAttribute('data-img-url-field')) {
    const path = el.getAttribute('data-img-url-field');
    applyImageFieldValue(path, el.value);
  }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.id === 'dash-prod-cat-filter') {
    state.dashProductCatFilter = el.value;
    render();
  } else if (el.id === 'pf-visibility') {
    state.prodForm.visibility = el.value;
  } else if (el.id === 'pf-category') {
    state.prodForm.categoryId = el.value;
  } else if (el.hasAttribute('data-lookbook-idx')) {
    const idx = Number(el.getAttribute('data-lookbook-idx'));
    const field = el.getAttribute('data-lookbook-field');
    state.customForm.lookbookCards[idx][field] = el.value;
  } else if (el.id === 'pf-images-file') {
    const files = Array.from(el.files || []);
    if (files.length) {
      showToast(`Uploading ${files.length} image(s) to GitHub /uploads/ folder...`);
      for (const f of files) {
        try {
          const compressedDataUrl = await compressImageFile(f, 1100, 0.85);
          const githubRawUrl = await uploadMediaToGithub(compressedDataUrl, f.name);
          state.prodForm.images.push(githubRawUrl);
        } catch (err) {
          showToast(err.message || 'Could not upload image to GitHub.', 'error');
        }
      }
      render();
      showToast('Image(s) saved in your GitHub repository /uploads/ folder!');
    }
  } else if (el.id === 'pf-videos-file') {
    const files = Array.from(el.files || []);
    for (const file of files) {
      try {
        showToast(`Uploading video "${file.name}" to GitHub /uploads/ folder...`);
        const dataUrl = await readVideoFile(file);
        const githubRawUrl = await uploadMediaToGithub(dataUrl, file.name);
        state.prodForm.videos.push({ name: file.name, url: githubRawUrl });
        showToast(`Video "${file.name}" saved in GitHub /uploads/ folder!`);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
    render();
  } else if (el.hasAttribute('data-img-file-field')) {
    const path = el.getAttribute('data-img-file-field');
    const maxW = Number(el.getAttribute('data-max-width') || 1100);
    const file = el.files?.[0];
    if (file) {
      try {
        showToast('Uploading image to GitHub /uploads/ folder...');
        const dataUrl = await compressImageFile(file, maxW, 0.85);
        const githubRawUrl = await uploadMediaToGithub(dataUrl, file.name);
        applyImageFieldValue(path, githubRawUrl);
        render();
        showToast('Image saved to GitHub /uploads/ folder!');
      } catch (err) {
        showToast(err.message || 'Failed to upload image to GitHub.', 'error');
      }
    }
  }
});

function applyImageFieldValue(path, val) {
  if (path.startsWith('catForm.')) {
    state.catForm[path.replace('catForm.', '')] = val;
  } else if (path.startsWith('customForm.')) {
    state.customForm[path.replace('customForm.', '')] = val;
  } else if (path.startsWith('lookbook.')) {
    const [, idxStr, field] = path.split('.');
    state.customForm.lookbookCards[Number(idxStr)][field] = val;
  }
}

// Form Submissions
document.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formId = e.target.id;

  if (formId === 'owner-login-form') {
    state.loginError = '';
    const normalizedEmail = state.loginEmail.trim().toLowerCase();
    const inputHash = await hashSecret(state.loginPassword);
    const storedEmail = (state.ownerAuthRecord?.email || 'owner@rrwear.com').toLowerCase();
    const defaultHash = await hashSecret('RRWear2026!');
    const storedHash = state.ownerAuthRecord?.passwordHash || defaultHash;

    if (normalizedEmail === storedEmail && inputHash === storedHash) {
      state.isOwnerAuthenticated = true;
      sessionStorage.setItem('rr_wear_owner_auth', 'true');
      state.dashboardTab = 'overview';
      navigateTo('dashboard');
      showToast(`Welcome back to ${state.siteSettings.brandName} Dashboard`);
    } else {
      state.loginError = 'Invalid owner email or password. Access is restricted to the store owner.';
      render();
    }
  } else if (formId === 'owner-forgot-form') {
    if (!state.loginEmail.trim()) {
      state.loginError = 'Please enter your owner email address first.';
      render();
      return;
    }
    state.loginResetSent = true;
    render();
    showToast('Password recovery request logged.');
  } else if (formId === 'product-save-form') {
    const pf = state.prodForm;
    if (!pf.name.trim() || pf.price === '' || pf.images.length === 0) {
      showToast('Please enter product name, price, and at least one product image.', 'error');
      return;
    }
    state.isSavingToGithub = true;
    render();

    const id = state.editingProductId || `prod-${Date.now()}`;
    const existing = state.products.find((p) => p.id === id);
    const payload = {
      id,
      name: pf.name.trim(),
      price: Number(pf.price),
      categoryId: pf.categoryId || state.categories[0]?.id || 'uncategorized',
      visibility: pf.visibility,
      description: pf.description.trim(),
      images: [...pf.images],
      videos: [...pf.videos],
      specifications: pf.specifications.filter((s) => s.label.trim() && s.value.trim()),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    if (existing) {
      Object.assign(existing, payload);
    } else {
      state.products.unshift(payload);
    }

    try {
      await persistStoreToGithub(
        state.editingProductId ? `Update product: ${payload.name}` : `Add new product: ${payload.name}`
      );
      showToast(
        state.editingProductId
          ? 'Product updated & permanently saved to GitHub!'
          : 'New product published & permanently saved to GitHub!'
      );
      state.editingProductId = null;
      state.dashboardTab = 'products';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      state.isSavingToGithub = false;
      render();
    }
  } else if (formId === 'category-save-form') {
    const cf = state.catForm;
    if (!cf.name.trim()) return;
    const id = state.editingCategoryId || `cat-${Date.now()}`;
    const payload = {
      id,
      name: cf.name.trim().toUpperCase(),
      description: cf.description.trim(),
      image:
        cf.image ||
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
      banner: cf.banner
    };
    const existing = state.categories.find((c) => c.id === id);
    if (existing) Object.assign(existing, payload);
    else state.categories.push(payload);

    try {
      await persistStoreToGithub(
        state.editingCategoryId ? `Update category: ${payload.name}` : `Create category: ${payload.name}`
      );
      showToast(
        state.editingCategoryId
          ? 'Category updated & saved permanently!'
          : 'New category created & saved permanently!'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
    state.editingCategoryId = null;
    state.catForm = { name: '', description: '', image: '', banner: '' };
    render();
  } else if (formId === 'customization-save-form') {
    state.siteSettings = JSON.parse(JSON.stringify(state.customForm));
    try {
      await persistStoreToGithub('Update website customization & banners');
      showToast('All website images, titles & customization permanently saved to GitHub!');
    } catch (err) {
      showToast(err.message, 'error');
    }
    render();
  } else if (formId === 'github-token-form') {
    const tokenVal = document.getElementById('gh-token-input')?.value.trim() || '';
    setGithubToken(tokenVal);
    try {
      await persistStoreToGithub('Initialize GitHub permanent store sync');
      showToast('GitHub Repository connected & store synced permanently!');
    } catch (err) {
      showToast(err.message, 'error');
    }
    render();
  } else if (formId === 'social-links-form') {
    const wa = document.getElementById('social-whatsapp')?.value.trim() || '';
    const tg = document.getElementById('social-telegram')?.value.trim() || '';
    const msg = document.getElementById('social-messenger')?.value.trim() || '';
    state.siteSettings.whatsappNumber = wa;
    state.siteSettings.telegramUsername = tg;
    state.siteSettings.messengerUsername = msg;
    state.customForm.whatsappNumber = wa;
    state.customForm.telegramUsername = tg;
    state.customForm.messengerUsername = msg;
    try {
      await persistStoreToGithub('Update social media contact links');
      showToast('Social media ordering links permanently saved to GitHub!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  } else if (formId === 'owner-security-form') {
    const emailVal = document.getElementById('sec-owner-email')?.value.trim().toLowerCase();
    const passVal = document.getElementById('sec-new-pass')?.value.trim();
    if (!emailVal) return;
    const updates = { email: emailVal, updatedAt: Date.now() };
    if (passVal) {
      if (passVal.length < 6) {
        showToast('New owner password must be at least 6 characters.', 'error');
        return;
      }
      updates.passwordHash = await hashSecret(passVal);
    }
    state.ownerAuthRecord = { ...(state.ownerAuthRecord || {}), ...updates };
    try {
      await persistStoreToGithub('Update owner portal credentials');
      document.getElementById('sec-new-pass').value = '';
      showToast('Owner login credentials permanently saved to GitHub!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
});

// ============================================================================
// 14. BOOTSTRAP APPLICATION
// ============================================================================
window.addEventListener('hashchange', handleHashChange);
handleHashChange();
initStoreFromGithub();
