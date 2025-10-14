import { ReactNode, useCallback, useMemo, useState } from "react";
import { Alert, AlertType } from "../types";
import { createPortal } from "react-dom";
import { CheckCircle, X, XCircle, Info } from "lucide-react";
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
      duration?: number
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
    [hideAlert]
  );

  const AlertContainer = useCallback(() => {
    if (alerts.length === 0) return null;

    const getAlertStyles = (type: AlertType) => {
      switch (type) {
        case "success":
          return {
            bgClass:
              "bg-gradient-to-r from-emerald-900/95 to-emerald-800/95 border-emerald-700",
            iconColor: "text-emerald-400",
            icon: CheckCircle,
          };
        case "error":
          return {
            bgClass:
              "bg-gradient-to-r from-rose-900/95 to-rose-800/95 border-rose-700",
            iconColor: "text-rose-400",
            icon: XCircle,
          };
        case "info":
        default:
          return {
            bgClass:
              "bg-gradient-to-r from-blue-900/95 to-blue-800/95 border-blue-700",
            iconColor: "text-blue-400",
            icon: Info,
          };
      }
    };

    return createPortal(
      <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md w-full">
        {alerts.map((alert) => {
          const { bgClass, iconColor, icon: Icon } = getAlertStyles(alert.type);

          return (
            <div
              key={alert.id}
              className={`${bgClass} border backdrop-blur-md rounded-xl shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300 overflow-hidden`}
            >
              <div className="p-4 flex items-start gap-3">
                <div className={`${iconColor} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white leading-tight">
                    {alert.title}
                  </h4>
                  {alert.message && (
                    <p className="text-sm mt-1.5 text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
                      {alert.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => hideAlert(alert.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-300 hover:text-white"
                  aria-label="Cerrar alerta"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>,
      document.body
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
