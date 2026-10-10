import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCelebrations, CelebrationItem } from '../../utils/dateUtils';
import confetti from 'canvas-confetti';
import { 
  Cake, 
  Heart, 
  MessageCircle, 
  PhoneCall, 
  Check, 
  Calendar, 
  Clock, 
  Sparkles,
  MapPin,
  Search,
  Filter
} from 'lucide-react';

interface CelebrationsCenterProps {
  onSelectDevotee: (devoteeId: string) => void;
}

export const CelebrationsCenter: React.FC<CelebrationsCenterProps> = ({ onSelectDevotee }) => {
  const { devotees, careInteractions, logCareInteraction, settings } = useData();
  const { currentUser, isViewer } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'today' | '7days' | 'month'>('today');
  const [wishedMap, setWishedMap] = useState<Record<string, boolean>>({});

  const celebrations = getCelebrations(devotees);

  const todayCelebrations = celebrations.filter((c) => c.isToday);
  const next7DaysCelebrations = celebrations.filter((c) => c.daysUntil > 0 && c.daysUntil <= 7);
  const thisMonthCelebrations = celebrations.filter((c) => c.daysUntil <= 30);

  const displayedList = 
    activeFilter === 'today' ? todayCelebrations :
    activeFilter === '7days' ? [...todayCelebrations, ...next7DaysCelebrations] :
    thisMonthCelebrations;

  const handleSendWish = async (c: CelebrationItem, via: 'WHATSAPP' | 'PHONE_CALL') => {
    // Pop celebratory confetti!
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ea580c', '#f59e0b', '#ec4899', '#3b82f6'],
    });

    const key = `${c.devotee.id}-${c.type}`;
    setWishedMap((prev) => ({ ...prev, [key]: true }));

    const occasion = c.type === 'BIRTHDAY' ? 'Birthday' : 'Marriage Anniversary';
    const devTitle = c.devotee.spiritual_name || c.devotee.legal_name;

    await logCareInteraction({
      devotee_id: c.devotee.id,
      devotee_name: devTitle,
      interaction_type: c.type === 'BIRTHDAY' ? 'BIRTHDAY_WISH' : 'ANNIVERSARY_WISH',
      conducted_by_id: currentUser.id,
      conducted_by_name: currentUser.spiritual_name || currentUser.full_name,
      date: new Date().toISOString().split('T')[0],
      wished_via: via,
      notes: `Sent ${via} pastoral wishes for ${occasion}. Prayed for spiritual growth and Radha-Krishna bhakti.`,
    });

    if (via === 'WHATSAPP' && c.devotee.phone) {
      const cleanPhone = c.devotee.phone.replace(/[^0-9]/g, '');
      const text = settings.default_whatsapp_wish_template
        .replace('{NAME}', devTitle)
        .replace('{OCCASION}', occasion);
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
              Vaishnava Care & Pastoral Center
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight mt-1">
            Birthday & Anniversary Celebrations
          </h2>
          <p className="text-rose-100 text-xs mt-1 max-w-xl">
            Srila Prabhupada emphasized loving exchanges and honoring devotees. Send personalized Krishna conscious greetings and track pastoral outreach.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-white/20 p-1 rounded-xl backdrop-blur-xs text-xs font-bold">
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'today' ? 'bg-white text-rose-900 shadow-xs' : 'text-white hover:bg-white/10'
            }`}
          >
            Today ({todayCelebrations.length})
          </button>
          <button
            onClick={() => setActiveFilter('7days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === '7days' ? 'bg-white text-rose-900 shadow-xs' : 'text-white hover:bg-white/10'
            }`}
          >
            Next 7 Days ({next7DaysCelebrations.length + todayCelebrations.length})
          </button>
          <button
            onClick={() => setActiveFilter('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'month' ? 'bg-white text-rose-900 shadow-xs' : 'text-white hover:bg-white/10'
            }`}
          >
            This Month ({thisMonthCelebrations.length})
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedList.length > 0 ? (
          displayedList.map((item, idx) => {
            const devName = item.devotee.spiritual_name || item.devotee.legal_name;
            const key = `${item.devotee.id}-${item.type}`;
            const isWished = wishedMap[key];

            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  item.isToday
                    ? 'border-rose-300 ring-2 ring-rose-400/20 bg-gradient-to-b from-rose-50/40 to-white'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{item.type === 'BIRTHDAY' ? '🎂' : '💍'}</span>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.type === 'BIRTHDAY' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.type === 'BIRTHDAY' ? 'Birthday' : 'Marriage Anniversary'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {item.isToday ? (
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                          Today!
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          In {item.daysUntil} day{item.daysUntil === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3
                      onClick={() => onSelectDevotee(item.devotee.id)}
                      className="font-bold text-sm text-slate-900 hover:text-amber-700 cursor-pointer"
                    >
                      {devName}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.devotee.city}, {item.devotee.state}</span>
                    </div>

                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Original Date:</span>
                        <strong className="font-mono">{item.fullDate}</strong>
                      </div>
                      {item.yearsCount && (
                        <div className="flex justify-between text-slate-600">
                          <span>Milestone:</span>
                          <strong className="text-amber-700">{item.yearsCount} Years</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Primary Seva:</span>
                        <span className="truncate max-w-[120px] font-medium text-slate-800">
                          {item.devotee.primary_seva || 'Congregation'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">{item.devotee.phone}</span>

                  <div className="flex items-center space-x-1.5">
                    {isWished ? (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Wished</span>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSendWish(item, 'PHONE_CALL')}
                          disabled={isViewer}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          title="Call on Phone & Log Interaction"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSendWish(item, 'WHATSAPP')}
                          disabled={isViewer}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 active:scale-95"
                          title="Send Krishna conscious WhatsApp blessing"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Blessing</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No celebration events found in this timeframe.
          </div>
        )}
      </div>

      {/* Pastoral Care Interactions Log Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center">
          <Heart className="w-4 h-4 text-rose-600 mr-2" />
          Recent Pastoral Care & Wishes History ({careInteractions.length} logs)
        </h3>

        <div className="divide-y divide-slate-100">
          {careInteractions.slice(0, 5).map((care) => (
            <div key={care.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-800">
                  {care.interaction_type.replace('_', ' ')} for <strong>{care.devotee_name}</strong>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {care.notes}
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>By {care.conducted_by_name}</span>
                <span className="block font-mono">{care.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
