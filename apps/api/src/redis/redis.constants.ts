/**
 * All Redis key builders and TTL values for MoonLight.
 * Prefix: ml:{module}:{type}:{identifier}
 * Centralizing here prevents key collisions across modules.
 */

// ─── TTL values (seconds) ─────────────────────────────────────────────────────

export const TTL = {
  // Product cache
  PRODUCT_SINGLE:     60 * 30,          // 30 min — individual product page
  PRODUCT_LIST:       60 * 10,          // 10 min — paginated product lists
  PRODUCT_FEATURED:   60 * 60,          // 1 hr  — bestsellers / featured
  PRODUCT_HOMEPAGE:   60 * 60 * 2,      // 2 hr  — homepage data
  PRODUCT_SEARCH:     60 * 5,           // 5 min — search/filter results

  // Session
  ACCESS_TOKEN_BLACKLIST: 60 * 16,      // 16 min — slightly > access token expiry
  REFRESH_TOKEN:          60 * 60 * 24 * 7, // 7 days
  DEVICE_SESSION:         60 * 60 * 24 * 30, // 30 days

  // Cart
  GUEST_CART:    60 * 60 * 24 * 7,     // 7 days
  USER_CART:     60 * 60 * 24 * 30,    // 30 days

  // Inventory
  STOCK_LOCK:    30,                    // 30 sec — distributed lock TTL
  RESERVATION:   60 * 15,              // 15 min — inventory reservation hold

  // Rate limiting
  RATE_LIMIT_WINDOW: 60,               // 1 min sliding window
  RATE_LIMIT_HOUR:   60 * 60,          // 1 hr window for aggressive limits

  // Analytics
  LIVE_USERS:      60 * 5,             // 5 min HyperLogLog window
  TRENDING_WINDOW: 60 * 60 * 24,       // 24 hr trending window

  // AI / Recommendations
  AI_RESPONSE:        60 * 60 * 6,     // 6 hr — AI response cache
  RECOMMENDATION:     60 * 60 * 2,     // 2 hr — product recommendations
  EMBEDDING:          60 * 60 * 24 * 7, // 7 days — vector embeddings
} as const;

// ─── Key builders ─────────────────────────────────────────────────────────────

const P = 'ml'; // root prefix

export const Key = {
  // Products
  product: {
    single:    (slug: string)                    => `${P}:product:single:${slug}`,
    list:      (params: string)                  => `${P}:product:list:${params}`,
    featured:  ()                                => `${P}:product:featured`,
    homepage:  ()                                => `${P}:product:homepage`,
    search:    (query: string)                   => `${P}:product:search:${query}`,
    category:  (cat: string, page: number)       => `${P}:product:cat:${cat}:p${page}`,
    invalidatePattern: ()                        => `${P}:product:*`,
  },

  // Session & Auth
  auth: {
    blacklist:     (jti: string)                 => `${P}:auth:blacklist:${jti}`,
    refresh:       (jti: string)                 => `${P}:auth:refresh:${jti}`,
    userSessions:  (userId: string)              => `${P}:auth:sessions:${userId}`,
    deviceSession: (userId: string, deviceId: string) => `${P}:auth:device:${userId}:${deviceId}`,
  },

  // Cart
  cart: {
    guest: (sessionId: string)   => `${P}:cart:guest:${sessionId}`,
    user:  (userId: string)      => `${P}:cart:user:${userId}`,
  },

  // Inventory
  inventory: {
    stock:       (variantId: string)              => `${P}:inv:stock:${variantId}`,
    lock:        (variantId: string)              => `${P}:inv:lock:${variantId}`,
    reservation: (reservationId: string)          => `${P}:inv:reserve:${reservationId}`,
    userReserve: (userId: string, variantId: string) => `${P}:inv:userreserve:${userId}:${variantId}`,
  },

  // Rate limiting
  rateLimit: {
    auth:     (identifier: string) => `${P}:rl:auth:${identifier}`,
    checkout: (identifier: string) => `${P}:rl:checkout:${identifier}`,
    api:      (identifier: string) => `${P}:rl:api:${identifier}`,
    password: (identifier: string) => `${P}:rl:pwd:${identifier}`,
  },

  // Analytics
  analytics: {
    productViews:  (productId: string)  => `${P}:analytics:views:${productId}`,
    trending:      ()                   => `${P}:analytics:trending`,
    topSearches:   ()                   => `${P}:analytics:searches`,
    liveUsers:     ()                   => `${P}:analytics:live`,
    dailyRevenue:  (date: string)       => `${P}:analytics:revenue:${date}`,
    hourlyOrders:  (hour: string)       => `${P}:analytics:orders:${hour}`,
    categoryViews: (category: string)   => `${P}:analytics:catviews:${category}`,
  },

  // Queue events
  queue: {
    deadLetter: (queue: string) => `${P}:queue:dlq:${queue}`,
  },

  // AI
  ai: {
    response:       (hash: string)      => `${P}:ai:response:${hash}`,
    recommendation: (userId: string)    => `${P}:ai:rec:${userId}`,
    embedding:      (productId: string) => `${P}:ai:embed:${productId}`,
    similarProducts:(productId: string) => `${P}:ai:similar:${productId}`,
  },

  // Realtime / Pub-Sub channels
  channel: {
    orderStatus:    (orderId: string)   => `${P}:channel:order:${orderId}`,
    inventory:      (variantId: string) => `${P}:channel:inv:${variantId}`,
    adminNotify:    ()                  => `${P}:channel:admin`,
    priceChange:    (productId: string) => `${P}:channel:price:${productId}`,
  },
} as const;

// ─── BullMQ queue names ───────────────────────────────────────────────────────

export const QUEUE = {
  EMAIL:          'ml:queue:email',
  ORDER:          'ml:queue:order',
  INVOICE:        'ml:queue:invoice',
  ANALYTICS:      'ml:queue:analytics',
  CART_REMINDER:  'ml:queue:cart-reminder',
  WEBHOOK:        'ml:queue:webhook',
  NOTIFICATION:   'ml:queue:notification',
} as const;

// ─── Rate limit configs ───────────────────────────────────────────────────────

export const RATE_LIMIT = {
  AUTH_LOGIN:       { max: 5,   windowSec: 60  },  // 5 login attempts / min
  AUTH_REGISTER:    { max: 3,   windowSec: 60  },  // 3 registrations / min
  FORGOT_PASSWORD:  { max: 3,   windowSec: 300 },  // 3 resets / 5 min
  CHECKOUT:         { max: 10,  windowSec: 60  },  // 10 checkout attempts / min
  API_DEFAULT:      { max: 100, windowSec: 60  },  // 100 req / min
  SEARCH:           { max: 30,  windowSec: 60  },  // 30 searches / min
} as const;
