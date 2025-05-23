"use client";

import { LogInIcon } from "lucide-react";

export default function LoginCard() {
  return (
    <div
      className="mb-12 relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-sky-600/10 to-indigo-600/10 
                  backdrop-blur-sm border border-foreground/10 rounded-2xl p-8 w-full max-w-4xl transition-all duration-500
                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-600/5 before:to-sky-600/5 before:opacity-0 
                  hover:before:opacity-100 before:transition-opacity before:duration-500"
    >
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-sky-500/20 rounded-full blur-xl"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-sky-500/15 to-indigo-500/15 rounded-full blur-xl"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 
                           bg-clip-text text-transparent leading-tight"
              >
                Welcome to Nudge!
              </h2>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6 sm:mb-0 sm:mr-8">
              Add games to favourites, track and beat high scores and more. Join
              other players as a registered member.
            </p>

            {/* Feature highlights */}
            <div className="hidden sm:flex gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>High Score Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Custom Favourites</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Personal Dashboard</span>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col gap-3 sm:min-w-fit">
            <button
              className="group relative overflow-hidden bg-gradient-to-r bg-blue-600 hover:bg-blue-700 text-white font-semibold
                           px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => (window.location.href = "/auth/login")}
            >
              <span className="relative z-10 flex items-center gap-2">
                Sign In
                <LogInIcon className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
