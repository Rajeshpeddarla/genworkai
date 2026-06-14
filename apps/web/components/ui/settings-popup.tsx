"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { 
  Settings, 
  X, 
  Palette, 
  User, 
  Trash2, 
  Monitor, 
  Moon, 
  Sun 
} from "lucide-react";

export function SettingsPopup({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("appearance");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col md:flex-row h-[500px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-48 bg-zinc-50 dark:bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 p-4">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </h2>
            <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <button 
              onClick={() => setActiveTab("appearance")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'appearance' ? 'bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
            >
              <Palette className="w-4 h-4" /> Appearance
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button 
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'data' ? 'bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
            >
              <Trash2 className="w-4 h-4" /> Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto relative">
          <button onClick={onClose} className="absolute top-4 right-4 hidden md:block text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Theme Preferences</h3>
                <p className="text-sm text-zinc-500 mb-4">Choose how GenWorkAI looks to you.</p>
                
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setTheme('light')} className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'}`}>
                    <Sun className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Light</span>
                  </button>
                  <button onClick={() => setTheme('dark')} className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'}`}>
                    <Moon className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">Aura Dark</span>
                  </button>
                  <button onClick={() => setTheme('system')} className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'}`}>
                    <Monitor className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">System</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Profile Details</h3>
                <p className="text-sm text-zinc-500 mb-6">Update your personal information.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Display Name</label>
                    <input type="text" defaultValue="Tom Cook" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                    <input type="email" defaultValue="tom@example.com" className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Data Management</h3>
                <p className="text-sm text-zinc-500 mb-6">Manage your conversation history and local data.</p>
                
                <div className="space-y-4">
                  <div className="p-4 border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 rounded-xl">
                    <h4 className="font-medium text-red-900 dark:text-red-400 mb-1">Clear AI Chat History</h4>
                    <p className="text-xs text-red-700 dark:text-red-300/80 mb-3">This will permanently delete all your conversation history from the AI workspace.</p>
                    <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors shadow-sm">
                      Clear Chats
                    </button>
                  </div>
                  
                  <div className="p-4 border border-zinc-200 dark:border-white/10 rounded-xl">
                    <h4 className="font-medium text-zinc-900 dark:text-white mb-1">Clear Local Cache</h4>
                    <p className="text-xs text-zinc-500 mb-3">Frees up storage by clearing temporarily downloaded files and thumbnails.</p>
                    <button className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
