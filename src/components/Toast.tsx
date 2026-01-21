import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {messages.map((message) => (
          <ToastItem key={message.id} message={message} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [message.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-xl shadow-black/20 flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--accent-ember-glow)] flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-[var(--accent-ember)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--text-primary)] text-sm">{message.title}</p>
        <p className="text-[var(--text-muted)] text-xs mt-0.5 truncate">{message.body}</p>
      </div>
      <button
        onClick={() => onDismiss(message.id)}
        className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
