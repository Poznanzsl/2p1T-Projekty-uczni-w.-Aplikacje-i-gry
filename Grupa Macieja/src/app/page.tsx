import GameThumbnail from "@/components/GameThumbnail";

const games = [
    {
        id: 1,
        title: "game 1",
        thumbnailUrl: "https://mcjk.cc/projects/buzz.png",
    },
    {
        id: 2,
        title: "game 2",
        thumbnailUrl: "https://mcjk.cc/projects/statki.png",
    },
    {
        id: 3,
        title: "game 3",
        thumbnailUrl: "https://placehold.co/600x400",
    },
    {
        id: 4,
        title: "game 4",
        thumbnailUrl: "https://placehold.co/600x400",
    },
    {
        id: 5,
        title: "game 5",
        thumbnailUrl: "https://placehold.co/600x400",
    },
    {
        id: 6,
        title: "game 6",
        thumbnailUrl: "https://placehold.co/600x400",
    },
];

// Helper function for delay calculation
const calculateDelay = (index: number): string => `${index * 0.08}s`; // Stagger delay

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center bg-background p-10 text-foreground font-sans">
            <h1
                className="text-2xl sm:text-4xl font-bold mb-10
                   opacity-0 animate-fade-in-up" // Title animation
                style={{ animationDelay: "0s" }} // Title appears first
            >
                🎮
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {games.map((game, index) => (
                    <GameThumbnail
                        key={game.id}
                        game={game}
                        animationDelay={calculateDelay(index + 1)} // Start delay after title (index + 1)
                    />
                ))}
            </div>
            <footer className="mt-10">
                <p className="text-xs font-display">
                    Copyright © 2025 Acme Corporation / Designed by mcjk
                </p>
            </footer>
        </main>
    );
}
