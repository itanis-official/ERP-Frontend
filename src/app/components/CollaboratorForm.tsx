import { useState, useEffect, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { X, CheckCircle, FileText, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { contractorsApi, type CollaborateurExterne } from "../lib/contractorsApi";
import { countryOptions, currencyOptions, getCitiesByCountryName, normalizeCountryName } from "../lib/referenceData";
import { useModuleSelectOptions } from "../lib/selectOptionsConfig";

interface CollaboratorFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: CollaborateurExterne;
}

export function CollaboratorForm({ open, onClose, onSubmit, initialData }: CollaboratorFormProps) {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const getDefaultData = () => ({
    nom: initialData?.nom || "",
    prenom: initialData?.prenom || "",
    email: initialData?.email || "",
    telephone: initialData?.telephone || "",
    poste: initialData?.poste || "",
    departement: initialData?.departement || "",
    dateDebut: initialData?.dateDebut || new Date().toISOString().split("T")[0],
    statut: initialData?.statut || "actif",
    role: "Sous-traitant",
    matricule: initialData?.matricule || `SUB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    cin: initialData?.cin || "",
    dateNaissance: initialData?.dateNaissance || "",
    genre: initialData?.genre || "",
    nationalite: normalizeCountryName(initialData?.nationalite || "Tunisie"),
    telephoneSecondaire: initialData?.telephoneSecondaire || "",
    adresse: initialData?.adresse || "",
    codePostal: initialData?.codePostal || "",
    ville: initialData?.ville || "",
    gouvernorat: initialData?.gouvernorat || "",
    pays: normalizeCountryName(initialData?.pays || "Tunisie"),
    societeOrigine: initialData?.societeOrigine || "",
    mission: initialData?.mission || "",
    dureeMission: initialData?.dureeMission || "",
    tauxJournalier: initialData?.tauxJournalier || "",
    tauxHoraire: initialData?.tauxHoraire || "",
    devise: initialData?.devise || "EUR",
    dateFinMission: initialData?.dateFinMission || "",
    missionRenouvelable: initialData?.missionRenouvelable || false,
    numeroContratSoustraitance: initialData?.numeroContratSoustraitance || "",
  });

  const [formData, setFormData] = useState(getDefaultData());
  const cityOptions = getCitiesByCountryName(formData.pays);

  useEffect(() => {
    if (open) {
      setFormData(getDefaultData());
      setCvFile(null);
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  if (!open) return null;

  const handleCVUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setCvFile(file);
      setCvUploading(true);

      // Simulate CV extraction
      setTimeout(() => {
        setCvUploading(false);
      }, 2000);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setCvFile(file);
      setCvUploading(true);
      setTimeout(() => {
        setCvUploading(false);
      }, 2000);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.nom) newErrors.nom = "Nom requis";
    if (!formData.prenom) newErrors.prenom = "Prénom requis";
    if (!formData.email) newErrors.email = "Email requis";
    if (!formData.telephone) newErrors.telephone = "Téléphone requis";
    if (!formData.poste) newErrors.poste = "Poste requis";
    if (!formData.societeOrigine) newErrors.societeOrigine = "Société d'origine requise";
    if (!formData.tauxJournalier) newErrors.tauxJournalier = "Taux journalier requis";
    if (!formData.dateFinMission) newErrors.dateFinMission = "Date fin de mission requise";
    if (!formData.numeroContratSoustraitance) newErrors.numeroContratSoustraitance = "Numéro contrat requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const apiData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        poste: formData.poste,
        departement: formData.departement,
        dateDebut: formData.dateDebut,
        statut: formData.statut,
        role: formData.role,
        matricule: formData.matricule,
        cin: formData.cin || null,
        dateNaissance: formData.dateNaissance || null,
        genre: formData.genre || null,
        nationalite: formData.nationalite,
        telephoneSecondaire: formData.telephoneSecondaire || null,
        adresse: formData.adresse || null,
        codePostal: formData.codePostal || null,
        ville: formData.ville || null,
        gouvernorat: formData.gouvernorat || null,
        pays: formData.pays,
        societeOrigine: formData.societeOrigine,
        mission: formData.mission || null,
        dureeMission: parseInt(formData.dureeMission) || 0,
        tauxJournalier: parseFloat(formData.tauxJournalier) || 0,
        tauxHoraire: formData.tauxHoraire ? parseFloat(formData.tauxHoraire) : null,
        devise: formData.devise,
        dateFinMission: formData.dateFinMission,
        missionRenouvelable: formData.missionRenouvelable,
        fichierCV: cvFile?.name || "",
        numeroContratSoustraitance: formData.numeroContratSoustraitance,
      };

      if (initialData?.id) {
        await contractorsApi.update(initialData.id, apiData);
      } else {
        await contractorsApi.create(apiData);
      }

      onSubmit({ ...formData, success: true });
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setSubmitError(error.response?.data?.message || "Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-[#2C3E50]">
            {initialData ? 'Modifier' : 'Ajouter'} un Sous-traitant
          </h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Section 1: Informations Personnelles */}
          <div>
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4 pb-2 border-b border-[#E9ECEF]">
              Informations Personnelles
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={errors.nom ? "border-red-500" : ""}
                  placeholder="Dupont"
                />
                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className={errors.prenom ? "border-red-500" : ""}
                  placeholder="Marie"
                />
                {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="marie@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className={errors.telephone ? "border-red-500" : ""}
                  placeholder="+216 71 123 456"
                />
                {errors.telephone && <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Téléphone Secondaire</Label>
                <Input
                  value={formData.telephoneSecondaire}
                  onChange={(e) => setFormData({ ...formData, telephoneSecondaire: e.target.value })}
                  placeholder="+216 71 234 567"
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Matricule <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">CIN</Label>
                <Input
                  value={formData.cin}
                  onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                  placeholder="12345678"
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Date de Naissance</Label>
                <Input
                  type="date"
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Genre</Label>
                <Select value={formData.genre} onValueChange={(value) => setFormData({ ...formData, genre: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rhSelectOptions.genderOptions || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Nationalité</Label>
                <Select value={formData.nationalite} onValueChange={(value) => setFormData({ ...formData, nationalite: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une nationalite" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((country) => (
                      <SelectItem key={country.isoCode} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Adresse */}
          <div>
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4 pb-2 border-b border-[#E9ECEF]">
              Adresse
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Adresse</Label>
                <Input
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="123 Rue de l'Exemple"
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Code Postal</Label>
                <Input
                  value={formData.codePostal}
                  onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                  placeholder="1000"
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Ville</Label>
                <Select value={formData.ville} onValueChange={(value) => setFormData({ ...formData, ville: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((cityName) => (
                      <SelectItem key={cityName} value={cityName}>
                        {cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Gouvernorat</Label>
                <Input
                  value={formData.gouvernorat}
                  onChange={(e) => setFormData({ ...formData, gouvernorat: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Pays</Label>
                <Select value={formData.pays} onValueChange={(value) => setFormData({ ...formData, pays: value, ville: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((country) => (
                      <SelectItem key={country.isoCode} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 3: Informations Professionnelles */}
          <div>
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4 pb-2 border-b border-[#E9ECEF]">
              Informations Professionnelles
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Poste <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  className={errors.poste ? "border-red-500" : ""}
                  placeholder="Consultant"
                />
                {errors.poste && <p className="text-red-500 text-sm mt-1">{errors.poste}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Département</Label>
                <Select value={formData.departement} onValueChange={(value) => setFormData({ ...formData, departement: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rhSelectOptions.departments || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Société d'Origine <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.societeOrigine}
                  onChange={(e) => setFormData({ ...formData, societeOrigine: e.target.value })}
                  className={errors.societeOrigine ? "border-red-500" : ""}
                  placeholder="TechCorp Solutions"
                />
                {errors.societeOrigine && <p className="text-red-500 text-sm mt-1">{errors.societeOrigine}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Mission</Label>
                <Input
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="Développement ERP"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Détails Mission */}
          <div>
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4 pb-2 border-b border-[#E9ECEF]">
              Détails de la Mission
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Durée Mission (jours) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.dureeMission}
                  onChange={(e) => setFormData({ ...formData, dureeMission: e.target.value })}
                  className={errors.dureeMission ? "border-red-500" : ""}
                  placeholder="30"
                />
                {errors.dureeMission && <p className="text-red-500 text-sm mt-1">{errors.dureeMission}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Taux Journalier <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.tauxJournalier}
                    onChange={(e) => setFormData({ ...formData, tauxJournalier: e.target.value })}
                    className={errors.tauxJournalier ? "border-red-500" : ""}
                    placeholder="100"
                  />
                  <Select value={formData.devise} onValueChange={(value) => setFormData({ ...formData, devise: value })}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currencyCode) => (
                        <SelectItem key={currencyCode} value={currencyCode}>
                          {currencyCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.tauxJournalier && <p className="text-red-500 text-sm mt-1">{errors.tauxJournalier}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Taux Horaire</Label>
                <Input
                  type="number"
                  value={formData.tauxHoraire}
                  onChange={(e) => setFormData({ ...formData, tauxHoraire: e.target.value })}
                  placeholder="15"
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Date Début <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Date Fin Mission <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.dateFinMission}
                  onChange={(e) => setFormData({ ...formData, dateFinMission: e.target.value })}
                  className={errors.dateFinMission ? "border-red-500" : ""}
                />
                {errors.dateFinMission && <p className="text-red-500 text-sm mt-1">{errors.dateFinMission}</p>}
              </div>

              <div className="flex items-end pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.missionRenouvelable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, missionRenouvelable: checked as boolean })
                    }
                  />
                  <Label className="text-[#7F8C8D] font-normal">Mission renouvelable</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Contrat */}
          <div>
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4 pb-2 border-b border-[#E9ECEF]">
              Contrat de Sous-traitance
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Numéro Contrat <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.numeroContratSoustraitance}
                  onChange={(e) => setFormData({ ...formData, numeroContratSoustraitance: e.target.value })}
                  className={errors.numeroContratSoustraitance ? "border-red-500" : ""}
                  placeholder="CONT-2026-001"
                />
                {errors.numeroContratSoustraitance && (
                  <p className="text-red-500 text-sm mt-1">{errors.numeroContratSoustraitance}</p>
                )}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(rhSelectOptions.employeeStatuses || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 6: CV */}
          <div>
            <h3 className="text-lg font-bold text-[#2C3E50] mb-4 pb-2 border-b border-[#E9ECEF]">
              CV du Sous-traitant
            </h3>

            {!cvFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 hover:border-[#E67E22] rounded-xl p-8 text-center transition-colors cursor-pointer"
                onClick={() => document.getElementById("cv-upload")?.click()}
              >
                <FileText className="mx-auto mb-4 text-gray-400" size={64} />
                <p className="text-gray-700 font-medium mb-1">Glissez le CV ici ou cliquez pour parcourir</p>
                <p className="text-sm text-gray-500">PDF uniquement, max 10MB</p>
                <input
                  id="cv-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleCVUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="text-[#E67E22]" size={32} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{cvFile.name}</p>
                    <p className="text-sm text-gray-500">{(cvFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                {cvUploading && (
                  <div className="flex items-center gap-2 text-[#E67E22]">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Téléchargement en cours...</span>
                  </div>
                )}
                {!cvUploading && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-sm">CV prêt</span>
                  </div>
                )}
              </div>
            )}
            {errors.cv && <p className="text-red-500 text-sm mt-1">{errors.cv}</p>}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div className="text-red-600 font-bold">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-red-800">Erreur de sauvegarde</p>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#E67E22] hover:bg-[#D35400] text-white px-6 min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  {initialData ? 'Modifier' : 'Créer'} Sous-traitant
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
