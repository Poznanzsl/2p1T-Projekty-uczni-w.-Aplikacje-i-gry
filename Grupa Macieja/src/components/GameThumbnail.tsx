"use client";

import Image from "next/image";
import type React from "react";

interface Game {
    id: number;
    title: string;
    thumbnailUrl: string;
}

interface GameThumbnailProps {
    game: Game;
    animationDelay: string; // Pass delay as a string like "0.1s", "0.2s", etc.
}

const GameThumbnail: React.FC<GameThumbnailProps> = ({
    game,
    animationDelay,
}) => {
    return (
        <div
            className="group relative hover:z-50 cursor-pointer overflow-visible
                 opacity-0 animate-fade-in-up" // Base styles + entry animation class
            style={{ animationDelay }} // Apply staggered delay
        >
            {/* Container for image and clipping the title bar */}
            <div
                className="relative shadow-md
                   transition-all duration-400 transform group-hover:-translate-y-12 ease-in-out
                   group-hover:scale-105 group-hover:shadow-xl group-hover:z-10 rounded-xl group-hover:rounded-b-none" // Scaling and shadow on hover
            >
                <Image
                    src={game.thumbnailUrl}
                    alt={game.title} // Good practice to add alt text
                    // Consider adding width/height if you know the dimensions for better layout stability
                    width={600}
                    height={400}
                    className="relative block w-full aspect-[4/3] object-cover z-30 rounded-t-lg transition-all duration-400 rounded-xl group-hover:rounded-b-none" // Added rounded-t-lg
                />

                {/* Title Bar - Initially hidden below */}
                <div className="bg-card border border-border border-t-0 absolute overflow-hidden bottom-0 left-0 right-0 flex items-center rounded-b-xl opacity-0 group-hover:opacity-100 backdrop-blur-3xl blur-xl group-hover:blur-none h-14 px-2 z-20 transition-all duration-400 transform -rotate-x-90 group-hover:translate-y-full group-hover:rotate-x-0">
                    <h3 className="text-foreground text-base font-semibold truncate">
                        {/* Added text-white and mix-blend for better contrast on varying gradients */}
                        {game.title}
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default GameThumbnail;
