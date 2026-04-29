import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { X, FileText, Loader2, AlertCircle, Calendar, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";
import { leaveApi } from "../lib/leaveApi";
import type { CollaborateurInterne } from "../lib/personnelApi";
import { useModuleSelectOptions } from "../lib/selectOptionsConfig";

interface LeaveRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  employees?: CollaborateurInterne[];
  currentEmployeeId?: number | null;
}

export function LeaveRequestForm({ 
  open, 
  onClose, 
  onSubmit,
  employees = [],
  currentEmployeeId = null,
}: LeaveRequestFormProps) {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const leaveTypeOptions = rhSelectOptions.leaveTypes || []
  const defaultLeaveType = leaveTypeOptions[0]?.value || 'Annuel'
  const [justifFile, setJustifFile] = useState<File | null>(null);
  const [justifUploading, setJustifUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    employeId: currentEmployeeId ? String(currentEmployeeId) : "",
    typeConge: defaultLeaveType,
    dateDebut: "",
    dateFin: "",
    motif: "",
    fichierJustificatif: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        employeId: currentEmployeeId ? String(currentEmployeeId) : "",
        typeConge: defaultLeaveType,
        dateDebut: "",
        dateFin: "",
        motif: "",
        fichierJustificatif: "",
      });
      setJustifFile(null);
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [open, currentEmployeeId, defaultLeaveType]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const selectedEmployee = employees.find(e => e.id?.toString() === formData.employeId);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleDateChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleJustifChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/gif'];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, fichierJustificatif: "Format non supporté" });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, fichierJustificatif: "Fichier trop volumineux (max 5MB)" });
        return;
      }
      
      setJustifFile(file);
      setFormData({ ...formData, fichierJustificatif: file.name });
      setErrors({ ...errors, fichierJustificatif: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.employeId) newErrors.employeId = "L'employé est requis";
    if (!formData.dateDebut) newErrors.dateDebut = "La date de début est requise";
    if (!formData.dateFin) newErrors.dateFin = "La date de fin est requise";
    if (formData.dateDebut && formData.dateFin && new Date(formData.dateDebut) > new Date(formData.dateFin)) {
      newErrors.dateDebut = "La date de début doit être avant la date de fin";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const employeId = Number(formData.employeId);
    if (!Number.isInteger(employeId) || employeId <= 0) {
      setSubmitError("Employé invalide.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const existingRequests = await leaveApi.getByEmploye(employeId);
      const hasOpenRequest = existingRequests.some(
        (request) => request.statut !== "Rejected" && request.statut !== "ApprovedHR" && request.statut !== "ApprovedRH"
      );

      if (hasOpenRequest) {
        setSubmitError("Cet employe a deja une demande de conge en cours. Veuillez attendre sa validation ou son refus avant d'en creer une autre.");
        setIsSubmitting(false);
        return;
      }

      const duration = calculateDuration(formData.dateDebut, formData.dateFin);
      await leaveApi.create({
        employeId,
        typeConge: formData.typeConge,
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        dureeJours: duration,
        motif: formData.motif,
        statut: "Pending",
        fichierJustificatif: formData.fichierJustificatif || undefined,
      });
      onSubmit(formData);
    } catch (error: any) {
      console.error('Erreur:', error);
      setSubmitError(error.response?.data?.message || "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const duration = calculateDuration(formData.dateDebut, formData.dateFin);
  const balanceAfter = selectedEmployee 
    ? (selectedEmployee.soldeConges || 0) - duration 
    : 0;
  const monthlyRights = Number(selectedEmployee?.droitsMensuels || 0);
  const deficitDays = balanceAfter < 0 ? Math.abs(balanceAfter) : 0;
  const monthsToRecover = deficitDays > 0 && monthlyRights > 0
    ? Math.ceil(deficitDays / monthlyRights)
    : 0;

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 mx-4 max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E9ECEF] px-8 py-6 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">Nouvelle Demande de Congé</h2>
            <p className="text-sm text-[#7F8C8D] mt-1">Créer une nouvelle demande de congé</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Employee Info */}
          {selectedEmployee && (
            <div className="bg-[#FFF5EC] p-4 rounded-xl border border-[#E9ECEF]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-medium">
                  {selectedEmployee.prenom?.[0]}{selectedEmployee.nom?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-[#2C3E50]">{selectedEmployee.prenom} {selectedEmployee.nom}</p>
                  <p className="text-sm text-[#7F8C8D]">{selectedEmployee.poste}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-lg font-semibold text-[#2C3E50]">
                  Solde actuel: <span className="text-green-600">{selectedEmployee.soldeConges || 0} jours</span>
                </p>
                <p className="text-sm text-[#7F8C8D]">Droits mensuels: {selectedEmployee.droitsMensuels || 0} jours/mois</p>
              </div>
            </div>
          )}

          {/* Employee Selection */}
          {!currentEmployeeId && (
            <div>
              <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
                Sélectionner l'employé
              </Label>
              <Select 
                value={formData.employeId} 
                onValueChange={(value) => setFormData({ ...formData, employeId: value })}
              >
                <SelectTrigger className={`border-[#E9ECEF] ${errors.employeId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Sélectionnez un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id?.toString() || ""}>
                      {emp.prenom} {emp.nom} - {emp.poste}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeId && <p className="text-red-500 text-sm mt-1">{errors.employeId}</p>}
            </div>
          )}

          {/* Type Selection */}
          <div>
            <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
              Type de congé
            </Label>
            <Select 
              value={formData.typeConge} 
              onValueChange={(value) => setFormData({ ...formData, typeConge: value })}
            >
              <SelectTrigger className="border-[#E9ECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
              Période
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-[#2C3E50] mb-2 block">Date de début *</Label>
                <Input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => handleDateChange("dateDebut", e.target.value)}
                  className={`border-[#E9ECEF] ${errors.dateDebut ? 'border-red-500' : ''}`}
                />
                {errors.dateDebut && <p className="text-red-500 text-sm mt-1">{errors.dateDebut}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold text-[#2C3E50] mb-2 block">Date de fin *</Label>
                <Input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => handleDateChange("dateFin", e.target.value)}
                  className={`border-[#E9ECEF] ${errors.dateFin ? 'border-red-500' : ''}`}
                />
                {errors.dateFin && <p className="text-red-500 text-sm mt-1">{errors.dateFin}</p>}
              </div>
            </div>
          </div>

          {/* Duration Preview */}
          {formData.dateDebut && formData.dateFin && (
            <p className="text-sm text-[#7F8C8D]">
              Durée calculée: <span className="font-medium text-[#2C3E50]">{duration} jour(s)</span>
            </p>
          )}

          {/* Motif */}
          <div>
            <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
              Motif
            </Label>
            <Textarea
              placeholder="Précisez le motif..."
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              className="border-[#E9ECEF] h-24"
            />
          </div>

          {/* Balance Preview */}
          {formData.dateDebut && formData.dateFin && selectedEmployee && (
            <div className="bg-[#FFF5EC] p-4 rounded-xl border-2 border-[#E67E22]">
              <p className="font-medium text-[#2C3E50] mb-2">Aperçu du solde après validation:</p>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span className="text-[#7F8C8D]">Solde actuel:</span>
                  <span className="font-medium">{selectedEmployee.soldeConges || 0} jours</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-[#7F8C8D]">Demandé:</span>
                  <span className="font-medium text-[#E67E22]">-{duration} jours</span>
                </p>
                <hr className="my-2 border-[#E9ECEF]" />
                <p className="flex justify-between text-base">
                  <span className="font-medium">Nouveau solde:</span>
                  <span className={`font-bold ${balanceAfter >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balanceAfter} jours
                  </span>
                </p>
                {balanceAfter < 0 && (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800">
                    <p className="font-medium">
                      Solde négatif autorisé: {deficitDays} jour(s) seront reportés sur les mois suivants.
                    </p>
                    {monthsToRecover > 0 ? (
                      <p className="text-sm mt-1">
                        Avec {monthlyRights} jour(s)/mois, le rattrapage prendra environ {monthsToRecover} mois.
                      </p>
                    ) : (
                      <p className="text-sm mt-1">
                        Configurez les droits mensuels de l'employé pour estimer la durée de rattrapage.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workflow Info */}
          <div className="bg-gray-50 p-4 rounded-xl border border-[#E9ECEF]">
            <p className="text-sm text-[#7F8C8D] mb-2">Workflow de validation:</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#2C3E50] font-medium">Employé</span>
              <span className="text-[#7F8C8D]">→</span>
              <span className="text-[#2C3E50]">Chef de Projet</span>
              <span className="text-[#7F8C8D]">→</span>
              <span className="text-[#2C3E50]">RH</span>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-[#E9ECEF] px-8 py-6 flex items-center justify-end gap-3 mt-4 rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              className="text-[#7F8C8D]"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#E67E22] hover:bg-[#D35400] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Soumission...
                </>
              ) : (
                "Soumettre la Demande"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
