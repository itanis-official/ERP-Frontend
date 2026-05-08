import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Upload, CheckCircle, Folder, FileText, Loader2 } from "lucide-react";
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
import { Slider } from "./ui/slider";
import { companyApi, type Company } from "../lib/companyApi";
import { opportunityApi, type Opportunity } from "../lib/opportunityApi";
import { crmApi } from "../lib/api";
import { useModuleSelectOptions } from "../lib/selectOptionsConfig";

interface Agent {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  poste: string;
  departement: string;
  nomComplet: string;
}

interface OpportunityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  companyName?: string;
}

const getProbabilityLabel = (value: number) => {
  if (value < 30) return "Faible";
  if (value < 70) return "Moyenne";
  return "Élevée";
};

export function OpportunityForm({ open, onClose, onSubmit, companyName }: OpportunityFormProps) {
  const crmSelectOptions = useModuleSelectOptions('crm')
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ['companies-list'],
    queryFn: async () => {
      try { return await companyApi.getAll() }
      catch { return [] }
    },
    enabled: open,
  })

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['agents-list'],
    queryFn: async () => {
      try {
        const response = await crmApi.get('/api/agents')
        return response.data
      } catch { return [] }
    },
    enabled: open,
  })

  const [opportunityType, setOpportunityType] = useState("nouveau"); // "nouveau" | "ajout"
  const [cdcType, setCdcType] = useState("client"); // "client" | "team"
  
  const [formData, setFormData] = useState({
    societe: "",
    titre: "",
    typeProjet: "",
    valeurEstimee: "",
    probabilite: 50,
    dateCloturePrevu: "",
    projetParent: "",
    typeAjout: "",
    agentCommercial: "",
    agentCdc: "",
    echeanceCdc: "",
    pipelineStage: "prospection",
    notes: "",
  });

  const [cdcFile, setCdcFile] = useState<File | null>(null);
  const [cdcPreview, setCdcPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);
  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 250); };

  const { data: parentProjects = [] } = useQuery<Opportunity[]>({
    queryKey: ['parent-projects', formData.societe],
    queryFn: async () => {
      try { return await opportunityApi.getByCompany(Number(formData.societe)) }
      catch { return [] }
    },
    enabled: open && !!formData.societe,
  });

  if (!open) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const selectedCompany = companies.find((c) => c.id === Number(formData.societe));

  const handleCdcUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, cdc: "Le fichier doit faire moins de 10MB" });
        return;
      }
      setCdcFile(file);
      setCdcPreview(file.name);
      setErrors({ ...errors, cdc: "" });
    }
  };

  const handleCdcDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.type.includes("word"))) {
      setCdcFile(file);
      setCdcPreview(file.name);
      setErrors({ ...errors, cdc: "" });
    } else {
      setErrors({ ...errors, cdc: "Format accepté: PDF, DOCX" });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.societe) newErrors.societe = "Champ obligatoire";
    if (!formData.titre) newErrors.titre = "Champ obligatoire";
    if (!formData.typeProjet) newErrors.typeProjet = "Champ obligatoire";
    if (!formData.valeurEstimee) newErrors.valeurEstimee = "Champ obligatoire";
    if (!formData.agentCommercial) newErrors.agentCommercial = "Champ obligatoire";

    if (opportunityType === "ajout") {
      if (!formData.projetParent) newErrors.projetParent = "Champ obligatoire";
      if (!formData.typeAjout) newErrors.typeAjout = "Champ obligatoire";
    }

    if (cdcType === "team") {
      if (!formData.agentCdc) newErrors.agentCdc = "Champ obligatoire";
    } else {
      if (!cdcFile) newErrors.cdc = "Veuillez uploader le fichier";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Success
    const assignedAgent = agents.find((a) => String(a.id) === formData.agentCdc);
    const message = cdcType === "team" && assignedAgent
      ? `Opportunité créée avec succès !\nTâche assignée à ${assignedAgent.nomComplet}`
      : "Opportunité créée avec succès !";
    
    setSuccessMessage(message);
    setTimeout(() => {
      onSubmit({ ...formData, opportunityType, cdcType, cdcFile });
    }, 1500);
  };

  const isFormValid =
    formData.societe &&
    formData.titre &&
    formData.typeProjet &&
    formData.valeurEstimee &&
    formData.agentCommercial &&
    (opportunityType === "nouveau" || (formData.projetParent && formData.typeAjout)) &&
    (cdcType === "team" ? formData.agentCdc : cdcFile);

  if (successMessage) {
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] p-8 text-center">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Succès!</h3>
          <p className="text-sm text-slate-400 whitespace-pre-line">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[900px] w-full max-h-[88vh] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Nouvelle Opportunité</h2>
            <p className="text-xs text-slate-400 mt-0.5">Créez une nouvelle opportunité commerciale</p>
          </div>
          <button onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Section 1 - Type d'Opportunité */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Type d'Opportunité
            </h3>
            <RadioGroup value={opportunityType} onValueChange={setOpportunityType} className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border-2 border-[#E9ECEF] rounded-lg hover:border-[#E67E22] cursor-pointer transition-colors">
                <RadioGroupItem value="nouveau" id="nouveau" className="border-[#E67E22] text-[#E67E22] w-5 h-5" />
                <Label htmlFor="nouveau" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🆕</span>
                    <div>
                      <p className="font-bold text-[#2C3E50]">Nouveau Projet</p>
                      <p className="text-sm text-[#7F8C8D]">Crée un nouveau projet</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border-2 border-[#E9ECEF] rounded-lg hover:border-[#E67E22] cursor-pointer transition-colors">
                <RadioGroupItem value="ajout" id="ajout" className="border-[#E67E22] text-[#E67E22] w-5 h-5" />
                <Label htmlFor="ajout" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">➕</span>
                    <div>
                      <p className="font-bold text-[#2C3E50]">Ajout à Projet Existant</p>
                      <p className="text-sm text-[#7F8C8D]">Sous-projet ou complément de fonctionnalité</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Conditional fields for "Ajout" */}
            {opportunityType === "ajout" && (
              <div className="mt-6 space-y-6 p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                {/* Select Company First */}
                {!formData.societe && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <span className="text-blue-500">ℹ️</span>
                    <p className="text-sm text-blue-700">Veuillez d'abord sélectionner une société pour voir les projets existants</p>
                  </div>
                )}

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Projet Parent <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.projetParent}
                    onValueChange={(value) => setFormData({ ...formData, projetParent: value })}
                    disabled={!formData.societe || parentProjects.length === 0}
                  >
                    <SelectTrigger className={`h-11 border-2 ${errors.projetParent ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                      <SelectValue placeholder={parentProjects.length === 0 ? "Aucun projet disponible" : "Sélectionner un projet"} />
                    </SelectTrigger>
                    <SelectContent>
                      {parentProjects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-[#E67E22]" />
                            <span>{project.titre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projetParent && <p className="text-red-500 text-sm mt-1">⚠️ {errors.projetParent}</p>}
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Type d'Ajout <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.typeAjout}
                    onChange={(e) => setFormData({ ...formData, typeAjout: e.target.value })}
                    className={`h-11 border-2 ${errors.typeAjout ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                    placeholder="Ex: Nouvelle fonctionnalité, Module supplémentaire..."
                  />
                  {errors.typeAjout && <p className="text-red-500 text-sm mt-1">⚠️ {errors.typeAjout}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Section 2 - Informations Générales */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Informations Générales
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Société <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.societe}
                    onValueChange={(value) => setFormData({ ...formData, societe: value, projetParent: "" })}
                  >
                    <SelectTrigger className={`h-11 border-2 ${errors.societe ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                      <SelectValue placeholder={isLoadingCompanies ? "Chargement..." : "Sélectionner une société"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCompanies ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">Chargement...</span>
                        </div>
                      ) : companies.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">Aucune société disponible</div>
                      ) : (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#E67E22] rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">{getInitials(company.raisonSociale)}</span>
                              </div>
                              <span>{company.raisonSociale}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.societe && <p className="text-red-500 text-sm mt-1">⚠️ {errors.societe}</p>}
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Titre de l'Opportunité <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className={`h-11 border-2 ${errors.titre ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                    placeholder="Ex: Site E-commerce, Application Mobile..."
                  />
                  {errors.titre && <p className="text-red-500 text-sm mt-1">⚠️ {errors.titre}</p>}
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Type de Projet <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.typeProjet}
                    onValueChange={(value) => setFormData({ ...formData, typeProjet: value })}
                  >
                    <SelectTrigger className={`h-11 border-2 ${errors.typeProjet ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                      <SelectValue placeholder="Sélectionner un type de projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {(crmSelectOptions.opportunityProjectTypes || []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.typeProjet && <p className="text-red-500 text-sm mt-1">⚠️ {errors.typeProjet}</p>}
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Secteur</Label>
                  <div className="inline-block px-3 py-2 bg-[#F0F0F0] text-[#7F8C8D] rounded-lg text-sm font-medium">
                    {selectedCompany?.secteur || "Sélectionnez une société"}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Valeur Estimée (€) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7F8C8D] font-bold">€</span>
                    <Input
                      type="number"
                      value={formData.valeurEstimee}
                      onChange={(e) => setFormData({ ...formData, valeurEstimee: e.target.value })}
                      className={`h-11 border-2 pl-8 ${errors.valeurEstimee ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-[#7F8C8D] mt-1">ℹ️ Montant prévisionnel du projet</p>
                  {errors.valeurEstimee && <p className="text-red-500 text-sm mt-1">⚠️ {errors.valeurEstimee}</p>}
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Probabilité: <span className="text-[#E67E22] font-bold">{formData.probabilite}%</span>
                    <span className="text-xs ml-2 text-[#7F8C8D]">({getProbabilityLabel(formData.probabilite)})</span>
                  </Label>
                  <Slider
                    value={[formData.probabilite]}
                    onValueChange={(value) => setFormData({ ...formData, probabilite: value[0] })}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-xs text-[#7F8C8D] mt-2">
                    <span>Faible (0-30%)</span>
                    <span>Moyenne (30-70%)</span>
                    <span>Élevée (70-100%)</span>
                  </div>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Date de Clôture Prévue (optionnel)</Label>
                  <Input
                    type="date"
                    value={formData.dateCloturePrevu}
                    onChange={(e) => setFormData({ ...formData, dateCloturePrevu: e.target.value })}
                    className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 - Cahier des Charges */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Cahier des Charges
            </h3>

            <RadioGroup value={cdcType} onValueChange={setCdcType} className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border-2 border-[#E9ECEF] rounded-lg hover:border-[#E67E22] cursor-pointer transition-colors">
                <RadioGroupItem value="client" id="cdcClient" className="border-[#E67E22] text-[#E67E22]" />
                <Label htmlFor="cdcClient" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <span>☑</span>
                    <p className="font-bold text-[#2C3E50]">Le client fournit un cahier des charges</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border-2 border-[#E9ECEF] rounded-lg hover:border-[#E67E22] cursor-pointer transition-colors">
                <RadioGroupItem value="team" id="cdcTeam" className="border-[#E67E22] text-[#E67E22]" />
                <Label htmlFor="cdcTeam" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <span>☐</span>
                    <p className="font-bold text-[#2C3E50]">L'équipe prépare le cahier des charges</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* If Client Provides */}
            {cdcType === "client" && (
              <div className="mt-6">
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Cahier des Charges <span className="text-red-500">*</span>
                </Label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCdcDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    errors.cdc ? 'border-red-500 bg-red-50' : 'border-[#BDC3C7] hover:border-[#E67E22] bg-[#F8F9FA]'
                  }`}
                >
                  {cdcPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-[#E67E22]" />
                      <div className="text-left">
                        <p className="font-medium text-[#2C3E50]">{cdcPreview}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCdcFile(null);
                            setCdcPreview(null);
                          }}
                          className="text-xs text-red-500 hover:underline mt-1"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 text-[#BDC3C7] mx-auto mb-2" />
                      <p className="text-sm font-medium text-[#7F8C8D]">Glissez-déposez votre fichier</p>
                      <p className="text-xs text-[#BDC3C7] mt-1">ou cliquez pour sélectionner</p>
                      <p className="text-xs text-[#BDC3C7] mt-2">PDF, DOCX - Max 10MB</p>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleCdcUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {errors.cdc && <p className="text-red-500 text-sm mt-2">⚠️ {errors.cdc}</p>}
              </div>
            )}

            {/* If Team Prepares */}
            {cdcType === "team" && (
              <div className="mt-6 space-y-6 p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Agent Responsable <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.agentCdc}
                    onValueChange={(value) => setFormData({ ...formData, agentCdc: value })}
                  >
                    <SelectTrigger className={`h-11 border-2 ${errors.agentCdc ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={String(agent.id)}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#E67E22] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">{getInitials(agent.nomComplet)}</span>
                            </div>
                            <span>{agent.nomComplet}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.agentCdc && <p className="text-red-500 text-sm mt-1">⚠️ {errors.agentCdc}</p>}
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Échéance de Préparation (optionnel)</Label>
                  <Input
                    type="date"
                    value={formData.echeanceCdc}
                    onChange={(e) => setFormData({ ...formData, echeanceCdc: e.target.value })}
                    className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4 - Affectation */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Affectation
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">
                  Agent Commercial <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.agentCommercial}
                  onValueChange={(value) => setFormData({ ...formData, agentCommercial: value })}
                >
                  <SelectTrigger className={`h-11 border-2 ${errors.agentCommercial ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}>
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={String(agent.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#E67E22] rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">{getInitials(agent.nomComplet)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{agent.nomComplet}</p>
                            <p className="text-xs text-[#7F8C8D]">{agent.poste}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.agentCommercial && <p className="text-red-500 text-sm mt-1">⚠️ {errors.agentCommercial}</p>}
              </div>

              <div>
                <Label className="text-[#7F8C8D] font-bold mb-2 block">Pipeline Stage</Label>
                <Select
                  value={formData.pipelineStage}
                  onValueChange={(value) => setFormData({ ...formData, pipelineStage: value })}
                >
                  <SelectTrigger className="h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(crmSelectOptions.pipelineStages || []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 5 - Notes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2"><div className="w-1 h-3.5 rounded-full bg-[#E67E22]" />
              Notes Supplémentaires
            </h3>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[100px] border-2 border-[#E9ECEF] focus:border-[#E67E22] resize-y"
              placeholder="Détails supplémentaires, besoins spécifiques..."
            />
          </div>

        </form>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50 px-8 py-4 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleClose}
            className="h-10 px-5 rounded-xl border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 transition-all duration-200">
            Annuler
          </Button>
          <Button type="submit" disabled={!isFormValid} onClick={handleSubmit}
            className={`h-10 px-6 rounded-xl text-sm font-medium transition-all duration-200 gap-2 ${
              isFormValid
                ? 'bg-[#E67E22] hover:bg-[#D35400] text-white shadow-sm shadow-orange-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}>
            <CheckCircle className="w-4 h-4" /> Créer l'Opportunité
          </Button>
        </div>
      </div>
    </div>
  );
}
