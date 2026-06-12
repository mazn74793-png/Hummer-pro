import { MenuItem } from './types';
import heroImage from './assets/images/hummer_hero_banner_1780836656832.png';
import friedChickenImage from './assets/images/menu_fried_chicken_1780836678062.png';
import crepeImage from './assets/images/menu_crepe_1780836694487.png';
import pizzaImage from './assets/images/menu_pizza_1781266068227.jpg';

// Let's use the actual generated paths via bundler imports
export const IMAGES = {
  hero: heroImage,
  friedChicken: friedChickenImage,
  crepe: crepeImage,
  pizza: pizzaImage
};

export const MENU_ITEMS: MenuItem[] = [
  // --- CREPES CATEGORY ---
  {
    id: 'k-1',
    nameAr: 'كريب سوبر هامر الجبار',
    nameEn: 'Super Hummer Mighty Crepe',
    descriptionAr: 'قنبلة هامر! كريب عملاق محشو بقطع الدجاج الكريسبي المقرمشة، ميكس جريل، فراخ بانيه، ميكس جبن موزاريلا وشيدر غرقانة بصوص هامر السري.',
    descriptionEn: 'The Hummer Special! Packed to the brim with crispy chicken chunks, pane, mix of cheddar and mozzarella cheese, smothered in our secret Hummer sauce.',
    price: 135,
    image: IMAGES.crepe,
    category: 'crepes',
    spicyOption: true,
    tags: ['الأكثر طلباً', 'توقيع هامر'],
    sizes: [
      { id: 'sz-k1', nameAr: 'هامر عادي', nameEn: 'Regular', extraPrice: 0 },
      { id: 'sz-k2', nameAr: 'هامر وحش (عملاق)', nameEn: 'Monster Size', extraPrice: 40 }
    ]
  },
  {
    id: 'k-2',
    nameAr: 'كريب زنجر سبايسي نار',
    nameEn: 'Spicy Zinger Fire Crepe',
    descriptionAr: 'لعشاق المشطشط! صدور دجاج زنجر حارة كريسبي، بطاطس مقرمشة، فلفل هالبينو، ميكس جبن وصوص الشطة الحارة النارية.',
    descriptionEn: 'For hot-heads! Spicy zinger crispy breast chunks, golden fries, crunchy jalapenos, mixed cheese, and fiery hot sauce.',
    price: 115,
    image: IMAGES.crepe,
    category: 'crepes',
    spicyOption: true,
    tags: ['سبايسي نار']
  },
  {
    id: 'k-3',
    nameAr: 'كريب شيش طاووق مميز',
    nameEn: 'Premium Shish Tawook Crepe',
    descriptionAr: 'شيش طاووق مشوي على الجريل بتتبيلة هامر التركية، فلفل ألوان، زيتون أسود، موزاريلا وصوص الثومية الفاخر.',
    descriptionEn: 'Flame-grilled marinated Shish Tawook chunks, bell peppers, black olives, mozzarella, and dynamic garlic premium sauce.',
    price: 125,
    image: IMAGES.crepe,
    category: 'crepes',
    tags: ['دجاج مشوي']
  },
  {
    id: 'k-4',
    nameAr: 'كريب الكومبو الثلاثي',
    nameEn: 'Triple Blend Crepe',
    descriptionAr: 'مزيج مذهل من دجاج كريسبي، دجاج بانيه، ميكس لحوم مدخنة، مع جبل من جبنة الموزاريلا وصوص باربكيو ورانش دبل.',
    descriptionEn: 'Fabulous blend of crispy chicken, pane, smoked turkey, piled with mountains of mozzarella, BBQ, and creamy ranch.',
    price: 130,
    image: IMAGES.crepe,
    category: 'crepes',
    tags: ['جديد']
  },
  {
    id: 'k-5',
    nameAr: 'كريب ميكس جبن شلال',
    nameEn: 'Avalanche Mix Cheese Crepe',
    descriptionAr: 'شلال من الموزاريلا الفاخرة، الجبنة الرومي المصرية القديمة، والجبنة الشيدر السايحة، مع شرائح زيتون وصوص رانش.',
    descriptionEn: 'An avalanche of premium mozzarella, classic Egyptian Roumy cheese, and melted cheddar, with black olives and fresh ranch.',
    price: 95,
    image: IMAGES.crepe,
    category: 'crepes',
    tags: ['مناسب للنباتيين']
  },
  {
    id: 'k-6',
    nameAr: 'كريب نوتيلا بالموز والمكسرات',
    nameEn: 'Sweet Nutella & Banana Crepe',
    descriptionAr: 'كريب حلو غرقان شوكولاتة نوتيلا أصلية، شرائح موز طازجة، صوص كراميل، رشة بندق مطحون وبسكويت دايجستف مقرمش.',
    descriptionEn: 'Sweet hot crepe loaded with genuine Nutella spread, fresh banana slices, caramel drizzle, crushed hazelnuts, and crunchy digestive biscuit crumbs.',
    price: 85,
    image: IMAGES.crepe,
    category: 'crepes',
    tags: ['كريب حلو', 'لعشاق التحلية']
  },

  // --- FRIED CHICKEN CATEGORY ---
  {
    id: 'fc-1',
    nameAr: 'وجبة هامر الفردية الكلاسيكية',
    nameEn: 'Hummer Solo Classic Meal',
    descriptionAr: '3 قطع من الدجاج المقلي المقرمش الذهبي بتتبيلة هامر السرية المتبلة لمدة ٢٤ ساعة، بطاطس كولوسال، كول سلو غني، كيزر طازج، وصوص ثوم مميز.',
    descriptionEn: '3 pieces of crunchy, deep-fried chicken marinated for 24h, giant fries, creamy coleslaw, fresh bun, and our signature dip.',
    price: 165,
    image: IMAGES.friedChicken,
    category: 'fried-chicken',
    spicyOption: true,
    tags: ['الأكثر مبيعاً'],
    sizes: [
      { id: 'sz-fc1', nameAr: '٣ قطع دجاج', nameEn: '3 Pieces', extraPrice: 0 },
      { id: 'sz-fc2', nameAr: '٤ قطع دجاج + كوكاكولا', nameEn: '4 Pieces + Drink', extraPrice: 50 }
    ]
  },
  {
    id: 'fc-2',
    nameAr: 'دلو هامر العائلي (توفير اللمة)',
    nameEn: 'Hummer Save-Big Family Bucket',
    descriptionAr: '9 قطع دجاج كريسبي وجميل (توازن رائع من الفخذ والصدور والدبابيس)، بطاطس حجم عائلي، طبق كول سلو كبير، ٣ كيزر، و ٣ صوصات مجانية من اختيارك.',
    descriptionEn: '9 super crispy chicken pieces, massive bucket of golden fries, large coleslaw bowl, 3 fresh buns, and 3 complimentary dips.',
    price: 430,
    image: IMAGES.friedChicken,
    category: 'fried-chicken',
    spicyOption: true,
    tags: ['توفير كبير']
  },
  {
    id: 'fc-3',
    nameAr: 'وجبة سوبر كريسبي ستربس مقرمشة',
    nameEn: 'Super Crispy Strips Feast',
    descriptionAr: '5 قطع من صدور الفراخ الاستربس المقرمشة بالبقسماط الخشن، بطاطس محمرة، كول سلو كريمي ولذيذ، ٢ كيزر وصوص الديناميت الخاص.',
    descriptionEn: '5 premium thick chicken breast tenders breaded in double crunch flakes, dynamic fries, sweet coleslaw, 2 buns, and Dynamite sauce.',
    price: 155,
    image: IMAGES.friedChicken,
    category: 'fried-chicken',
    spicyOption: true,
    tags: ['خالية من العظم']
  },
  {
    id: 'fc-4',
    nameAr: 'صندوق اللمة الخارقة - هامر بوكس',
    nameEn: 'The Ultimate Hummer Mega Bucket',
    descriptionAr: '15 قطعة كاملة من الفراخ المقلية العظيمة كريسبي على أصوات القرمشة العالية، بطاطس عائلية عملاقة، علبة كول سلو جامبو، ٥ كيزر ولتر كونت الكوكاكولا الباردة.',
    descriptionEn: '15 delicious pieces of fried chicken cooked to gold perfection, mega family fries, jumbo coleslaw, 5 fresh buns, and a 1-liter cold Pepsi bottle.',
    price: 660,
    image: IMAGES.friedChicken,
    category: 'fried-chicken',
    spicyOption: true,
    tags: ['وليمة الحفلات']
  },

  // --- COMBOS & DEALS ---
  {
    id: 'cb-1',
    nameAr: 'عرض الملوك - كريب + فرخة',
    nameEn: 'The Kings Combo - Crepe & Chicken',
    descriptionAr: 'توفير الملوك! كريب زنجر كريسبي حادق مع قطعة فراخ كريسبي مقرمشة دبابيس، بطاطس متوسطة، بيبسي منعش دايت أو عادي، ومكس صوص ثومية وكيزر.',
    descriptionEn: 'The best of both worlds! 1 Spicy Zinger Crepe + 1 golden chicken drumstick + medium golden fries + 1 Pepsi can + sauce.',
    price: 215,
    image: IMAGES.hero,
    category: 'combos',
    spicyOption: true,
    tags: ['عرض ناري 60%', 'توفير الملوك']
  },
  {
    id: 'cb-2',
    nameAr: 'عرض الثنائي الشقي - كريبين وبطاطس',
    nameEn: 'Fiery Duo Crepes Pack',
    descriptionAr: 'كريب كريسبي دجاج عادي + كريب زنجر سبايسي حار + بطاطس حجم عائلي غرقانة جبنة شيدر سايحة + زجاجة لتر كوكاكولا باردة.',
    descriptionEn: 'Double delight! 1 Regular Crispy Chicken Crepe + 1 Spicy Zinger Crepe + family fries with melted cheddar cheese pool + 1-liter Pepsi.',
    price: 245,
    image: IMAGES.hero,
    category: 'combos',
    tags: ['عرض الصحاب']
  },

  // --- SIDES ---
  {
    id: 'sd-1',
    nameAr: 'بطاطس هامر الموتزاريلا والبيكون',
    nameEn: 'Loaded Hummer Cheese & Bacon Fries',
    descriptionAr: 'طبق بطاطس مقلية ذهبية وسميكة، مغطاه بشيدر سايح دافئ، رشة جبنة موتزاريلا سايحة، وقطع اللحم البقري المقدد (بيكون) المدخنة الفاخرة.',
    descriptionEn: 'Loaded premium french fries dynamic, topped with hot liquid cheddar reservoir, stringy mozzarella cheese pull, and smoked beef bacon bits.',
    price: 65,
    image: IMAGES.friedChicken,
    category: 'sides',
    tags: ['مقرمش وحادق']
  },
  {
    id: 'sd-2',
    nameAr: 'سلطة كول سلو هامر الكريمية',
    nameEn: 'Hummer Signature Sweet Coleslaw',
    descriptionAr: 'كرنب وجزر مبشورين طازة بخلطة مايونيز هامر الكريمية الشهيرة بالعسل والليمون الخفيف.',
    descriptionEn: 'Finely grated fresh cabbage and carrots tossed in our signature creamy sweet dressing with natural honey hint.',
    price: 35,
    image: IMAGES.friedChicken,
    category: 'sides'
  },
  {
    id: 'sd-3',
    nameAr: 'أصابع موتزاريلا القرمشة الذهبية',
    nameEn: 'Super Stretchy Mozzarella Sticks (4 Pcs)',
    descriptionAr: '٤ أصابع جبنة موتزاريلا متبلة ومغطاة بفتات الخبز، مقلية حتى تصبح هشة ومطاطية جداً، تقدم مع صوص باربكيو مجاناً.',
    descriptionEn: '4 sticks of seasoned mozzarella cheese breaded and deep-fried till extreme elasticity, served with smoky BBQ dipping sauce.',
    price: 55,
    image: IMAGES.crepe,
    category: 'sides'
  },

  // --- DRINKS ---
  {
    id: 'dr-1',
    nameAr: 'علبة بيبسي مثلجة حارقة للحرارة',
    nameEn: 'Ice-Cold Pepsi Can',
    descriptionAr: 'مشروب غازي بيبسي مثلج ومحكم ليرطب على قلبك بعد الأكل السبايسي.',
    descriptionEn: 'Chilling 330ml can of bubbly Pepsi to quench the fire after delicious spicy meals.',
    price: 20,
    image: IMAGES.hero,
    category: 'drinks'
  },
  {
    id: 'dr-2',
    nameAr: 'علبة ميراندا برتقال منعشة',
    nameEn: 'Mirinda Orange Can',
    descriptionAr: 'مذاق البرتقال اللذيذ الفوار والمنعش مع وجبة هامر المقرمشة.',
    descriptionEn: 'Zesty sparkling orange fizzy Mirinda can to light up your meal experience.',
    price: 20,
    image: IMAGES.hero,
    category: 'drinks'
  },
  {
    id: 'dr-3',
    nameAr: 'مياه معدنية طبيعية نقية',
    nameEn: 'Fresh Mineral Water',
    descriptionAr: 'زجاجة مياه معدنية طبيعية نقية مبردة.',
    descriptionEn: 'Chilled bottle of pure natural spring water.',
    price: 12,
    image: IMAGES.hero,
    category: 'drinks'
  },
  // --- PIZZAS CATEGORY ---
  {
    id: 'pz-1',
    nameAr: 'بيتزا سوبر هامر الإيطالية',
    nameEn: 'Super Hummer Italian Pizza',
    descriptionAr: 'تحفة البيتزا بصوص البومودورو الإيطالي، مغطاة بستريبس الدجاج المقرمش، سلامي بقري، قطع بصل وفلفل، وشلال جبنة موزاريلا سايحة.',
    descriptionEn: 'The absolute masterpiece with Italian pomodoro sauce, crispy chicken strips, beef salami, bell peppers, onions, and an avalanche of melted mozzarella.',
    price: 140,
    image: IMAGES.pizza,
    category: 'pizza',
    tags: ['الأكثر مبيعاً', 'بيتزا هامر عائلية'],
    sizes: [
      { id: 'sz-pz1', nameAr: 'وسط (٢٨ سم)', nameEn: 'Medium (28cm)', extraPrice: 0 },
      { id: 'sz-pz2', nameAr: 'عائلية كبيرة (٣٢ سم)', nameEn: 'Jumbo Large (32cm)', extraPrice: 40 }
    ]
  },
  {
    id: 'pz-2',
    nameAr: 'بيتزا ميكس رانش الدجاج',
    nameEn: 'Chicken Ranch Pizza',
    descriptionAr: 'مزيج فاخر من الدجاج الكريسبي وشرائح الرومي المدخن والفطر، مغطاة بصوص الرانش الغني والجبنة الموزاريلا الوفيرة.',
    descriptionEn: 'A luxury mix of crispy chicken chunks, smoked turkey slices, and mushrooms, topped with ultimate creamy ranch sauce, and rich mozzarella.',
    price: 150,
    image: IMAGES.pizza,
    category: 'pizza',
    tags: ['دبل تشيز'],
    sizes: [
      { id: 'sz-pz3', nameAr: 'وسط (٢٨ سم)', nameEn: 'Medium (28cm)', extraPrice: 0 },
      { id: 'sz-pz4', nameAr: 'عائلية كبيرة (٣٢ سم)', nameEn: 'Jumbo Large (32cm)', extraPrice: 45 }
    ]
  },
  {
    id: 'pz-3',
    nameAr: 'بيتزا ملوك الجبن الفاخرة',
    nameEn: 'Mellok Cheese Ultimate Pizza',
    descriptionAr: 'لعشاق الغرق في الجبن! مزيج غني وموزون من الجبنة الموزاريلا، الشيدر السايحة، الجبنة الرومي المصريه الأصيلة، ولمسة ريكفورد فرنسي.',
    descriptionEn: 'For cheese fanatics! A perfectly balanced blend of premium mozzarella, cheddar, classic Egyptian Roumy, and bold French blue Roquefort crumbs.',
    price: 130,
    image: IMAGES.pizza,
    category: 'pizza',
    tags: ['مناسب للنباتيين']
  }
];

// Options for Crepe Dynamic Customizer
export const CUSTOMIZE_INGREDIENTS = {
  bases: [
    { id: 'cb-savory', nameAr: 'كريب حادق لقمة مقرمشة', nameEn: 'Crispy Savory Bread Base', price: 45 },
    { id: 'cb-sweet', nameAr: 'كريب حلو خفيف', nameEn: 'Sweet Golden Crepe Base', price: 50 },
  ],
  fillings: [
    { id: 'f-crispy', nameAr: 'قطع دجاج كريسبي مقرمشة', nameEn: 'Crispy Chicken Pieces', price: 40 },
    { id: 'f-zinger', nameAr: 'قطع دجاج زنجر ناري', nameEn: 'Spicy Zinger Chicken Shreds', price: 40 },
    { id: 'f-shish', nameAr: 'شيش طاووق على الجريل', nameEn: 'Grilled Shish Tawook Chunks', price: 45 },
    { id: 'f-pane', nameAr: 'شرائح بانيه مصرية أصلية', nameEn: 'Classic Sliced Pane strips', price: 35 },
    { id: 'f-beef', nameAr: 'برجر لحم بلدي مشوي قطع', nameEn: 'Charcoal Grilled Beef Burger Cubes', price: 50 },
    { id: 'f-mixcheese', nameAr: 'مزيج الأجبان الثلاثة سايح', nameEn: 'Melted Triple Cheese Blend', price: 30 },
    { id: 'f-nutella', nameAr: 'شوكولاتة نوتيلا أصلية دبل', nameEn: 'Double Original Nutella Spread', price: 35 },
    { id: 'f-lotus', nameAr: 'شوكولاتة وزبدة اللوتس الذهبية', nameEn: 'Golden Biscoff Lotus Spread', price: 40 }
  ],
  toppings: [
    { id: 't-mozzarella', nameAr: 'جبنة موزاريلا إضافية زيادة', nameEn: 'Extra Stringy Mozzarella', price: 18 },
    { id: 't-bacon', nameAr: 'شرائح بيكون بقري مدخن ممتاز', nameEn: 'Premium Smoked Beef Bacon', price: 25 },
    { id: 't-jalapeno', nameAr: 'قطع فلفل هالبينو تولع الطلب', nameEn: 'Sizzling Jalapeno Peppers', price: 12 },
    { id: 't-salad', nameAr: 'ميكس فلفل ألوان وزيتون أسود', nameEn: 'Mix Bell Peppers & Black Olives', price: 10 },
    { id: 't-mushroom', nameAr: 'قطع فطر وعيش الغراب طبيعي', nameEn: 'Sautéed Sliced Mushrooms', price: 20 },
    { id: 't-banana', nameAr: 'حلقات موز طازجة (للحلو)', nameEn: 'Fresh Banana Rondelles (Sweet)', price: 15 }
  ],
  sauces: [
    { id: 's-hummer', nameAr: 'صوص هامر السري الأقوى', nameEn: 'Hummer Original Secret Sauce', price: 12 },
    { id: 's-cheddar', nameAr: 'صوص جبن شيدر سايح ساخن', nameEn: 'Gooey Warm Cheddar Cheese Dip', price: 12 },
    { id: 's-ranch', nameAr: 'صوص رانش أمريكي كريمي', nameEn: 'Creamy Buttermilk Ranch Sauce', price: 10 },
    { id: 's-bbq', nameAr: 'صوص باربكيو مدخن غامق', nameEn: 'Smoky Dark Barbecue Glaze', price: 8 },
    { id: 's-garlic', nameAr: 'صوص ثومية سورية أصلية تقيلة', nameEn: 'Original Thick Syrian Garlic Whip', price: 10 },
    { id: 's-ketchup', nameAr: 'صوص كاتشب ومايونيز كلاسيك', nameEn: 'Classic Ketchup-Mayonnaise Mix', price: 6 },
    { id: 's-caramel', nameAr: 'صوص كراميل غني وحلو كاندي', nameEn: 'Rich Butterscotch Caramel Drizzle', price: 10 }
  ]
};

// Fun pre-written reviews for social proof with Egyptian dialect accents
export const SAMPLE_REVIEWS = [
  {
    id: 'r-1',
    name: 'أحمد أشرف البطل',
    rating: 5,
    comment: 'بصراحة كريب سوبر هامر الجبار ده حكاية تانية خالص! الكريب مقرمش والحشو مليان للاخر وفراخ نظيفة جداً ومستوية صح جداً. والتوصيل كان أسرع من المتوقع. هامر هيكتسح السوق!',
    date: 'منذ ساعتين',
    badge: 'ملك المقرمشات'
  },
  {
    id: 'r-2',
    name: 'مي صلاح',
    rating: 5,
    comment: 'أحلى حاجة إنهم عاملين الكريب الحلو بتاعي مظبوط ومش مسكر أوي يجزع النفس، جربت برضه الكول سلو وحق ربنا دي أحلى كول سلو أكلتها برة البيت. الفراخ الاستربس مقرمشتها فظيعة!',
    date: 'منذ يوم',
    badge: 'عاشق الكريبات'
  },
  {
    id: 'r-3',
    name: 'هاني العبد',
    rating: 4,
    comment: 'الدلو الـ 9 قطع بيكفي العيلة كلها وبيفيض وبطاطسهم بتبقى سخنة ومقرمشة عكس محلات تانية كتير بتجيلك طرية. تتبيلة الفراخ خطيرة ومكتومة بالبهارات المحبوكة. عاش يا شباب.',
    date: 'منذ يومين',
    badge: 'هامر الأكيل'
  },
  {
    id: 'r-4',
    name: 'كريم التوني',
    rating: 5,
    comment: 'أنا طلبت كريب كاستم عملته بنفسي من صانع الكريبات عالموقع هنا وعجبني أوي اختيار الصوص السري مع الموزاريلا الزيادة. الخدمة ممتازة والموقع سهل جداً في الطلب.',
    date: 'منذ 3 أيام',
    badge: 'زبون دائم'
  }
];

// Store branches information
export const HUMMER_BRANCHES = [
  {
    id: 'b-1',
    nameAr: 'فرع قباء (الرئيسي)',
    nameEn: 'Quba Branch (Main)',
    addressAr: '55 شارع ابراهيم الخليل، مدينة قباء، جسر السويس، قباء',
    addressEn: '55 Ibrahim Al-Khalil St, Quba City, Gesr Al-Suez, Quba',
    phone: '01023456789',
    deliveryHotline: '19033',
    hoursAr: '١١:٠٠ صباحاً - ٤:٠٠ فجراً',
    hoursEn: '11:00 AM - 04:00 AM'
  }
];
