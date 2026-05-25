import React, { useState } from "react";
import { AlertTriangle, Calendar as CalendarIcon } from "lucide-react";

export interface CalendarEvent {
  dayNumber: number;
  type: 'exam' | 'deadline' | 'vacation' | 'grading' | 'other';
  title: string;
  date?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  title?: string;
  subtitle?: string;
  onEventEdit?: (event: CalendarEvent) => void;
}

export default function Calendar({ events, title = "Chronologie Académique", subtitle = "INSAT Tunis", onEventEdit }: CalendarProps) {
  const parseDate = (value?: string) => {
    if (!value) return null;
    const exact = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (exact) {
      const year = Number(exact[1]);
      const month = Number(exact[2]) - 1;
      const day = Number(exact[3]);
      const d = new Date(year, month, day);
      if (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      ) {
        return d;
      }
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const datedEvents = events
    .map((event) => ({ event, parsedDate: parseDate(event.date) }))
    .filter((item) => item.parsedDate !== null)
    .sort((a, b) => (a.parsedDate as Date).getTime() - (b.parsedDate as Date).getTime());

  const initialDate = datedEvents.length
    ? new Date(
        (datedEvents[0].parsedDate as Date).getFullYear(),
        (datedEvents[0].parsedDate as Date).getMonth(),
        1,
      )
    : new Date();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(initialDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalSlots = (firstDayIndex + daysInMonth) > 35 ? 42 : 35;
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const getEventsForDay = (day: number, monthIndex: number, yearValue: number) =>
    events.filter((event) => {
      const parsedDate = parseDate(event.date);
      if (parsedDate) {
        return (
          parsedDate.getDate() === day &&
          parsedDate.getMonth() === monthIndex &&
          parsedDate.getFullYear() === yearValue
        );
      }
      return event.dayNumber === day;
    });

  const selectedDayEvents =
    selectedDay !== null ? getEventsForDay(selectedDay, month, year) : [];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="flex-1 p-6 border-r border-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-700">{title}</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{subtitle}</span>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 capitalize">{monthNames[month]} {year}</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
              <span className="sr-only">Mois précédent</span>
              &larr;
            </button>
            <button onClick={handleToday} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
              Aujourd'hui
            </button>
            <button onClick={handleNextMonth} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
              <span className="sr-only">Mois suivant</span>
              &rarr;
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-3 text-center text-[10px] font-extrabold uppercase text-slate-500 border-r border-slate-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className={`grid grid-cols-7 ${totalSlots > 35 ? 'grid-rows-6' : 'grid-rows-5'} bg-slate-100 gap-[1px]`}>
            {Array.from({ length: totalSlots }).map((_, i) => {
              const dayNumber = i - firstDayIndex + 1;
              const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
              const today = new Date();
              const isToday =
                dayNumber === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
               
              const dayEvents = isCurrentMonth
                ? getEventsForDay(dayNumber, month, year)
                : [];

              const isSelected = selectedDay === dayNumber;

              return (
                <div 
                  key={i} 
                  onClick={() => isCurrentMonth && setSelectedDay(dayNumber)}
                  className={`min-h-[90px] p-2 bg-white flex flex-col group transition-all duration-200 ${
                    isCurrentMonth ? 'cursor-pointer hover:bg-slate-50' : 'bg-slate-50/50 opacity-40'
                  } ${isSelected ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30' : ''}`}
                >
                  <span className={`text-xs font-bold transition-transform duration-200 ${
                    isSelected ? 'text-blue-700' :
                    isCurrentMonth ? 'text-slate-700 group-hover:text-blue-600' : 'text-slate-400'
                  } ${isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-md shadow-blue-500/30' : ''}`}>
                    {dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : (dayNumber <= 0 ? daysInPrevMonth + dayNumber : dayNumber - daysInMonth)}
                  </span>
                  
                  <div className="mt-auto space-y-1.5 pt-2">
                    {dayEvents.map((evt, idx) => {
                      let style = 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';
                      if (evt.type === 'exam') style = 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100';
                      if (evt.type === 'deadline') style = 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100';
                      if (evt.type === 'grading') style = 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100';
                      if (evt.type === 'vacation') style = 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100';

                      return (
                        <div 
                          key={idx} 
                          className={`text-[9px] font-bold px-2 py-1 rounded-md truncate transition-colors duration-200 shadow-sm ${style}`} 
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details Side Panel */}
      <div className="w-full md:w-64 bg-slate-50 p-6 flex flex-col">
        {selectedDay ? (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner">
                {selectedDay}
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-800 capitalize">{monthNames[month]} {year}</div>
                <div className="text-xs font-semibold text-slate-500">
                  {selectedDayEvents.length} événement(s)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((evt, idx) => {
                  let style = 'bg-white border-slate-200 text-slate-700';
                  let iconColor = 'text-slate-400';
                  if (evt.type === 'exam') { style = 'bg-amber-50/50 border-amber-200 text-amber-800'; iconColor = 'text-amber-500'; }
                  if (evt.type === 'deadline') { style = 'bg-blue-50/50 border-blue-200 text-blue-800'; iconColor = 'text-blue-500'; }
                  if (evt.type === 'grading') { style = 'bg-red-50/50 border-red-200 text-red-800'; iconColor = 'text-red-500'; }
                  if (evt.type === 'vacation') { style = 'bg-green-50/50 border-green-200 text-green-800'; iconColor = 'text-green-500'; }

                  return (
                    <div key={idx} className={`p-3 rounded-xl border ${style} shadow-sm transition-all hover:shadow-md relative group`}>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                        <div>
                          <div className="text-xs font-bold leading-tight pr-6">{evt.title}</div>
                          <div className="text-[10px] font-semibold opacity-70 mt-1 uppercase tracking-wider">{evt.type}</div>
                        </div>
                      </div>
                      {onEventEdit && (
                        <button 
                          onClick={() => onEventEdit(evt)}
                          className="absolute top-3 right-3 p-1.5 bg-white rounded-lg shadow-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                          title="Modifier la date"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                  Aucun événement prévu pour cette date.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
            <CalendarIcon className="h-10 w-10 mb-3 text-slate-300" />
            <p className="text-xs font-semibold max-w-[150px]">
              Sélectionnez une date pour voir les détails
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
