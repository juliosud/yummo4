import React, { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import AIInsightsChat from "@/components/AIInsightsChat";

interface ChatDrawerProps {
	triggerBottomOffsetClass?: string; // position of the grab handle above bottom nav
}

const ACTIVATION_ZONE_PX = 80; // bottom area height to start swipe
const OPEN_THRESHOLD_PX = 30; // minimal upward movement to open

const ChatDrawer: React.FC<ChatDrawerProps> = ({
	triggerBottomOffsetClass = "bottom-24",
}) => {
	const [open, setOpen] = useState(false);
	const touchStartYRef = useRef<number | null>(null);
	const touchMovedRef = useRef(false);

	// Global swipe-up from bottom to open behavior
	useEffect(() => {
		const onTouchStart = (e: TouchEvent) => {
			if (open) return; // ignore if already open
			if (!e.touches || e.touches.length === 0) return;
			const y = e.touches[0].clientY;
			const viewportH = window.innerHeight;
			// Only activate if touch begins in the bottom activation zone
			if (y > viewportH - ACTIVATION_ZONE_PX) {
				touchStartYRef.current = y;
				touchMovedRef.current = false;
			}
		};

		const onTouchMove = (e: TouchEvent) => {
			if (open) return;
			if (touchStartYRef.current == null) return;
			const y = e.touches[0]?.clientY ?? null;
			if (y == null) return;
			const dy = y - touchStartYRef.current; // negative if moving up
			if (dy < -OPEN_THRESHOLD_PX) {
				// Significant upward swipe
				touchMovedRef.current = true;
				setOpen(true);
				// prevent accidental click-through on nav
				e.preventDefault();
			}
		};

		const onTouchEnd = () => {
			touchStartYRef.current = null;
			touchMovedRef.current = false;
		};

		window.addEventListener("touchstart", onTouchStart, { passive: true });
		window.addEventListener("touchmove", onTouchMove, { passive: false });
		window.addEventListener("touchend", onTouchEnd, { passive: true });
		return () => {
			window.removeEventListener("touchstart", onTouchStart as any);
			window.removeEventListener("touchmove", onTouchMove as any);
			window.removeEventListener("touchend", onTouchEnd as any);
		};
	}, [open]);

	return (
		<Drawer shouldScaleBackground open={open} onOpenChange={setOpen}>
			{/* Grab handle trigger */}
			<DrawerTrigger asChild>
				<div
					className={`fixed left-0 right-0 ${triggerBottomOffsetClass} z-40 flex justify-center`}
				>
					<div className="h-2 w-24 rounded-full bg-gray-300 shadow-sm cursor-grab active:cursor-grabbing" />
				</div>
			</DrawerTrigger>

			{/* Content set to ~2/3 of viewport height, with a max for very tall screens */}
			<DrawerContent className="rounded-t-3xl border-0 shadow-2xl h-[66vh] max-h-[85vh]">
				<div className="h-full overflow-hidden">
					<AIInsightsChat />
				</div>
			</DrawerContent>
		</Drawer>
	);
};

export default ChatDrawer;
