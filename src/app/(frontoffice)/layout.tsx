import { ReactNode } from 'react';

interface FrontOfficeLayoutProps {
  children: ReactNode;
}

export default function FrontOfficeLayout({ children }: FrontOfficeLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}