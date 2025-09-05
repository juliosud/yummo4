import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Star } from "lucide-react";

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
}

interface AddToCartDialogProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, comments?: string) => void;
}

const AddToCartDialog: React.FC<AddToCartDialogProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [comments, setComments] = useState("");

  const handleAddToCart = () => {
    if (item) {
      onAddToCart(item, comments.trim() || undefined);
      setComments("");
      onClose();
    }
  };

  const handleClose = () => {
    setComments("");
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add to Cart
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <div className="flex gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  ${item.price.toFixed(2)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {item.prepTime}min
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="e.g., Remove mustard, Extra shrimp, No onions..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 text-right">
              {comments.length}/200 characters
            </div>
          </div>

          {/* Common Modifications */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Options</Label>
            <div className="flex flex-wrap gap-2">
              {[
                "No onions",
                "Extra sauce",
                "No spice",
                "Extra cheese",
                "Well done",
                "Medium rare",
                "No pickles",
                "Extra crispy",
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    const currentComments = comments.trim();
                    const newComments = currentComments
                      ? `${currentComments}, ${option}`
                      : option;
                    setComments(newComments);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart} className="flex-1">
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartDialog;
