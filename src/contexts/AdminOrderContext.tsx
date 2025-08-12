import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "archived";
  orderTime: Date;
  tableNumber: string;
  sessionCode?: string;
  estimatedMinutes?: number;
}

interface AdminOrderContextType {
  orders: Order[];
  loading: boolean;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"],
  ) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const AdminOrderContext = createContext<AdminOrderContextType | undefined>(undefined);

export const useAdminOrders = () => {
  const context = useContext(AdminOrderContext);
  if (context === undefined) {
    throw new Error("useAdminOrders must be used within an AdminOrderProvider");
  }
  return context;
};

export const AdminOrderProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert database order to context order format
  const convertDBOrderToOrder = (dbOrder: any): Order => {
    const items: OrderItem[] =
      dbOrder.order_items?.map((item: any) => ({
        id: item.menu_item_id,
        name: item.item_name || item.menu_item?.name || "Unknown Item",
        price: item.price,
        quantity: item.quantity,
        image:
          item.menu_item?.image ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      })) || [];

    return {
      id: dbOrder.id,
      items,
      total: dbOrder.total,
      status: dbOrder.status,
      orderTime: new Date(dbOrder.created_at),
      tableNumber: dbOrder.table_number,
      sessionCode: dbOrder.session_code,
      estimatedMinutes: dbOrder.estimated_minutes,
    };
  };

  // Fetch ALL orders from database (no filtering by table or session)
  const fetchOrders = async () => {
    try {
      setLoading(true);

      console.log("📊 AdminOrderContext: Fetching ALL orders from database...");

      // Build query to get ALL orders (no table/session filtering)
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price,
            item_name,
            menu_item:menu_items (
              id,
              name,
              image
            )
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        return;
      }

      console.log(
        `✅ AdminOrderContext: Successfully fetched ${data?.length || 0} orders from database`,
      );
      
      const convertedOrders = data?.map(convertDBOrderToOrder) || [];
      setOrders(convertedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Update order status in database
  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
  ) => {
    try {
      console.log(`🔄 AdminOrderContext: Updating order ${orderId} status to ${status}`);

      // Optimistic update - update UI immediately
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );

      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) {
        console.error("❌ Error updating order status:", error);
        // Revert optimistic update on error
        await fetchOrders();
        throw error;
      }

      console.log("✅ Order status updated successfully in database");
    } catch (error) {
      console.error("❌ Error updating order status:", error);
      throw error;
    }
  };

  // Refresh orders
  const refreshOrders = async () => {
    await fetchOrders();
  };

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Set up real-time subscription for ALL orders
  useEffect(() => {
    console.log("🔔 AdminOrderContext: Setting up real-time subscription for ALL orders");

    const subscription = supabase
      .channel("admin_orders_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("🔔 Real-time order update received:", payload);
          fetchOrders();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        (payload) => {
          console.log("🔔 Real-time order items update received:", payload);
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      console.log("🔕 AdminOrderContext: Unsubscribing from real-time updates");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AdminOrderContext.Provider
      value={{
        orders,
        loading,
        updateOrderStatus,
        refreshOrders,
      }}
    >
      {children}
    </AdminOrderContext.Provider>
  );
};
