"use client";

import { Bell, Search, Zap, Plus, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SettingsPopup } from "../ui/settings-popup";

export function TopNav() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-950/50 px-4 shadow-sm backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form className="relative flex flex-1" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <Search
              className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400 dark:text-zinc-500"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-zinc-900 dark:text-white focus:ring-0 focus:outline-none outline-none sm:text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              placeholder="Search commands, files, or ask AI... (Press '/' to focus)"
              type="search"
              name="search"
              autoComplete="off"
            />
          </form>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button type="button" className="-m-2.5 p-2.5 text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-zinc-200 dark:lg:bg-white/10" aria-hidden="true" />

            {/* Extension Link */}
            <Link 
              href="/extension"
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-all"
            >
              <Zap className="h-4 w-4" />
              <span>Extension</span>
            </Link>

            {/* Profile dropdown / Settings Trigger */}
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="-m-1.5 flex items-center p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors" 
                id="user-menu-button"
              >
                <span className="sr-only">Open settings</span>
                <img
                  className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt=""
                />
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-zinc-900 dark:text-white" aria-hidden="true">
                    Tom Cook
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
