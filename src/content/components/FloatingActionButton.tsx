import { Logo } from '@/components/Logo';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-24 right-6 z-[10000]">
      <button
        onClick={onClick}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Toggle email guard"
      >
        <Logo className="w-8 h-8 text-white" />
      </button>
    </div>
  );
}

