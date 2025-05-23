"use client";

import { LogOutIcon } from "lucide-react";

export default function WelcomeCard({ firstName }: { firstName: string }) {
  return (
    <div
      className="mb-12 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 via-blue-600/10 to-sky-600/10 
                  backdrop-blur-sm border border-border rounded-2xl p-8 w-full max-w-4xl transition-all duration-500
                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-600/5 before:to-blue-600/5 before:opacity-0 
                  hover:before:opacity-100 before:transition-opacity before:duration-500"
    >
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-500/15 to-sky-500/15 rounded-full blur-xl"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-sky-400 
                           bg-clip-text text-transparent leading-tight"
              >
                Welcome, {firstName}!
              </h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6 sm:mb-0 sm:mr-8">
              Thanks for signing in! You can now access fantastic features
              in-game! You can also add and remove games from favourites here, they will move to the correct sections after refreshing the page.
            </p>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col gap-3 sm:min-w-fit">
            <button
              className="group relative overflow-hidden bg-gradient-to-r bg-red-600 hover:bg-red-700 text-white font-semibold
                           px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => (window.location.href = "/auth/logout")}
            >
              <span className="relative z-10 flex items-center gap-2">
                Sign Out
                <LogOutIcon className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}