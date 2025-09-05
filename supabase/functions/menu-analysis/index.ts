import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.log("Menu analysis function started");

// Define the MenuItem interface
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  prepTime: number;
  rating: number;
  available: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Static menu data (same as in CustomerMenu.tsx)
const staticMenuItems: MenuItem[] = [
  // Breakfast Items
  {
    id: "1",
    name: "Pear & Orange",
    description: "Delicious breakfast with pear and orange flavors",
    price: 25.0,
    image:
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80",
    category: "breakfast",
    prepTime: 20,
    rating: 4.8,
    available: true,
    calories: 320,
    protein: 8,
    carbs: 65,
    fat: 4,
  },
  {
    id: "3",
    name: "Egg & Bread",
    description: "Classic breakfast with farm fresh eggs and artisan bread",
    price: 25.0,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80",
    category: "breakfast",
    prepTime: 10,
    rating: 4.7,
    available: true,
    calories: 420,
    protein: 18,
    carbs: 35,
    fat: 22,
  },
  {
    id: "4",
    name: "Sweet Pancake",
    description: "Fluffy pancakes with maple syrup and fresh berries",
    price: 13.0,
    image:
      "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&q=80",
    category: "breakfast",
    prepTime: 20,
    rating: 4.9,
    available: true,
    calories: 380,
    protein: 12,
    carbs: 58,
    fat: 14,
  },
  {
    id: "9",
    name: "Avocado Toast",
    description:
      "Sourdough toast topped with smashed avocado, cherry tomatoes, and feta",
    price: 16.0,
    image:
      "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&q=80",
    category: "breakfast",
    prepTime: 8,
    rating: 4.6,
    available: true,
    calories: 290,
    protein: 14,
    carbs: 28,
    fat: 18,
  },
  {
    id: "10",
    name: "French Toast",
    description: "Thick-cut brioche French toast with cinnamon and vanilla",
    price: 18.0,
    image:
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80",
    category: "breakfast",
    prepTime: 15,
    rating: 4.8,
    available: true,
    calories: 450,
    protein: 16,
    carbs: 52,
    fat: 20,
  },
  {
    id: "11",
    name: "Breakfast Burrito",
    description:
      "Scrambled eggs, bacon, cheese, and hash browns wrapped in a flour tortilla",
    price: 14.5,
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80",
    category: "breakfast",
    prepTime: 12,
    rating: 4.5,
    available: true,
    calories: 520,
    protein: 24,
    carbs: 42,
    fat: 28,
  },
  // Lunch Items
  {
    id: "2",
    name: "Meat & Mushrooms",
    description: "Savory dish with premium meat and wild mushrooms",
    price: 37.0,
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
    category: "lunch",
    prepTime: 30,
    rating: 5.0,
    available: true,
    calories: 480,
    protein: 35,
    carbs: 12,
    fat: 32,
  },
  {
    id: "5",
    name: "Shrimp Salad",
    description: "Fresh salad with grilled shrimp and citrus dressing",
    price: 22.5,
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
    category: "lunch",
    prepTime: 15,
    rating: 4.6,
    available: true,
    calories: 280,
    protein: 28,
    carbs: 15,
    fat: 12,
  },
  {
    id: "12",
    name: "Grilled Chicken Sandwich",
    description:
      "Juicy grilled chicken breast with lettuce, tomato, and mayo on brioche",
    price: 19.0,
    image:
      "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&q=80",
    category: "lunch",
    prepTime: 18,
    rating: 4.7,
    available: true,
    calories: 420,
    protein: 32,
    carbs: 38,
    fat: 16,
  },
  {
    id: "13",
    name: "Caesar Salad",
    description:
      "Crisp romaine lettuce with parmesan, croutons, and Caesar dressing",
    price: 16.5,
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80",
    category: "lunch",
    prepTime: 10,
    rating: 4.4,
    available: true,
    calories: 220,
    protein: 8,
    carbs: 18,
    fat: 14,
  },
  {
    id: "14",
    name: "Fish Tacos",
    description:
      "Grilled fish with cabbage slaw and chipotle mayo in corn tortillas",
    price: 21.0,
    image:
      "https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400&q=80",
    category: "lunch",
    prepTime: 20,
    rating: 4.8,
    available: true,
    calories: 380,
    protein: 26,
    carbs: 42,
    fat: 14,
  },
  {
    id: "15",
    name: "Beef Burger",
    description:
      "Angus beef patty with cheese, lettuce, tomato, and special sauce",
    price: 24.0,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
    category: "lunch",
    prepTime: 25,
    rating: 4.9,
    available: true,
    calories: 580,
    protein: 36,
    carbs: 45,
    fat: 32,
  },
  {
    id: "16",
    name: "Pasta Carbonara",
    description: "Creamy pasta with bacon, eggs, parmesan, and black pepper",
    price: 26.0,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&q=80",
    category: "lunch",
    prepTime: 22,
    rating: 4.7,
    available: true,
    calories: 520,
    protein: 22,
    carbs: 58,
    fat: 24,
  },
  {
    id: "17",
    name: "Margherita Pizza",
    description: "Classic pizza with fresh mozzarella, tomatoes, and basil",
    price: 28.0,
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
    category: "lunch",
    prepTime: 35,
    rating: 4.6,
    available: true,
    calories: 480,
    protein: 20,
    carbs: 62,
    fat: 18,
  },
  // Dinner Items
  {
    id: "18",
    name: "Grilled Salmon",
    description:
      "Atlantic salmon with lemon herb butter and seasonal vegetables",
    price: 32.0,
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",
    category: "dinner",
    prepTime: 25,
    rating: 4.8,
    available: true,
    calories: 420,
    protein: 38,
    carbs: 8,
    fat: 26,
  },
  {
    id: "19",
    name: "Ribeye Steak",
    description: "12oz ribeye steak with garlic mashed potatoes and asparagus",
    price: 45.0,
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80",
    category: "dinner",
    prepTime: 40,
    rating: 4.9,
    available: true,
    calories: 680,
    protein: 52,
    carbs: 28,
    fat: 42,
  },
  {
    id: "20",
    name: "Lobster Risotto",
    description: "Creamy arborio rice with fresh lobster and white wine",
    price: 38.0,
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&q=80",
    category: "dinner",
    prepTime: 35,
    rating: 4.7,
    available: true,
    calories: 520,
    protein: 28,
    carbs: 58,
    fat: 18,
  },
  {
    id: "21",
    name: "Lamb Chops",
    description:
      "Herb-crusted lamb chops with rosemary jus and roasted vegetables",
    price: 42.0,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    category: "dinner",
    prepTime: 30,
    rating: 4.8,
    available: true,
    calories: 580,
    protein: 42,
    carbs: 18,
    fat: 38,
  },
  // Desserts
  {
    id: "7",
    name: "Chocolate Cake",
    description: "Rich chocolate cake with ganache frosting",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
    category: "dessert",
    prepTime: 10,
    rating: 4.9,
    available: true,
    calories: 380,
    protein: 6,
    carbs: 52,
    fat: 18,
  },
  {
    id: "22",
    name: "Tiramisu",
    description:
      "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
    price: 9.5,
    image:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
    category: "dessert",
    prepTime: 5,
    rating: 4.8,
    available: true,
    calories: 320,
    protein: 8,
    carbs: 38,
    fat: 16,
  },
  {
    id: "23",
    name: "Crème Brûlée",
    description: "Vanilla custard with caramelized sugar crust",
    price: 10.0,
    image:
      "https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=400&q=80",
    category: "dessert",
    prepTime: 8,
    rating: 4.7,
    available: true,
    calories: 280,
    protein: 6,
    carbs: 32,
    fat: 14,
  },
  {
    id: "24",
    name: "Cheesecake",
    description: "New York style cheesecake with berry compote",
    price: 9.0,
    image:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80",
    category: "dessert",
    prepTime: 5,
    rating: 4.6,
    available: true,
    calories: 420,
    protein: 10,
    carbs: 42,
    fat: 24,
  },
  {
    id: "25",
    name: "Ice Cream Sundae",
    description:
      "Vanilla ice cream with chocolate sauce, whipped cream, and cherry",
    price: 7.5,
    image:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80",
    category: "dessert",
    prepTime: 3,
    rating: 4.5,
    available: true,
    calories: 320,
    protein: 6,
    carbs: 48,
    fat: 12,
  },
  // Drinks
  {
    id: "8",
    name: "Fresh Fruit Smoothie",
    description: "Refreshing smoothie with seasonal fruits",
    price: 7.5,
    image:
      "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&q=80",
    category: "drinks",
    prepTime: 5,
    rating: 4.7,
    available: true,
    calories: 180,
    protein: 4,
    carbs: 42,
    fat: 2,
  },
  {
    id: "26",
    name: "Craft Beer",
    description: "Local IPA with citrus and pine notes",
    price: 6.0,
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80",
    category: "drinks",
    prepTime: 2,
    rating: 4.4,
    available: true,
    calories: 180,
    protein: 2,
    carbs: 18,
    fat: 0,
  },
  {
    id: "27",
    name: "House Wine",
    description: "Cabernet Sauvignon from local vineyard",
    price: 8.0,
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80",
    category: "drinks",
    prepTime: 2,
    rating: 4.3,
    available: true,
    calories: 125,
    protein: 0,
    carbs: 4,
    fat: 0,
  },
  {
    id: "28",
    name: "Fresh Orange Juice",
    description: "Freshly squeezed orange juice",
    price: 5.0,
    image:
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80",
    category: "drinks",
    prepTime: 3,
    rating: 4.6,
    available: true,
    calories: 110,
    protein: 2,
    carbs: 26,
    fat: 0,
  },
  {
    id: "29",
    name: "Espresso",
    description: "Rich, bold espresso shot",
    price: 3.5,
    image:
      "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
    category: "drinks",
    prepTime: 2,
    rating: 4.8,
    available: true,
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0,
  },
  {
    id: "30",
    name: "Iced Tea",
    description: "Refreshing iced tea with lemon",
    price: 4.0,
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
    category: "drinks",
    prepTime: 3,
    rating: 4.2,
    available: true,
    calories: 70,
    protein: 0,
    fat: 0,
  },
];

// OpenAI integration for intelligent menu analysis
async function analyzeMenuWithOpenAI(query: string, menuItems: MenuItem[]): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Prepare menu data for OpenAI
  const menuData = menuItems
    .filter(item => item.available)
    .map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      prepTime: item.prepTime,
      rating: item.rating,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    }));

  const systemPrompt = `You are a helpful restaurant AI assistant. You have access to our complete menu with nutritional information. 

Your role is to:
- Answer customer questions about menu items
- Make personalized recommendations based on preferences
- Provide nutritional information when asked
- Help customers find items that match their criteria (price, prep time, dietary needs, etc.)
- Be friendly, helpful, and knowledgeable about the food

Always format your responses with emojis and clear structure. When recommending items, include the name, rating, price, and a brief description.

Here is our current menu:
${JSON.stringify(menuData, null, 2)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not process your request right now.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Sorry, I\'m having trouble processing your request right now. Please try again later.';
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log("Analyzing query with OpenAI:", query);
    
    // Use OpenAI to analyze the query and return response
    const response = await analyzeMenuWithOpenAI(query, staticMenuItems);
    
    return new Response(
      JSON.stringify({ response }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
