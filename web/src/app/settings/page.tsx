"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Palette, Shield, Bell } from "lucide-react";
import {
  useThemeStore,
  type Theme,
  themeNames,
} from "@/src/stores/theme-store";
import { Check } from "lucide-react";

const themes: Theme[] = [
  "light",
  "dark",
  "coffee",
  "night",
  "forest",
  "dracula",
];

const themePreviews: Record<Theme, string> = {
  light: "bg-white border-2 border-gray-200",
  dark: "bg-gray-900 border-2 border-gray-700",
  coffee: "bg-amber-900 border-2 border-amber-700",
  night: "bg-slate-900 border-2 border-slate-700",
  forest: "bg-emerald-900 border-2 border-emerald-700",
  dracula: "bg-purple-900 border-2 border-purple-700",
};

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/app" className="btn btn-ghost btn-sm gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to chats
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-base-content/60 mt-1">
              Customize your experience
            </p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
            <div className="p-4 border-b border-base-300 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Theme</h2>
                <p className="text-xs text-base-content/40">
                  Choose your preferred theme
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-105 ${
                      theme === t
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-base-300 hover:border-base-content/30"
                    }`}
                  >
                    <div className={`h-20 ${themePreviews[t]}`}>
                      <div className="p-2 space-y-1.5">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-current opacity-30" />
                          <div className="w-2 h-2 rounded-full bg-current opacity-30" />
                          <div className="w-2 h-2 rounded-full bg-current opacity-30" />
                        </div>
                        <div className="w-3/4 h-1.5 rounded bg-current opacity-20" />
                        <div className="w-1/2 h-1.5 rounded bg-current opacity-20" />
                      </div>
                    </div>
                    <div className="p-2 flex items-center justify-between bg-base-200">
                      <span className="text-xs font-medium capitalize">
                        {themeNames[t]}
                      </span>
                      {theme === t && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
            <div className="p-4 border-b border-base-300 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-info" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Notifications</h2>
                <p className="text-xs text-base-content/40">
                  Manage notification preferences
                </p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                "Message notifications",
                "Group notifications",
                "Sound",
                "Desktop notifications",
              ].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    defaultChecked
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
            <div className="p-4 border-b border-base-300 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center">
                <Shield className="w-4 h-4 text-base-content/60" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Security</h2>
                <p className="text-xs text-base-content/40">
                  Manage your security settings
                </p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                "Two-factor authentication",
                "Active sessions",
                "Blocked users",
              ].map((label) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <button className="btn btn-ghost btn-xs">Manage</button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
