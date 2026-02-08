'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: 'DASHBOARD', path: '/' },
    { name: 'INCIDENTS', path: '/incidents' },
    { name: 'ESCALATIONS', path: '/escalations' },
  ];

  return (
    <nav className="flex items-center">
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Link 
            key={item.path} 
            href={item.path}
            className={`
              relative px-4 py-2 text-xs font-mono tracking-widest transition-all duration-300
              ${active 
                ? 'text-hg-amber font-bold bg-hg-amber/5' 
                : 'text-hg-text-dim hover:text-hg-text hover:bg-white/5'}
            `}
          >
            {item.name}
            
            {/* Active Indicator Line */}
            {active && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-hg-amber shadow-[0_0_8px_rgba(245,158,11,0.5)] transform scale-x-100 transition-transform duration-300" />
            )}
            
            {/* Hover Indicator Line (Subtle) */}
            {!active && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
