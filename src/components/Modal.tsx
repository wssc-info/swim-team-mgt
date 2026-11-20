interface ModalProps {
  children: React.ReactNode;
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

export default function Modal({ children, size = 'lg', maxHeight = 'max-h-[90vh]' }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg w-full ${sizeClasses[size]} flex flex-col ${maxHeight}`}>
        {children}
      </div>
    </div>
  );
}
