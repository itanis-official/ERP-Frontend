import { useState, useEffect, useRef, type FormEvent } from "react";
import { X, User, Briefcase, Phone, Mail, Lock, Eye, EyeOff, Dices, Save, CheckCircle, AlertCircle, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { phoneCountryOptions } from "../lib/referenceData";

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  companyName: string;
  companyLogo?: string;
  editMode?: boolean;
  contactName?: string;
}

// Password strength calculation
const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[@#$%&*!^()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength += 25;
  return strength;
};

const getPasswordStrengthLabel = (strength: number): { label: string; color: string } => {
  if (strength < 25) return { label: "Faible", color: "#E74C3C" };
  if (strength < 50) return { label: "Moyen", color: "#E67E22" };
  if (strength < 75) return { label: "Bon", color: "#F39C12" };
  return { label: "Fort", color: "#27AE60" };
};

const generateRandomPassword = (): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@#$%&*!";
  const all = uppercase + lowercase + numbers + special;
  
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export function ContactForm({ open, onClose, onSubmit, companyName, companyLogo, editMode = false, contactName }: ContactFormProps) {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    poste: "",
    telephoneCountry: "+216",
    telephone: "",
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    sendEmail: false,
    forcePasswordChange: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [loginAvailable, setLoginAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);
  const handleClose = () => { setIsVisible(false); setTimeout(onClose, 250); };

  // Auto-suggest login based on nom/prenom
  useEffect(() => {
    if (formData.nom && formData.prenom) {
      const suggestedLogin = `${formData.prenom.toLowerCase()}.${formData.nom.toLowerCase()}`.replace(/\s/g, '');
      if (!formData.login || formData.login === "") {
        setFormData(prev => ({ ...prev, login: suggestedLogin }));
      }
    }
  }, [formData.nom, formData.prenom]);

  // Simulate login validation
  useEffect(() => {
    if (formData.login.length > 2) {
      // Simulate API call
      setTimeout(() => {
        setLoginAvailable(Math.random() > 0.3); // Random for demo
      }, 300);
    } else {
      setLoginAvailable(null);
    }
  }, [formData.login]);

  if (!open) return null;

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  const passwordRequirements = [
    { label: "Minimum 8 caractères", met: formData.password.length >= 8 },
    { label: "Au moins 1 majuscule", met: /[A-Z]/.test(formData.password) },
    { label: "Au moins 1 chiffre", met: /[0-9]/.test(formData.password) },
    { label: "Au moins 1 caractère spécial", met: /[@#$%&*!^()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password) },
  ];

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.nom) newErrors.nom = "Champ obligatoire";
    if (!formData.prenom) newErrors.prenom = "Champ obligatoire";
    if (!formData.email) newErrors.email = "Champ obligatoire";
    if (!formData.login) newErrors.login = "Champ obligatoire";
    if (!formData.password) newErrors.password = "Champ obligatoire";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (passwordStrength < 50) newErrors.password = "Le mot de passe est trop faible";
    if (loginAvailable === false) newErrors.login = "Le login existe déjà";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const isFormValid = formData.nom && formData.prenom && formData.email && formData.login && 
                      formData.password && formData.confirmPassword && 
                      formData.password === formData.confirmPassword && 
                      passwordStrength >= 50 && loginAvailable !== false;

  return (
    <div onClick={(e) => e.target === e.currentTarget && handleClose()}
      className={`fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto py-10 px-4 transition-all duration-300 ease-out ${
        isVisible ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[800px] w-full my-8 overflow-hidden flex flex-col max-h-[88vh] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.97] translate-y-3'
      }`}>
        {/* Header */}
        <div className="border-b border-slate-100 px-8 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editMode ? "Modifier Contact" : "Nouveau Contact Client"}
              </h2>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1 w-fit mt-1.5">
                {companyLogo && <img src={companyLogo} alt="" className="w-5 h-5 rounded" />}
                <span className="text-xs text-slate-500 font-medium">{companyName}</span>
              </div>
            </div>
            <button onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN - Informations Personnelles */}
            <div>
              <div className="mb-6">
                <h3 className="text-xs font-bold text-[#7F8C8D] uppercase tracking-wider mb-2">
                  Informations Personnelles
                </h3>
                <div className="h-px bg-[#E9ECEF]"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8C8D]" />
                    <Input
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className={`h-11 pl-10 border-2 ${errors.nom ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder="Nom de famille"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8C8D]" />
                    <Input
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className={`h-11 pl-10 border-2 ${errors.prenom ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder="Prénom"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Poste</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8C8D]" />
                    <Input
                      value={formData.poste}
                      onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                      className="h-11 pl-10 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                      placeholder="Ex: Directeur Technique"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">Téléphone</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.telephoneCountry}
                      onValueChange={(value) => setFormData({ ...formData, telephoneCountry: value })}
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
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="flex-1 h-11 border-2 border-[#E9ECEF] focus:border-[#E67E22]"
                      placeholder="XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7F8C8D]" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`h-11 pl-10 border-2 ${errors.email ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder="contact@exemple.com"
                    />
                  </div>
                </div>

                <p className="text-xs text-[#7F8C8D] mt-4">* Champs obligatoires</p>
              </div>
            </div>

            {/* RIGHT COLUMN - Accès Espace Client */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#E67E22]" />
                <h3 className="text-xs font-bold text-[#7F8C8D] uppercase tracking-wider">
                  Accès Espace Client
                </h3>
              </div>
              <div className="h-px bg-[#E9ECEF] -mt-4 mb-6"></div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <span className="text-blue-500 text-lg">ℹ️</span>
                  <p className="text-sm text-blue-700">
                    Ces identifiants permettront au contact de se connecter à l'espace client pour consulter les factures et projets
                  </p>
                </div>
              </div>

              {/* Credentials Wrapper */}
              <div className="bg-[#F8F9FA] border-l-4 border-[#E67E22] rounded-xl p-6 space-y-4">
                {/* Login */}
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block flex items-center gap-1">
                    🔑 Login <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                      className={`h-11 pr-10 border-2 ${
                        errors.login ? 'border-red-500' : 
                        loginAvailable === true ? 'border-green-500' : 
                        loginAvailable === false ? 'border-red-500' : 
                        'border-[#E9ECEF]'
                      } focus:border-[#E67E22]`}
                      placeholder="Identifiant unique"
                    />
                    {loginAvailable === true && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {loginAvailable === false && (
                      <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {loginAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">✓ Disponible</p>
                  )}
                  {loginAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">✗ Déjà utilisé</p>
                  )}
                  <p className="text-xs text-[#7F8C8D] mt-1">Sera utilisé pour la connexion</p>
                </div>

                {/* Password */}
                <div className="relative">
                  <Label className="text-[#7F8C8D] font-bold mb-2 block flex items-center gap-1">
                    🔑 Mot de passe <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => setShowPasswordTooltip(true)}
                      onBlur={() => setTimeout(() => setShowPasswordTooltip(false), 200)}
                      className={`h-11 pr-10 border-2 ${errors.password ? 'border-red-500' : 'border-[#E9ECEF]'} focus:border-[#E67E22]`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F8C8D] hover:text-[#2C3E50]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-full transition-colors"
                            style={{
                              backgroundColor: passwordStrength > i * 25 ? strengthInfo.color : '#E9ECEF'
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs mt-1" style={{ color: strengthInfo.color }}>
                        {strengthInfo.label}
                      </p>
                    </div>
                  )}

                  {/* Password Requirements Tooltip */}
                  {showPasswordTooltip && (
                    <div className="absolute left-full ml-4 top-0 bg-white rounded-lg shadow-xl border border-[#E9ECEF] p-4 w-64 z-10">
                      <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
                      <p className="text-sm font-bold text-[#2C3E50] mb-2">Exigences du mot de passe :</p>
                      <div className="space-y-1">
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {req.met ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                            )}
                            <span className={`text-xs ${req.met ? 'text-green-600' : 'text-[#7F8C8D]'}`}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label className="text-[#7F8C8D] font-bold mb-2 block">
                    Confirmer mot de passe <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`h-11 pr-10 border-2 ${
                        errors.confirmPassword ? 'border-red-500' : 
                        formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : 
                        'border-[#E9ECEF]'
                      } focus:border-[#E67E22]`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7F8C8D] hover:text-[#2C3E50]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-600 mt-1">✓ Correspond</p>
                  )}
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">✗ Ne correspond pas</p>
                  )}
                </div>

                {/* Generate Password Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  className="w-full gap-2 border-2 hover:bg-[#F8F9FA]"
                >
                  <Dices className="w-4 h-4" />
                  Générer mot de passe aléatoire
                </Button>
              </div>

              {/* Additional Options */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked as boolean })}
                    disabled={!formData.email}
                    className="mt-0.5 border-[#E67E22] data-[state=checked]:bg-[#E67E22]"
                  />
                  <div>
                    <Label htmlFor="sendEmail" className="text-sm font-medium cursor-pointer">
                      Envoyer les identifiants par email au contact
                    </Label>
                    <p className="text-xs text-[#7F8C8D] mt-0.5">
                      {formData.email 
                        ? `Un email sera envoyé à ${formData.email} avec les instructions de connexion`
                        : "Aucun email fourni"
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="forcePasswordChange"
                    checked={formData.forcePasswordChange}
                    onCheckedChange={(checked) => setFormData({ ...formData, forcePasswordChange: checked as boolean })}
                    className="mt-0.5 border-[#E67E22] data-[state=checked]:bg-[#E67E22]"
                  />
                  <div>
                    <Label htmlFor="forcePasswordChange" className="text-sm font-medium cursor-pointer">
                      Forcer le changement de mot de passe à la première connexion
                    </Label>
                    <p className="text-xs text-[#7F8C8D] mt-0.5">Recommandé pour la sécurité</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 mt-8 border-t border-[#E9ECEF]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-[#E9ECEF] text-[#34495E] hover:bg-[#F8F9FA]"
            >
              Annuler
            </Button>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="outline"
                disabled={!isFormValid}
                className="gap-2 border-2 border-[#E67E22] text-[#E67E22] hover:bg-[#FFF5EC]"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>

              {formData.sendEmail && formData.email && (
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className={`gap-2 ${
                    isFormValid
                      ? 'bg-[#E67E22] hover:bg-[#D35400] text-white shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Enregistrer et Envoyer Email
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}