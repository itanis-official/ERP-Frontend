import { useState, useEffect, type ChangeEvent } from "react";
import {
  X,
  Upload,
  CheckCircle,
  FileText,
  Loader2,
  Camera,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { personnelApi, type CollaborateurInterne } from "../lib/personnelApi";
import { countryOptions, currencyOptions, getCitiesByCountryName, normalizeCountryName } from "../lib/referenceData";
import { useModuleSelectOptions } from "../lib/selectOptionsConfig";

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  mode?: "create" | "edit";
}

type EmployeeType = "interne" | "externe";
type ContractType = "CDI" | "CDD" | "Stage" | "Intérim" | "Freelance";
type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1: Identity
  photo: File | null;
  matricule: string;
  type: EmployeeType;
  nom: string;
  prenom: string;
  cin: string;
  dateNaissance: string;
  genre: string;
  situationFamiliale: string;
  nationalite: string;
  emailPro: string;
  emailPerso: string;
  telephonePrincipal: string;
  telephoneSecondaire: string;
  adresse: string;
  codePostal: string;
  ville: string;
  gouvernorat: string;
  pays: string;

  // Step 2: Contract
  typeContrat: ContractType;
  cnss: string;
  dateDebut: string;
  dateFin: string;
  dateEmbauche: string;
  periodeEssai: number;
  periodeEssaiUnit: string;
  dateConfirmation: string;
  departement: string;
  poste: string;
  manager: string;
  niveauHierarchique: string;
  salaireBrut: string;
  devise: string;
  confidentiel: boolean;
  heureDebut: string;
  heureFin: string;
  joursTravailes: string[];
  horairesFlexibles: boolean;

  // Step 3: Leave & Documents
  soldeCongesInitial: number;
  droitsMensuels: number;
  dateDebutAcquisition: string;
  teletravaAilAutorise: boolean;
  joursTeeletravailParSemaine: number;
  joursFixesTeletravail: string[];
  ticketRestaurant: boolean;
  montantTicket: string;
  transport: boolean;
  montantTransport: string;
  assuranceSante: boolean;
  typeAssurance: string;
  organismeAssurance: string;
  numeroPoliceSante: string;
  autresAvantages: boolean;
  descriptionAvantages: string;

  // Documents
  cv: File | null;
  cin_doc: File | null;
  attestationCnss: File | null;
  diplomes: File[];
  contratSigne: File | null;
  autresDocuments: File[];

  // Collaborateur Externe specific
  societeOrigine: string;
  numeroContratSousTraitance: string;
  dureeMission: number;
  tauxJournalierMensuel: string;
  typeRate: "journalier" | "mensuel";
  dateFinMission: string;
  renouvellement: boolean;

  // Step 4: Confirmation
  notes: string;
}

export function EmployeeFormMultiStep({ open, onClose, onSubmit, initialData, mode = "create" }: EmployeeFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const getDefaultData = (): FormData => ({
    photo: null,
    matricule: initialData?.matricule || `EMP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    type: initialData?.type || "interne",
    nom: initialData?.nom || "",
    prenom: initialData?.prenom || "",
    cin: initialData?.cin || "",
    dateNaissance: initialData?.dateNaissance || "",
    genre: initialData?.genre || "",
    situationFamiliale: initialData?.situationFamiliale || "",
    nationalite: normalizeCountryName(initialData?.nationalite || "Tunisie"),
    emailPro: initialData?.emailPro || "",
    emailPerso: initialData?.emailPerso || "",
    telephonePrincipal: initialData?.telephonePrincipal || "",
    telephoneSecondaire: initialData?.telephoneSecondaire || "",
    adresse: initialData?.adresse || "",
    codePostal: initialData?.codePostal || "",
    ville: initialData?.ville || "",
    gouvernorat: initialData?.gouvernorat || "",
    pays: normalizeCountryName(initialData?.pays || "Tunisie"),

    typeContrat: initialData?.typeContrat || "CDI",
    cnss: initialData?.cnss || "",
    dateDebut: initialData?.dateDebut || "",
    dateFin: initialData?.dateFin || "",
    dateEmbauche: initialData?.dateEmbauche || new Date().toISOString().split("T")[0],
    periodeEssai: initialData?.periodeEssai || 3,
    periodeEssaiUnit: initialData?.periodeEssaiUnit || "mois",
    dateConfirmation: initialData?.dateConfirmation || "",
    departement: initialData?.departement || "",
    poste: initialData?.poste || "",
    manager: initialData?.manager || "",
    niveauHierarchique: initialData?.niveauHierarchique || "",
    salaireBrut: initialData?.salaireBrut || "",
    devise: initialData?.devise || "TND",
    confidentiel: initialData?.confidentiel ?? true,
    heureDebut: initialData?.heureDebut || "09:00",
    heureFin: initialData?.heureFin || "18:00",
    joursTravailes: initialData?.joursTravailes || ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
    horairesFlexibles: initialData?.horairesFlexibles ?? false,

    soldeCongesInitial: initialData?.soldeCongesInitial || 0,
    droitsMensuels: initialData?.droitsMensuels || 2,
    dateDebutAcquisition: initialData?.dateDebutAcquisition || new Date().toISOString().split("T")[0],
    teletravaAilAutorise: initialData?.teletravaAilAutorise || false,
    joursTeeletravailParSemaine: initialData?.joursTeeletravailParSemaine || 2,
    joursFixesTeletravail: initialData?.joursFixesTeletravail || [],
    ticketRestaurant: initialData?.ticketRestaurant || false,
    montantTicket: initialData?.montantTicket || "",
    transport: initialData?.transport || false,
    montantTransport: initialData?.montantTransport || "",
    assuranceSante: initialData?.assuranceSante || false,
    typeAssurance: initialData?.typeAssurance || "",
    organismeAssurance: initialData?.organismeAssurance || "",
    numeroPoliceSante: initialData?.numeroPoliceSante || "",
    autresAvantages: initialData?.autresAvantages || false,
    descriptionAvantages: initialData?.descriptionAvantages || "",

    cv: null,
    cin_doc: null,
    attestationCnss: null,
    diplomes: initialData?.diplomes || [],
    contratSigne: null,
    autresDocuments: initialData?.autresDocuments || [],

    societeOrigine: initialData?.societeOrigine || "",
    numeroContratSousTraitance: initialData?.numeroContratSousTraitance || "",
    dureeMission: initialData?.dureeMission || 6,
    tauxJournalierMensuel: initialData?.tauxJournalierMensuel || "",
    typeRate: initialData?.typeRate || "journalier",
    dateFinMission: initialData?.dateFinMission || "",
    renouvellement: initialData?.renouvellement || false,

    notes: initialData?.notes || "",
  });

  const [formData, setFormData] = useState<FormData>(getDefaultData());

  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo || null);
  const [cvExtracting, setCvExtracting] = useState(false);
  const [cvExtracted, setCvExtracted] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(getDefaultData());
      setCurrentStep(1);
      setPhotoPreview(initialData?.photo || null);
      setCvExtracted(false);
      setValidationError(null);
      setSuccessMessage(false);
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

  const stepLabels = ["Identite", "Contrat", "Documents", "Confirmation"];
  const progressPercent = ((currentStep - 1) / 3) * 100;

  // Photo handling
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // CV extraction simulation
  const handleCvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData.type === "externe") {
      setFormData({ ...formData, cv: file });
      setCvExtracting(true);

      setTimeout(() => {
        setCvExtracting(false);
        setCvExtracted(true);
        setFormData((prev) => ({
          ...prev,
          nom: "Saidi",
          prenom: "Ahmed",
          emailPro: "ahmed.saidi@techconsult.com",
          telephonePrincipal: "+216 98 765 432",
          poste: "Developer Backend",
          societeOrigine: "TechConsult SA",
        }));
      }, 2000);
    }
  };

  // Validation
  const validateStep = (step: Step): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (step === 1) {
      if (formData.nom.trim() === "") errors.push("Nom");
      if (formData.prenom.trim() === "") errors.push("Prénom");
      if (formData.cin.trim() === "") errors.push("CIN/Passeport");
      if (formData.dateNaissance === "") errors.push("Date de naissance");
      if (formData.genre === "") errors.push("Genre");
      if (formData.emailPro.trim() === "") errors.push("Email professionnel");
      
      return { valid: errors.length === 0, errors };
    }
    
    if (step === 2) {
      if (!formData.typeContrat) errors.push("Type de contrat");
      if (formData.cnss.trim() === "") errors.push("Numéro CNSS");
      if (formData.dateEmbauche === "") errors.push("Date d'embauche");
      if (formData.departement === "") errors.push("Département");
      if (formData.poste.trim() === "") errors.push("Poste");
      
      return { valid: errors.length === 0, errors };
    }
    
    return { valid: true, errors: [] };
  };

  const handleNextStep = () => {
    const validation = validateStep(currentStep);
    
    if (validation.valid) {
      setValidationError(null);
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as Step);
      }
    } else {
      setValidationError(`Veuillez compléter: ${validation.errors.join(", ")}`);
      // Auto-hide error after 4 seconds
      setTimeout(() => setValidationError(null), 4000);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const mapFormDataToApi = (): Omit<CollaborateurInterne, 'id' | 'createdAt' | 'updatedAt'> => {
    const joursTravaillesStr = Array.isArray(formData.joursTravailes) 
      ? formData.joursTravailes.join(',') 
      : formData.joursTravailes;
    
    return {
      matricule: formData.matricule,
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.emailPro,
      telephone: formData.telephonePrincipal,
      poste: formData.poste,
      typeEmploye: formData.poste || 'Employe',
      departement: formData.departement,
      statut: 'actif',
      role: 'Employee',
      photo: photoPreview,
      cin: formData.cin,
      dateNaissance: formData.dateNaissance,
      genre: formData.genre,
      nationalite: formData.nationalite,
      situationFamiliale: formData.genre,
      adresse: formData.adresse,
      codePostal: formData.codePostal,
      ville: formData.ville,
      gouvernorat: formData.gouvernorat,
      pays: formData.pays,
      emailPersonnel: formData.emailPerso,
      telephoneSecondaire: formData.telephoneSecondaire,
      typeContrat: formData.typeContrat,
      numeroCNSS: formData.cnss,
      dateEmbauche: formData.dateEmbauche,
      periodeEssai: formData.periodeEssai,
      dateConfirmation: formData.dateConfirmation || null,
      niveauHierarchique: formData.niveauHierarchique,
      salaireBrut: parseFloat(formData.salaireBrut) || 0,
      devise: formData.devise,
      horaireDebut: formData.heureDebut,
      horaireFin: formData.heureFin,
      joursTravailles: joursTravaillesStr,
      teleTravailAutorise: formData.teletravaAilAutorise,
      joursParSemaine: formData.joursTeeletravailParSemaine,
      soldeConges: formData.soldeCongesInitial,
      droitsMensuels: formData.droitsMensuels,
      dateDebutAcquisition: formData.dateDebutAcquisition,
      ticketRestaurant: formData.ticketRestaurant,
      montantTicket: parseFloat(formData.montantTicket) || 0,
      transport: formData.transport,
      montantTransport: parseFloat(formData.montantTransport) || 0,
      assuranceSante: formData.assuranceSante,
      typeAssurance: formData.typeAssurance,
      organismeAssurance: formData.organismeAssurance,
      numeroPoliceSante: formData.numeroPoliceSante,
      chefProjetId: null,
      managerId: null,
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const apiData = mapFormDataToApi();
      
      if (mode === 'edit' && initialData?.id) {
        await personnelApi.update(initialData.id, apiData);
      } else {
        await personnelApi.create(apiData);
      }

      setSuccessMessage(true);
      setTimeout(() => {
        onSubmit({ ...formData, success: true });
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setSubmitError(error.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde');
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
      <div className={`itanis-employee-modal my-8 max-h-[88vh] w-full max-w-[640px] overflow-y-auto rounded-2xl border border-[#E8E1DA] bg-white shadow-xl transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-[#EFE8E1] bg-white px-6 py-5">
          <div>
            <h1 className="text-[24px] font-medium text-[#2F2A26]">
              {formData.type === "interne" ? "Nouvel Employé Interne" : "Nouveau Collaborateur Externe"}
            </h1>
            <p className="mt-1 text-[13px] text-[#857B72]">
              Étape {currentStep} de 4 - {currentStep === 1 ? "Identité" : currentStep === 2 ? "Contrat & Poste" : currentStep === 3 ? "Congés & Documents" : "Confirmation"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#857B72] transition-colors hover:text-[#E07B2A]"
          >
            <X size={22} />
          </button>
        </div>

        {/* Progress Stepper */}
        <div className="border-b border-[#EFE8E1] px-6 py-5">
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as const).map((step) => (
              <div key={step} className="flex flex-col items-center gap-2 text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-medium transition-all ${
                    currentStep > step
                      ? "bg-green-500 text-white"
                      : currentStep === step
                        ? "bg-[#E07B2A] text-white"
                        : "bg-[#E5E2DE] text-[#8B837B]"
                  }`}
                >
                  {currentStep > step ? <CheckCircle size={15} /> : step}
                </div>
                <span className={`text-[12px] ${currentStep === step ? "font-medium text-[#2F2A26]" : "text-[#8B837B]"}`}>
                  {stepLabels[step - 1]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E8E3DD]">
            <div className="h-full rounded-full bg-[#E07B2A] transition-all duration-300 ease-out" style={{ inlineSize: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-8 p-6">
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div className="text-red-600 font-bold">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-red-800">Champs obligatoires manquants</p>
                <p className="text-sm text-red-700 mt-1">{validationError}</p>
              </div>
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div className="text-red-600 font-bold">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-red-800">Erreur de sauvegarde</p>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  {mode === 'edit' ? 'Employé modifié avec succès !' : 'Employé créé avec succès !'}
                </p>
              </div>
            </div>
          )}
          {currentStep === 1 && <Step1 formData={formData} setFormData={setFormData} photoPreview={photoPreview} handlePhotoUpload={handlePhotoUpload} />}
          {currentStep === 2 && <Step2 formData={formData} setFormData={setFormData} />}
          {currentStep === 3 && <Step3 formData={formData} setFormData={setFormData} handleCvUpload={handleCvUpload} cvExtracted={cvExtracted} cvExtracting={cvExtracting} />}
          {currentStep === 4 && <Step4 formData={formData} setFormData={setFormData} />}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-[#EFE8E1] bg-white px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="h-9 rounded-md border-[#DDD5CD] px-4 text-[#6E655E]">
            Annuler
          </Button>

          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || isSubmitting}
              className="h-9 rounded-md border-[#DDD5CD] px-4 text-[#6E655E]"
            >
              ← Précédent
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="h-9 rounded-md bg-[#E07B2A] px-4 text-white hover:bg-[#C7661B]"
              >
                Suivant →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-9 min-w-[180px] rounded-md bg-[#E07B2A] text-white hover:bg-[#C7661B]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Enregistrement...
                  </>
                ) : (
                  <>✓ {mode === 'edit' ? 'Modifier' : 'Créer'} le Collaborateur</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Identity
function Step1({ formData, setFormData, photoPreview, handlePhotoUpload }: any) {
  const rhSelectOptions = useModuleSelectOptions('rh')
  const cityOptions = getCitiesByCountryName(formData.pays);

  return (
    <div className="space-y-8">
      {/* Photo & Matricule Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Photo Upload */}
        <div>
          <label className="mb-2 block text-[12px] font-medium text-[#5E5650]">Photo</label>
          <div className="relative w-full">
            <div className="flex h-[120px] w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-[#D6CEC7] bg-[#FBF9F7] transition-colors hover:border-[#E07B2A]" onClick={() => document.getElementById('photo-upload')?.click()}>
              {photoPreview ? (
                <img src={photoPreview} alt="Apercu" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera size={20} className="mx-auto text-[#8B837B]" />
                  <p className="mt-1 text-[11px] text-[#8B837B]">Ajouter une photo</p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
          </div>
        </div>

        {/* Matricule */}
        <div>
          <Label className="mb-2 block text-[12px] font-medium text-[#5E5650]">Matricule <span className="text-[#E07B2A]">*</span></Label>
          <Input
            value={formData.matricule}
            onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
            className="border-[#E9ECEF]"
          />
          <p className="mt-2 text-[12px] text-[#8B837B]">Genere automatiquement</p>
        </div>
      </div>

      {/* Identity Fields */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Informations Personnelles</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Nom *</Label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Prénom *</Label>
            <Input
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
        </div>
      </div>

      {/* Identity Documents */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Documents d'Identité</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">CIN/Passeport *</Label>
            <Input
              value={formData.cin}
              onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
              placeholder="12345678"
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Date de Naissance *</Label>
            <Input
              type="date"
              value={formData.dateNaissance}
              onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Informations Personnelles</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Genre *</Label>
            <Select value={formData.genre} onValueChange={(val) => setFormData({ ...formData, genre: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {(rhSelectOptions.employeeGenderOptions || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Situation Familiale</Label>
            <Select value={formData.situationFamiliale} onValueChange={(val) => setFormData({ ...formData, situationFamiliale: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {(rhSelectOptions.maritalStatuses || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Nationalité *</Label>
            <Select value={formData.nationalite} onValueChange={(val) => setFormData({ ...formData, nationalite: val })}>
              <SelectTrigger>
                <SelectValue />
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

      {/* Contact Info */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Coordonnées</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Email Professionnel *</Label>
            <Input
              type="email"
              value={formData.emailPro}
              onChange={(e) => setFormData({ ...formData, emailPro: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Email Personnel</Label>
            <Input
              type="email"
              value={formData.emailPerso}
              onChange={(e) => setFormData({ ...formData, emailPerso: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Téléphone Principal *</Label>
            <Input
              type="tel"
              value={formData.telephonePrincipal}
              onChange={(e) => setFormData({ ...formData, telephonePrincipal: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Téléphone Secondaire</Label>
            <Input
              type="tel"
              value={formData.telephoneSecondaire}
              onChange={(e) => setFormData({ ...formData, telephoneSecondaire: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Adresse</h2>
        <div className="space-y-4">
          <Textarea
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            placeholder="Numéro, rue, bâtiment, étage..."
            className="border-[#E9ECEF]"
          />
          <div className="grid grid-cols-4 gap-4">
            <Input
              value={formData.codePostal}
              onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
              placeholder="Code Postal"
              className="border-[#E9ECEF]"
            />
            <Select value={formData.ville} onValueChange={(val) => setFormData({ ...formData, ville: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((cityName) => (
                  <SelectItem key={cityName} value={cityName}>
                    {cityName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formData.gouvernorat} onValueChange={(val) => setFormData({ ...formData, gouvernorat: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                {(rhSelectOptions.governorates || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formData.pays} onValueChange={(val) => setFormData({ ...formData, pays: val, ville: "" })}>
              <SelectTrigger>
                <SelectValue />
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
    </div>
  );
}

// Step 2: Contract & Position
function Step2({ formData, setFormData }: any) {
  const rhSelectOptions = useModuleSelectOptions('rh')
  return (
    <div className="space-y-8">
      {/* Contract Type */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Informations Contractuelles</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Type de Contrat *</Label>
            <Select value={formData.typeContrat} onValueChange={(val) => setFormData({ ...formData, typeContrat: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(rhSelectOptions.contractTypes || [])
                  .filter((option) => formData.type === 'externe' || option.value !== 'Freelance')
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Numéro CNSS *</Label>
            <Input
              value={formData.cnss}
              onChange={(e) => setFormData({ ...formData, cnss: e.target.value })}
              placeholder="XXX-XXX-XXX"
              className="border-[#E9ECEF]"
            />
            <p className="text-xs text-[#7F8C8D] mt-1">Caisse Nationale de Sécurité Sociale</p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Dates Importantes</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Date d'Embauche *</Label>
            <Input
              type="date"
              value={formData.dateEmbauche}
              onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Période d'Essai</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={formData.periodeEssai}
                onChange={(e) => setFormData({ ...formData, periodeEssai: Number(e.target.value) })}
                className="border-[#E9ECEF]"
              />
              <Select value={formData.periodeEssaiUnit} onValueChange={(val) => setFormData({ ...formData, periodeEssaiUnit: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(rhSelectOptions.trialUnits || []).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Date de Confirmation</Label>
            <Input
              type="date"
              value={formData.dateConfirmation}
              onChange={(e) => setFormData({ ...formData, dateConfirmation: e.target.value })}
              className="border-[#E9ECEF] bg-gray-50"
            />
            <p className="text-xs text-[#7F8C8D] mt-1">Auto-calculée</p>
          </div>
        </div>
      </div>

      {/* Hourly Rate */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Rémunération</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Taux Horaire (€/h)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8C8D]">€</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate || ""}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="25.00"
                className="pl-8 border-[#E9ECEF]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Organization */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Organisation</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Département *</Label>
            <Select value={formData.departement} onValueChange={(val) => setFormData({ ...formData, departement: val })}>
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
            <Label className="text-sm font-semibold mb-2 block">Poste *</Label>
            <Input
              value={formData.poste}
              onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
              placeholder="Ex: Développeur Full Stack"
              className="border-[#E9ECEF]"
            />
          </div>
        </div>
      </div>

      {/* Hierarchy */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Hiérarchie</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Manager / Chef de Projet</Label>
            <Select value={formData.manager} onValueChange={(val) => setFormData({ ...formData, manager: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {(rhSelectOptions.managerNames || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Niveau Hiérarchique</Label>
            <Select value={formData.niveauHierarchique} onValueChange={(val) => setFormData({ ...formData, niveauHierarchique: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {(rhSelectOptions.hierarchyLevels || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Salary - Confidential Section */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-red-700 mb-4">⚠️ SECTION CONFIDENTIELLE - Visible uniquement par Admin et RH</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Salaire Brut Mensuel *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8C8D]">
                {formData.devise === "TND" ? "د.ت" : "€"}
              </span>
              <Input
                type="number"
                value={formData.salaireBrut}
                onChange={(e) => setFormData({ ...formData, salaireBrut: e.target.value })}
                placeholder="0.00"
                className="pl-8 border-[#E9ECEF]"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Devise</Label>
            <Select value={formData.devise} onValueChange={(val) => setFormData({ ...formData, devise: val })}>
              <SelectTrigger>
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
          <div>
            <Label className="text-sm font-semibold mb-2 block">Confidentialité</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.confidentiel}
                onChange={(e) => setFormData({ ...formData, confidentiel: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-[#2C3E50]">Confidentiel</span>
            </label>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Horaires de Travail</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Heure de Début</Label>
            <Input
              type="time"
              value={formData.heureDebut}
              onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Heure de Fin</Label>
            <Input
              type="time"
              value={formData.heureFin}
              onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold mb-2 block">Jours Travaillés</Label>
          <div className="flex gap-3 flex-wrap">
            {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
              <label key={day} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.joursTravailes.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, joursTravailes: [...formData.joursTravailes, day] });
                    } else {
                      setFormData({ ...formData, joursTravailes: formData.joursTravailes.filter((d: string) => d !== day) });
                    } 
                  }}
                  className="rounded"
                />
                <span className="text-sm text-[#2C3E50]">{day}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Collaborateur Externe Specific Fields */}
      {formData.type === "externe" && (
        <Card className="p-6 border-blue-400 border-2 bg-blue-50">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-blue-600 mb-4">Informations Collaborateur Externe</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Société d'Origine *</Label>
              <Input
                value={formData.societeOrigine}
                onChange={(e) => setFormData({ ...formData, societeOrigine: e.target.value })}
                className="border-[#E9ECEF]"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Numéro Contrat Sous-traitance</Label>
              <Input
                value={formData.numeroContratSousTraitance}
                onChange={(e) => setFormData({ ...formData, numeroContratSousTraitance: e.target.value })}
                placeholder="ST-YYYY-XXX"
                className="border-[#E9ECEF]"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Durée Mission</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.dureeMission}
                  onChange={(e) => setFormData({ ...formData, dureeMission: Number(e.target.value) })}
                  className="border-[#E9ECEF]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#7F8C8D]">mois</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Taux {formData.typeRate === "journalier" ? "Journalier" : "Mensuel"} *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7F8C8D]">
                    {formData.devise === "TND" ? "د.ت" : "€"}
                  </span>
                  <Input
                    type="number"
                    value={formData.tauxJournalierMensuel}
                    onChange={(e) => setFormData({ ...formData, tauxJournalierMensuel: e.target.value })}
                    placeholder="0.00"
                    className="pl-8 border-[#E9ECEF]"
                  />
                </div>
                <Select value={formData.typeRate} onValueChange={(val) => setFormData({ ...formData, typeRate: val as any })}>
                  <SelectTrigger style={{ inlineSize: "120px" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(rhSelectOptions.rateTypes || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Step 3: Leave & Documents
function Step3({ formData, setFormData, handleCvUpload, cvExtracted, cvExtracting }: any) {
  const rhSelectOptions = useModuleSelectOptions('rh')
  return (
    <div className="space-y-8">
      {/* Leave Management */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Gestion des Congés et Avantages</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Solde Initial (jours) *</Label>
            <Input
              type="number"
              value={formData.soldeCongesInitial}
              onChange={(e) => setFormData({ ...formData, soldeCongesInitial: Number(e.target.value) })}
              className="border-[#E9ECEF]"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Droits Acquis par Mois *</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.5"
                value={formData.droitsMensuels}
                onChange={(e) => setFormData({ ...formData, droitsMensuels: Number(e.target.value) })}
                className="border-[#E9ECEF]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#7F8C8D]">j/mois</span>
            </div>
            <p className="text-xs text-[#7F8C8D] mt-1">{formData.droitsMensuels * 12} jours/an</p>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-2 block">Date Début Acquisition</Label>
            <Input
              type="date"
              value={formData.dateDebutAcquisition}
              onChange={(e) => setFormData({ ...formData, dateDebutAcquisition: e.target.value })}
              className="border-[#E9ECEF]"
            />
          </div>
        </div>
      </div>

      {/* Remote Work */}
      <div className="bg-[#F8F9FA] rounded-lg p-6 border border-[#E9ECEF]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#2C3E50]">Télétravail Autorisé</h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.teletravaAilAutorise}
              onChange={(e) => setFormData({ ...formData, teletravaAilAutorise: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full ${formData.teletravaAilAutorise ? "bg-[#E67E22]" : "bg-gray-300"}`}></div>
          </label>
        </div>

        {formData.teletravaAilAutorise && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E9ECEF]">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Jours par Semaine</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.joursTeeletravailParSemaine}
                onChange={(e) => setFormData({ ...formData, joursTeeletravailParSemaine: Number(e.target.value) })}
                className="border-[#E9ECEF]"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Jours Fixes</Label>
              <div className="flex gap-2 flex-wrap">
                {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      if (formData.joursFixesTeletravail.includes(day)) {
                        setFormData({
                          ...formData,
                          joursFixesTeletravail: formData.joursFixesTeletravail.filter((d: string) => d !== day),
                        });
                      } else {
                        setFormData({
                          ...formData,
                          joursFixesTeletravail: [...formData.joursFixesTeletravail, day],
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      formData.joursFixesTeletravail.includes(day)
                        ? "bg-[#E67E22] text-white"
                        : "bg-[#E9ECEF] text-[#7F8C8D]"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Social Benefits */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Avantages Sociaux</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <label className="flex items-center justify-between mb-3 cursor-pointer">
              <span className="text-sm font-semibold text-[#2C3E50]">Ticket Restaurant</span>
              <input
                type="checkbox"
                checked={formData.ticketRestaurant}
                onChange={(e) => setFormData({ ...formData, ticketRestaurant: e.target.checked })}
                className="rounded"
              />
            </label>
            {formData.ticketRestaurant && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7F8C8D]">€</span>
                <Input
                  type="number"
                  value={formData.montantTicket}
                  onChange={(e) => setFormData({ ...formData, montantTicket: e.target.value })}
                  placeholder="8.00"
                  className="pl-8 border-[#E9ECEF] text-xs"
                />
              </div>
            )}
          </Card>

          <Card className="p-4">
            <label className="flex items-center justify-between mb-3 cursor-pointer">
              <span className="text-sm font-semibold text-[#2C3E50]">Transport</span>
              <input
                type="checkbox"
                checked={formData.transport}
                onChange={(e) => setFormData({ ...formData, transport: e.target.checked })}
                className="rounded"
              />
            </label>
            {formData.transport && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7F8C8D]">€</span>
                <Input
                  type="number"
                  value={formData.montantTransport}
                  onChange={(e) => setFormData({ ...formData, montantTransport: e.target.value })}
                  placeholder="0.00"
                  className="pl-8 border-[#E9ECEF] text-xs"
                />
              </div>
            )}
          </Card>

          <Card className="p-4">
            <label className="flex items-center justify-between mb-3 cursor-pointer">
              <span className="text-sm font-semibold text-[#2C3E50]">Assurance Santé</span>
              <input
                type="checkbox"
                checked={formData.assuranceSante}
                onChange={(e) => setFormData({ ...formData, assuranceSante: e.target.checked })}
                className="rounded"
              />
            </label>
            {formData.assuranceSante && (
              <div className="space-y-2">
                <Select value={formData.typeAssurance} onValueChange={(val) => setFormData({ ...formData, typeAssurance: val })}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rhSelectOptions.insuranceTypes || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="text" placeholder="Organisme" className="text-xs border-[#E9ECEF]" />
              </div>
            )}
          </Card>

          <Card className="p-4">
            <label className="flex items-center justify-between mb-3 cursor-pointer">
              <span className="text-sm font-semibold text-[#2C3E50]">Autres Avantages</span>
              <input
                type="checkbox"
                checked={formData.autresAvantages}
                onChange={(e) => setFormData({ ...formData, autresAvantages: e.target.checked })}
                className="rounded"
              />
            </label>
            {formData.autresAvantages && <Input type="text" placeholder="Description" className="text-xs border-[#E9ECEF]" />}
          </Card>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#7F8C8D] mb-4">Documents Administratifs</h2>

        {formData.type === "externe" && (
          <div className="mb-6">
            <Label className="text-sm font-semibold mb-3 block">CV / Dossier du Candidat</Label>
            <div
              className="border-2 border-dashed border-[#BDC3C7] hover:border-[#E67E22] rounded-lg p-6 text-center transition-colors cursor-pointer"
              onClick={() => document.getElementById("cv-upload")?.click()}
            >
              <FileText className="mx-auto mb-3 text-[#7F8C8D]" size={48} />
              <p className="text-sm font-medium text-[#2C3E50]">Glissez le CV/dossier ici ou cliquez</p>
              <p className="text-xs text-[#7F8C8D]">PDF, DOCX - Max 5MB</p>
              <input id="cv-upload" type="file" onChange={handleCvUpload} className="hidden" />
            </div>
            {cvExtracted && <p className="text-xs text-green-600 mt-2">✓ CV analysé - Données extraites</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 border-[#E9ECEF]">
            <Label className="text-xs font-semibold mb-2 block">CIN / Passeport</Label>
            <div className="border-2 border-dashed border-[#BDC3C7] rounded p-3 text-center text-xs cursor-pointer hover:border-[#E67E22]">
              <Upload size={20} className="mx-auto text-[#7F8C8D] mb-1" />
              <p>Cliquer pour uploader</p>
            </div>
          </Card>

          <Card className="p-4 border-[#E9ECEF]">
            <Label className="text-xs font-semibold mb-2 block">Attestation CNSS</Label>
            <div className="border-2 border-dashed border-[#BDC3C7] rounded p-3 text-center text-xs cursor-pointer hover:border-[#E67E22]">
              <Upload size={20} className="mx-auto text-[#7F8C8D] mb-1" />
              <p>Cliquer pour uploader</p>
            </div>
          </Card>

          <Card className="p-4 border-[#E9ECEF]">
            <Label className="text-xs font-semibold mb-2 block">Diplômes & Certifications</Label>
            <div className="border-2 border-dashed border-[#BDC3C7] rounded p-3 text-center text-xs cursor-pointer hover:border-[#E67E22]">
              <Upload size={20} className="mx-auto text-[#7F8C8D] mb-1" />
              <p>Cliquer pour uploader</p>
            </div>
          </Card>

          <Card className="p-4 border-[#E9ECEF]">
            <Label className="text-xs font-semibold mb-2 block">Contrat Signé</Label>
            <div className="border-2 border-dashed border-[#BDC3C7] rounded p-3 text-center text-xs cursor-pointer hover:border-[#E67E22]">
              <Upload size={20} className="mx-auto text-[#7F8C8D] mb-1" />
              <p>Cliquer pour uploader</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Step 4: Confirmation
function Step4({ formData, setFormData }: any) {
  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#2C3E50]">{formData.prenom} {formData.nom}</h2>
        <p className="text-sm text-[#7F8C8D] mt-2">{formData.matricule}</p>
        <div className="mt-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            formData.type === "interne" ? "bg-[#E67E22] text-white" : "bg-blue-100 text-blue-800"
          }`}>
            {formData.type === "interne" ? "Collaborateur Interne" : "Collaborateur Externe"}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 border-[#E9ECEF]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#2C3E50]">Identité</h3>
            <button className="text-xs text-[#E67E22] hover:text-[#D35400]">Modifier</button>
          </div>
          <div className="space-y-2 text-xs text-[#7F8C8D]">
            <p><span className="font-semibold">CIN:</span> {formData.cin}</p>
            <p><span className="font-semibold">Genre:</span> {formData.genre}</p>
            <p><span className="font-semibold">Nationalité:</span> {formData.nationalite}</p>
            <p><span className="font-semibold">Email:</span> {formData.emailPro}</p>
          </div>
        </Card>

        <Card className="p-4 border-[#E9ECEF]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#2C3E50]">Contrat</h3>
            <button className="text-xs text-[#E67E22] hover:text-[#D35400]">Modifier</button>
          </div>
          <div className="space-y-2 text-xs text-[#7F8C8D]">
            <p><span className="font-semibold">Type:</span> {formData.typeContrat}</p>
            <p><span className="font-semibold">Département:</span> {formData.departement}</p>
            <p><span className="font-semibold">Poste:</span> {formData.poste}</p>
            <p><span className="font-semibold">Date embauche:</span> {formData.dateEmbauche}</p>
          </div>
        </Card>

        <Card className="p-4 border-[#E9ECEF]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#2C3E50]">Congés</h3>
            <button className="text-xs text-[#E67E22] hover:text-[#D35400]">Modifier</button>
          </div>
          <div className="space-y-2 text-xs text-[#7F8C8D]">
            <p><span className="font-semibold">Solde initial:</span> {formData.soldeCongesInitial} jours</p>
            <p><span className="font-semibold">Droits mensuels:</span> {formData.droitsMensuels} j/mois</p>
            <p><span className="font-semibold">Télétravail:</span> {formData.teletravaAilAutorise ? "Oui" : "Non"}</p>
          </div>
        </Card>

        <Card className="p-4 border-[#E9ECEF]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#2C3E50]">Rémunération</h3>
            <button className="text-xs text-[#E67E22] hover:text-[#D35400]">Modifier</button>
          </div>
          <div className="space-y-2 text-xs text-[#7F8C8D]">
            <p><span className="font-semibold">Salaire:</span> {formData.salaireBrut} {formData.devise}</p>
            <p><span className="font-semibold">Confidentialité:</span> {formData.confidentiel ? "Oui" : "Non"}</p>
          </div>
        </Card>
      </div>

      {/* Validation Checkboxes */}
      <div className="bg-[#FFF5EC] border border-[#E67E22] rounded-lg p-6 space-y-4">
        <h3 className="font-bold text-[#2C3E50]">Validation Finale</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded" />
            <span className="text-sm text-[#2C3E50]">J'ai vérifié que toutes les informations sont correctes</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded" />
            <span className="text-sm text-[#2C3E50]">Les documents fournis sont conformes et authentiques</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 rounded" />
            <span className="text-sm text-[#2C3E50]">Le collaborateur a pris connaissance et accepté son contrat</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Notes RH / Observations</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Remarques, informations complémentaires..."
          className="border-[#E9ECEF]"
        />
        <p className="text-xs text-[#7F8C8D] mt-2">Visible uniquement par RH et Admin</p>
      </div>
    </div>
  );
}
