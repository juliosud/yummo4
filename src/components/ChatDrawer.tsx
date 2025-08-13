import React from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import AIInsightsChat from "@/components/AIInsightsChat";

interface ChatDrawerProps {
	triggerBottomOffsetClass?: string; // position of the grab handle above bottom nav
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({
	triggerBottomOffsetClass = "bottom-24",
}) => {
	return (
		<Drawer shouldScaleBackground>
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
