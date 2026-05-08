import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { X, Loader2, AlertCircle, Wifi, Home } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { teletravailApi } from "../lib/teletravailApi";
import { useModuleSelectOptions } from "../lib/selectOptionsConfig";

interface TeletravailRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  employees?: any[];
  currentEmployeeId?: number | null;
}

export function TeletravailRequestForm({ 
  open, 
  onClose, 
  onSubmit, 
  initialData,
  employees = [],
  currentEmployeeId = null,
}: TeletravailRequestFormProps) {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const teleworkTypeOptions = rhSelectOptions.teleworkTypes || []
  const defaultTeleworkType = teleworkTypeOptions[0]?.value || 'Regular'
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    employeId: initialData?.employeId || (currentEmployeeId ? String(currentEmployeeId) : ""),
    type: initialData?.type || defaultTeleworkType,
    dateDebut: initialData?.dateDebut || "",
    dateFin: initialData?.dateFin || "",
    joursParSemaine: initialData?.joursParSemaine || "1",
    joursFixes: initialData?.joursFixes || "",
    raison: initialData?.raison || "",
    typeRaison: initialData?.typeRaison || "",
    equipementFourni: initialData?.equipementFourni || false,
    vpnConfigure: initialData?.vpnConfigure || false,
    acesOutilsOk: initialData?.acesOutilsOk || false,
    horairesJoignables: initialData?.horairesJoignables || "",
    modeContact: initialData?.modeContact || "",
  });

  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.employeId) newErrors.employeId = "L'employé est requis";
    if (!formData.raison) newErrors.raison = "Le motif est requis";
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
      const existingRequests = await teletravailApi.getByEmploye(employeId);
      const hasOpenRequest = existingRequests.some(
        (request) => request.statut !== "Rejected" && request.statut !== "Approved"
      );

      if (hasOpenRequest) {
        setSubmitError("Cet employe a deja une demande de teletravail en cours. Veuillez attendre sa validation ou son refus avant d'en creer une autre.");
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        employeId,
        type: formData.type,
        dateDebut: formData.dateDebut || null,
        dateFin: formData.dateFin || null,
        joursParSemaine: parseInt(formData.joursParSemaine),
        joursFixes: formData.joursFixes || null,
        raison: formData.raison,
        typeRaison: formData.typeRaison || null,
        equipementFourni: formData.equipementFourni,
        vpnConfigure: formData.vpnConfigure,
        accesOutilsOk: formData.acesOutilsOk,
        horairesJoignables: formData.horairesJoignables || null,
        modeContact: formData.modeContact || null,
        statut: "Pending",
      };
      console.log('Submitting teletravail data:', submitData);
      await teletravailApi.create(submitData);
      onSubmit(formData);
    } catch (error: any) {
      console.error('Erreur:', error);
      console.error('Error response:', error.response?.data);
      setSubmitError(error.response?.data?.message || error.message || "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 mx-4 border border-[#f1dfd2] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f1dfd2] bg-[#fff8f2] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-[#ef7c21]" />
            <h2 className="text-2xl font-bold text-[#1d1d1b]">
              {initialData ? "Modifier demande de télétravail" : "Nouvelle demande de télétravail"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white hover:bg-[#fff3e8] text-[#7e7771] hover:text-[#1d1d1b] border border-[#f1dfd2] transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Section 1: Information Générale */}
          <div>
            <h3 className="text-lg font-bold text-[#1d1d1b] mb-4 pb-2 border-b border-[#f1dfd2]">
              Informations Générales
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {!currentEmployeeId && (
                <div>
                  <Label className="text-[#4d4742] font-semibold mb-2 block">Employé</Label>
                  <Select value={formData.employeId} onValueChange={(value) => {
                    setFormData({ ...formData, employeId: value });
                    if (errors.employeId) setErrors({ ...errors, employeId: "" });
                  }}>
                    <SelectTrigger className={errors.employeId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <div className="p-2 text-sm text-[#7e7771]">Chargement des employés...</div>
                      ) : (
                        employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.prenom} {emp.nom}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.employeId && <p className="text-red-500 text-sm mt-1">{errors.employeId}</p>}
                </div>
              )}

              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Type de Télétravail</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teleworkTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Période et Fréquence */}
          <div>
            <h3 className="text-lg font-bold text-[#1d1d1b] mb-4 pb-2 border-b border-[#f1dfd2]">
              Période et Fréquence
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Date de Début</Label>
                <Input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  className={errors.dateDebut ? "border-red-500" : ""}
                />
              </div>

              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Date de Fin</Label>
                <Input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Jours par Semaine</Label>
                <Select value={formData.joursParSemaine} onValueChange={(value) => setFormData({ ...formData, joursParSemaine: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        {day} jour{day > 1 ? 's' : ''} par semaine
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Jours Fixes (optionnel)</Label>
                <Input
                  type="text"
                  placeholder="Ex: lundi, mercredi, vendredi"
                  value={formData.joursFixes}
                  onChange={(e) => setFormData({ ...formData, joursFixes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Motif */}
          <div>
            <h3 className="text-lg font-bold text-[#1d1d1b] mb-4 pb-2 border-b border-[#f1dfd2]">
              Motif
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-[#4d4742] font-semibold mb-2 block">Motif de la Demande</Label>
                <textarea
                  value={formData.raison}
                  onChange={(e) => {
                    setFormData({ ...formData, raison: e.target.value });
                    if (errors.raison) setErrors({ ...errors, raison: "" });
                  }}
                  placeholder="Décrivez le motif de votre demande de télétravail..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef7c21] focus:border-[#ef7c21] ${errors.raison ? "border-red-500" : "border-[#e7d8ca]"}`}
                />
                {errors.raison && <p className="text-red-500 text-sm mt-1">{errors.raison}</p>}
              </div>

              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Type de Motif (optionnel)</Label>
                <Input
                  type="text"
                  placeholder="Ex: Personnelle, Santé, Productivité"
                  value={formData.typeRaison}
                  onChange={(e) => setFormData({ ...formData, typeRaison: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Infrastructure */}
          <div>
            <h3 className="text-lg font-bold text-[#1d1d1b] mb-4 pb-2 border-b border-[#f1dfd2]">
              Infrastructure et Équipement
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="equipement"
                  checked={formData.equipementFourni}
                  onCheckedChange={(checked) => setFormData({ ...formData, equipementFourni: checked as boolean })}
                />
                <Label htmlFor="equipement" className="text-[#4d4742] font-medium cursor-pointer">
                  Équipement fourni par l'entreprise
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="vpn"
                  checked={formData.vpnConfigure}
                  onCheckedChange={(checked) => setFormData({ ...formData, vpnConfigure: checked as boolean })}
                />
                <Label htmlFor="vpn" className="text-[#4d4742] font-medium cursor-pointer flex items-center gap-2">
                  <Wifi size={16} /> VPN configuré
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="outils"
                  checked={formData.acesOutilsOk}
                  onCheckedChange={(checked) => setFormData({ ...formData, acesOutilsOk: checked as boolean })}
                />
                <Label htmlFor="outils" className="text-[#4d4742] font-medium cursor-pointer">
                  Accès aux outils OK
                </Label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Horaires Joignables (optionnel)</Label>
                <Input
                  type="text"
                  placeholder="Ex: 9h-12h, 14h-17h"
                  value={formData.horairesJoignables}
                  onChange={(e) => setFormData({ ...formData, horairesJoignables: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[#4d4742] font-semibold mb-2 block">Mode de Contact (optionnel)</Label>
                <Input
                  type="text"
                  placeholder="Ex: Email, Teams, Téléphone"
                  value={formData.modeContact}
                  onChange={(e) => setFormData({ ...formData, modeContact: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[#f1dfd2]">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#ef7c21] hover:bg-[#d96813] text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Soumission...
                </>
              ) : (
                "Soumettre"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
