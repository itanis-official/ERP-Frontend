import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Upload, CheckCircle, ArrowRight, Globe, Building2, Info, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { companyApi } from "../lib/companyApi";
import { crmApi } from "../lib/api";
import {
  countryOptions,
  currencyOptions,
  getCitiesByCountryName,
  normalizeCountryName,
  phoneCountryOptions,
} from "../lib/referenceData";

interface CompanyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  editMode?: boolean;
  companyName?: string;
}

interface CrmAgent {
  id: number;
  nom: string;
  prenom: string;
  poste?: string;
}

interface CrmEquipe {
  id: number;
  nom: string;
  domaine: string;
}

const sectors = ["IT", "Finance", "Santé", "Commerce", "Industrie", "Services", "Autre"];

export function CompanyForm({ open, onClose, onSubmit, initialData, editMode = false, companyName }: CompanyFormProps) {
  const getInitialData = () => ({
    raisonSociale: initialData?.raisonSociale || companyName || "",
    matriculeFiscalCountry: initialData?.matriculeFiscalCountry || "TN",
    matriculeFiscal: initialData?.matriculeFiscal || "",
    secteur: initialData?.secteur || "",
    devis: initialData?.devis || "",
    adresse: initialData?.adresse || "",
    codePostal: initialData?.codePostal || "",
    ville: initialData?.ville || "",
    pays: normalizeCountryName(initialData?.pays || "Tunisie"),
    emailPrincipal: initialData?.emailPrincipal || "",
    emailSecondaire: initialData?.emailSecondaire || "",
    telephonePrincipalCountry: initialData?.telephonePrincipalCountry || "+216",
    telephonePrincipal: initialData?.telephonePrincipal || "",
    telephoneSecondaireCountry: initialData?.telephoneSecondaireCountry || "+216",
    telephoneSecondaire: initialData?.telephoneSecondaire || "",
    affectationType: initialData?.affectationType || (initialData?.agentResponsableId ? "agent" : initialData?.equipeResponsableId ? "equipe" : "global"),
    agentResponsableId: initialData?.agentResponsableId ? String(initialData.agentResponsableId) : "none",
    equipeResponsableId: initialData?.equipeResponsableId ? String(initialData.equipeResponsableId) : "none",
    statut: initialData?.statut || "prospect",
    notes: initialData?.notes || "",
  });

  const [formData, setFormData] = useState(getInitialData());
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData(getInitialData());
      setErrors({});
      setLogoPreview(initialData?.logo || null);
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [open, initialData, companyName]);

  const { data: agents = [] } = useQuery<CrmAgent[]>({
    queryKey: ["crm-agents-list"],
    queryFn: async () => {
      const response = await crmApi.get("/api/Agents");
      return response.data;
    },
    enabled: open,
  });

  const { data: equipes = [] } = useQuery<CrmEquipe[]>({
    queryKey: ["crm-equipes-list"],
    queryFn: async () => {
      const response = await crmApi.get("/api/Equipes");
      return response.data;
    },
    enabled: open,
  });

  const cityOptions = getCitiesByCountryName(formData.pays);

  const getMatriculePlaceholder = (country: string) => {
    switch (country) {
      case "TN":
        return "8 chiffres + lettre (ex: 1234567A)";
      case "FR":
        return "SIRET 14 chiffres";
      default:
        return "Format libre";
    }
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors({ ...errors, logo: "Le fichier doit faire moins de 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.raisonSociale) newErrors.raisonSociale = "Champ obligatoire";
    if (!formData.matriculeFiscal) newErrors.matriculeFiscal = "Champ obligatoire";
    if (!formData.secteur) newErrors.secteur = "Champ obligatoire";
    if (!formData.devis) newErrors.devis = "Champ obligatoire";
    if (!formData.emailPrincipal) newErrors.emailPrincipal = "Champ obligatoire";
    if (!formData.telephonePrincipal) newErrors.telephonePrincipal = "Champ obligatoire";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const companyData = {
        raisonSociale: formData.raisonSociale,
        matriculeFiscalCountry: formData.matriculeFiscalCountry,
        matriculeFiscal: formData.matriculeFiscal,
        secteur: formData.secteur,
        logo: logoPreview,
        devis: formData.devis,
        adresse: formData.adresse || null,
        codePostal: formData.codePostal || null,
        ville: formData.ville || null,
        pays: formData.pays || null,
        emailPrincipal: formData.emailPrincipal || null,
        emailSecondaire: formData.emailSecondaire || null,
        telephonePrincipalCountry: formData.telephonePrincipalCountry || null,
        telephonePrincipal: formData.telephonePrincipal || null,
        telephoneSecondaireCountry: formData.telephoneSecondaireCountry || null,
        telephoneSecondaire: formData.telephoneSecondaire || null,
        affectationType: formData.affectationType,
        agentResponsableId: formData.affectationType === "agent" && formData.agentResponsableId !== "none"
          ? parseInt(formData.agentResponsableId)
          : null,
        equipeResponsableId: formData.affectationType === "equipe" && formData.equipeResponsableId !== "none"
          ? parseInt(formData.equipeResponsableId)
          : null,
        statut: formData.statut,
        notes: formData.notes || null,
      };

      if (editMode && initialData?.id) {
        await companyApi.update(initialData.id, companyData);
      } else {
        await companyApi.create(companyData);
      }
      onSubmit(formData);
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || error.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.raisonSociale && formData.matriculeFiscal && formData.secteur &&
                      formData.devis && formData.emailPrincipal && formData.telephonePrincipal;

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);

  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 250); };

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[1000px] w-full max-h-[88vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {editMode ? `Modifier ${companyName}` : "Nouvelle Société"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Remplissez les informations de la société</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Section 1 - Informations Générales */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Informations Générales
            </h3>
            
            {/* Raison Sociale - Full Width */}
            <div className="mb-6">
              <Label className="text-[#7F8C8D] font-bold mb-2 block">
                Raison Sociale <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.raisonSociale}
                onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                className={`h-11 border-2 ${errors.raisonSociale ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                placeholder="Nom de la société"
              />
              {errors.raisonSociale && (
                <p className="text-red-500 text-sm mt-1">⚠️ {errors.raisonSociale}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Matricule Fiscal with Country Selector */}
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Matricule Fiscal <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.matriculeFiscalCountry}
                      onValueChange={(value) => setFormData({ ...formData, matriculeFiscalCountry: value })}
                    >
                      <SelectTrigger className="w-[140px] h-11 border-2 border-[#E9ECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.matriculeFiscal}
                      onChange={(e) => setFormData({ ...formData, matriculeFiscal: e.target.value })}
                      className={`flex-1 h-11 border-2 ${errors.matriculeFiscal ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder={getMatriculePlaceholder(formData.matriculeFiscalCountry)}
                    />
                  </div>
                  <p className="text-xs text-[#7F8C8D] mt-1">ℹ️ {getMatriculePlaceholder(formData.matriculeFiscalCountry)}</p>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Secteur d'Activité <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.secteur}
                    onValueChange={(value) => setFormData({ ...formData, secteur: value })}
                  >
                    <SelectTrigger className={`h-11 border-2 ${errors.secteur ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                      <SelectValue placeholder="Sélectionner un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 flex items-center gap-2">
                    Devise <span className="text-red-500">*</span>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-[#7F8C8D] cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded p-2 z-10">
                        Devise de facturation principale de la societe.
                      </div>
                    </div>
                  </Label>
                  <Select
                    value={formData.devis}
                    onValueChange={(value) => setFormData({ ...formData, devis: value })}
                  >
                    <SelectTrigger className={`h-11 border-2 ${errors.devis ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                      <SelectValue placeholder="Selectionner une devise" />
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
              </div>

              {/* Right Column - Logo Upload */}
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Logo Société
                </Label>
                <div className="flex items-center justify-center">
                  {logoPreview ? (
                    <div className="relative w-48 h-48 border-2 border-[#E9ECEF] rounded-lg overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setLogoPreview(null)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-48 h-48 border-2 border-dashed border-[#BDC3C7] rounded-lg hover:border-[#E67E22] transition-colors cursor-pointer flex flex-col items-center justify-center text-center">
                      <Building2 className="w-12 h-12 text-[#BDC3C7] mb-2" />
                      <p className="text-sm font-medium text-[#7F8C8D]">Cliquez pour ajouter un logo</p>
                      <p className="text-xs text-[#BDC3C7] mt-1">PNG, JPG, max 2MB</p>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 - Coordonnées */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Coordonnées
            </h3>
            <div className="space-y-6">
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Adresse</Label>
                <Input
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Code Postal</Label>
                  <Input
                    value={formData.codePostal}
                    onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                    className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Ville</Label>
                  <Select
                    value={formData.ville}
                    onValueChange={(value) => setFormData({ ...formData, ville: value })}
                  >
                    <SelectTrigger className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]">
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
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Pays</Label>
                  <Select
                    value={formData.pays}
                    onValueChange={(value) => setFormData({ ...formData, pays: value, ville: "" })}
                  >
                    <SelectTrigger className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]">
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

              {/* Emails */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Email Principal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.emailPrincipal}
                    onChange={(e) => setFormData({ ...formData, emailPrincipal: e.target.value })}
                    className={`h-11 border-2 ${errors.emailPrincipal ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                    placeholder="contact@entreprise.com"
                  />
                </div>
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Email Secondaire (optionnel)</Label>
                  <Input
                    type="email"
                    value={formData.emailSecondaire}
                    onChange={(e) => setFormData({ ...formData, emailSecondaire: e.target.value })}
                    className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                    placeholder="contact2@entreprise.com"
                  />
                </div>
              </div>

              {/* Téléphones with Country Codes */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Téléphone Principal <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.telephonePrincipalCountry}
                      onValueChange={(value) => setFormData({ ...formData, telephonePrincipalCountry: value })}
                    >
                      <SelectTrigger className="w-[120px] h-11 border-2 border-[#E9ECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneCountryOptions.map((item) => (
                          <SelectItem key={`${item.name}-${item.phoneCode}`} value={item.phoneCode}>
                            {item.name} {item.phoneCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      value={formData.telephonePrincipal}
                      onChange={(e) => setFormData({ ...formData, telephonePrincipal: e.target.value })}
                      className={`flex-1 h-11 border-2 ${errors.telephonePrincipal ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder="XX XXX XXX"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Téléphone Secondaire (optionnel)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.telephoneSecondaireCountry}
                      onValueChange={(value) => setFormData({ ...formData, telephoneSecondaireCountry: value })}
                    >
                      <SelectTrigger className="w-[120px] h-11 border-2 border-[#E9ECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneCountryOptions.map((item) => (
                          <SelectItem key={`${item.name}-${item.phoneCode}`} value={item.phoneCode}>
                            {item.name} {item.phoneCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="tel"
                      value={formData.telephoneSecondaire}
                      onChange={(e) => setFormData({ ...formData, telephoneSecondaire: e.target.value })}
                      className="flex-1 h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                      placeholder="XX XXX XXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 - Configuration Commerciale */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Configuration Commerciale
            </h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Responsable</Label>
                <RadioGroup
                  value={formData.affectationType}
                  onValueChange={(value) => setFormData({ ...formData, affectationType: value })}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="global" id="assign-global" className="border-[#E67E22] text-[#E67E22]" />
                    <Label htmlFor="assign-global" className="cursor-pointer text-[#2C3E50] font-medium">Tous</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="agent" id="assign-agent" className="border-[#E67E22] text-[#E67E22]" />
                    <Label htmlFor="assign-agent" className="cursor-pointer text-[#2C3E50] font-medium">Agent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equipe" id="assign-team" className="border-[#E67E22] text-[#E67E22]" />
                    <Label htmlFor="assign-team" className="cursor-pointer text-[#2C3E50] font-medium">Équipe</Label>
                  </div>
                </RadioGroup>

                {formData.affectationType === "agent" && (
                  <Select
                    value={formData.agentResponsableId}
                    onValueChange={(value) => setFormData({ ...formData, agentResponsableId: value })}
                  >
                    <SelectTrigger className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]">
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non affecté</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={String(agent.id)}>
                          {agent.prenom} {agent.nom}{agent.poste ? ` - ${agent.poste}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {formData.affectationType === "equipe" && (
                  <Select
                    value={formData.equipeResponsableId}
                    onValueChange={(value) => setFormData({ ...formData, equipeResponsableId: value })}
                  >
                    <SelectTrigger className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]">
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non affectée</SelectItem>
                      {equipes.map((equipe) => (
                        <SelectItem key={equipe.id} value={String(equipe.id)}>
                          {equipe.nom} - {equipe.domaine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(formData.affectationType === "global"
                  || (formData.affectationType === "agent" && formData.agentResponsableId === "none")
                  || (formData.affectationType === "equipe" && formData.equipeResponsableId === "none")) && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <span className="text-blue-500">ℹ️</span>
                    <p className="text-sm text-blue-700">Cette société passe à tous.</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Statut</Label>
                <RadioGroup
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prospect" id="prospect" className="border-[#E67E22] text-[#E67E22]" />
                    <Label htmlFor="prospect" className="cursor-pointer text-[#2C3E50] font-medium">
                      🔵 Prospect
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="actif" id="actif" className="border-[#27AE60] text-[#27AE60]" />
                    <Label htmlFor="actif" className="cursor-pointer text-[#2C3E50] font-medium">
                      ✅ Actif
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactif" id="inactif" className="border-[#7F8C8D] text-[#7F8C8D]" />
                    <Label htmlFor="inactif" className="cursor-pointer text-[#2C3E50] font-medium">
                      ⏸️ Inactif
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Section 4 - Notes Internes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Notes Internes
            </h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[120px] border-2 border-[#E9ECEF] focus:border-[#E67E22] resize-y"
              placeholder="Ajoutez des notes ou commentaires internes..."
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <span className="text-rose-600 text-sm">!</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-800">Erreur</p>
                <p className="text-xs text-rose-600 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50 px-8 py-4 flex items-center justify-between">
          <Button
            type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}
            className="h-10 px-5 rounded-xl border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 transition-all duration-200"
          >
            Annuler
          </Button>
          <Button
            type="submit" form="" disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
            className={`h-10 px-6 rounded-xl text-sm font-medium transition-all duration-200 gap-2 ${
              isFormValid && !isSubmitting
                ? 'bg-[#E67E22] hover:bg-[#D35400] text-white shadow-sm shadow-orange-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Enregistrer</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}