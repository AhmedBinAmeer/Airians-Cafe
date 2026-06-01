import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { MenuItem } from "../models/MenuItem.js";
import { RecessWave } from "../models/RecessWave.js";
import { User } from "../models/User.js";

dotenv.config();

const commonDesiExtras = [
  { name: "Extra raita", price: 40 },
  { name: "Green chutney", price: 25 },
  { name: "Extra salad", price: 30 }
];

const menuItems = [
  {
    name: "Chicken Biryani",
    description: "Aromatic basmati rice with spiced chicken, raita, and fresh salad.",
    category: "Rice & Desi Plates",
    price: 320,
    prepMinutes: 18,
    tags: ["popular", "spicy", "lunch"],
    extras: [...commonDesiExtras, { name: "Extra chicken piece", price: 160 }],
    imageUrl: "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Beef Pulao",
    description: "Campus-style beef yakhni pulao with balanced spices and raita.",
    category: "Rice & Desi Plates",
    price: 360,
    prepMinutes: 20,
    tags: ["desi", "lunch"],
    extras: [...commonDesiExtras, { name: "Extra beef", price: 180 }],
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Chicken Karahi Bowl",
    description: "Boneless chicken karahi served with one naan and salad.",
    category: "Rice & Desi Plates",
    price: 470,
    prepMinutes: 22,
    tags: ["desi", "premium"],
    extras: [{ name: "Extra naan", price: 45 }, { name: "Extra gravy", price: 80 }, ...commonDesiExtras],
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Daal Chawal",
    description: "Comforting lentils over rice with achaar and crispy topping.",
    category: "Rice & Desi Plates",
    price: 220,
    prepMinutes: 10,
    tags: ["budget", "vegetarian"],
    extras: [{ name: "Shami kebab", price: 90 }, { name: "Extra achaar", price: 20 }, ...commonDesiExtras],
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Zinger Burger",
    description: "Crispy chicken fillet with lettuce, mayo, and soft bun.",
    category: "Burgers & Fast Food",
    price: 390,
    prepMinutes: 14,
    tags: ["popular", "recess-fast"],
    extras: [{ name: "Cheese slice", price: 70 }, { name: "Extra patty", price: 230 }, { name: "Masala fries", price: 130 }],
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Anda Shami Burger",
    description: "Classic Pakistani bun kebab with egg, shami, onions, and chutney.",
    category: "Burgers & Fast Food",
    price: 240,
    prepMinutes: 10,
    tags: ["budget", "classic"],
    extras: [{ name: "Extra egg", price: 60 }, { name: "Extra shami", price: 90 }, { name: "Cheese slice", price: 70 }],
    imageUrl: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Chicken Cheese Paratha Roll",
    description: "Grilled paratha roll with chicken, cheese, onions, and mayo garlic.",
    category: "Rolls & Shawarma",
    price: 310,
    prepMinutes: 12,
    tags: ["popular", "recess-fast"],
    extras: [{ name: "Extra cheese", price: 80 }, { name: "Mayo garlic dip", price: 40 }, { name: "Extra chicken", price: 130 }],
    imageUrl: "https://images.unsplash.com/photo-1662116765994-1e4200c43589?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Malai Boti Roll",
    description: "Creamy grilled chicken boti wrapped in paratha with mint chutney.",
    category: "Rolls & Shawarma",
    price: 340,
    prepMinutes: 12,
    tags: ["creamy", "grilled"],
    extras: [{ name: "Extra malai boti", price: 150 }, { name: "Cheese", price: 80 }, { name: "Mint chutney", price: 25 }],
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Chicken Shawarma",
    description: "Soft pita wrap with chicken, pickles, fries, and garlic sauce.",
    category: "Rolls & Shawarma",
    price: 280,
    prepMinutes: 11,
    tags: ["quick", "recess-fast"],
    extras: [{ name: "Extra garlic sauce", price: 35 }, { name: "Extra chicken", price: 120 }, { name: "Cheese", price: 80 }],
    imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Aloo Paratha",
    description: "Stuffed paratha served with yogurt, achaar, and mint chutney.",
    category: "Breakfast",
    price: 180,
    prepMinutes: 12,
    tags: ["vegetarian", "morning"],
    extras: [{ name: "Fried egg", price: 70 }, { name: "Extra yogurt", price: 40 }, { name: "Doodh patti chai", price: 110 }],
    imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Halwa Puri Plate",
    description: "Two puris with channay, aloo tarkari, and suji halwa.",
    category: "Breakfast",
    price: 260,
    prepMinutes: 10,
    tags: ["weekend", "desi"],
    extras: [{ name: "Extra puri", price: 45 }, { name: "Extra channay", price: 70 }, { name: "Extra halwa", price: 60 }],
    imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Club Sandwich",
    description: "Triple-layer chicken, egg, lettuce, and mayo sandwich with fries.",
    category: "Snacks",
    price: 360,
    prepMinutes: 13,
    tags: ["filling", "sharing"],
    extras: [{ name: "Cheese slice", price: 70 }, { name: "Extra fries", price: 120 }, { name: "Coleslaw", price: 60 }],
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Samosa Chaat",
    description: "Crispy samosa topped with channay, yogurt, chutneys, and masala.",
    category: "Snacks",
    price: 190,
    prepMinutes: 8,
    tags: ["spicy", "vegetarian"],
    extras: [{ name: "Extra samosa", price: 70 }, { name: "Extra yogurt", price: 35 }, { name: "Extra chutney", price: 25 }],
    imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Masala Fries",
    description: "Crispy fries tossed with Pakistani masala and served with dip.",
    category: "Snacks",
    price: 180,
    prepMinutes: 7,
    tags: ["quick", "vegetarian"],
    extras: [{ name: "Cheese sauce", price: 80 }, { name: "Mayo garlic", price: 35 }, { name: "Loaded chicken topping", price: 140 }],
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Doodh Patti Chai",
    description: "Strong milk tea brewed the Pakistani way.",
    category: "Chai & Coffee",
    price: 110,
    prepMinutes: 5,
    tags: ["hot", "classic"],
    extras: [{ name: "Elaichi", price: 20 }, { name: "Extra strong", price: 20 }, { name: "No sugar", price: 0 }],
    imageUrl: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Karak Chai",
    description: "Bold tea with a strong simmered flavor for long lecture days.",
    category: "Chai & Coffee",
    price: 130,
    prepMinutes: 5,
    tags: ["hot", "popular"],
    extras: [{ name: "Elaichi", price: 20 }, { name: "Extra strong", price: 20 }, { name: "Gur instead of sugar", price: 25 }],
    imageUrl: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Cold Coffee",
    description: "Chilled blended coffee with milk and a smooth cafe finish.",
    category: "Chai & Coffee",
    price: 260,
    prepMinutes: 7,
    tags: ["cold", "sweet"],
    extras: [{ name: "Chocolate drizzle", price: 50 }, { name: "Extra espresso", price: 90 }, { name: "Vanilla scoop", price: 100 }],
    imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Mint Margarita",
    description: "Fresh mint, lemon, and crushed ice for a quick cool-down.",
    category: "Beverages",
    price: 220,
    prepMinutes: 6,
    tags: ["cold", "fresh"],
    extras: [{ name: "Extra lemon", price: 20 }, { name: "Black salt rim", price: 15 }, { name: "Sprite base", price: 40 }],
    imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Rooh Afza Lemonade",
    description: "A campus favorite with Rooh Afza, lemon, and chilled soda.",
    category: "Beverages",
    price: 200,
    prepMinutes: 5,
    tags: ["cold", "pakistani"],
    extras: [{ name: "Basil seeds", price: 35 }, { name: "Extra lemon", price: 20 }, { name: "Mint", price: 20 }],
    imageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Kheer Cup",
    description: "Creamy rice pudding with nuts and cardamom.",
    category: "Desserts",
    price: 180,
    prepMinutes: 4,
    tags: ["sweet", "desi"],
    extras: [{ name: "Extra nuts", price: 50 }, { name: "Rabri topping", price: 90 }],
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Gulab Jamun",
    description: "Two warm gulab jamuns in syrup.",
    category: "Desserts",
    price: 160,
    prepMinutes: 4,
    tags: ["sweet", "desi"],
    extras: [{ name: "Extra piece", price: 80 }, { name: "Vanilla scoop", price: 100 }],
    imageUrl: "https://images.unsplash.com/photo-1605197183305-6d9ef3c5a45a?auto=format&fit=crop&w=900&q=80"
  }
];

const waves = [
  {
    name: "Breakfast Rush",
    startTime: "10:00",
    endTime: "10:20",
    cutoffTime: "09:45",
    maxItems: 140,
    active: true
  },
  {
    name: "Lunch Break",
    startTime: "13:00",
    endTime: "13:30",
    cutoffTime: "12:45",
    maxItems: 260,
    active: true
  },
  {
    name: "Evening Recess",
    startTime: "16:00",
    endTime: "16:25",
    cutoffTime: "15:45",
    maxItems: 180,
    active: true
  }
];

async function seed() {
  await connectDB();

  await MenuItem.deleteMany({});
  await RecessWave.deleteMany({});

  await MenuItem.insertMany(menuItems);
  await RecessWave.insertMany(waves);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@airianscafe.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = new User({
      name: process.env.ADMIN_NAME || "Airian Admin",
      email: adminEmail,
      phone: "03000000000",
      role: "admin",
      isVerified: true
    });
  }

  admin.role = "admin";
  admin.isVerified = true;
  await admin.setPassword(adminPassword);
  await admin.save();

  console.log(`Seeded ${menuItems.length} menu items, ${waves.length} waves, and admin ${adminEmail}`);
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
