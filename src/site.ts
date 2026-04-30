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
    'Chancey is a lottery toolkit for adults 18+. The number builder helps you mix favorite numbers with quick picks and save sets you can reuse. The tracker scans any printed ticket and checks the official draw results for you. Chancey does not sell tickets, predict numbers, or improve your odds.',
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

export const featureBlocks = [
  {
    id: 'build',
    eyebrow: 'Number builder',
    title: 'Pick your numbers in seconds.',
    description:
      'Mix your favorite numbers with quick picks. Save the sets you love and reuse them on the next ticket. No math. No spreadsheet. Just a faster way to pick.',
    bullets: [
      'Mix favorites and quick picks across any supported game',
      'Save sets so you stop typing the same numbers',
      'See real draw history — never sold as predictions',
    ],
    screenshotAlt: 'Chancey number builder mixing favorite numbers with quick picks',
    screenshotLabel: 'Number builder',
    placeholderVariant: 'builder',
  },
  {
    id: 'scan',
    eyebrow: 'Ticket scanning',
    title: 'Scan any printed ticket in seconds.',
    description:
      'Once you buy a ticket, scan it. Chancey reads the numbers, the game, and the draw date. You confirm what it caught before it saves to your history.',
    bullets: [
      'Powerball, Mega Millions, state daily games, and more',
      'Edit any number before saving — you stay in control',
      'On-device first, with cloud help for unclear scans',
    ],
    screenshotAlt: 'Chancey scanner reading a printed Powerball ticket',
    screenshotLabel: 'Scanner',
    placeholderVariant: 'scan',
  },
  {
    id: 'check',
    eyebrow: 'Auto-checking draws',
    title: 'Know what your tickets did, right after the draw.',
    description:
      'When the lottery posts a draw, Chancey checks every saved ticket against the official numbers. Each one gets a clear label: match, partial, or no match.',
    bullets: [
      'Match status the moment results go live',
      'Matched numbers light up on each ticket',
      'Stop squinting at screenshots at red lights',
    ],
    screenshotAlt: 'Chancey ticket history showing match, partial, and no-match results',
    screenshotLabel: 'History · Results',
    placeholderVariant: 'history',
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
    body: 'Scan the slip into Chancey. After the draw, every saved ticket is checked against the official results.',
  },
] as const;

export const faqs = [
  {
    q: 'What is Chancey?',
    a: 'Chancey is a lottery app for adults 18+. The builder helps you pick numbers and save your favorite sets. The tracker scans printed tickets and checks each one against the official draw results. Chancey does not sell tickets, pay prizes, or predict winning numbers.',
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
    a: 'You take a photo of the ticket. Chancey reads the numbers, the game, and the draw date. You confirm what it caught before it saves. If it can\'t read a number on your device, it may use a cloud step to help. Ticket photos are never used for ads.',
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
