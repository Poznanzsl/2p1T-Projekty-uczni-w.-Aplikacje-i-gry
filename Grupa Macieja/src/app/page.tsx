import GameThumbnail from "@/components/GameThumbnail";
import LoginCard from "../components/LoginCard";

import { auth0 } from "@/lib/auth0";
import WelcomeCard from "../components/WelcomeCard";
import { getUserFavourites } from "../lib/database";

const games = [
  {
    favourite: false,
    id: "minesweeper",
    title: "Minesweeper",
    thumbnailUrl: "https://placehold.co/600x400",
  },
  {
    favourite: false,
    id: "memory",
    title: "Memory",
    thumbnailUrl: "https://placehold.co/600x400",
  },
  {
    favourite: false,
    id: "pak",
    title: "Pak",
    thumbnailUrl: "https://placehold.co/600x400",
  },
  {
    favourite: false,
    id: "battleships",
    title: "Battleships",
    thumbnailUrl: "https://placehold.co/600x400",
  },
  {
    favourite: false,
    id: "snake",
    title: "Snake",
    thumbnailUrl: "https://placehold.co/600x400",
  },
  {
    favourite: false,
    id: "sudoku",
    title: "Sudoku",
    thumbnailUrl: "https://placehold.co/600x400",
  },
];

// Helper function for delay calculation
const calculateDelay = (index: number): string => `${index * 0.08}s`; // Stagger delay

export default async function HomePage() {
  const session = await auth0.getSession();

  const userGames = [...games];

  if (session) {
    const favourites = await getUserFavourites(session.user.sub);

    if (favourites) {
      for (let i = 0; i < userGames.length; i++) {
        userGames[i].favourite = favourites.includes(userGames[i].id);
      }
    }
    
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-10 text-foreground font-sans">
      {/* Enhanced Welcome Card */}
      {session ? (
        <WelcomeCard firstName={session.user.name.split(" ")[0]} />
      ) : (
        <LoginCard />
      )}

      {session && (
        <>
          <h2
            className="font-display text-xl sm:text-3xl font-bold mb-10
                   opacity-0 animate-fade-in-up" // Title animation
            style={{ animationDelay: "0s" }} // Title appears first
          >
            Favourites
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            {games.some((n) => n.favourite) ? (
              games
                .filter((n) => n.favourite)
                .map((game, index) => (
                  <GameThumbnail
                    loggedIn={session ? true : false}
                    key={game.id}
                    game={game}
                    animationDelay={calculateDelay(index + 1)} // Start delay after title (index + 1)
                  />
                ))
            ) : (
              <p
                className="col-span-3 mb-6 text-center text-foreground/60 animate-fade-in-up"
                style={{ animationDelay: "0s" }}
              >
                Nothing here yet...
              </p>
            )}
          </div>
        </>
      )}

      <h2
        className="font-display text-xl sm:text-3xl font-bold mt-10 mb-10
                   opacity-0 animate-fade-in-up" // Title animation
        style={{ animationDelay: "0s" }} // Title appears first
      >
        Library
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {games.some((n) => !n.favourite) ? (
          games
            .filter((n) => (session ? !n.favourite : true))
            .map((game, index) => (
              <GameThumbnail
                loggedIn={session ? true : false}
                key={game.id}
                game={game}
                animationDelay={calculateDelay(index + 1)} // Start delay after title (index + 1)
              />
            ))
        ) : (
          <p
            className="col-span-3 mb-6 text-center text-foreground/60 animate-fade-in-up"
            style={{ animationDelay: "0s" }}
          >
            Nothing here yet...
          </p>
        )}
      </div>
      <footer className="mt-10">
        <p className="text-xs font-display">Copyright © 2025 Nudge</p>
      </footer>
    </main>
  );
}
