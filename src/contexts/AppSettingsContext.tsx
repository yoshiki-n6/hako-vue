import React, { createContext, useContext, useEffect, useState } from 'react';

export type NotificationInterval = 1 | 3 | 7; // days

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  notificationIntervalDays: NotificationInterval;
}

interface AppSettingsContextType {
  settings: AppSettings;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  setNotificationInterval: (days: NotificationInterval) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notificationsEnabled: true,
  notificationIntervalDays: 1,
};

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return context;
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('hakovue_app_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('hakovue_app_settings', JSON.stringify(settings));
  }, [settings]);

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const toggleDarkMode = () =>
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));

  const toggleNotifications = () =>
    setSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));

  const setNotificationInterval = (days: NotificationInterval) =>
    setSettings(prev => ({ ...prev, notificationIntervalDays: days }));

  return (
    <AppSettingsContext.Provider value={{ settings, toggleDarkMode, toggleNotifications, setNotificationInterval }}>
      {children}
    </AppSettingsContext.Provider>
  );
}
