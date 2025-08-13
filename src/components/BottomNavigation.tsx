import React from "react";
import { Home, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface BottomNavigationProps {
	activeTab: "home" | "orders";
	onHomeClick?: () => void;
	onOrdersClick?: () => void;
}

const BottomNavigation = ({
	activeTab = "home",
	onHomeClick = () => {
		// Preserve URL parameters when navigating
		const urlParams = new URLSearchParams(window.location.search);
		const queryString = urlParams.toString();
		window.location.href = `/menu${queryString ? `?${queryString}` : ""}`;
	},
	onOrdersClick = () => {
		// Preserve URL parameters when navigating
		const urlParams = new URLSearchParams(window.location.search);
		const queryString = urlParams.toString();
		window.location.href = `/orders${queryString ? `?${queryString}` : ""}`;
	},
}: BottomNavigationProps) => {
	const { getTotalItems } = useCart();
	const cartItemCount = getTotalItems();
	return (
		<div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 px-4 py-2 pb-safe-bottom">
			<div className="flex items-center justify-center max-w-sm mx-auto">
				<div className="flex items-center justify-between w-full px-6">
					<button
						className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200"
						onClick={onHomeClick}
					>
						<div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg">
							<Home className="w-6 h-6 text-white" />
						</div>
						<span
							className={`text-xs font-semibold transition-colors ${
								activeTab === "home" ? "text-gray-900" : "text-gray-500"
							}`}
						>
							Menu
						</span>
					</button>

					<button
						className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200"
						onClick={onOrdersClick}
					>
						<div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 relative bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg">
							<ShoppingCart className="w-6 h-6 text-white" />
							{/* Notification badge with count for cart items */}
							{cartItemCount > 0 && (
								<div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.5rem] h-6 px-1 flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
									{cartItemCount}
								</div>
							)}
						</div>
						<span
							className={`text-xs font-semibold transition-colors ${
								activeTab === "orders" ? "text-gray-900" : "text-gray-500"
							}`}
						>
							Orders
						</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default BottomNavigation;
