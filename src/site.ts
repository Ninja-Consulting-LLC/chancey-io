export const site = {
  name: 'Chancey',
  legalName: 'Chancey',
  domain: 'chancey.io',
  url: 'https://chancey.io',
  appUrl: 'https://app.chancey.io',
  contactPath: '/contact/',
  tagline: 'Pick your lottery numbers. Track every ticket.',
  shortDescription:
    'Chancey is a lottery toolkit for adults 18+. Pick numbers in the builder, save the sets you love, and track every ticket through the next draw.',
  longDescription:
    'Chancey is a lottery toolkit for adults 18+. The number builder helps you mix favorite numbers with quick picks and save sets you can reuse. The tracker scans supported printed tickets and checks saved tickets when official results are available for supported draws. Chancey does not sell tickets, predict numbers, or improve your odds.',
  founded: '2026',
  category: 'Lottery toolkit app',
  audience: 'Adults 18+ who play state, provincial, and national lotteries',
  primaryColor: '#ff6b3d',
  themeColor: '#fff6ec',
  ogImage: '/og-image.png',
  twitter: '@chanceyapp',
  ga4Id: 'G-04W0XTXMJ4',
  socials: {
    // Add when live
  },
} as const;

export const navItems = [
  { href: '/how-it-works/', label: 'How it works' },
  { href: '/support/', label: 'Support' },
  { href: '/responsible-play/', label: 'Responsible play' },
] as const;

export const footerLinks = {
  product: [
    { href: '/', label: 'Home' },
    { href: '/how-it-works/', label: 'How it works' },
    { href: site.appUrl, label: 'Open web app', external: true },
  ],
  company: [
    { href: '/about/', label: 'About' },
    { href: '/responsible-play/', label: 'Responsible play' },
    { href: '/support/', label: 'Support' },
    { href: '/contact/', label: 'Contact' },
  ],
  legal: [
    { href: '/privacy/', label: 'Privacy' },
    { href: '/terms/', label: 'Terms' },
  ],
} as const;

export const appScreenshots = {
  home: {
    src: '/app-screenshots/home.png',
    width: 1290,
    height: 2796,
    alt: 'Chancey simple home screen with saved Powerball tickets and draw status',
  },
  rules: {
    src: '/app-screenshots/rules.png',
    width: 1290,
    height: 2796,
    alt: 'Chancey simple mode number builder with guided pick controls',
  },
  scan: {
    src: '/app-screenshots/scan.png',
    width: 1290,
    height: 2796,
    alt: 'Chancey scanner screen ready to capture a lottery ticket',
  },
  stats: {
    src: '/app-screenshots/stats.png',
    width: 1290,
    height: 2796,
    alt: 'Chancey ticket and draw statistics screen with simple mode summaries',
  },
} as const;

export const featureBlocks = [
  {
    id: 'build',
    eyebrow: 'Simple mode',
    title: 'Pick your numbers without tuning every dial.',
    description:
      'Simple mode turns the builder into a guided flow. Choose a vibe, keep the numbers you like, and save a set without turning the app into a spreadsheet.',
    bullets: [
      'Guided pick styles for quick, balanced, or favorite-heavy sets',
      'Save sets so you stop typing the same numbers',
      'Draw stats are context, never predictions',
    ],
    screenshotAlt: appScreenshots.rules.alt,
    screenshotSrc: appScreenshots.rules.src,
    screenshotWidth: appScreenshots.rules.width,
    screenshotHeight: appScreenshots.rules.height,
    screenshotLabel: 'Simple builder',
    previewVariant: 'builder',
  },
  {
    id: 'scan',
    eyebrow: 'Ticket scanning',
    title: 'Scan supported printed tickets in seconds.',
    description:
      'Once you buy a supported ticket, scan it. Chancey reads the numbers, the game, and the draw date when it can. You confirm what it caught before it saves to your history.',
    bullets: [
      'Built for common U.S. lottery games, with more formats added over time',
      'Edit any number before saving — you stay in control',
      'On-device first, with cloud help for unclear scans',
    ],
    screenshotAlt: appScreenshots.scan.alt,
    screenshotSrc: appScreenshots.scan.src,
    screenshotWidth: appScreenshots.scan.width,
    screenshotHeight: appScreenshots.scan.height,
    screenshotLabel: 'Scanner',
    previewVariant: 'scan',
  },
  {
    id: 'check',
    eyebrow: 'Auto-checking draws',
    title: 'Know what your tickets did after results post.',
    description:
      'When official results are available for a supported draw, Chancey checks saved tickets against the posted numbers. Each one gets a clear label: match, partial, or no match.',
    bullets: [
      'Match status after official results are available',
      'Matched numbers light up on each ticket',
      'Stop squinting at camera-roll screenshots',
    ],
    screenshotAlt: appScreenshots.home.alt,
    screenshotSrc: appScreenshots.home.src,
    screenshotWidth: appScreenshots.home.width,
    screenshotHeight: appScreenshots.home.height,
    screenshotLabel: 'History · Results',
    previewVariant: 'history',
  },
] as const;

export const features = [
  {
    icon: 'history',
    title: 'Full searchable history',
    body: 'Find every saved ticket by game, date, or outcome. No more lost slips.',
  },
  {
    icon: 'remind',
    title: 'Optional draw reminders',
    body: 'Get a ping before draws on tickets you saved. No promo notifications, ever.',
  },
  {
    icon: 'shield',
    title: 'Private by default',
    body: 'No ad trackers in the app. Ticket photos are never used for advertising.',
  },
] as const;

export const howItWorks = [
  {
    step: '01',
    title: 'Pick your numbers',
    body: 'Mix favorites and quick picks in the builder. Save the sets you love so they\'re ready next time.',
  },
  {
    step: '02',
    title: 'Buy the ticket like always',
    body: 'Take your set to your usual store, kiosk, or the lottery\'s website. Chancey is not a retailer.',
  },
  {
    step: '03',
    title: 'Scan and check after the draw',
    body: 'Scan a supported slip into Chancey. After official results are available for a supported draw, saved tickets can be checked against the posted numbers.',
  },
] as const;

export const faqs = [
  {
    q: 'What is Chancey?',
    a: 'Chancey is a lottery app for adults 18+. The builder helps you pick numbers and save your favorite sets. The tracker scans supported printed tickets and checks saved tickets when official results are available for supported draws. Chancey does not sell tickets, pay prizes, or predict winning numbers.',
  },
  {
    q: 'Does Chancey sell lottery tickets?',
    a: 'No. Chancey is not a lottery retailer and is not part of any state or national lottery. Buy tickets the same way you always do. Chancey only helps you pick, save, and check what you already bought.',
  },
  {
    q: 'Can Chancey predict winning numbers?',
    a: 'No. Lottery draws are random. No app — Chancey included — can change the odds. The builder helps you pick faster and save sets you like, but it never claims to predict outcomes.',
  },
  {
    q: 'Is Chancey free?',
    a: 'The core features — the builder, scanning tickets, checking draws, and saving history — are free. If we add paid features later, we will price them clearly before you buy.',
  },
  {
    q: 'How does ticket scanning work?',
    a: 'You take a photo of a supported ticket. Chancey reads the numbers, the game, and the draw date when it can. You confirm what it caught before it saves. If it can\'t read a number on your device, it may use a cloud step to help. Ticket photos are never used for ads.',
  },
  {
    q: 'Where does Chancey work?',
    a: 'Chancey works in any modern web browser at app.chancey.io. Native iPhone and Android apps are on the roadmap. Draw data depends on what your lottery posts.',
  },
  {
    q: 'Do I need an account?',
    a: 'An account lets you sync saved picks and tickets across devices. It also lets you get them back if you change phones. You can use Chancey on a single device without an account, with less sync.',
  },
  {
    q: 'How is my data handled?',
    a: 'Chancey stores your account info, saved tickets, picks, and the logs we need to run the app. We do not sell ticket photos, browsing data, or contact info to advertisers. The Privacy Policy has the full list.',
  },
  {
    q: 'Does Chancey replace the official lottery?',
    a: 'No. The lottery is always the source of truth for results and prize claims. Chancey shows what it sees from posted results so you know what to check with the lottery.',
  },
  {
    q: 'I think I have a winning ticket — what now?',
    a: 'Always claim wins through the lottery that issued the ticket. Chancey is a checking and organizing tool. It cannot pay prizes.',
  },
  {
    q: 'Does Chancey try to make me play more?',
    a: 'No. Chancey has no in-app ads, no streaks, no engagement traps, and no promo notifications. Reminders are optional and tied to draws you saved.',
  },
  {
    q: 'Who is Chancey for?',
    a: 'Adults 18+ (or the local age of majority, whichever is greater) who already play the lottery and want a real way to pick and track tickets. Chancey is not a tool to bring in new players.',
  },
] as const;
