"use client";

import { StarIcon } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState, useTransition } from "react";

interface Game {
  id: string;
  favourite: boolean;
  title: string;
  thumbnailUrl: string;
  link?: string;
}

interface GameThumbnailProps {
  game: Game;
  animationDelay: string; // Pass delay as a string like "0.1s", "0.2s", etc.
  onFavouriteChange?: (gameId: string, isFavourited: boolean) => void; // Optional callback for parent updates
  loggedIn: boolean;
}

const GameThumbnail: React.FC<GameThumbnailProps> = ({
  game,
  animationDelay,
  onFavouriteChange,
  loggedIn,
}) => {
  const [isFavourited, setIsFavourited] = useState(game.favourite);
  const [isPending, startTransition] = useTransition();

  const toggleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newFavouriteState = !isFavourited;

    // Optimistic update
    setIsFavourited(newFavouriteState);

    startTransition(async () => {
      try {
        // First, get current favourites
        const getFavouritesResponse = await fetch("/api/favourites");

        if (!getFavouritesResponse.ok) {
          throw new Error("Failed to fetch current favourites");
        }

        const { favourites: currentFavourites } =
          await getFavouritesResponse.json();

        // Update the favourites array
        let updatedFavourites: string[];

        if (newFavouriteState) {
          // Add to favourites if not already present
          updatedFavourites = currentFavourites.includes(game.id)
            ? currentFavourites
            : [...currentFavourites, game.id];
        } else {
          // Remove from favourites
          updatedFavourites = currentFavourites.filter(
            (id: string) => id !== game.id
          );
        }

        // Update favourites on server
        const updateResponse = await fetch("/api/favourites", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            favourites: updatedFavourites,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update favourites");
        }

        // Notify parent component if callback provided
        onFavouriteChange?.(game.id, newFavouriteState);
      } catch (error) {
        console.error("Error toggling favourite:", error);
        // Revert optimistic update on error
        setIsFavourited(!newFavouriteState);

        // You might want to show a toast notification here
        alert("Failed to update favourite. Please try again.");
      }
    });
  };

  const handleGameClick = () => {
    // Navigate to game or handle game selection
    if (game.link) {
      window.open(game.link, "_blank");
    }
  };

  return (
    <div
      className="group relative hover:z-50 cursor-pointer overflow-visible
                 opacity-0 animate-fade-in-up" // Base styles + entry animation class
      style={{ animationDelay }} // Apply staggered delay
      onClick={handleGameClick}
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
        <div className="bg-card border border-border border-t-0 absolute overflow-hidden bottom-0 left-0 right-0 flex items-center justify-between rounded-b-xl opacity-0 group-hover:opacity-100 backdrop-blur-3xl blur-xl group-hover:blur-none h-14 px-2 z-20 transition-all duration-400 transform -rotate-x-90 group-hover:translate-y-full group-hover:rotate-x-0">
          <h3 className="text-foreground text-base font-semibold truncate">
            {/* Added text-white and mix-blend for better contrast on varying gradients */}
            {game.title}
          </h3>

          {/* Favourite Star Button */}
          {loggedIn && (
            <button
              onClick={toggleFavourite}
              disabled={isPending}
              className={`cursor-pointer p-1 transition-all duration-200 hover:scale-110 disabled:opacity-50 ${
                isFavourited
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-gray-400 hover:text-yellow-400"
              }`}
              aria-label={
                isFavourited ? "Remove from favourites" : "Add to favourites"
              }
            >
              <StarIcon
                className={`w-5 h-5 transition-all duration-200 ${
                  isFavourited ? "fill-current" : ""
                } ${isPending ? "animate-pulse" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameThumbnail;
