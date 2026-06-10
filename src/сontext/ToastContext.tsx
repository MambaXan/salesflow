import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextType {
  addToast: (message: string, type?: "success" | "error") => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    
    // Добавляем новый тост в массив
    setToasts((prev) => [...prev, { id, message, type }]);

    // Автоматически удаляем его через 3 секунды
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Контейнер, который будет красиво всплывать в углу экрана */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} onClick={() => removeToast(t.id)}>
            <span className="toast__icon">{t.type === "success" ? "✨" : "❌"}</span>
            <span className="toast__text">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};