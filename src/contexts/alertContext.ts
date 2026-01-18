import { createContext } from "react";
import { AlertType } from "../types";

export interface AlertContextType {
  showAlert: (
    type: AlertType,
    title?: string,
    message?: string,
    duration?: number,
  ) => void;
}

export const AlertContext = createContext<AlertContextType | null>(null);
