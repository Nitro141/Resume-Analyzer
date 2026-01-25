import { motion } from "motion/react";

export function LightPullThemeSwitcher() {
    const toggleDarkMode = () => {
        const root = document.documentElement;
        root.classList.toggle("dark");
    };

    return (
        <div className="relative py-16 p-6 overflow-hidden">
            <motion.div
                drag="y"
                dragDirectionLock
                onDragEnd={(event, info) => {
                    if (info.offset.y > 0) {
                        toggleDarkMode();
                    }
                }}
                dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
                dragTransition={{ bounceStiffness: 500, bounceDamping: 15 }}
                dragElastic={0.075}
                whileDrag={{ cursor: "grabbing" }}
                className="relative bottom-0 w-8 h-8 rounded-full cursor-grab z-20 hover:scale-110 active:scale-90 transition-transform"
            >
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-[9999px] bg-neutral-200 dark:bg-neutral-700 -z-10"></div>

                {/* Sun */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_#facc15,_#fcd34d,_#fef9c3)] shadow-[0_0_20px_8px_rgba(250,204,21,0.5)] dark:hidden"></div>

                {/* Moon */}
                <div className="absolute inset-0 hidden dark:block rounded-full bg-neutral-950 shadow-[inset_-3px_-3px_5px_0px_rgba(255,255,255,0.3)] overflow-hidden">
                    <div className="absolute top-[-2px] left-[2px] w-6 h-6 rounded-full bg-transparent shadow-[inset_6px_2px_0px_0px_#e5e5e5]"></div>
                </div>
            </motion.div>
        </div>
    );
}
