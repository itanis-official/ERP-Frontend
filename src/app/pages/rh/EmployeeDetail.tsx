import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Briefcase, Calendar, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { personnelApi, type CollaborateurInterne } from '../../lib/personnelApi'

export function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_RH_API || 'http://localhost:5085'

  const { data: employee, isLoading, error } = useQuery<CollaborateurInterne>({
    queryKey: ['employee', id],
    queryFn: () => personnelApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#E67E22]" size={40} />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Employé non trouvé</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const formatDate = (value?: string | null) => {
    if (!value) return 'Non renseigné'
    return new Date(value).toLocaleDateString('fr-FR')
  }

  const toArray = (value?: string | null) => {
    if (!value) return []
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  const parseJsonPaths = (value?: string | null): string[] => {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const requiredDocs = [
    { label: 'CV', path: employee.cvPath },
    { label: 'CIN', path: employee.cinDocumentPath },
    { label: 'Attestation CNSS', path: employee.attestationCnssPath },
    { label: 'Contrat signé', path: employee.contratSignePath },
  ].filter((item) => Boolean(item.path)) as Array<{ label: string; path: string }>

  const diplomaDocs = parseJsonPaths(employee.diplomesPathsJson).map((path, index) => ({
    label: `Diplôme ${index + 1}`,
    path,
  }))

  const otherDocs = parseJsonPaths(employee.autresDocumentsPathsJson).map((path, index) => ({
    label: `Document ${index + 1}`,
    path,
  }))

  const documentSections = [
    { title: 'Documents obligatoires', items: requiredDocs },
    { title: 'Diplômes', items: diplomaDocs },
    { title: 'Autres documents', items: otherDocs },
  ].filter((section) => section.items.length > 0)

  const publicUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`
  }

  const fileName = (path: string) => path.split('/').pop() || path

  const days = toArray(employee.joursTravailles)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/rh/personnel')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">
              {employee.prenom} {employee.nom}
            </h1>
            <p className="text-gray-600">{employee.poste}</p>
          </div>
        </div>
        <Button
          className="bg-[#E67E22] hover:bg-[#D66F1C] text-white flex items-center gap-2"
          onClick={() => navigate(`/rh/personnel?edit=${employee.id}`)}
        >
          <Edit2 size={18} />
          Modifier
        </Button>
      </div>

      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Photo & Status */}
        <Card className="lg:col-span-1 p-6 text-center">
          <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-[#E67E22] bg-[#E67E22] flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {employee.photo ? (
              <img src={employee.photo} alt={employee.prenom} className="w-full h-full object-cover" />
            ) : (
              `${employee.prenom?.[0] || ''}${employee.nom?.[0] || ''}`
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {employee.prenom} {employee.nom}
          </h2>
          <Badge className={employee.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
            {employee.statut === 'actif' ? 'Actif' : 'Inactif'}
          </Badge>
          <div className="mt-4 space-y-2 text-left">
            <div>
              <p className="text-sm text-gray-600">Département</p>
              <p className="font-medium text-gray-900">{employee.departement}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Poste</p>
              <p className="font-medium text-gray-900">{employee.poste}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type d'employe</p>
              <p className="font-medium text-gray-900">{employee.typeEmploye || 'Non renseigne'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Matricule</p>
              <p className="font-medium text-gray-900">{employee.matricule}</p>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-3 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations Personnelles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Email</label>
                <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                  <Mail size={16} />
                  {employee.email}
                </a>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Téléphone</label>
                <a href={`tel:${employee.telephone}`} className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                  <Phone size={16} />
                  {employee.telephone || 'Non renseigné'}
                </a>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">CIN</label>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  {employee.cin || 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Adresse</label>
                <p className="text-gray-900 flex items-start gap-2 mt-1">
                  <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                  {employee.adresse ? `${employee.adresse}, ${employee.codePostal} ${employee.ville}` : 'Non renseigné'}
                </p>
              </div>
            </div>

            {/* Job Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Poste</label>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  <Briefcase size={16} />
                  {employee.poste}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Date d'embauche</label>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  <Calendar size={16} />
                  {employee.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Type de contrat</label>
                <Badge className="mt-1">{employee.typeContrat || 'Non renseigné'}</Badge>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Type d'employe</label>
                <p className="text-gray-900 mt-1">{employee.typeEmploye || 'Non renseigne'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Niveau Hiérarchique</label>
                <p className="text-gray-900 mt-1">{employee.niveauHierarchique || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Employment Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Détails d'Emploi</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Salaire Brut</p>
            <p className="text-2xl font-bold text-[#E67E22]">{employee.salaireBrut} {employee.devise}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Solde Congés</p>
            <p className="text-2xl font-bold text-gray-900">{employee.soldeConges} jours</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Ancienneté</p>
            <p className="text-2xl font-bold text-gray-900">
              {employee.dateEmbauche 
                ? Math.floor((new Date().getTime() - new Date(employee.dateEmbauche).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : 0} ans
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Statut</p>
            <Badge className={employee.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
              {employee.statut === 'actif' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Contrat, Horaires et Avantages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Type contrat: <span className="text-gray-900 font-medium">{employee.typeContrat || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">CNSS: <span className="text-gray-900 font-medium">{employee.numeroCNSS || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Période essai: <span className="text-gray-900 font-medium">{employee.periodeEssai || 0} mois</span></p>
            <p className="text-sm text-gray-600">Date confirmation: <span className="text-gray-900 font-medium">{formatDate(employee.dateConfirmation)}</span></p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">Horaire: <span className="text-gray-900 font-medium">{employee.horaireDebut || '--:--'} - {employee.horaireFin || '--:--'}</span></p>
            <p className="text-sm text-gray-600">Jours travaillés: <span className="text-gray-900 font-medium">{days.length > 0 ? days.join(', ') : 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Télétravail: <span className="text-gray-900 font-medium">{employee.teleTravailAutorise ? 'Autorisé' : 'Non'}</span></p>
            <p className="text-sm text-gray-600">Jours/semaine TT: <span className="text-gray-900 font-medium">{employee.joursParSemaine ?? 0}</span></p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">Ticket restaurant: <span className="text-gray-900 font-medium">{employee.ticketRestaurant ? `${employee.montantTicket} ${employee.devise}` : 'Non'}</span></p>
            <p className="text-sm text-gray-600">Transport: <span className="text-gray-900 font-medium">{employee.transport ? `${employee.montantTransport} ${employee.devise}` : 'Non'}</span></p>
            <p className="text-sm text-gray-600">Assurance santé: <span className="text-gray-900 font-medium">{employee.assuranceSante ? 'Oui' : 'Non'}</span></p>
            <p className="text-sm text-gray-600">Police santé: <span className="text-gray-900 font-medium">{employee.numeroPoliceSante || 'Non renseigné'}</span></p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations Complètes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Nationalité: <span className="text-gray-900 font-medium">{employee.nationalite || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Genre: <span className="text-gray-900 font-medium">{employee.genre || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Situation familiale: <span className="text-gray-900 font-medium">{employee.situationFamiliale || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Date naissance: <span className="text-gray-900 font-medium">{formatDate(employee.dateNaissance)}</span></p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">Email personnel: <span className="text-gray-900 font-medium">{employee.emailPersonnel || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Téléphone secondaire: <span className="text-gray-900 font-medium">{employee.telephoneSecondaire || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Pays: <span className="text-gray-900 font-medium">{employee.pays || 'Non renseigné'}</span></p>
            <p className="text-sm text-gray-600">Niveau hiérarchique: <span className="text-gray-900 font-medium">{employee.niveauHierarchique || 'Non renseigné'}</span></p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">Droits mensuels: <span className="text-gray-900 font-medium">{employee.droitsMensuels} jours/mois</span></p>
            <p className="text-sm text-gray-600">Date début acquisition: <span className="text-gray-900 font-medium">{formatDate(employee.dateDebutAcquisition)}</span></p>
            <p className="text-sm text-gray-600">Créé le: <span className="text-gray-900 font-medium">{formatDate(employee.createdAt)}</span></p>
            <p className="text-sm text-gray-600">Dernière mise à jour: <span className="text-gray-900 font-medium">{formatDate(employee.updatedAt)}</span></p>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <Badge variant="outline">{requiredDocs.length + diplomaDocs.length + otherDocs.length} fichier(s)</Badge>
        </div>

        {documentSections.length === 0 ? (
          <p className="text-sm text-gray-600">Aucun document enregistré</p>
        ) : (
          <div className="space-y-5">
            {documentSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">{section.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.items.map((doc) => (
                    <a
                      key={`${section.title}-${doc.path}`}
                      href={publicUrl(doc.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-600 mb-1">{doc.label}</p>
                      <p className="font-medium text-gray-900 break-all">{fileName(doc.path)}</p>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
