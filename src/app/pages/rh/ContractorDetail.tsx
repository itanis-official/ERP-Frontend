import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Briefcase, Calendar, Building2, FileText, Download, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { contractorsApi, type CollaborateurExterne } from '../../lib/contractorsApi'

export function ContractorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: contractor, isLoading, error } = useQuery<CollaborateurExterne>({
    queryKey: ['contractor', id],
    queryFn: () => contractorsApi.getById(Number(id)),
    enabled: !!id,
  })

  const handleDownloadCV = async () => {
    if (!id) return
    try {
      const blob = await contractorsApi.downloadCV(Number(id))
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CV_${contractor?.prenom}_${contractor?.nom}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Erreur lors du téléchargement du CV')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#E67E22]" size={40} />
      </div>
    )
  }

  if (error || !contractor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Sous-traitant non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/rh/contractors')} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-700">Actif</Badge>
      case 'inactif':
        return <Badge className="bg-gray-100 text-gray-700">Inactif</Badge>
      case 'suspendu':
        return <Badge className="bg-yellow-100 text-yellow-700">Suspendu</Badge>
      default:
        return <Badge>{statut}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/rh/contractors')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">
              {contractor.prenom} {contractor.nom}
            </h1>
            <p className="text-gray-600">{contractor.poste}</p>
          </div>
        </div>
        <Button
          className="bg-[#E67E22] hover:bg-[#D66F1C] text-white flex items-center gap-2"
          onClick={() => navigate(`/rh/contractors?edit=${contractor.id}`)}
        >
          <Edit2 size={18} />
          Modifier
        </Button>
      </div>

      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Photo & Status */}
        <Card className="lg:col-span-1 p-6 text-center">
          <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-[#E67E22] bg-[#FFF5EC] flex items-center justify-center text-[#E67E22] text-3xl font-bold">
            {contractor.prenom?.[0]}{contractor.nom?.[0]}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {contractor.prenom} {contractor.nom}
          </h2>
          {getStatusBadge(contractor.statut)}
          <div className="mt-4 space-y-2 text-left">
            <div>
              <p className="text-sm text-gray-600">Matricule</p>
              <p className="font-medium text-gray-900">{contractor.matricule}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Département</p>
              <p className="font-medium text-gray-900">{contractor.departement || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Société d'origine</p>
              <p className="font-medium text-gray-900">{contractor.societeOrigine}</p>
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
                <a href={`mailto:${contractor.email}`} className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                  <Mail size={16} />
                  {contractor.email || 'Non renseigné'}
                </a>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Téléphone</label>
                <a href={`tel:${contractor.telephone}`} className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                  <Phone size={16} />
                  {contractor.telephone || 'Non renseigné'}
                </a>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">CIN</label>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  {contractor.cin || 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Adresse</label>
                <p className="text-gray-900 flex items-start gap-2 mt-1">
                  <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                  {contractor.adresse ? `${contractor.adresse}, ${contractor.codePostal} ${contractor.ville}` : 'Non renseigné'}
                </p>
              </div>
            </div>

            {/* Job Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">Poste</label>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  <Briefcase size={16} />
                  {contractor.poste || 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Date de début</label>
                <p className="text-gray-900 flex items-center gap-2 mt-1">
                  <Calendar size={16} />
                  {contractor.dateDebut ? new Date(contractor.dateDebut).toLocaleDateString('fr-FR') : 'Non renseigné'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Nationalité</label>
                <p className="text-gray-900 mt-1">{contractor.nationalite || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">Genre</label>
                <p className="text-gray-900 mt-1">
                  {contractor.genre === 'M' ? 'Masculin' : contractor.genre === 'F' ? 'Féminin' : 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mission Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 size={20} className="text-[#E67E22]" />
          Détails de la Mission
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Société d'origine</p>
            <p className="font-semibold text-gray-900">{contractor.societeOrigine}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Mission</p>
            <p className="font-semibold text-gray-900">{contractor.mission || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Durée</p>
            <p className="font-semibold text-gray-900">{contractor.dureeMission} jours</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Fin de mission</p>
            <p className="font-semibold text-gray-900">
              {contractor.dateFinMission ? new Date(contractor.dateFinMission).toLocaleDateString('fr-FR') : 'Non renseigné'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Taux Journalier</p>
            <p className="text-2xl font-bold text-[#E67E22]">{contractor.tauxJournalier} {contractor.devise}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Taux Horaire</p>
            <p className="text-2xl font-bold text-gray-900">
              {contractor.tauxHoraire ? `${contractor.tauxHoraire} ${contractor.devise}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Mission Renouvelable</p>
            <Badge className={contractor.missionRenouvelable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
              {contractor.missionRenouvelable ? 'Oui' : 'Non'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Contract Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations Contractuelles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Numéro de Contrat</p>
            <p className="font-semibold text-gray-900">{contractor.numeroContratSoustraitance || 'Non renseigné'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Statut</p>
            {getStatusBadge(contractor.statut)}
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-[#E67E22]" />
          Documents
        </h3>
        <div className="space-y-2">
          {contractor.fichierCV ? (
            <div 
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between"
              onClick={handleDownloadCV}
            >
              <div className="flex items-center gap-3">
                <FileText className="text-[#E67E22]" size={24} />
                <div>
                  <p className="font-medium text-gray-900">CV du Sous-traitant</p>
                  <p className="text-sm text-gray-600">{contractor.fichierCV}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                Télécharger
              </Button>
            </div>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
              Aucun CV disponible
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
