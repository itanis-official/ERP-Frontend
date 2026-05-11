import { useState, useEffect, type FormEvent } from "react";
import { X, Loader2, AlertCircle, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { exitApi } from "../lib/exitApi";
import type { CollaborateurInterne } from "../lib/personnelApi";

interface ExitAuthorizationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  employees?: CollaborateurInterne[];
  currentEmployeeId?: number | null;
}

const motifOptions = [
  { value: "Déjeuner", label: "🍽️ Déjeuner" },
  { value: "Rendez-vous médical", label: "🏥 Rendez-vous médical" },
  { value: "Affaires personnelles", label: "💼 Affaires personnelles" },
  { value: "Courses", label: "🛒 Courses" },
  { value: "Banque", label: "🏦 Banque" },
  { value: "Autre", label: "📋 Autre" },
];

export function ExitAuthorizationForm({ 
  open, 
  onClose, 
  onSubmit,
  employees = [],
  currentEmployeeId = null,
}: ExitAuthorizationFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    employeId: currentEmployeeId ? String(currentEmployeeId) : "",
    date: new Date().toISOString().split("T")[0],
    heureSortie: "",
    heureRetour: "",
    duree: "",
    motif: "",
    details: "",
    aRecuperer: false,
    dateRecuperation: "",
    heureRecuperation: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        employeId: currentEmployeeId ? String(currentEmployeeId) : "",
        date: new Date().toISOString().split("T")[0],
        heureSortie: "",
        heureRetour: "",
        duree: "",
        motif: "",
        details: "",
        aRecuperer: false,
        dateRecuperation: "",
        heureRecuperation: "",
      });
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [open, currentEmployeeId]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const selectedEmployee = employees.find(e => String(e.id) === String(formData.employeId));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.employeId) newErrors.employeId = "L'employé est requis";
    if (!formData.date) newErrors.date = "La date est requise";
    if (!formData.heureSortie) newErrors.heureSortie = "L'heure de sortie est requise";
    if (!formData.motif) newErrors.motif = "Le motif est requis";
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
      const existingRequests = await exitApi.getByEmploye(employeId);
      const hasOpenRequest = existingRequests.some(
        (request) => request.statut !== "Rejected" && request.statut !== "Approved"
      );

      if (hasOpenRequest) {
        setSubmitError("Cet employe a deja une autorisation de sortie en cours. Veuillez attendre sa validation ou son refus avant d'en creer une autre.");
        setIsSubmitting(false);
        return;
      }

      await exitApi.create({
        employeId,
        date: formData.date,
        heureSortie: formData.heureSortie,
        heureRetour: formData.heureRetour || null,
        duree: formData.duree,
        motif: formData.motif,
        details: formData.details || null,
        aRecuperer: formData.aRecuperer,
        dateRecuperation: formData.aRecuperer ? formData.dateRecuperation : null,
        heureRecuperation: formData.aRecuperer ? formData.heureRecuperation : null,
        statut: "Pending",
      });
      onSubmit(formData);
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || error.message || "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 mx-4 max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E9ECEF] px-8 py-6 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">Nouvelle Sortie Autorisée</h2>
            <p className="text-sm text-[#7F8C8D] mt-1">Créer une nouvelle demande de sortie</p>
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
                  {employees.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">Aucun employé</div>
                  ) : (
                    employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id?.toString() || ""}>
                        {emp.prenom} {emp.nom} - {emp.poste}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.employeId && <p className="text-red-500 text-sm mt-1">{errors.employeId}</p>}
            </div>
          )}

          {/* Date et Horaires */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
                Date de sortie
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`border-[#E9ECEF] ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
                Durée
              </Label>
              <Input
                type="text"
                placeholder="Ex: 2h"
                value={formData.duree}
                onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                className="border-[#E9ECEF]"
              />
            </div>
          </div>

          {/* Horaires */}
          <div>
            <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
              Horaires
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-[#2C3E50] mb-2 block">Heure de sortie *</Label>
                <Input
                  type="time"
                  value={formData.heureSortie}
                  onChange={(e) => setFormData({ ...formData, heureSortie: e.target.value })}
                  className={`border-[#E9ECEF] ${errors.heureSortie ? 'border-red-500' : ''}`}
                />
                {errors.heureSortie && <p className="text-red-500 text-sm mt-1">{errors.heureSortie}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold text-[#2C3E50] mb-2 block">Heure de retour</Label>
                <Input
                  type="time"
                  value={formData.heureRetour}
                  onChange={(e) => setFormData({ ...formData, heureRetour: e.target.value })}
                  className="border-[#E9ECEF]"
                />
              </div>
            </div>
          </div>

          {/* Motif */}
          <div>
            <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
              Motif
            </Label>
            <Select 
              value={formData.motif} 
              onValueChange={(value) => setFormData({ ...formData, motif: value })}
            >
              <SelectTrigger className={`border-[#E9ECEF] ${errors.motif ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {motifOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.motif && <p className="text-red-500 text-sm mt-1">{errors.motif}</p>}
          </div>

          {/* Details */}
          <div>
            <Label className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-3 block">
              Détails
            </Label>
            <Textarea
              placeholder="Détails supplémentaires..."
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="border-[#E9ECEF] h-24"
            />
          </div>

          {/* Récupération */}
          <div className="bg-gray-50 p-4 rounded-xl border border-[#E9ECEF]">
            <div className="flex items-center gap-3">
              <Checkbox
                id="aRecuperer"
                checked={formData.aRecuperer}
                onCheckedChange={(checked) => setFormData({ ...formData, aRecuperer: checked as boolean })}
              />
              <Label htmlFor="aRecuperer" className="text-gray-700 font-medium cursor-pointer">
                Temps à rattraper
              </Label>
            </div>

            {formData.aRecuperer && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-sm font-semibold text-[#2C3E50] mb-2 block">
                    Date récupération
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateRecuperation}
                    onChange={(e) => setFormData({ ...formData, dateRecuperation: e.target.value })}
                    className="border-[#E9ECEF]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[#2C3E50] mb-2 block">
                    Heure récupération
                  </Label>
                  <Input
                    type="time"
                    value={formData.heureRecuperation}
                    onChange={(e) => setFormData({ ...formData, heureRecuperation: e.target.value })}
                    className="border-[#E9ECEF]"
                  />
                </div>
              </div>
            )}
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
