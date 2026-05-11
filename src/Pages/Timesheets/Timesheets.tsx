import { useState, useMemo } from 'react';
import type { Timesheet, TimesheetTask, User, Project } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';

interface TimesheetsProps {
  currentUser: User;
  timesheet: Timesheet | undefined;
  projects: Project[];
  onSaveTask: (task: TimesheetTask) => void;
  onDeleteTask: (taskId: string) => void;
  onSubmitTimesheet: () => void;
}

// Tunisian Holidays utility
const getTunisianHoliday = (date: Date) => {
  const day = date.getDay();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const key = `${d}-${m}`;

  const fixedHolidays: Record<string, string> = {
    '1-1': "Jour de l'an",
    '14-1': "Fête de la Révolution",
    '20-3': "Fête de l'Indépendance",
    '9-4': "Fête des Martyrs",
    '1-5': "Fête du Travail",
    '25-7': "Fête de la République",
    '13-8': "Fête de la Femme",
    '15-10': "Fête de l'Évacuation"
  };

  if (fixedHolidays[key]) return { type: 'holiday', name: fixedHolidays[key] };
  if (day === 0 || day === 6) return { type: 'weekend', name: day === 0 ? 'Dimanche' : 'Samedi' };
  return null;
};

export function Timesheets({
  timesheet,
  onSaveTask,
}: TimesheetsProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  // Navigation State for Calendar
  const [navDate, setNavDate] = useState(new Date());
  const currentMonth = navDate.getMonth();
  const currentYear = navDate.getFullYear();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const [newTask, setNewTask] = useState<Partial<TimesheetTask>>({
    date: todayStr,
    startTime: '09:00',
    endTime: '17:00',
    description: ''
  });

  // Month Navigation
  const nextMonth = () => setNavDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setNavDate(new Date(currentYear, currentMonth - 1, 1));
  const goToToday = () => setNavDate(new Date());

  const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Data Processing
  const tasksByDate = useMemo(() => {
    return timesheet?.tasks.reduce((acc, task) => {
      acc[task.date] = [...(acc[task.date] || []), task];
      return acc;
    }, {} as Record<string, TimesheetTask[]>);
  }, [timesheet]);

  const calculateHours = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, Number((eh + em / 60 - (sh + sm / 60)).toFixed(1)));
  };

  const handleSaveTask = () => {
    const hours = calculateHours(newTask.startTime!, newTask.endTime!);
    onSaveTask({
      id: Math.random().toString(36).substr(2, 9),
      date: newTask.date!,
      startTime: newTask.startTime!,
      endTime: newTask.endTime!,
      name: projectSearch || 'Indépendant',
      description: newTask.description!,
      hours,
      type: projectSearch ? 'project' : 'independent'
    });
    setIsAddingTask(false);
    setProjectSearch('');
  };

  const openLogForm = (dateIso: string) => {
    setNewTask((prev) => ({ ...prev, date: dateIso }));
    setIsAddingTask(true);
  };

  // Render Calendar View
  const renderCalendarView = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarGrid = [];
    let dayCounter = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDay) || dayCounter > daysInMonth) {
          week.push(null);
        } else {
          week.push(dayCounter++);
        }
      }
      calendarGrid.push(week);
      if (dayCounter > daysInMonth) break;
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-slate-900 min-w-[200px]">
              {monthsFr[currentMonth]} <span className="text-slate-300 font-medium">{currentYear}</span>
            </h2>
            <div className="flex bg-slate-50 p-1 rounded-xl">
              <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={goToToday} className="px-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">
                Aujourd'hui
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
              <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {calendarGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 divide-x divide-slate-100">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="bg-slate-50/20 min-h-[160px]" />;
                  const dateObj = new Date(currentYear, currentMonth, day);
                  const dateIso = dateObj.toISOString().split('T')[0];
                  const isPast = dateObj < today;
                  const holiday = getTunisianHoliday(dateObj);
                  const dayTasks = tasksByDate?.[dateIso] || [];
                  const totalHours = dayTasks.reduce((sum, t) => sum + t.hours, 0);
                  const workloadPercent = Math.min(totalHours / 8 * 100, 100);

                  return (
                    <div
                      key={di}
                      className={`min-h-[160px] p-3 group relative transition-colors ${
                        isPast ? 'bg-slate-50/40' : 'bg-white hover:bg-orange-50/10'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-black ${isPast ? 'text-slate-300' : 'text-slate-800'}`}>
                          {day}
                        </span>
                        {holiday && (
                          <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1 py-0.5 rounded uppercase">
                            {holiday.name}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mb-2">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            className="text-[9px] p-1.5 bg-white border border-slate-100 rounded-lg shadow-sm font-bold truncate border-l-2 border-l-[#ef7c21]"
                          >
                            {t.name} ({t.hours}h)
                          </div>
                        ))}
                      </div>

                      {!isPast && !holiday && (
                        <button
                          onClick={() => openLogForm(dateIso)}
                          className="w-full py-2 border-2 border-dashed border-slate-100 rounded-xl text-[9px] text-slate-300 font-black uppercase opacity-0 group-hover:opacity-100 transition-all hover:border-[#ef7c21] hover:text-[#ef7c21]"
                        >
                          + Planifier
                        </button>
                      )}

                      {totalHours > 0 && (
                        <div className="absolute bottom-2 left-3 right-3">
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${totalHours > 8 ? 'bg-red-500' : 'bg-[#ef7c21]'}`}
                              style={{ width: `${workloadPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Espace Temps</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez votre historique et planifiez vos prochaines étapes.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100">
          <button
            onClick={() => setViewMode('list')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400'
            }`}
          >
            TIMESHEET
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
              viewMode === 'calendar' ? 'bg-[#ef7c21] text-white shadow-lg shadow-orange-100' : 'text-slate-400'
            }`}
          >
            CALENDRIER
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        renderCalendarView()
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <Card noPadding className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-slate-900">Journal d'activités</h3>
              <Button onClick={() => setIsAddingTask(true)} className="bg-slate-900 text-white rounded-xl px-6 font-bold h-11">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle Entrée
              </Button>
            </div>

            <div className="p-4 overflow-x-auto">
              {/* Quick Log for Today/Past */}
              <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                {[0, 1, 2, 3, 4].map((daysBack) => {
                  const d = new Date();
                  d.setDate(d.getDate() - daysBack);
                  const dIso = d.toISOString().split('T')[0];
                  return (
                    <button
                      key={daysBack}
                      onClick={() => openLogForm(dIso)}
                      className="flex-shrink-0 px-6 py-4 rounded-[1.5rem] border-2 border-slate-50 bg-white hover:border-orange-200 transition-all text-left min-w-[150px]"
                    >
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {daysBack === 0 ? "Aujourd'hui" : d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-black text-slate-800">
                        {d.getDate()} {d.toLocaleDateString('fr-FR', { month: 'short' })}
                      </p>
                    </button>
                  );
                })}
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Projet</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Heures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {timesheet?.tasks.sort((a, b) => b.date.localeCompare(a.date)).map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/30 transition-all group">
                      <td className="px-8 py-5 text-sm font-bold text-slate-700">{task.date}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-orange-50 text-[#ef7c21] rounded-lg text-[10px] font-black uppercase">
                          {task.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">{task.description}</td>
                      <td className="px-8 py-5 text-right font-black text-slate-900">{task.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Log Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <Card className="w-full max-w-xl p-10 border-none shadow-2xl rounded-[3rem] bg-white animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {viewMode === 'list' ? 'Enregistrer un log' : 'Planifier une tâche'}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-tighter">
                  Saisie pour le {newTask.date}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setIsAddingTask(false)} className="rounded-full bg-slate-50 h-10 w-10 p-0">
                <X />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Date"
                  value={newTask.date}
                  max={viewMode === 'list' ? todayStr : undefined}
                  min={viewMode === 'calendar' ? todayStr : undefined}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                />
                <Input
                  label="Projet"
                  placeholder="Nom du projet..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  label="Début"
                  value={newTask.startTime}
                  onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                />
                <Input
                  type="time"
                  label="Fin"
                  value={newTask.endTime}
                  onChange={(e) => setNewTask({ ...newTask, endTime: e.target.value })}
                />
              </div>
              <Input
                label="Notes"
                placeholder="Détails de l'activité..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <div className="mt-10 flex gap-3">
              <Button
                onClick={handleSaveTask}
                className="w-full bg-[#ef7c21] hover:bg-orange-600 text-white rounded-2xl h-14 font-black shadow-lg"
              >
                ENREGISTRER
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
