import { useState } from 'react';
import type { Timesheet, User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import {
  Eye,
  X,
  Clock,
  Briefcase
} from 'lucide-react';

interface TimesheetValidationProps {
  timesheets: Timesheet[];
  users: User[];
  onValidate: (timesheetId: string) => void;
  onReject: (timesheetId: string) => void;
}

export function TimesheetValidation({ timesheets, users, onValidate, onReject }: TimesheetValidationProps) {
  const [viewingTs, setViewingTs] = useState<Timesheet | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const pendingTimesheets = timesheets.filter((t) => t.status === 'submitted');
  const getUser = (userId: string) => users.find((u) => u.id === userId);

  // Get tasks for viewing timesheet
  const viewingTsTasks = viewingTs?.tasks || [];

  // Tasks for selected date
  const tasksForSelectedDate = viewingTsTasks.filter((t) => t.date === selectedDate);

  // Generate days for the month based on timesheet data
  const getDaysInMonth = () => {
    if (!viewingTs) return [];
    const year = viewingTs.year;
    const month = viewingTs.month;
    const daysCount = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasTasks = viewingTsTasks.some((t) => t.date === dateStr);
      return { day, dateStr, hasTasks };
    });
  };

  const daysInMonth = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Validation des Timesheets</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" />
            Approbation des feuilles de temps soumises
          </p>
        </div>
      </div>

      {/* Employee Table */}
      <Card noPadding className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        {pendingTimesheets.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Aucune feuille de temps en attente de validation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Collaborateur
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Période
                  </th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Heures
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingTimesheets.map((ts) => {
                  const user = getUser(ts.userId);
                  return (
                    <tr key={ts.id} className="hover:bg-slate-50">
                      <td className="px-8 py-6 flex items-center gap-3">
                        <Avatar
                          initials={user?.avatarInitials || '??'}
                          color={user?.avatarColor}
                          size="md"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{user?.name || 'Unknown'}</span>
                          <p className="text-[10px] text-slate-400 font-medium">{user?.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-600">
                          {ts.month + 1}/{ts.year}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black bg-orange-50 text-[#ef7c21] border border-orange-100">
                          {ts.totalHours}h
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button size="sm" variant="outline" onClick={() => setViewingTs(ts)}>
                          <Eye className="h-4 w-4 mr-1" /> Voir Détails
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Calendar Modal */}
      {viewingTs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <Card className="w-full max-w-4xl bg-white shadow-2xl rounded-[2rem] flex flex-col max-h-[90vh] overflow-hidden" noPadding>
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-2xl text-[#ef7c21]">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase">
                    {getUser(viewingTs.userId)?.name} - {viewingTs.month + 1}/{viewingTs.year}
                  </h3>
                  <p className="text-xs font-bold text-slate-400">Sélectionnez un jour pour voir les détails</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingTs(null);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Calendar Grid */}
              <div className="p-8 border-r border-slate-100 bg-slate-50/30 w-full md:w-1/2 overflow-y-auto">
                <div className="grid grid-cols-7 gap-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                    <div key={d} className="text-[10px] font-black text-slate-400 uppercase text-center mb-2">
                      {d}
                    </div>
                  ))}
                  {daysInMonth.map(({ day, dateStr, hasTasks }) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        h-12 rounded-xl flex flex-col items-center justify-center transition-all relative border
                        ${
                          selectedDate === dateStr
                            ? 'bg-[#ef7c21] border-[#ef7c21] text-white shadow-lg'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-orange-200'
                        }
                        ${!hasTasks && 'opacity-40 grayscale'}
                      `}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      {hasTasks && selectedDate !== dateStr && (
                        <div className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#ef7c21]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Details */}
              <div className="flex-1 p-8 bg-white flex flex-col">
                <div className="mb-6">
                  <h4 className="text-lg font-black text-slate-900">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                      : 'Sélectionnez un jour'}
                  </h4>
                  <div className="h-1 w-8 bg-[#ef7c21] mt-2 rounded-full" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {tasksForSelectedDate.length > 0 ? (
                    tasksForSelectedDate.map((task, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-[#ef7c21] uppercase tracking-widest flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {task.name || task.projectName || 'Tâche'}
                          </span>
                          <span className="text-xs font-black text-slate-900">{task.hours}h</span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{task.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center">
                      <Clock className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">Aucune tâche</p>
                    </div>
                  )}
                </div>

                {/* Approve/Reject Footer */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      onReject(viewingTs.id);
                      setViewingTs(null);
                      setSelectedDate(null);
                    }}
                  >
                    Refuser
                  </Button>
                  <Button
                    className="flex-1 bg-[#ef7c21] rounded-xl"
                    onClick={() => {
                      onValidate(viewingTs.id);
                      setViewingTs(null);
                      setSelectedDate(null);
                    }}
                  >
                    Approuver
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
