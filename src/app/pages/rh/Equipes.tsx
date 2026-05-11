import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Trash2, UserPlus, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { equipesApi, type Equipe } from '../../lib/equipesApi'
import { personnelApi, type CollaborateurInterne } from '../../lib/personnelApi'
import { useAuth } from '../../contexts/AuthContext'
import { normalizeRole } from '../../lib/rbac'

function fullName(c: { prenom?: string; nom?: string }) {
  return `${c.prenom || ''} ${c.nom || ''}`.trim()
}

export function Equipes() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const rhId = user?.id

  const [search, setSearch] = useState('')
  const [selectedDomaine, setSelectedDomaine] = useState('all')
  const [selectedEquipeId, setSelectedEquipeId] = useState<number | null>(null)

  const [createForm, setCreateForm] = useState({
    nom: '',
    domaine: '',
    description: '',
    chefProjetId: 'none',
  })

  const [agentIds, setAgentIds] = useState<number[]>([])
  const [assignChefId, setAssignChefId] = useState<string>('none')

  const [isCreating, setIsCreating] = useState(false)
  const [isAssigningAgents, setIsAssigningAgents] = useState(false)
  const [isAssigningChef, setIsAssigningChef] = useState(false)
  const [isDeletingTeamId, setIsDeletingTeamId] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: equipes = [], isLoading: loadingEquipes } = useQuery<Equipe[]>({
    queryKey: ['equipes'],
    queryFn: equipesApi.getAll,
  })

  const { data: domaines = [] } = useQuery<string[]>({
    queryKey: ['equipes-domaines'],
    queryFn: equipesApi.getDomaines,
  })

  const { data: employees = [] } = useQuery<CollaborateurInterne[]>({
    queryKey: ['employees'],
    queryFn: personnelApi.getAll,
  })

  const allDomaines = useMemo(() => {
    const fromTeams = equipes.map((e) => e.domaine).filter(Boolean)
    return Array.from(new Set([...domaines, ...fromTeams]))
  }, [domaines, equipes])

  const filteredEquipes = useMemo(() => {
    return equipes.filter((e) => {
      const matchesDomaine = selectedDomaine === 'all' || e.domaine === selectedDomaine
      const token = `${e.nom} ${e.domaine} ${e.description || ''}`.toLowerCase()
      const matchesSearch = token.includes(search.toLowerCase())
      return matchesDomaine && matchesSearch
    })
  }, [equipes, selectedDomaine, search])

  const selectedEquipe = useMemo(() => {
    return filteredEquipes.find((e) => e.id === selectedEquipeId) || filteredEquipes[0] || null
  }, [filteredEquipes, selectedEquipeId])

  const chefCandidates = useMemo(() => {
    return employees.filter((c) => {
      const role = normalizeRole(c.role)
      return role === 'chef_projet' || role === 'super_admin'
    })
  }, [employees])

  const agentCandidates = useMemo(() => {
    return employees.filter((c) => normalizeRole(c.role) === 'agent')
  }, [employees])

  const currentMemberIds = useMemo(() => {
    return new Set((selectedEquipe?.membres || []).map((m) => m.collaborateurId))
  }, [selectedEquipe])

  const handleCreateEquipe = async () => {
    setErrorMsg('')
    if (!rhId) {
      setErrorMsg('Utilisateur RH introuvable.')
      return
    }

    if (!createForm.nom.trim() || !createForm.domaine.trim()) {
      setErrorMsg('Nom et domaine sont obligatoires.')
      return
    }

    setIsCreating(true)
    try {
      await equipesApi.create({
        rhId,
        nom: createForm.nom.trim(),
        domaine: createForm.domaine.trim(),
        description: createForm.description.trim() || undefined,
        chefProjetId: createForm.chefProjetId === 'none' ? undefined : Number(createForm.chefProjetId),
      })
      setCreateForm({ nom: '', domaine: '', description: '', chefProjetId: 'none' })
      await qc.invalidateQueries({ queryKey: ['equipes'] })
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Impossible de créer l\'équipe.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAssignAgents = async () => {
    setErrorMsg('')
    if (!selectedEquipe || !rhId || agentIds.length === 0) return

    setIsAssigningAgents(true)
    try {
      await equipesApi.assignAgents(selectedEquipe.id, rhId, agentIds)
      setAgentIds([])
      await qc.invalidateQueries({ queryKey: ['equipes'] })
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Impossible d\'affecter les agents.')
    } finally {
      setIsAssigningAgents(false)
    }
  }

  const handleAssignChef = async () => {
    setErrorMsg('')
    if (!selectedEquipe || !rhId || assignChefId === 'none') return

    setIsAssigningChef(true)
    try {
      await equipesApi.assignChef(selectedEquipe.id, rhId, Number(assignChefId))
      setAssignChefId('none')
      await qc.invalidateQueries({ queryKey: ['equipes'] })
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Impossible d\'affecter le chef de projet.')
    } finally {
      setIsAssigningChef(false)
    }
  }

  const handleRemoveMember = async (collaborateurId: number) => {
    setErrorMsg('')
    if (!selectedEquipe || !rhId) return

    try {
      await equipesApi.removeMember(selectedEquipe.id, collaborateurId, rhId)
      await qc.invalidateQueries({ queryKey: ['equipes'] })
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Impossible de retirer ce membre.')
    }
  }

  const handleDeleteEquipe = async (id: number) => {
    setErrorMsg('')
    if (!rhId) return
    if (!confirm('Supprimer cette équipe ?')) return

    setIsDeletingTeamId(id)
    try {
      await equipesApi.delete(id, rhId)
      if (selectedEquipeId === id) {
        setSelectedEquipeId(null)
      }
      await qc.invalidateQueries({ queryKey: ['equipes'] })
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Impossible de supprimer cette équipe.')
    } finally {
      setIsDeletingTeamId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Gestion des Equipes</h1>
        <p className="text-gray-600">Accueil &gt; Equipes</p>
      </div>

      {errorMsg && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
          {errorMsg}
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 xl:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-[#2C3E50]">Nouvelle Equipe</h2>

          <div>
            <Label>Nom</Label>
            <Input
              value={createForm.nom}
              onChange={(e) => setCreateForm((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Ex: Equipe Dev Core"
            />
          </div>

          <div>
            <Label>Domaine</Label>
            <Input
              value={createForm.domaine}
              onChange={(e) => setCreateForm((p) => ({ ...p, domaine: e.target.value }))}
              placeholder="Ex: Developpement"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description de l'equipe"
            />
          </div>

          <div>
            <Label>Chef de Projet (optionnel)</Label>
            <Select
              value={createForm.chefProjetId}
              onValueChange={(value) => setCreateForm((p) => ({ ...p, chefProjetId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectionner un chef" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {chefCandidates.map((chef) => (
                  <SelectItem key={chef.id} value={String(chef.id)}>
                    {fullName(chef)} - {chef.poste}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-[#E67E22] hover:bg-[#D35400] text-white"
            onClick={handleCreateEquipe}
            disabled={isCreating}
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Creer Equipe
          </Button>
        </Card>

        <div className="xl:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une equipe..."
              />
              <Select value={selectedDomaine} onValueChange={setSelectedDomaine}>
                <SelectTrigger className="h-9 md:w-[260px] rounded-md border-[#DDD5CD] bg-white text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7D746C]">Domaine:</span>
                    <SelectValue placeholder="Tous les domaines" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {allDomaines.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold text-[#2C3E50] mb-3">Equipes</h3>
              {loadingEquipes ? (
                <div className="text-gray-500 text-sm">Chargement...</div>
              ) : filteredEquipes.length === 0 ? (
                <div className="text-gray-500 text-sm">Aucune equipe trouvee.</div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
                  {filteredEquipes.map((equipe) => (
                    <button
                      key={equipe.id}
                      onClick={() => setSelectedEquipeId(equipe.id)}
                      className={`w-full text-left p-3 rounded-lg border transition ${
                        selectedEquipe?.id === equipe.id
                          ? 'border-[#E67E22] bg-[#FFF5EC]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-[#2C3E50]">{equipe.nom}</p>
                        <Badge variant="outline">{equipe.domaine}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Chef: {equipe.chefProjet ? fullName(equipe.chefProjet) : 'Non affecte'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{equipe.membres.length} membres</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 space-y-4">
              {!selectedEquipe ? (
                <div className="text-gray-500 text-sm">Selectionnez une equipe.</div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#2C3E50]">{selectedEquipe.nom}</h3>
                      <p className="text-sm text-gray-600">{selectedEquipe.description || 'Sans description'}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDeleteEquipe(selectedEquipe.id)}
                      disabled={isDeletingTeamId === selectedEquipe.id}
                    >
                      {isDeletingTeamId === selectedEquipe.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Changer le chef de projet</Label>
                    <div className="flex gap-2">
                      <Select value={assignChefId} onValueChange={setAssignChefId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner un chef" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selectionner</SelectItem>
                          {chefCandidates.map((chef) => (
                            <SelectItem key={chef.id} value={String(chef.id)}>
                              {fullName(chef)} - {chef.poste}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAssignChef} disabled={isAssigningChef || assignChefId === 'none'}>
                        {isAssigningChef ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Ajouter des agents</Label>
                    <div className="max-h-[140px] overflow-auto border rounded-md p-2 mt-2 space-y-1">
                      {agentCandidates.map((a) => {
                        const checked = agentIds.includes(a.id!)
                        const alreadyMember = currentMemberIds.has(a.id!)
                        return (
                          <label key={a.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              disabled={alreadyMember}
                              checked={checked}
                              onChange={(e) => {
                                const value = a.id!
                                setAgentIds((prev) => {
                                  if (e.target.checked) return [...prev, value]
                                  return prev.filter((id) => id !== value)
                                })
                              }}
                            />
                            <span className={alreadyMember ? 'text-gray-400' : 'text-gray-700'}>
                              {fullName(a)} - {a.poste} {alreadyMember ? '(deja membre)' : ''}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <Button
                      className="mt-2"
                      onClick={handleAssignAgents}
                      disabled={isAssigningAgents || agentIds.length === 0}
                    >
                      {isAssigningAgents ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                      Affecter Agents
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#2C3E50] mb-2">Membres</h4>
                    {selectedEquipe.membres.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun membre.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEquipe.membres.map((m) => (
                          <div key={m.id} className="flex items-center justify-between border rounded-md p-2">
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {m.collaborateur ? fullName(m.collaborateur) : `ID ${m.collaborateurId}`}
                              </p>
                              <p className="text-xs text-gray-500">{m.roleDansEquipe}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveMember(m.collaborateurId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
