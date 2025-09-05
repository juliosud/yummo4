import React, { useState } from "react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Store, CheckCircle } from "lucide-react";

interface RestaurantSetupProps {
  onComplete?: () => void;
}

const RestaurantSetup: React.FC<RestaurantSetupProps> = ({ onComplete }) => {
  const { createRestaurant, loading, error } = useRestaurant();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Generate slug from restaurant name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "") // Only allow letters, numbers, and hyphens
      .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen

    setFormData({
      ...formData,
      slug,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await createRestaurant(
        formData.name.trim(),
        formData.slug.trim(),
        formData.description.trim()
      );
      setIsComplete(true);

      // Call onComplete callback after a short delay
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    } catch (err) {
      console.error("Error creating restaurant:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Restaurant Created!
                </h2>
                <p className="text-gray-600 mt-2">
                  Your restaurant "{formData.name}" has been set up
                  successfully.
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Redirecting to your dashboard...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Set Up Your Restaurant
          </CardTitle>
          <CardDescription>
            Create your restaurant profile to get started with managing your
            menu, orders, and tables.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Mario's Italian Bistro"
                value={formData.name}
                onChange={handleNameChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Restaurant URL *</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">swifttable.com/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="marios-italian-bistro"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  required
                  disabled={isSubmitting}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                This will be your restaurant's unique URL. Only letters,
                numbers, and hyphens allowed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your restaurant..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting || !formData.name.trim() || !formData.slug.trim()
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Restaurant...
                </>
              ) : (
                "Create Restaurant"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              You can always update these details later in your restaurant
              settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantSetup;
