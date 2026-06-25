export const site = {
  name: 'Chancey',
  legalName: 'Chancey',
  domain: 'chancey.io',
  url: 'https://chancey.io',
  appUrl: import.meta.env.PUBLIC_CHANCEY_APP_URL ?? 'https://app.chancey.io',
  contactPath: '/contact/',
  // Placeholder store URLs so the badge row renders. Swap for real listing
  // URLs at launch.
  appStoreUrl: 'https://apps.apple.com/app/chancey/id000000000',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=app.chancey.io',
  tagline: 'Never throw away a winning ticket again.',
  shortDescription:
    'Chancey is a lottery ticket tracker for adults 18+. Scan a ticket you already bought and Chancey checks every draw against the official results, so a win never gets past you.',
  longDescription:
    'Chancey is a lottery ticket tracker for adults 18+. Scan any printed ticket you already bought. Chancey reads it, saves it, and checks each saved ticket against the official posted results, so you never miss a win. A simple number builder is included if you want one. Chancey does not sell tickets, predict numbers, or change your odds.',
  founded: '2026',
  category: 'Lottery ticket tracker app',
  audience: 'Adults 18+ who play state, provincial, and national lotteries',
  primaryColor: '#ff6b3d',
  themeColor: '#fff6ec',
  ogImage: '/og-image.png',
  twitter: '@chanceyapp',
  ga4Id: 'G-04W0XTXMJ4',
  heroVariant: 'never-wonder',
  socials: {},
} as const;

export const pricing = {
  freeScansPerMonth: 5,
  monthlyUsd: 4.99,
  annualUsd: 39.99,
  currency: 'USD',
  annualSavingUsd: 20,
} as const;

// Nav stays minimal on purpose: brand + the one action. Everything else is a
// footer link so the header reads like a product, not a site map.
export const navItems: ReadonlyArray<{ href: string; label: string }> = [];

export const footerLinks = {
  product: [
    { href: '/', label: 'Home' },
    { href: '/how-it-works/', label: 'How it works' },
    { href: '/pricing/', label: 'Pricing' },
    { href: site.appUrl, label: 'Open Chancey', external: true },
  ],
  company: [
    { href: '/about/', label: 'About' },
    { href: '/support/', label: 'Support' },
    { href: '/responsible-play/', label: 'Responsible play' },
    { href: '/contact/', label: 'Contact' },
  ],
  legal: [
    { href: '/privacy/', label: 'Privacy' },
    { href: '/terms/', label: 'Terms' },
  ],
} as const;

// Order tells the story: scan, it checks itself, (bonus) build a set.
export const featureBlocks = [
  {
    id: 'scan',
    eyebrow: 'Scan',
    title: 'Scan the ticket you already bought.',
    description:
      'Take a photo of any printed slip. Chancey reads the numbers, the game, and the draw date. You confirm before it saves.',
    bullets: [
      'Powerball, Mega Millions, and state daily games',
      'Fix any number before you save it',
      'Works on the phone in your hand',
    ],
    screenshotAlt: 'Chancey scanning a printed Powerball ticket',
    screenshotLabel: 'Scan',
    previewVariant: 'scan',
  },
  {
    id: 'check',
    eyebrow: 'Check',
    title: 'A win never gets past you.',
    description:
      'When the lottery posts a draw, Chancey checks every saved ticket against the official numbers. Each one gets a clear label: match, partial, or no match.',
    bullets: [
      'You find out the moment results post',
      'Matched numbers light up on the ticket',
      'No more "did I win?" in the car',
    ],
    screenshotAlt: 'Chancey ticket history showing a winning match',
    screenshotLabel: 'Results',
    previewVariant: 'history',
  },
  {
    id: 'build',
    eyebrow: 'Build (bonus)',
    title: 'Need a set? Build one fast.',
    description:
      'Mix your favorite numbers with quick picks and save sets to reuse. For fun and order only. It does not predict numbers or change the odds.',
    bullets: [
      'Mix favorites and quick picks',
      'Save sets so you stop retyping them',
      'See real draw history, never a prediction',
    ],
    screenshotAlt: 'Chancey number builder mixing favorites with quick picks',
    screenshotLabel: 'Builder',
    previewVariant: 'builder',
  },
] as const;

export const faqs = [
  {
    q: 'What is Chancey?',
    a: 'Chancey is a lottery ticket tracker for adults 18+. Scan a ticket you already bought and Chancey checks it against the official posted results, so you never miss a win. A simple number builder is included. Chancey does not sell tickets, pay prizes, or predict winning numbers.',
  },
  {
    q: 'Does Chancey sell lottery tickets?',
    a: 'No. Chancey is not a lottery seller and is not part of any state or national lottery. You buy tickets the way you always do. Chancey only checks and organizes what you already bought.',
  },
  {
    q: 'Can Chancey predict winning numbers?',
    a: 'No. Lottery draws are random. No app can change the odds, and Chancey does not try. The builder helps you pick faster and save sets, but it never claims to predict anything.',
  },
  {
    q: 'Is Chancey free?',
    a: 'Chancey is free for up to 5 ticket scans a month. That includes the builder, your full history, and automatic draw checking. Pro is unlimited scans for $4.99 a month or $39.99 a year (about $20 a year cheaper). No ads on any plan.',
  },
  {
    q: 'How does scanning work?',
    a: 'You take a photo of the ticket. Chancey reads the numbers, the game, and the draw date. You confirm before it saves. If your phone cannot read a number, a cloud step can help. Ticket photos are never used for ads.',
  },
  {
    q: 'Where does Chancey work?',
    a: 'Chancey works in any modern web browser at app.chancey.io, plus native iPhone and Android apps. Draw data depends on what your lottery posts.',
  },
  {
    q: 'Do I need an account?',
    a: 'Yes. Chancey uses an account to save tickets, saved sets, preferences, and subscription state across devices. You can delete your account from Settings anytime.',
  },
  {
    q: 'How is my data handled?',
    a: 'Chancey stores your account info, saved tickets, sets, and the logs needed to run the app. We do not sell ticket photos, browsing data, or contact info to advertisers. The Privacy page has the full list.',
  },
  {
    q: 'Does Chancey replace the official lottery?',
    a: 'No. The lottery is always the source of truth for results and prize claims. Chancey shows what it sees from posted results so you know what to check with the lottery.',
  },
  {
    q: 'I think I have a winning ticket. What now?',
    a: 'Always claim wins through the lottery that issued the ticket. Keep the printed slip safe; you need it to redeem. Chancey checks and organizes. It cannot pay prizes.',
  },
  {
    q: 'Does Chancey try to make me play more?',
    a: 'No. Chancey is about the tickets you already bought, not buying more. No in-app ads, no streaks, no nudges.',
  },
  {
    q: 'Who is Chancey for?',
    a: 'Adults 18+ (or the local age of majority, whichever is greater) who already play and want a real way to track and check tickets. It is not a tool to bring in new players.',
  },
] as const;

// Home shows only this short objection set. No overlap with the full
// Support FAQ. Indexes: free, account, predict, replace lottery, data.
export const homeFaqIndexes = [3, 6, 2, 8, 7] as const;
export const homeFaqs = homeFaqIndexes.map((i) => faqs[i]);

export const pricingFaqs = [
  {
    q: 'What counts as a scan?',
    a: 'One scanned ticket is one scan, no matter how many lines it has. Re-checking a ticket you already saved against later draws does not cost another scan.',
  },
  {
    q: 'What happens when I hit 5 scans in a month?',
    a: 'Nothing breaks. Your saved tickets keep getting checked against new draws. You just cannot scan a new ticket until next month, or until you go Pro for unlimited scans.',
  },
  {
    q: 'Is the number builder free?',
    a: 'Yes. The builder, your full history, and automatic draw checking are free on every plan. Only the number of new scans per month is limited.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel whenever you want. You keep Pro until the end of the period you paid for, then drop back to the free plan. Your history stays.',
  },
  {
    q: 'Monthly or yearly?',
    a: 'Pro is $4.99 a month or $39.99 a year. The yearly plan works out to about $3.33 a month, roughly $20 a year cheaper than monthly.',
  },
  {
    q: 'Are there ads?',
    a: 'No ads on any plan, ever. We make money from Pro, not from your data and not from getting you to play more.',
  },
] as const;
