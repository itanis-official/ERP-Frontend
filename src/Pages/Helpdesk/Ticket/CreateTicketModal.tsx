import { useState, useRef, useEffect } from 'react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { TicketPriority } from '../../../types';
import type { Intervention } from '../../../types/helpdesk';
import { interventionService } from '../../../Services/helpdesk/interventionService';
import { X, Upload, File } from 'lucide-react';

const CLIENTS_DATA = [
  { id: 'c1', name: 'Groupe Renault', subClients: ['Usine Flins', 'Siège Boulogne', 'Logistique'] },
  { id: 'c2', name: 'TotalEnergies', subClients: ['Raffinage France', 'Secteur IT', 'Plateforme Mer'] }
];

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: any) => void;
}

export function CreateTicketModal({ isOpen, onClose, onSubmit }: CreateTicketModalProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    subClient: '',
    interventionId: '',
    customTitle: '',
    priority: 'medium' as TicketPriority,
    team: 'helpdesk' as string,
    description: ''
  });

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loadingInterventions, setLoadingInterventions] = useState(true);
  const [interventionError, setInterventionError] = useState(false);

  useEffect(() => {
    interventionService.getAll()
      .then((data) => setInterventions(data))
      .catch(() => setInterventionError(true))
      .finally(() => setLoadingInterventions(false));
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedClientData = CLIENTS_DATA.find((c) => c.name === formData.clientName);
  const subClientOptions = selectedClientData
    ? selectedClientData.subClients.map((sc) => ({ value: sc, label: sc }))
    : [];

  const isCustom = formData.interventionId === 'other';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedIntervention = interventions.find(
      (i) => String(i.id) === formData.interventionId
    );
    const finalTitle = isCustom
      ? formData.customTitle
      : selectedIntervention?.nom || '';

    onSubmit({
      ...formData,
      interventionId: isCustom ? null : Number(formData.interventionId),
      title: finalTitle,
      attachments: files,
    });

    // Reset form
    setFormData({
      clientName: '',
      subClient: '',
      interventionId: '',
      customTitle: '',
      priority: 'medium',
      team: 'helpdesk',
      description: ''
    });
    setFiles([]);
    onClose();
  };

  const interventionOptions = () => {
    if (loadingInterventions) return [{ value: '', label: 'Chargement...' }];
    if (interventionError) return [{ value: '', label: 'Erreur de chargement — réessayez' }];
    return [
      { value: '', label: 'Sélectionner une intervention...' },
      ...interventions.map((i) => ({ value: String(i.id), label: i.nom })),
      { value: 'other', label: 'Autre... (Saisir manuellement)' },
    ];
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Nouveau Ticket</h2>
            <p className="text-sm text-slate-500 font-medium">Ouverture manuelle d'un incident.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Client & Sous-client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Select
                label="Client Principal"
                required
                options={[
                  { value: '', label: 'Sélectionner un client...' },
                  ...CLIENTS_DATA.map((c) => ({ value: c.name, label: c.name }))
                ]}
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value, subClient: '' })
                }
              />
              <Select
                label="Sous-Client / Site"
                required
                disabled={!formData.clientName}
                options={[
                  { value: '', label: 'Sélectionner un sous-client...' },
                  ...subClientOptions
                ]}
                value={formData.subClient}
                onChange={(e) => setFormData({ ...formData, subClient: e.target.value })}
              />
            </div>

            {/* Intervention & Priorité */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Objet du ticket (Intervention)"
                  required
                  disabled={loadingInterventions || interventionError}
                  options={interventionOptions()}
                  value={formData.interventionId}
                  onChange={(e) =>
                    setFormData({ ...formData, interventionId: e.target.value, customTitle: '' })
                  }
                />
                <Select
                  label="Priorité"
                  options={[
                    { value: 'low', label: 'Basse' },
                    { value: 'medium', label: 'Moyenne' },
                    { value: 'high', label: 'Haute' },
                    { value: 'critical', label: 'Critique' }
                  ]}
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as TicketPriority })
                  }
                />
              </div>

              {isCustom && (
                <Input
                  label="Précisez l'objet du ticket"
                  placeholder="Saisissez l'objet manuellement..."
                  required
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                  className="border-[#ef7c21] bg-orange-50/30"
                />
              )}

              {/* Intervention details card */}
              {formData.interventionId && !isCustom && (() => {
                const selected = interventions.find(i => String(i.id) === formData.interventionId);
                if (!selected) return null;
                return (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex flex-wrap gap-6 text-sm">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durée estimée</p>
                      <p className="font-bold text-slate-700">{selected.dureeEstimeeMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix forfaitaire</p>
                      <p className="font-bold text-slate-700">{selected.prixForfaitaire} €</p>
                    </div>
                    {selected.description && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                        <p className="font-medium text-slate-600">{selected.description}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Équipe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Équipe assignée"
                required
                options={[
                  { value: 'developpement', label: 'Développement' },
                  { value: 'helpdesk', label: 'Helpdesk' },
                  { value: 'windows', label: 'Infrastructure Windows' }
                ]}
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest opacity-70">
                Description
              </label>
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-[#ef7c21] transition-all min-h-[100px] font-medium resize-none"
                placeholder="Détaillez l'incident..."
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Pièces jointes */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest opacity-70">
                Pièces jointes
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-orange-50 hover:border-[#ef7c21] transition-all cursor-pointer group"
              >
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="text-[#ef7c21] h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">Déposer des fichiers ou cliquer ici</p>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <File className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-600 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="p-1 text-slate-300 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-6 h-11 font-bold"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="create-ticket-form"
            className="bg-[#ef7c21] hover:bg-orange-600 text-white rounded-xl px-8 h-11 font-black shadow-lg shadow-orange-100 transition-all active:scale-95"
          >
            Créer le ticket
          </Button>
        </div>
      </div>
    </div>
  );
}