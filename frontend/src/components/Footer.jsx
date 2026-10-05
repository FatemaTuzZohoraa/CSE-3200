import React from 'react';
import { Mail, MapPin, Globe } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-stone-900 border-t border-amber-900/40 text-xs text-stone-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 p-0.5 shadow-sm border border-amber-800/40 flex items-center justify-center shrink-0">
                <img src="/ruet-logo.png" alt="RUET Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-sans font-extrabold text-base text-amber-200 tracking-wider">RUET CLUB ZONE</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Centralized digital portal for student engagement, event management, and club activity tracking at Rajshahi University of Engineering & Technology.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-amber-100 text-xs uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#clubs" className="hover:text-amber-400 transition-colors">Ruet Clubs Directory</a></li>
              <li><a href="#events" className="hover:text-amber-400 transition-colors">Upcoming Events & Hackathons</a></li>
              <li><a href="#achievements" className="hover:text-amber-400 transition-colors">National Achievement Wall</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-100 text-xs uppercase tracking-wider mb-3">RUET Administration</h4>
            <ul className="space-y-2 text-[11px]">
              <li>Directorate of Student Welfare (DSW)</li>
              <li>Central Computer Center (CCC)</li>
              <li>Office of the Registrar</li>
              <li>IQAC & Student Clubs Committee</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-amber-100 text-xs uppercase tracking-wider mb-3">Campus Address</h4>
            <p className="flex items-start space-x-2 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>Kazla, Rajshahi-6204, Bangladesh</span>
            </p>
            <p className="flex items-center space-x-2 text-[11px]">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>clubzone@ruet.ac.bd</span>
            </p>
            <p className="flex items-center space-x-2 text-[11px]">
              <Globe className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>www.ruet.ac.bd</span>
            </p>
          </div>

        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} Rajshahi University of Engineering & Technology. All rights reserved.</p>
          <p className="font-sans font-bold text-amber-200/60">Ruet Club Zone • Built for RUET Students</p>
        </div>

      </div>
    </footer>
  );
};
