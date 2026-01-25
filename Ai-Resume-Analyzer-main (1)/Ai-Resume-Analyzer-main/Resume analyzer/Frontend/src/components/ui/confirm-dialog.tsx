import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'warning' | 'danger' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Yes',
    cancelText = 'No',
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            icon: 'text-amber-600 dark:text-amber-400',
            button: 'bg-amber-600 hover:bg-amber-700'
        },
        danger: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            icon: 'text-red-600 dark:text-red-400',
            button: 'bg-red-600 hover:bg-red-700'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'text-blue-600 dark:text-blue-400',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <X className="h-4 w-4 text-neutral-500" />
                </button>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Icon and Title */}
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${styles.bg} ${styles.border} border`}>
                            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-neutral-300 dark:border-neutral-700"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 ${styles.button} text-white`}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
