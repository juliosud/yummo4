import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, User, MapPin, Phone } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  comments?: string;
}

interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  status: "Ready" | "In Progress" | "Completed" | "Archived";
  total: number;
  timestamp: string;
  dineIn: boolean;
  takeaway: boolean;
  isTerminalOrder?: boolean;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "bg-green-500 text-white";
      case "in progress":
        return "bg-amber-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      case "archived":
        return "bg-slate-400 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: date.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  };

  const { time, date } = formatDate(order.timestamp);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Order Details
            </DialogTitle>
            <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
              {order.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Order #{order.id.slice(-4)}</span>
              <span>•</span>
              <span>{time}</span>
            </div>
            <p className="text-sm text-gray-500">{date}</p>
          </div>

          {/* Customer/Table Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                {order.tableNumber}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {order.isTerminalOrder ? order.customerName : `Table ${order.tableNumber}`}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {order.isTerminalOrder && (
                    <Badge variant="secondary" className="text-xs">
                      Terminal Order
                    </Badge>
                  )}
                  <span className="text-sm text-gray-600">
                    {order.dineIn ? "Dine In" : "Takeaway"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">
                          {item.quantity}x
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {item.comments && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-blue-600 mt-0.5">
                          Note:
                        </span>
                        <span className="text-sm text-blue-700 italic">
                          "{item.comments}"
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Order placed at {time}</span>
              </div>
              {order.isTerminalOrder && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Customer: {order.customerName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Table: {order.tableNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
