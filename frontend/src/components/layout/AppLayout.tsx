import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../common/CommandPalette';

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc]">
      <CommandPalette />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[1400px] mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
