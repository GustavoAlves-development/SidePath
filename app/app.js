// ---------- Unlock routes (for post-checkout redirects) ----------
// Visiting /unlock/roadmap or /unlock/ideas grants that product locally and
// cleans the URL back to "/". Built to match Stripe's success_url pattern:
// https://sidepath.site/unlock/roadmap?session_id={CHECKOUT_SESSION_ID}
// Swap the localStorage write below for a real entitlement check (e.g. a
// server call that verifies the session_id) once Stripe is wired up.

const UNLOCK_ROUTE_PRODUCTS = ['roadmap', 'ideas'];
const unlockRouteMatch = window.location.pathname.match(/^\/unlock\/(roadmap|ideas)\/?$/i);
let pendingUnlockProduct = null;

if (unlockRouteMatch) {
  pendingUnlockProduct = unlockRouteMatch[1].toLowerCase();
  localStorage.setItem(`sidepath_unlocked_${pendingUnlockProduct}`, 'true');
  window.history.replaceState({}, '', '/');
}

function showUnlockToast(product) {
  const names = { roadmap: 'First $1,000 Roadmap', ideas: '50 Extra Income Ideas' };
  const toast = document.createElement('div');
  toast.className = 'unlock-toast';
  toast.innerHTML = `<svg viewBox="0 0 24 24"><use href="#icon-check"/></svg><span>Unlocked — ${names[product] || 'your purchase'} is ready.</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ---------- Tab navigation ----------

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const target = tab.dataset.panel;
    panels.forEach(p => p.classList.toggle('active', p.id === target));
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
});

function goToPanel(id) {
  const tab = document.querySelector(`.tab[data-panel="${id}"]`);
  if (tab) tab.click();
}

// ---------- Pricing FAQ accordion ----------

document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const isOpen = item.dataset.open === 'true';
    item.dataset.open = isOpen ? 'false' : 'true';
  });
});

// ---------- Filter chips (Library + Ideas) ----------

function wireFilters(rowId, gridId, cardSelector, matcher) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const grid = document.getElementById(gridId);
  row.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      row.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      grid.querySelectorAll(cardSelector).forEach(card => {
        const show = matcher ? matcher(card, filter) : (filter === 'all' || card.dataset.category === filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

// ---------- Cover art generator (inline SVG, no external images) ----------
// Each article gets its own icon (set per-topic, not per-category) plus one of
// four background compositions chosen by index, so cards read as distinct
// pieces rather than one template stamped five times.

function coverSVG(icon, index) {
  const variant = index % 4;
  const iconTag = `<g style="color:var(--accent-strong)"><use href="#icon-${icon}" x="164" y="54" width="72" height="72"/></g>`;

  if (variant === 0) {
    // Orbit: nested ring + two soft fields
    return `
      <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="var(--accent-soft)"/>
        <circle cx="140" cy="55" r="72" fill="var(--accent)" opacity="0.16"/>
        <circle cx="295" cy="120" r="58" fill="var(--gold)" opacity="0.14"/>
        <circle cx="200" cy="88" r="88" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="0.35" transform="rotate(-8 200 88)"/>
        <circle cx="66" cy="150" r="5" fill="var(--gold)" opacity="0.5"/>
        <circle cx="345" cy="35" r="4" fill="var(--gold)" opacity="0.5"/>
        ${iconTag}
      </svg>
    `;
  }
  if (variant === 1) {
    // Halo corner: one big offset circle + thin arc, icon pushed right
    return `
      <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="var(--accent-soft)"/>
        <circle cx="60" cy="30" r="110" fill="var(--accent)" opacity="0.17"/>
        <circle cx="60" cy="30" r="140" fill="none" stroke="var(--gold)" stroke-width="1.5" opacity="0.4"/>
        <circle cx="330" cy="150" r="4.5" fill="var(--accent)" opacity="0.4"/>
        <circle cx="300" cy="40" r="3.5" fill="var(--gold)" opacity="0.5"/>
        ${iconTag}
      </svg>
    `;
  }
  if (variant === 2) {
    // Dot field: scattered grid of dots, no big shapes
    const dots = [
      [40, 40, 5], [90, 130, 4], [150, 35, 3.5], [340, 60, 5],
      [370, 140, 4], [30, 150, 3.5], [370, 30, 3],
    ];
    return `
      <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="180" fill="var(--accent-soft)"/>
        <circle cx="200" cy="90" r="70" fill="var(--accent)" opacity="0.1"/>
        ${dots.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--gold)" opacity="0.45"/>`).join('')}
        ${iconTag}
      </svg>
    `;
  }
  // variant 3 — Diagonal band: a soft rotated band crossing the card
  return `
    <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="180" fill="var(--accent-soft)"/>
      <line x1="-40" y1="40" x2="300" y2="220" stroke="var(--accent)" stroke-width="60" opacity="0.13" stroke-linecap="round"/>
      <line x1="120" y1="-30" x2="460" y2="150" stroke="var(--gold)" stroke-width="26" opacity="0.14" stroke-linecap="round"/>
      <circle cx="345" cy="35" r="4" fill="var(--gold)" opacity="0.5"/>
      <circle cx="55" cy="155" r="3.5" fill="var(--accent)" opacity="0.4"/>
      ${iconTag}
    </svg>
  `;
}

// ---------- Library articles data ----------

const ARTICLES = [
  { id: 'a1', cat: 'freelance', icon: 'sell', date: 'Jun 2026', title: 'Price Your First Freelance Gig', readTime: '7 min read',
    excerpt: "Underpricing is the mistake that's hardest to undo. Here's how to land on a number you can defend — and raise later.",
    body: [
      { t: 'p', c: "Underpricing is the single most common first mistake, and it's hard to undo — clients who onboarded you at a low rate rarely accept a big jump later. The fix isn't confidence, it's math." },
      { t: 'h3', c: 'Find your walk-away number' },
      { t: 'p', c: "Add up your monthly expenses, then add a margin for taxes, slow months, and savings — most people land somewhere around 1.4x their bare minimum. Divide that by your realistic billable hours, not a 40-hour week. Once you account for finding work, admin, and revisions, 20-25 billable hours a week is closer to reality when you're starting out." },
      { t: 'callout', label: 'Quick math', c: "$3,200 in monthly needs × 1.4 ÷ (22 hours × 4.3 weeks) ≈ $47/hr. That's your floor, not your asking price." },
      { t: 'h3', c: 'Quote the project, not the hour' },
      { t: 'p', c: "An hourly rate invites a client to negotiate your worth down, one hour at a time. A project quote — built from your floor rate times an honest time estimate — sells an outcome instead, and outcomes are worth more than hours to the person paying for them." },
      { t: 'ul', items: [
        "Three quotes went out and nobody blinked — you're underpriced, not lucky.",
        "You dread sending the invoice more than doing the work — also underpriced.",
        "No client has ever tried to negotiate you down — same signal, different flavor."
      ] },
      { t: 'p', c: "Anchor high in the first message, and let the client negotiate down if they want to — it's far easier to come down 10% once than to ask an existing client to accept a 30% increase later." },
    ] },
  { id: 'a2', cat: 'freelance', icon: 'people', date: 'Jun 2026', title: 'Where to Find Your First Five Clients', readTime: '6 min read',
    excerpt: "Marketplaces are the slowest path to a first client. Here's where the real ones actually come from.",
    body: [
      { t: 'p', c: "Marketplaces are the slowest way to land your first client — you're one of hundreds of profiles, competing mostly on price, for people who don't know you yet." },
      { t: 'h3', c: 'Start with people who already trust your work' },
      { t: 'p', c: "Past coworkers, managers, classmates, and your existing network have already seen you do something well. They don't need convincing — just a reason to think of you at the right moment." },
      { t: 'ul', items: [
        'A past coworker or manager who has already seen your work',
        "A niche Discord or Slack where your exact buyer hangs out",
        'A local business Facebook group, if the work is location-based',
        "A subreddit built around your buyer's industry, not your skill"
      ] },
      { t: 'h3', c: 'Lead with the problem, not the pitch' },
      { t: 'p', c: "A direct, specific message — naming a problem you actually noticed and how you'd fix it — outperforms a generic \"I'm available for hire\" post every time. Use the cold outreach script in the Scripts section below as a starting point, then edit the bracketed detail so it's unmistakably about them." },
      { t: 'p', c: "Your first five clients rarely come from strangers finding you. They come from you finding the right five people and saying something specific enough that they can picture the result." },
    ] },
  { id: 'a3', cat: 'sell', icon: 'box', date: 'Jul 2026', title: 'Turn Unused Items Into Fast Cash', readTime: '5 min read',
    excerpt: "A sorting method, a photo rule, and a pricing rule that gets things sold this week, not this month.",
    body: [
      { t: 'p', c: "Before listing anything, sort by resale category, not sentimental value — what sells fast and for a fair price has almost nothing to do with what it cost you or meant to you." },
      { t: 'h3', c: 'What actually holds value' },
      { t: 'ul', items: [
        'Electronics and tools — hold value best, sell fastest if tested and working',
        'Furniture — moves quickly locally, badly if shipped',
        'Clothing — only sells well in bundles or from recognizable brands',
        "Everything else — bundle it, or donate it and stop paying it rent in your closet"
      ] },
      { t: 'h3', c: 'The listing rules that move the needle' },
      { t: 'p', c: "Photograph in natural light against a plain background — listings with four or more clear photos measurably outsell one blurry shot. Price 10-15% above what you'd actually accept, since local marketplaces run on a little back-and-forth; a firm price with no room to negotiate quietly repels buyers." },
      { t: 'callout', label: 'Quick math', c: "An item you'd accept $80 for should list around $90-95 — enough room for one counter-offer without going below your number." },
      { t: 'p', c: "For anything bulky, local pickup beats shipping every time. The friction of boxing, weighing, and hauling something to a shipping counter kills more sales than a slightly lower price ever does." },
    ] },
  { id: 'a4', cat: 'sell', icon: 'shirt', date: 'Jul 2026', title: 'Print-on-Demand Without Holding Inventory', readTime: '6 min read',
    excerpt: "No stock, no upfront risk — if you pick a niche tight enough to actually be found.",
    body: [
      { t: 'p', c: "Print-on-demand lets you sell designed products — shirts, mugs, prints, phone cases — without buying stock upfront. A supplier prints and ships per order once you make a sale, so the risk on any single design is close to zero." },
      { t: 'h3', c: 'The work is the niche, not the printing' },
      { t: 'p', c: "The printing and fulfillment are the easy, solved part. The real work is the design, and more than that, the niche it's aimed at. A broad \"funny quote\" shop is competing with thousands of near-identical shops for the same generic search terms." },
      { t: 'ul', items: [
        'Too broad: "funny sayings," "motivational quotes," "cat lovers"',
        'Tight enough to rank: "gifts for third-shift ICU nurses," "disc golf dad jokes," "backyard beekeeper humor"'
      ] },
      { t: 'h3', c: 'Start smaller than feels comfortable' },
      { t: 'p', c: "Start with one tight niche and 10-15 designs rather than a huge generic catalog. A shop that owns one specific audience converts better than one that's a little bit for everyone — focus beats volume when you have zero existing audience to fall back on." },
    ] },
  { id: 'a5', cat: 'gig', icon: 'bolt', date: 'Aug 2026', title: 'Which Gig Platforms Actually Pay Well', readTime: '6 min read',
    excerpt: "Not all gig work pays the same per hour once you count the waiting. Here's what actually moves the needle.",
    body: [
      { t: 'p', c: "Not all gig work pays the same per hour once you factor in wait time, mileage, and fees — the number on the app before you accept a job is rarely the number you actually earn." },
      { t: 'h3', c: 'Delivery and rideshare run on timing, not the app you pick' },
      { t: 'p', c: "This work pays best during predictable local peaks — lunch and dinner rushes, weekend nights, and events — and poorly everywhere in between. Chasing a specific platform's bonus and surge notifications matters more than which app you're logged into; the peaks matter more than the brand." },
      { t: 'h3', c: 'Task work pays more once you have reviews' },
      { t: 'p', c: "Task-based platforms — moving help, furniture assembly, small repairs — tend to pay more per hour than driving once you have a handful of five-star reviews, because pricing on these becomes negotiable instead of fixed by an algorithm." },
      { t: 'callout', label: 'Quick math', c: "A $22 delivery job that takes 15 minutes of driving but 20 minutes of waiting is really a $38/hr job, not an $88/hr one. Track clock time, not just active job time." },
      { t: 'p', c: "Track your real hourly rate — clock-in to clock-out, not just active job time — for two weeks before committing to one platform over another." },
    ] },
  { id: 'a6', cat: 'gig', icon: 'wrench', date: 'Aug 2026', title: 'Local Services People Will Pay For This Week', readTime: '5 min read',
    excerpt: "Your neighborhood already needs these — and most can be booked within days.",
    body: [
      { t: 'p', c: "The fastest path to your first dollar is usually a service your neighborhood already needs, not a new online business you have to build an audience for first." },
      { t: 'ul', items: [
        'Pressure washing driveways and siding',
        'Dog walking and pet check-ins',
        'Yard cleanup and seasonal leaf or snow removal',
        'Moving and hauling help for a few hours',
        'Errand running and grocery pickup for elderly neighbors'
      ] },
      { t: 'p', c: "All five have near-zero startup cost and can be booked within days through a simple neighborhood app post or a flyer at the local coffee shop — no website, no waiting to be discovered." },
      { t: 'h3', c: 'Price by the job, not the hour' },
      { t: 'p', c: "Once you've done a job a couple of times and know how long it actually takes, switch to flat pricing. Flat pricing wins more bookings than hourly quotes for small jobs, because the customer knows exactly what they're paying before you start — no clock-watching, no surprises." },
    ] },
  { id: 'a7', cat: 'online', icon: 'mail', date: 'Sep 2026', title: 'Start a Niche Newsletter That Actually Gets Read', readTime: '7 min read',
    excerpt: "Narrow beats broad. How to pick a topic small enough to own completely.",
    body: [
      { t: 'p', c: "A newsletter about \"productivity\" competes with thousands of others for the same tired search terms. One about \"productivity for night-shift nurses\" has almost no competition, and an audience that feels like it was written specifically for them." },
      { t: 'h3', c: 'Narrow until it feels too small' },
      { t: 'p', c: "Pick a topic narrow enough that you could name twenty specific people who'd want it. If you can't picture the reader, the topic is still too broad — narrow it again." },
      { t: 'h3', c: 'Publish on a schedule you can actually keep' },
      { t: 'ul', items: [
        'Weekly and sustainable beats daily and abandoned by week three',
        'Pick a day and stick to it — consistency builds the habit on both ends',
        'A short, useful issue beats a long, skipped one'
      ] },
      { t: 'callout', label: 'Try this', c: "Write your first ten issues before you tell anyone it exists. Ten issues is enough to know if the topic has legs — and enough content to hand a new subscriber on day one." },
      { t: 'p', c: "The subscribe button matters far less than the first ten issues. Write those before you promote anything." },
    ] },
  { id: 'a8', cat: 'online', icon: 'play', date: 'Sep 2026', title: 'Turn One Skill Into a Paid Mini-Course', readTime: '6 min read',
    excerpt: "You don't need to be the expert — just a few steps ahead, with a clear order.",
    body: [
      { t: 'p', c: "You don't need to be the world's top expert to teach something valuable — you need to be a few steps ahead of the person you're teaching, and able to explain the path clearly enough that they don't get stuck." },
      { t: 'h3', c: 'Structure beats production value' },
      { t: 'p', c: "A tightly ordered sequence of short lessons that takes someone from \"stuck\" to \"done\" outsells a polished course with no clear order, recorded on expensive gear. Order is the product; the camera is not." },
      { t: 'ul', items: [
        'Start with the exact stuck point your student is at right now',
        'Break the path into 5-8 short lessons, each ending at a small win',
        'End with the one next step they should take after finishing'
      ] },
      { t: 'h3', c: 'Price the outcome, not the runtime' },
      { t: 'p', c: "Price it based on the outcome it delivers, not its length. A two-hour course that saves someone twenty hours of trial and error is worth more than a ten-hour course that saves nothing — length is not the thing anyone is actually paying for." },
    ] },
  { id: 'a9', cat: 'teach', icon: 'clock', date: 'May 2026', title: 'Price a Tutoring or Coaching Session', readTime: '5 min read',
    excerpt: "Stop pricing by the minute. Price the outcome the person walks away with.",
    body: [
      { t: 'p', c: "Session-based work is easy to underprice because it feels like \"just talking.\" It isn't — the person is paying for the result they leave with, not the number of minutes on the clock." },
      { t: 'h3', c: 'Price the result, not the minutes' },
      { t: 'p', c: "Before naming a number, get specific about what the person walks away with: a passed test, a working routine, a resolved sticking point. That outcome, not your hourly cost, is what sets the ceiling on what you can charge." },
      { t: 'h3', c: 'Package it' },
      { t: 'ul', items: [
        'A four- or six-session package instead of one-offs where possible',
        'An easier yes for the buyer than committing session by session',
        'Smoother income for you than hunting for a new booking every week'
      ] },
      { t: 'p', c: "One-off sessions are fine to start, but the package is where the real, predictable income shows up — offer it right after the first session goes well, while the result is still fresh." },
    ] },
  { id: 'a10', cat: 'teach', icon: 'calendar', date: 'May 2026', title: 'Run a Workshop People Actually Show Up To', readTime: '5 min read',
    excerpt: "One promise, a small room, and a reminder that actually gets sent.",
    body: [
      { t: 'p', c: "A workshop needs one promise, not five. Pick the single outcome someone gets in the room, put it in the title, and cut anything that doesn't serve that one promise." },
      { t: 'h3', c: 'Small room, high attendance' },
      { t: 'p', c: "Cap the group small enough that you can call on people by name. A packed but impersonal session gets worse reviews and fewer referrals than a tight one — attention is the actual product people are paying for." },
      { t: 'h3', c: 'The reminder that fills the seat' },
      { t: 'p', c: "Send a short, specific reminder the morning of, not just at signup — that single message is what turns a \"maybe\" into a seat actually filled." },
      { t: 'callout', label: 'Try this', c: "Morning-of reminder: \"See you at [time] — bring [one thing]. By the end you'll be able to [specific outcome].\"" },
    ] },
  { id: 'a11', cat: 'freelance', icon: 'flag', date: 'Sep 2026', title: 'How to Fire a Bad-Fit Client Without Burning the Bridge', readTime: '5 min read',
    excerpt: "Not every client is worth keeping. Here's how to end it cleanly, without a scene.",
    body: [
      { t: 'p', c: "Every freelancer eventually gets a client who pays late, changes scope constantly, or drains more energy than the invoice is worth. Staying because leaving feels awkward almost always costs more than the discomfort of ending it." },
      { t: 'h3', c: 'Spot it before it drains you completely' },
      { t: 'ul', items: [
        'Payment is consistently late or requires chasing',
        'Scope keeps expanding without a new quote to match it',
        'You dread every message from this one account specifically'
      ] },
      { t: 'h3', c: 'End it like a professional, not a friend' },
      { t: 'p', c: "Give real notice, finish what you've already committed to, and keep the message short: state that you're not the right fit going forward, not why they're difficult to work with. Burning zero bridges costs you nothing, and referrals still happen from clients you've fired, if you leave them well." },
      { t: 'callout', label: 'Try this', c: "\"I'm not able to continue taking on new work for [Client] past [date]. I'll wrap up what's in progress and hand off cleanly.\" No apology, no debate." },
      { t: 'p', c: "Firing a bad-fit client frees the hours for two better ones. The math almost always favors leaving sooner than it feels comfortable to." },
    ] },
  { id: 'a12', cat: 'sell', icon: 'gig', date: 'Sep 2026', title: 'Where to Actually List Things So They Sell', readTime: '5 min read',
    excerpt: "The platform you pick changes your price, your buyer, and how fast it moves.",
    body: [
      { t: 'p', c: "The same item can sell for wildly different prices depending on where you list it — a general marketplace, a local app, and a specialty forum each pull a different buyer with a different budget." },
      { t: 'h3', c: 'Match the platform to the item' },
      { t: 'ul', items: [
        'General local marketplace — fastest for common household items, bulky furniture, anything needing pickup',
        "Specialty forums or communities — best for collectibles or niche gear a generalist buyer wouldn't recognize the value of",
        "National shipping marketplaces — worth it only when the item's value clears the extra time and shipping hassle"
      ] },
      { t: 'h3', c: 'List in more than one place, but track it' },
      { t: 'p', c: "Cross-posting to two or three platforms multiplies your buyer pool, but only if you're disciplined about marking an item sold everywhere the moment it moves — a stale listing that gets a bite after you've already sold it elsewhere is the fastest way to lose a buyer's trust." },
      { t: 'callout', label: 'Quick math', c: "A generic blender might get $15 locally but $40 to the right specialty audience online. Fifteen minutes finding the right forum can be worth more than the item itself." },
      { t: 'p', c: "Five extra minutes picking the right platform before you list is usually worth more than any amount of price-tweaking after." },
    ] },
  { id: 'a13', cat: 'gig', icon: 'repeat', date: 'Sep 2026', title: 'Turning One-Off Gigs Into Standing Weekly Clients', readTime: '5 min read',
    excerpt: "The real money in local work isn't the one-time job — it's the client who books you every week.",
    body: [
      { t: 'p', c: "A single mowing job or cleaning gig pays once. The same client booked weekly, for months, is worth ten times as much for close to the same effort per visit." },
      { t: 'h3', c: 'Make the offer before you leave' },
      { t: 'p', c: "At the end of a one-off job, while the customer is looking at the result, offer a standing slot: \"Want me on the schedule every other Tuesday?\" This is the single highest-leverage moment in local service work, and most people never say it out loud." },
      { t: 'ul', items: [
        'Ask while satisfaction is highest — right after the job, not in a follow-up text days later',
        'Offer a small discount for standing over one-off, framed as a loyalty rate, not a discount on your worth',
        'Lock the day and time, not just the frequency — a fixed slot is what turns into a habit'
      ] },
      { t: 'callout', label: 'Try this', c: "\"I've got a Tuesday opening — want me on a regular schedule so you don't have to think about it?\"" },
      { t: 'p', c: "A calendar full of five standing weekly clients is more stable income than chasing twenty new one-off jobs a month." },
    ] },
  { id: 'a14', cat: 'online', icon: 'layers', date: 'Sep 2026', title: 'Repurpose One Piece of Content Five Ways', readTime: '6 min read',
    excerpt: "You don't need five ideas — you need one good idea cut five different ways.",
    body: [
      { t: 'p', c: "Most people burn out trying to constantly generate new ideas, when the better move is squeezing five pieces of content out of one thing that already worked." },
      { t: 'h3', c: 'One idea, five formats' },
      { t: 'ul', items: [
        'The original long-form piece — a newsletter issue, an article, a video',
        'A short-form clip pulled from the single most useful moment',
        'A carousel or thread breaking the main point into steps',
        'A quote graphic of the single best line',
        'A follow-up piece answering the most common question it got'
      ] },
      { t: 'h3', c: 'Reuse beats reinvent' },
      { t: 'p', c: "An audience on one platform almost never sees what you posted on another, so repurposing isn't repetition to them — it's the first time they're seeing it, in the format they actually check." },
      { t: 'callout', label: 'Quick math', c: "One hour on the original piece, plus twenty minutes cutting it four more ways, produces five posts instead of one — without five hours of new work." },
      { t: 'p', c: "Before you sit down to make something new, check whether last month's best piece has already given you everything it can." },
    ] },
  { id: 'a15', cat: 'teach', icon: 'phone', date: 'Sep 2026', title: 'Turning a Free Consult Call Into a Paid Client', readTime: '5 min read',
    excerpt: "The free call isn't the sales pitch — it's the audition. Here's how to close it without feeling salesy.",
    body: [
      { t: 'p', c: "A free consult call exists to prove you understand the problem, not to give away the entire solution for free. Spend it diagnosing, not solving, and the close takes care of itself." },
      { t: 'h3', c: 'Diagnose out loud, then stop' },
      { t: 'p', c: "Ask real questions, reflect back what you're hearing in specific terms, and name the actual problem clearly. That alone builds more trust than a rehearsed pitch — but stop short of handing over the full fix; that's what the paid engagement is for." },
      { t: 'ul', items: [
        'Spend 80% of the call asking and reflecting, not presenting',
        "Name the specific problem back to them in their own words",
        "End with one clear next step, not an open-ended \"let me know\""
      ] },
      { t: 'callout', label: 'Try this', c: "\"Based on what you've told me, here's exactly what I'd do first — want me to start this week?\"" },
      { t: 'p', c: "People don't hesitate to pay for clarity. A call that ends with a clear diagnosis and a specific next step converts far more often than one that ends with \"think it over.\"" },
    ] },
];

const ARTICLE_CAT_LABEL = {
  freelance: 'Freelance & Services',
  sell: 'Sell & Flip',
  gig: 'Gig & Local',
  online: 'Online & Content',
  teach: 'Teach & Consult',
};

function isArticleRead(id) {
  return localStorage.getItem(`sidepath_read_${id}`) === 'true';
}

function setArticleRead(id, value) {
  localStorage.setItem(`sidepath_read_${id}`, value ? 'true' : 'false');
  refreshReadState();
}

function refreshReadState() {
  const cards = document.querySelectorAll('.article-card');
  let read = 0;
  cards.forEach(card => {
    const id = card.dataset.id;
    const isRead = isArticleRead(id);
    card.classList.toggle('is-read', isRead);
    const toggle = card.querySelector('.read-toggle');
    if (toggle) toggle.classList.toggle('is-read', isRead);
    if (isRead) read++;
  });
  const total = cards.length;
  const label = document.getElementById('libProgressLabel');
  const fill = document.getElementById('libProgressFill');
  if (label) label.textContent = `${read} of ${total} guides read`;
  if (fill) fill.style.width = total ? `${(read / total) * 100}%` : '0%';

  if (currentModalArticle) {
    const btn = document.getElementById('modalReadToggle');
    const read2 = isArticleRead(currentModalArticle.id);
    btn.textContent = read2 ? 'Marked as read' : 'Mark as read';
    btn.classList.toggle('btn-unlocked', read2);
  }
}

function setStarIcon(btn, saved) {
  btn.classList.toggle('saved', saved);
  const use = btn.querySelector('use');
  if (use) use.setAttribute('href', saved ? '#icon-star-filled' : '#icon-star');
}

function isArticleSaved(id) {
  return localStorage.getItem(`sidepath_saved_article_${id}`) === 'true';
}

function toggleArticleSaved(id) {
  localStorage.setItem(`sidepath_saved_article_${id}`, isArticleSaved(id) ? 'false' : 'true');
}

const FEATURED_ARTICLE_ID = 'a1';
const NEW_BADGE_MONTH = 'Sep 2026';

function renderFeatured() {
  const wrap = document.getElementById('featuredArticle');
  if (!wrap) return;
  const article = ARTICLES.find(a => a.id === FEATURED_ARTICLE_ID);
  if (!article) return;
  const index = ARTICLES.findIndex(a => a.id === FEATURED_ARTICLE_ID);
  wrap.innerHTML = `
    <div class="featured-card" data-id="${article.id}">
      <div class="featured-cover">${coverSVG(article.icon, index)}</div>
      <div class="featured-body">
        <span class="featured-badge">Start here</span>
        <h2>${article.title}</h2>
        <p>${article.excerpt}</p>
        <span class="read-time">${article.readTime}</span>
      </div>
    </div>
  `;
  wrap.querySelector('.featured-card').addEventListener('click', () => openArticleModal(article.id));
}

function renderArticles() {
  const grid = document.getElementById('libraryGrid');
  if (!grid) return;
  grid.innerHTML = ARTICLES.map((article, index) => {
    const isNew = article.date === NEW_BADGE_MONTH;
    return `
      <article class="article-card" data-category="${article.cat}" data-id="${article.id}">
        <div class="article-cover">
          ${coverSVG(article.icon, index)}
          <button class="article-save" data-save-id="${article.id}" aria-label="Save for later"><svg viewBox="0 0 24 24"><use href="#icon-star"/></svg></button>
          <button class="read-toggle" data-read-id="${article.id}" aria-label="Mark as read"><svg viewBox="0 0 24 24"><use href="#icon-check"/></svg></button>
        </div>
        <div class="article-card-body">
          <span class="tag">${ARTICLE_CAT_LABEL[article.cat]}${isNew ? '<span class="new-badge">New</span>' : ''}</span>
          <h2>${article.title}</h2>
          <p class="excerpt">${article.excerpt}</p>
          <div class="read-time-row">
            <span class="read-time">${article.readTime}</span>
            <span class="read-time article-date">&middot; ${article.date}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.read-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.readId;
      setArticleRead(id, !isArticleRead(id));
    });
  });

  grid.querySelectorAll('.article-save').forEach(btn => {
    const id = btn.dataset.saveId;
    setStarIcon(btn, isArticleSaved(id));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleArticleSaved(id);
      setStarIcon(btn, isArticleSaved(id));
    });
  });

  grid.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('click', () => openArticleModal(card.dataset.id));
  });

  refreshReadState();
  applyLibraryFilters();
}

function applyLibraryFilters() {
  const grid = document.getElementById('libraryGrid');
  const emptyNote = document.getElementById('libraryEmptyNote');
  if (!grid) return;
  const activeChip = document.querySelector('#libraryFilters .filter-chip.active');
  const filter = activeChip ? activeChip.dataset.filter : 'all';
  const searchInput = document.getElementById('librarySearch');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  let visibleCount = 0;

  grid.querySelectorAll('.article-card').forEach(card => {
    const id = card.dataset.id;
    const article = ARTICLES.find(a => a.id === id);
    let matchesFilter = true;
    if (filter === 'saved') matchesFilter = isArticleSaved(id);
    else if (filter !== 'all') matchesFilter = card.dataset.category === filter;

    const haystack = `${article.title} ${article.excerpt}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);

    const show = matchesFilter && matchesSearch;
    card.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  if (emptyNote) emptyNote.classList.toggle('hidden', visibleCount > 0);
}

document.querySelectorAll('#libraryFilters .filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#libraryFilters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyLibraryFilters();
  });
});

const librarySearchInput = document.getElementById('librarySearch');
if (librarySearchInput) {
  librarySearchInput.addEventListener('input', applyLibraryFilters);
}

// ---------- Reading modal ----------

let currentModalArticle = null;

function renderBlock(b) {
  if (b.t === 'h3') return `<h3>${b.c}</h3>`;
  if (b.t === 'ul') return `<ul>${b.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  if (b.t === 'callout') return `<div class="callout"><span class="callout-label">${b.label}</span>${b.c}</div>`;
  return `<p>${b.c}</p>`;
}

function openArticleModal(id) {
  const article = ARTICLES.find(a => a.id === id);
  if (!article) return;
  currentModalArticle = article;

  const index = ARTICLES.findIndex(a => a.id === id);
  document.getElementById('modalHero').innerHTML = coverSVG(article.icon, index);
  document.getElementById('modalTag').textContent = ARTICLE_CAT_LABEL[article.cat];
  document.getElementById('modalTitle').textContent = article.title;
  document.getElementById('modalReadTime').textContent = `${article.readTime} · ${article.date}`;
  document.getElementById('modalBody').innerHTML = article.body.map(renderBlock).join('');

  const modal = document.getElementById('articleModal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  refreshReadState();
}

function closeArticleModal() {
  document.getElementById('articleModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModalArticle = null;
}

document.getElementById('modalClose').addEventListener('click', closeArticleModal);
document.getElementById('articleModal').addEventListener('click', (e) => {
  if (e.target.id === 'articleModal') closeArticleModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeArticleModal();
});
document.getElementById('modalReadToggle').addEventListener('click', () => {
  if (!currentModalArticle) return;
  setArticleRead(currentModalArticle.id, !isArticleRead(currentModalArticle.id));
});

renderFeatured();
renderArticles();

// ---------- Roadmap modules data ----------

const MODULES = [
  { id: 'm1', title: 'Pick One Lane, Not Five', body: [
    { t: 'p', c: "The instinct when starting is to try a little of everything — a freelance profile, a resale account, a gig app, all at once. In practice this splits your attention so thin that nothing gets enough momentum to pay off." },
    { t: 'h3', c: 'Match the lane to what you already have' },
    { t: 'p', c: "Pick one lane based on what you already have, not what sounds most exciting. Whichever one requires the least new setup is usually the right lane to start in." },
    { t: 'ul', items: [
      'Have a skill people already ask you for help with? Start in Freelance & Services.',
      'Have unused stuff or an eye for undervalued items? Start in Sell & Flip.',
      'Have free hours and a car or a bike? Start in Gig & Local.'
    ] },
    { t: 'callout', label: 'Try this', c: "Commit to one lane for the first 30 days before adding a second — even if a shiny idea shows up in week two." },
    { t: 'p', c: "The goal of month one isn't income yet — it's getting one channel to the point where it reliably produces something, so you have a repeatable process instead of a string of one-off wins." },
  ] },
  { id: 'm2', title: 'Price It Like You Mean It', body: [
    { t: 'p', c: "Whatever you're selling — time, a skill, an item — your first price is a guess, and most people guess too low out of nerves, not out of any real read on the market." },
    { t: 'h3', c: 'Anchor to comparables, not your comfort' },
    { t: 'p', c: "Look at what three comparable options charge, then price at the middle of that range, not the bottom. Pricing at the bottom doesn't win you more customers — it mostly wins you customers who only care about price, the worst kind to build a repeat business on." },
    { t: 'callout', label: 'Quick math', c: "Three competitors charge $30, $45, and $60 for the same thing. Price at $45, not $30 — the middle, not the floor." },
    { t: 'h3', c: 'Read the signal, not your nerves' },
    { t: 'p', c: "A price that's slightly too high and gets negotiated down still lands better than one that was too low from the start, because raising prices on existing buyers is much harder than lowering them for a new one." },
    { t: 'ul', items: [
      "Nobody has objected to your price in the first five conversations? You're underpriced, not popular.",
      'Every lead converts instantly with zero hesitation? Same signal.',
      "You're consistently the cheapest option in the room? Also the same signal."
    ] },
  ] },
  { id: 'm3', title: 'Find Buyers Where They Already Are', body: [
    { t: 'p', c: "Don't build an audience from zero before you have something to sell — find the place your buyer already gathers and show up there instead." },
    { t: 'h3', c: 'Where "already gathering" actually looks like' },
    { t: 'ul', items: [
      "A specific subreddit built around your buyer's problem, not your skill",
      'A local Facebook group, if the work is location-based',
      "A Discord or Slack community your buyer already spends time in",
      'A physical bulletin board, for anything hyper-local'
    ] },
    { t: 'h3', c: 'Give before you ask' },
    { t: 'p', c: "Post something genuinely useful first, not a pitch — answer a question well, share something that actually helps. The offer comes naturally in a reply or a follow-up, not the opening line." },
    { t: 'callout', label: 'Try this', c: "Find one thread this week where someone is describing the exact problem you solve, and answer it in detail with zero pitch attached." },
    { t: 'p', c: "One well-placed, genuinely helpful post in the right existing community outperforms weeks of posting into an empty new profile nobody follows yet." },
  ] },
  { id: 'm4', title: 'Get Paid Without the Awkward Part', body: [
    { t: 'p', c: "Money conversations feel awkward mainly because they're improvised — decide your payment terms before you need them, not in the middle of a conversation." },
    { t: 'h3', c: 'Set the terms before the work starts' },
    { t: 'ul', items: [
      'Services: get paid upfront, or at minimum a deposit before starting',
      "Goods: meet in a public place, or use a platform's built-in buyer/seller protection",
      'Never: a personal bank transfer to or from a total stranger'
    ] },
    { t: 'callout', label: 'Quick script', c: '"50% to start, 50% on delivery." Say it once, plainly, at the beginning — not as a negotiation, as a fact.' },
    { t: 'p', c: "Stating the terms plainly and early removes the need to negotiate it mid-project, when it's genuinely uncomfortable and the leverage has already shifted toward whoever's holding the work or the money." },
  ] },
  { id: 'm5', title: 'Turn One Client Into Three', body: [
    { t: 'p', c: "Finding a new buyer costs far more effort than keeping or expanding an existing one — referrals are the cheapest client acquisition channel you have, and most people never ask for them." },
    { t: 'h3', c: 'Ask at the moment satisfaction peaks' },
    { t: 'p', c: "After you finish any job well, ask directly: \"Do you know one or two people who'd need something similar?\" Most people don't offer a referral unasked, but will happily give one when asked plainly right after a good experience." },
    { t: 'ul', items: [
      'Ask right after delivery, not weeks later when the feeling has faded',
      'Make it specific: "one or two people," not a vague "let people know"',
      'Say thank you and follow up on any name they give you within 48 hours'
    ] },
    { t: 'callout', label: 'Try this', c: "Use the referral-ask script from the Library's Scripts section right after your next delivery — word for word is fine." },
    { t: 'p', c: "This single habit, repeated after every job, is usually what takes someone from occasional gigs to a steady pipeline without spending anything on marketing." },
  ] },
  { id: 'm6', title: 'Know When to Raise Your Rate', body: [
    { t: 'p', c: "Pricing isn't a one-time decision — it should move as your demand does, and most people wait far longer than they need to before adjusting it." },
    { t: 'h3', c: "The three signals it's time" },
    { t: 'ul', items: [
      "You're booked more than a couple of weeks out",
      "You've stopped feeling nervous quoting your current number",
      "You've gone three jobs in a row without anyone objecting to the price"
    ] },
    { t: 'h3', c: 'Roll it out without losing anyone' },
    { t: 'p', c: "Apply the new rate to new clients first — existing ones can be moved up gradually with notice, rather than hit with a surprise on their next invoice." },
    { t: 'callout', label: 'Quick math', c: "A 10-15% increase rarely loses a client who values the work. If it does cost you someone, that's usually a sign the increase was overdue, not that it was a mistake." },
  ] },
];

function isModuleDone(id) {
  return localStorage.getItem(`sidepath_module_${id}`) === 'true';
}

function refreshModuleState() {
  const modules = document.querySelectorAll('.module-check');
  let done = 0;
  modules.forEach(btn => {
    const id = btn.dataset.moduleId;
    const complete = isModuleDone(id);
    btn.closest('.module').dataset.done = complete ? 'true' : 'false';
    if (complete) done++;
  });
  const total = modules.length;
  const label = document.getElementById('roadmapProgressLabel');
  const fill = document.getElementById('roadmapProgressFill');
  if (label) label.textContent = `${done} of ${total} modules complete`;
  if (fill) fill.style.width = total ? `${(done / total) * 100}%` : '0%';
}

function renderModules() {
  const list = document.getElementById('moduleList');
  if (!list) return;
  list.innerHTML = MODULES.map((module, i) => `
    <div class="module" data-open="${i === 0 ? 'true' : 'false'}">
      <div class="module-head">
        <button class="check-toggle module-check" data-module-id="${module.id}" aria-label="Mark module complete"><svg viewBox="0 0 24 24"><use href="#icon-check"/></svg></button>
        <button class="module-toggle">
          <span class="module-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="module-title">${module.title}</span>
          <span class="module-chevron">&#9662;</span>
        </button>
      </div>
      <div class="module-body">${module.body.map(renderBlock).join('')}</div>
    </div>
  `).join('');

  list.querySelectorAll('.module-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const module = toggle.closest('.module');
      const isOpen = module.dataset.open === 'true';
      module.dataset.open = isOpen ? 'false' : 'true';
    });
  });

  list.querySelectorAll('.module-check').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.moduleId;
      const key = `sidepath_module_${id}`;
      localStorage.setItem(key, isModuleDone(id) ? 'false' : 'true');
      refreshModuleState();
    });
  });

  refreshModuleState();
}

renderModules();

// ---------- Onboarding checklist ----------

function isOnboardDone(id) {
  return localStorage.getItem(`sidepath_onboard_${id}`) === 'true';
}

function refreshOnboardState() {
  document.querySelectorAll('#onboardChecklist li').forEach(li => {
    const id = li.dataset.onboardId;
    li.classList.toggle('done', isOnboardDone(id));
  });
}

document.querySelectorAll('#onboardChecklist .check-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const li = btn.closest('li');
    const id = li.dataset.onboardId;
    const key = `sidepath_onboard_${id}`;
    localStorage.setItem(key, isOnboardDone(id) ? 'false' : 'true');
    refreshOnboardState();
  });
});

refreshOnboardState();

// ---------- Copy-to-clipboard scripts ----------

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent);
    } catch (err) {
      const range = document.createRange();
      range.selectNode(target);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    const original = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><use href="#icon-check"/></svg>Copied';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = original;
    }, 1600);
  });
});

// ---------- 50 Extra Income Ideas data ----------

const IDEAS = [
  { cat: 'freelance', title: 'Resume & LinkedIn editing', note: 'Rewrite bullet points around results, not duties — recruiters skim for numbers, not job descriptions.', start: 'Rewrite your own resume first as a portfolio piece.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Virtual assistant work', note: 'Inbox triage, calendar scheduling, and CRM data entry for founders drowning in admin.', start: 'Offer a free 2-hour trial to your first client.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Bookkeeping for small businesses', note: 'Monthly categorization and reconciliation in QuickBooks or Wave for owners who’d rather not look.', start: 'Get comfortable in one free tool before pitching anyone.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Voiceover for short videos', note: '30-90 second reads for ads and course intros, paid per finished minute.', start: 'Record 3 sample reads in different tones as a demo reel.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Proofreading and copy editing', note: 'A second pair of eyes on newsletters and resumes before they go out the door.', start: 'Edit one post for a writer you already follow, free, as a sample.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Social media scheduling', note: 'Batch a week of posts into Buffer or Later for a brand that keeps meaning to post more.', start: 'Pitch the local business you already buy from.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Transcription', note: 'Turn interviews, podcasts, and meetings into clean text, paid per audio minute.', start: 'Time yourself on a 5-minute clip to know your real hourly rate.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Basic logo and brand kits', note: 'A simple mark, two fonts, three colors — packaged for a founder who just needs something clean.', start: 'Build 3 starter kits on spec for your portfolio.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Website copy touch-ups', note: 'Rewrite a homepage headline and About page so it says what the business actually does.', start: 'Rewrite one local business’s homepage unprompted and send it over.', cost: 'Low cost to start' },
  { cat: 'freelance', title: 'Customer support coverage', note: 'Cover evening or weekend chat and email during a small store’s busiest hours.', start: 'Target stores whose listed support hours end before 9pm.', cost: 'Low cost to start' },

  { cat: 'sell', title: 'Flip thrifted furniture', note: 'Buy underpriced solid-wood pieces, clean and stage them, resell for 2-3x locally.', start: 'Start with one piece under $30 to learn the cleanup process.', cost: 'Some upfront cost' },
  { cat: 'sell', title: 'Retail arbitrage', note: 'Buy clearance stock in-store, resell online at the going market rate.', start: 'Scan clearance aisles with a resale-price app before buying.', cost: 'Some upfront cost' },
  { cat: 'sell', title: 'Sell handmade goods', note: 'Turn a craft skill into small-batch products for a specific, findable audience.', start: 'Make 10 units of one product before opening a shop for it.', cost: 'Some upfront cost' },
  { cat: 'sell', title: 'Flip electronics', note: 'Buy broken or outdated phones and laptops cheap, repair or wipe them, resell for a markup.', start: 'Learn one repair, like a cracked screen, before buying inventory.', cost: 'Some upfront cost' },
  { cat: 'sell', title: 'Print-on-demand shop', note: 'Sell your own designs on shirts and mugs with no inventory held — see the Library guide for the niche strategy.', start: 'Pick one specific niche and launch with 10 designs, not 100.', cost: 'Low cost to start' },
  { cat: 'sell', title: 'Bundle unused items', note: 'Group similar low-value items together — a bundle sells faster than five separate low-ball listings.', start: 'Bundle by use case, like a starter kit, not just by category.', cost: 'Low cost to start' },
  { cat: 'sell', title: 'Flip sneakers or collectibles', note: 'Buy limited releases at retail price, resell once demand outpaces supply.', start: 'Track resale prices on one release for two weeks before buying.', cost: 'Some upfront cost' },
  { cat: 'sell', title: 'Sell surplus garden produce', note: 'Local buyers pay a premium for fresh, pesticide-free produce sold direct, no middleman.', start: 'Post in a local buy-nothing group before your first harvest.', cost: 'Low cost to start' },
  { cat: 'sell', title: 'Upcycle clothing', note: 'Alter, dye, or customize thrifted clothing and resell to a specific style audience.', start: 'Redo 5 pieces in one consistent style before listing any.', cost: 'Low cost to start' },
  { cat: 'sell', title: 'Sell stock photos or assets', note: 'Upload reusable graphics, icons, or photos and earn a royalty per download.', start: 'Upload one themed set of 20 images rather than random singles.', cost: 'Low cost to start' },

  { cat: 'gig', title: 'Food or grocery delivery', note: 'Flexible hours, paid per run plus tips — best worked around lunch and dinner peaks.', start: 'Log on during one lunch rush and track your real hourly rate.', cost: 'Low cost to start' },
  { cat: 'gig', title: 'Rideshare driving', note: 'Best during predictable local peak hours — bar close and event nights beat the base fare.', start: 'Check your city’s event calendar before your first shift.', cost: 'Some upfront cost' },
  { cat: 'gig', title: 'Dog walking and pet sitting', note: 'Steady repeat bookings once you have a few reviews — most clients rebook the same walker weekly.', start: 'Offer your first walk free to one neighbor for a review.', cost: 'Low cost to start' },
  { cat: 'gig', title: 'Moving and hauling help', note: 'Paid by the job, often same-day, for people moving apartments or clearing a garage.', start: 'Post in a local moving-help group with this weekend’s availability.', cost: 'Low cost to start' },
  { cat: 'gig', title: 'Yard work and landscaping', note: 'Seasonal but reliably in demand — mowing routes pay best as standing weekly clients.', start: 'Offer a discounted first mow to lock in a recurring client.', cost: 'Some upfront cost' },
  { cat: 'gig', title: 'House cleaning', note: 'Recurring weekly or biweekly bookings pay best and fill your calendar without constant rebooking.', start: 'Clean one friend’s home at a discount for your first review.', cost: 'Some upfront cost' },
  { cat: 'gig', title: 'Handyman and assembly help', note: 'Furniture assembly and small repairs, priced per job — flat-pack assembly alone is steady demand.', start: 'List specifically as "furniture assembly" — it searches better than "handyman."', cost: 'Low cost to start' },
  { cat: 'gig', title: 'Elderly errand running', note: 'Groceries, prescriptions, and rides for neighbors who’d rather pay than ask a stranger.', start: 'Ask at a local senior center if anyone needs regular help.', cost: 'Low cost to start' },
  { cat: 'gig', title: 'Event setup and staffing', note: 'Local venues and caterers need short-notice help for setup, service, and breakdown.', start: 'Reach out to 3 local caterers directly — most run lean.', cost: 'Low cost to start' },
  { cat: 'gig', title: 'Mobile car detailing', note: 'Detail cars at a customer’s driveway with a portable kit — no shop rent to cover.', start: 'Detail your own car and post the before/after as your first ad.', cost: 'Some upfront cost' },

  { cat: 'online', title: 'Start a niche newsletter', note: 'Cover one specific topic well enough that people pay for it — see the Library guide for how narrow to go.', start: 'Write your first 3 issues before picking a platform.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Sell a digital template', note: 'A spreadsheet, planner, or document others can reuse and customize for their own situation.', start: 'Turn a tool you already built for yourself into a sellable version.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Affiliate content', note: 'Recommend products you actually use and earn a cut when someone buys through your link.', start: 'Write one honest, detailed review of something you already own.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Short-form video content', note: 'Build an audience with short videos, then monetize through brand deals once you have reach.', start: 'Post one video a day for two weeks before judging the format.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Sell an online mini-course', note: 'Package a skill you have into a short paid course — see the Library guide for structuring it.', start: 'Outline the 5-8 lessons before recording a single minute.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Freelance blog writing', note: 'Write articles for businesses that need regular content but no in-house writer.', start: 'Pitch one specific article idea, not a general "I write blogs" offer.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Manage social media locally', note: 'Post, respond, and grow one account for a monthly retainer instead of one-off gigs.', start: 'Offer a free 2-week trial to your first local business.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Sell presets or filters', note: 'Photo and video editors buy ready-made looks that save hours of manual color grading.', start: 'Package the look from your best-performing photo as pack one.', cost: 'Low cost to start' },
  { cat: 'online', title: 'Run a small paid community', note: 'Charge for access to a group built around a shared interest, with real discussion.', start: 'Run it free for a month first to prove there’s enough activity.', cost: 'Low cost to start' },
  { cat: 'online', title: 'License stock footage or music', note: 'Upload clips or tracks to a marketplace and earn a royalty every time one licenses.', start: 'Upload your best 10 clips, not your entire back catalog.', cost: 'Low cost to start' },

  { cat: 'teach', title: 'Tutor a subject you know well', note: 'Academic subjects or test prep, in person or online — see the Library guide for pricing sessions right.', start: 'Offer one free diagnostic session to find the real gap.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Teach a language conversationally', note: 'Practice sessions for learners who need speaking confidence, not grammar drills.', start: 'Offer a free 15-minute trial call to gauge fit.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Coach a skill you’ve mastered', note: 'Fitness, music, or a craft, taught around a specific goal, one-on-one or in small groups.', start: 'Coach one friend toward a goal for free, then ask for a testimonial.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Consult on a tool you use daily', note: 'Help small businesses set up and configure software you already know inside out.', start: 'Offer a one-hour paid setup audit as your entry offer.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Run a paid workshop', note: 'A single session teaching one specific, useful skill — see the Library guide for filling the room.', start: 'Test the topic free for a small group before charging for it.', cost: 'Some upfront cost' },
  { cat: 'teach', title: 'Career coaching', note: 'Help people prep for interviews or plan a career change using a process you’ve actually lived.', start: 'Mock-interview one person in your network as a free case study.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Resume review sessions', note: 'Live, paid feedback calls instead of async editing — faster for you, more useful for the client.', start: 'Offer live review as an upsell to async resume editing.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Teach a hobby class', note: 'Cooking, painting, or another hobby, taught to small groups in a home or rented space.', start: 'Host one free class for friends to work out timing and materials.', cost: 'Some upfront cost' },
  { cat: 'teach', title: 'Offer portfolio reviews', note: 'Feedback for designers, photographers, or writers building a portfolio for their first client.', start: 'Review one portfolio publicly, with permission, to show your eye.', cost: 'Low cost to start' },
  { cat: 'teach', title: 'Mentor beginners in your field', note: 'Paid one-on-one guidance for people starting out exactly where you did a few years ago.', start: 'Mentor one person free for a month before making it a paid offer.', cost: 'Low cost to start' },
];

const CAT_LABEL = {
  freelance: 'Freelance & Services',
  sell: 'Sell & Flip',
  gig: 'Gig & Local',
  online: 'Online & Content',
  teach: 'Teach & Consult',
};

function isIdeaSaved(id) {
  return localStorage.getItem(`sidepath_saved_${id}`) === 'true';
}

function renderIdeas() {
  const grid = document.getElementById('ideaGrid');
  if (!grid) return;
  grid.innerHTML = IDEAS.map((idea, i) => `
    <div class="idea-card" data-category="${idea.cat}" data-id="i${i}">
      <button class="idea-star" data-save-id="i${i}" aria-label="Save idea"><svg viewBox="0 0 24 24"><use href="#icon-star"/></svg></button>
      <span class="tag"><svg class="cat-icon" style="width:11px;height:11px;vertical-align:-1px;margin-right:4px" viewBox="0 0 24 24"><use href="#icon-${idea.cat}"/></svg>${CAT_LABEL[idea.cat]}</span>
      <span class="idea-title">${idea.title}</span>
      <span class="idea-note">${idea.note}</span>
      <span class="idea-start">&rarr; ${idea.start}</span>
      <span class="idea-cost">${idea.cost}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.idea-star').forEach(star => {
    const id = star.dataset.saveId;
    setStarIcon(star, isIdeaSaved(id));
    star.addEventListener('click', () => {
      const key = `sidepath_saved_${id}`;
      localStorage.setItem(key, isIdeaSaved(id) ? 'false' : 'true');
      setStarIcon(star, isIdeaSaved(id));
    });
  });

  wireFilters('ideasFilters', 'ideaGrid', '.idea-card', (card, filter) => {
    if (filter === 'all') return true;
    if (filter === 'saved') return isIdeaSaved(card.dataset.id);
    return card.dataset.category === filter;
  });
}

renderIdeas();

// ---------- Unlock / entitlement (demo, localStorage only) ----------

const UNLOCK_KEYS = {
  roadmap: 'sidepath_unlocked_roadmap',
  ideas: 'sidepath_unlocked_ideas',
};

function isUnlocked(product) {
  return localStorage.getItem(UNLOCK_KEYS[product]) === 'true';
}

function applyGateState(product) {
  const locked = document.getElementById(`${product}Locked`);
  const content = document.getElementById(`${product}Content`);
  const unlocked = isUnlocked(product);
  if (locked) locked.classList.toggle('hidden', unlocked);
  if (content) content.classList.toggle('hidden', !unlocked);
}

function refreshUnlockButtons() {
  document.querySelectorAll('[data-unlock]').forEach(btn => {
    const product = btn.dataset.unlock;
    const unlocked = isUnlocked(product);
    btn.disabled = unlocked;
    btn.textContent = unlocked ? 'Unlocked' : btn.dataset.label;
    btn.classList.toggle('btn-unlocked', unlocked);
  });
}

function refreshAllGates() {
  applyGateState('roadmap');
  applyGateState('ideas');
  refreshUnlockButtons();
}

document.querySelectorAll('[data-unlock]').forEach(btn => {
  btn.dataset.label = btn.textContent;
  btn.addEventListener('click', () => {
    const product = btn.dataset.unlock;
    localStorage.setItem(UNLOCK_KEYS[product], 'true');
    applyGateState(product);
    refreshUnlockButtons();
    goToPanel(product);
  });
});

const resetBtn = document.getElementById('resetDemo');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('sidepath_'))
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  });
}

refreshAllGates();

// ---------- Income Tracker (core feature, recurring value) ----------

const TRACKER_ENTRIES_KEY = 'sidepath_tracker_entries';
const TRACKER_GOAL_KEY = 'sidepath_tracker_goal';
const TRACKER_CATEGORIES = ['freelance', 'sell', 'gig', 'online', 'teach'];

function getTrackerEntries() {
  try {
    return JSON.parse(localStorage.getItem(TRACKER_ENTRIES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveTrackerEntries(list) {
  localStorage.setItem(TRACKER_ENTRIES_KEY, JSON.stringify(list));
}

function getTrackerGoal() {
  const raw = parseFloat(localStorage.getItem(TRACKER_GOAL_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : 500;
}

function formatEntryDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameMonth(iso, ref) {
  const d = new Date(`${iso}T00:00:00`);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function renderTracker() {
  const monthTotalEl = document.getElementById('trackerMonthTotal');
  if (!monthTotalEl) return;

  const entries = getTrackerEntries();
  const now = new Date();
  const monthEntries = entries.filter(e => isSameMonth(e.date, now));
  const monthTotal = monthEntries.reduce((sum, e) => sum + e.amount, 0);
  const allTotal = entries.reduce((sum, e) => sum + e.amount, 0);
  const goal = getTrackerGoal();

  monthTotalEl.textContent = `$${monthTotal.toFixed(2)}`;
  document.getElementById('trackerAllTotal').textContent = `$${allTotal.toFixed(2)}`;
  document.getElementById('trackerEntryCount').textContent = entries.length;

  document.getElementById('goalInput').value = goal;
  const pct = goal > 0 ? Math.min(100, (monthTotal / goal) * 100) : 0;
  document.getElementById('goalFill').style.width = `${pct}%`;
  document.getElementById('goalLabel').textContent = `$${monthTotal.toFixed(0)} of $${goal.toFixed(0)} this month`;

  const catTotals = {};
  TRACKER_CATEGORIES.forEach(c => { catTotals[c] = 0; });
  monthEntries.forEach(e => { catTotals[e.cat] = (catTotals[e.cat] || 0) + e.amount; });
  const maxCat = Math.max(1, ...Object.values(catTotals));

  const catWrap = document.getElementById('catBreakdown');
  catWrap.innerHTML = TRACKER_CATEGORIES.map(cat => {
    const amt = catTotals[cat];
    const barPct = (amt / maxCat) * 100;
    return `
      <div class="cat-bar-row">
        <span class="cat-icon-badge"><svg viewBox="0 0 24 24" width="14" height="14"><use href="#icon-${cat}"/></svg></span>
        <span class="cat-bar-label">${ARTICLE_CAT_LABEL[cat]}</span>
        <span class="cat-bar-track"><span class="cat-bar-fill" style="width:${barPct}%"></span></span>
        <span class="cat-bar-amount">$${amt.toFixed(0)}</span>
      </div>
    `;
  }).join('');

  const list = document.getElementById('entryList');
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) {
    list.innerHTML = '<p class="empty-note">No entries yet. Log your first payment above — even a small one counts.</p>';
    return;
  }
  list.innerHTML = sorted.map(e => `
    <div class="entry-row">
      <span class="entry-date">${formatEntryDate(e.date)}</span>
      <span class="entry-cat-icon"><svg viewBox="0 0 24 24" width="12" height="12"><use href="#icon-${e.cat}"/></svg></span>
      <span class="entry-note">${e.note || ARTICLE_CAT_LABEL[e.cat]}</span>
      <span class="entry-amount">$${e.amount.toFixed(2)}</span>
      <button class="entry-delete" data-delete-id="${e.id}" aria-label="Delete entry">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.entry-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      saveTrackerEntries(getTrackerEntries().filter(e => e.id !== btn.dataset.deleteId));
      renderTracker();
    });
  });
}

const entryForm = document.getElementById('entryForm');
if (entryForm) {
  const dateInput = document.getElementById('entryDate');
  dateInput.value = new Date().toISOString().slice(0, 10);

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('entryAmount').value);
    if (!amount || amount <= 0) return;
    const entries = getTrackerEntries();
    entries.push({
      id: `t${Date.now()}`,
      date: dateInput.value || new Date().toISOString().slice(0, 10),
      cat: document.getElementById('entryCat').value,
      amount,
      note: document.getElementById('entryNote').value.trim(),
    });
    saveTrackerEntries(entries);
    entryForm.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    renderTracker();
  });
}

const goalForm = document.getElementById('goalForm');
if (goalForm) {
  goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseFloat(document.getElementById('goalInput').value);
    localStorage.setItem(TRACKER_GOAL_KEY, Number.isFinite(val) && val > 0 ? val : 500);
    renderTracker();
  });
}

renderTracker();

if (pendingUnlockProduct) {
  goToPanel(pendingUnlockProduct);
  showUnlockToast(pendingUnlockProduct);
}
