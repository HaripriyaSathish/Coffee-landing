// Fallback content, used only if the PHP API / MySQL is not reachable.
// The real content is managed in the admin panel (backend/admin).
export const DEFAULT_BANNER = {
  settings: {
    brand_name: 'COLDPRESS',
    brand_tagline: 'Slow Brew Co.',
    nav_cta_text: 'Shop Now',
    nav_cta_url: '#shop',
    eyebrow: 'Steeped 18 hours · Finished with hot milk',
    primary_cta_text: 'Pre-order',
    secondary_cta_text: 'Watch the brew',
    secondary_cta_url: '#story',
    form_placeholder: 'Enter your email',
    form_success_text: 'You are on the list. First batch ships Friday.',
    scroll_hint: 'Scroll to explore',
  },
  nav: [
    { id: 1, label: 'Home', url: '#' },
    { id: 2, label: 'Shop', url: '#shop' },
    { id: 3, label: 'Our Brew', url: '#story' },
    { id: 4, label: 'Subscribe', url: '#subscribe' },
    { id: 5, label: 'Contact', url: '#contact' },
  ],
  flavors: [
    { id: 1, name: 'Original Black', subtitle: 'Single-origin Ethiopia', headline: 'Cold. Pressed. Perfected.', description: 'Ethically sourced beans, steeped for 18 hours in cold mountain water. Smooth, low-acid and bold enough to wake the city.', price: 4.99, volume: '250 ml', caffeine: '210 mg', liquid_color: '#2a1408', label_color: '#f1e4d1', accent_color: '#d39a5c', bg_color: '#3a2414' },
    { id: 2, name: 'Vanilla Oat', subtitle: 'Madagascar vanilla · oat milk', headline: 'Velvet in every sip.', description: 'Our signature cold brew folded with creamy oat milk and real Madagascar vanilla bean. Dairy-free, naturally sweet.', price: 5.49, volume: '250 ml', caffeine: '150 mg', liquid_color: '#a5754d', label_color: '#fbf3e6', accent_color: '#e9c58f', bg_color: '#463021' },
    { id: 3, name: 'Salted Caramel', subtitle: 'Sea salt · burnt sugar', headline: 'Sweet meets the deep.', description: 'Slow-cooked caramel and a pinch of sea salt over a dark-roast cold brew base. Dessert energy, zero compromise.', price: 5.49, volume: '250 ml', caffeine: '170 mg', liquid_color: '#7a3f17', label_color: '#f6dcc0', accent_color: '#f08a3c', bg_color: '#45291a' },
    { id: 4, name: 'Mocha Noir', subtitle: '70% dark cacao', headline: 'Dark side of the bean.', description: 'Cold brew meets 70% single-estate cacao for a deep, chocolatey finish with a clean, energising kick.', price: 5.99, volume: '250 ml', caffeine: '190 mg', liquid_color: '#3d1d14', label_color: '#ead2c4', accent_color: '#c0664a', bg_color: '#3a201a' },
  ],
  stats: [
    { value: '18h', label: 'Cold steeped' },
    { value: '0g', label: 'Added sugar' },
    { value: '100%', label: 'Arabica beans' },
  ],
  steps: [
    { scene_key: 'beans', step_label: 'Seeds', title: 'Roasted coffee seeds', description: 'Specialty arabica seeds, hand-picked and slow roasted in small batches.', duration_sec: 3.8, bg_color: '#3a2414' },
    { scene_key: 'grind', step_label: 'Powder', title: 'Seeds into powder', description: 'A slow burr grind turns the roasted seeds into fresh, coarse coffee powder.', duration_sec: 4, bg_color: '#432817' },
    { scene_key: 'brew', step_label: 'Decoction', title: 'Cold water decoction', description: 'Cold water soaks the powder for 18 hours and slowly turns into a rich coffee decoction.', duration_sec: 3.2, bg_color: '#3d2516' },
    { scene_key: 'bottle', step_label: 'Press', title: 'Cold pressed', description: 'The plunger presses the powder down, leaving only smooth, clear decoction.', duration_sec: 3.4, bg_color: '#3a2414' },
    { scene_key: 'serve', step_label: 'Pour', title: 'Into the cup', description: 'The cold-pressed decoction pours straight from the bottle into the glass.', duration_sec: 4.2, bg_color: '#3f2716' },
    { scene_key: 'milk', step_label: 'Hot milk', title: 'Hot milk, stirred in', description: 'Steaming hot milk is poured into the cold-pressed coffee and stirred into a creamy cappuccino.', duration_sec: 6.5, bg_color: '#46301f' },
  ],
};

export const SCENE_ORDER = ['beans', 'grind', 'brew', 'bottle', 'serve', 'milk'];

/** Merge API data over defaults and make sure all 6 animation steps exist, in scene order. */
export function normalizeBanner(api) {
  const d = DEFAULT_BANNER;
  if (!api) return d;
  const steps = SCENE_ORDER.map(
    (key) => api.steps?.find((s) => s.scene_key === key) || d.steps.find((s) => s.scene_key === key)
  ).map((s) => ({ ...s, duration_sec: Math.min(15, Math.max(0.8, Number(s.duration_sec) || 3)) }));
  return {
    settings: { ...d.settings, ...(api.settings || {}) },
    nav: api.nav?.length ? api.nav : d.nav,
    flavors: api.flavors?.length ? api.flavors : d.flavors,
    stats: api.stats ?? d.stats,
    steps,
  };
}
