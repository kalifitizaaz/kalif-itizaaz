
import { AppState } from "./types";

const STORAGE_KEY = 'mirror_app_state';

const initialData: AppState = {
  logs: {},
  settings: {
    notificationsEnabled: true,
    enableInsights: true
  }
};

export function getAppState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveAppState(initialData);
    return initialData;
  }
  return JSON.parse(stored);
}

export function saveAppState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
