import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  createRestaurant: (name: string, slug: string, description?: string) => Promise<void>;
  updateRestaurant: (updates: Partial<Restaurant>) => Promise<void>;
  refreshRestaurant: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
};

export const RestaurantProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user's restaurant
  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🏪 RestaurantContext: Fetching restaurant data...");

      const { data, error: fetchError } = await supabase.rpc('get_current_restaurant');

      if (fetchError) {
        console.error("Error fetching restaurant:", fetchError);
        setError(fetchError.message);
        setRestaurant(null);
        return;
      }

      if (data && data.length > 0) {
        setRestaurant(data[0]);
        console.log("✅ RestaurantContext: Restaurant data loaded:", data[0]);
      } else {
        console.log("ℹ️ RestaurantContext: No restaurant found for user");
        setRestaurant(null);
      }
    } catch (err) {
      console.error("Error fetching restaurant:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  // Create a new restaurant for the current user
  const createRestaurant = async (name: string, slug: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("🏪 RestaurantContext: Creating restaurant:", { name, slug, description });

      const { data, error: createError } = await supabase.rpc('create_restaurant_for_user', {
        p_restaurant_name: name,
        p_restaurant_slug: slug,
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (createError) {
        console.error("Error creating restaurant:", createError);
        setError(createError.message);
        throw createError;
      }

      console.log("✅ RestaurantContext: Restaurant created successfully");

      // Refresh restaurant data
      await fetchRestaurant();
    } catch (err) {
      console.error("Error creating restaurant:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update restaurant information
  const updateRestaurant = async (updates: Partial<Restaurant>) => {
    if (!restaurant) {
      throw new Error("No restaurant to update");
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🏪 RestaurantContext: Updating restaurant:", updates);

      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', restaurant.id);

      if (updateError) {
        console.error("Error updating restaurant:", updateError);
        setError(updateError.message);
        throw updateError;
      }

      console.log("✅ RestaurantContext: Restaurant updated successfully");

      // Refresh restaurant data
      await fetchRestaurant();
    } catch (err) {
      console.error("Error updating restaurant:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh restaurant data
  const refreshRestaurant = async () => {
    await fetchRestaurant();
  };

  // Fetch restaurant data on mount
  useEffect(() => {
    fetchRestaurant();
  }, []);

  const value: RestaurantContextType = {
    restaurant,
    loading,
    error,
    createRestaurant,
    updateRestaurant,
    refreshRestaurant,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};
