import { ReactNode, useCallback, useMemo, useState } from "react";
import { Alert, AlertType } from "../types";
import { createPortal } from "react-dom";
import { CheckCircle, X, XCircle } from "lucide-react";
import { AlertContext } from "./alertContext";

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const hideAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback(
    (
      type: AlertType = "info",
      title?: string,
      message?: string,
      duration?: number,
    ) => {
      const newAlert: Alert = {
        id: Date.now(),
        type,
        title,
        message,
        duration: duration ?? 3000,
      };

      setAlerts((prevAlerts) => [...prevAlerts, newAlert]);

      if (newAlert.duration && newAlert.duration > 0) {
        window.setTimeout(() => {
          hideAlert(newAlert.id);
        }, newAlert.duration);
      }
    },
    [hideAlert],
  );

  const AlertContainer = useCallback(() => {
    if (alerts.length === 0) return null;

    return createPortal(
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 rounded-lg shadow-lg backdrop-blur-sm bg-gray-700 text-gray-300 animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-start gap-3">
              {alert.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-white">
                  {alert.title}
                </h4>
                {alert.message && (
                  <p className="text-sm mt-1 text-white opacity-90 break-words whitespace-pre-wrap">
                    {alert.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => hideAlert(alert.id)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-gray-600 transition-colors"
                aria-label="Cerrar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>,
      document.body,
    );
  }, [alerts, hideAlert]);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer />
    </AlertContext.Provider>
  );
};
