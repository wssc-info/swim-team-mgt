import {Button} from "@/components/ui/button";

interface ModalProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | '2xl' | '3xl' | '4xl';
  maxHeight?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export default function Modal({ title, onClose, children, footer, size = 'lg', maxHeight = 'max-h-[90vh]' }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg w-full ${sizeClasses[size]} flex flex-col ${maxHeight}`}>
        <div className="shrink-0 flex justify-between items-center px-6 py-4 border-b">
          <div className="text-xl font-bold">{title}</div>
          <Button >x</Button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
