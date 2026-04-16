import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, GripVertical, Check } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { crmApi } from '../../lib/api'

export function Phases() {
  const [newPhase, setNewPhase] = useState('')
  const [isAddingPhase, setIsAddingPhase] = useState(false)
  const [editingPhase, setEditingPhase] = useState<any>(null)

  const { data: phases = [] } = useQuery<any[]>({
    queryKey: ['phases'],
    queryFn: async () => {
      try { return (await crmApi.get('/api/phases')).data }
      catch { return [] }
    },
  })

  const defaultPhases = [
    { id: 1, name: 'Prospection', order: 1, color: '#95A5A6' },
    { id: 2, name: 'Qualification', order: 2, color: '#3498DB' },
    { id: 3, name: 'Proposition', order: 3, color: '#9B59B6' },
    { id: 4, name: 'Négociation', order: 4, color: '#E67E22' },
    { id: 5, name: 'Gagné', order: 5, color: '#27AE60' },
    { id: 6, name: 'Perdu', order: 6, color: '#E74C3C' },
  ]

  const displayPhases = phases.length > 0 ? phases : defaultPhases

  const handleAddPhase = async () => {
    if (!newPhase.trim()) return
    // TODO: Call API to add phase
    setNewPhase('')
    setIsAddingPhase(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Phases du Pipeline</h1>
          <p className="text-gray-600">Gérez les étapes de votre processus commercial</p>
        </div>
        <Button
          className="bg-[#E67E22] hover:bg-[#D66F1C] text-white flex items-center gap-2"
          onClick={() => setIsAddingPhase(!isAddingPhase)}
        >
          <Plus size={18} />
          {isAddingPhase ? 'Annuler' : 'Ajouter une Phase'}
        </Button>
      </div>

      {/* Add New Phase Form */}
      {isAddingPhase && (
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nom de la phase (ex: Étape de fermeture)"
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPhase()}
              />
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={handleAddPhase}
            >
              <Check size={18} />
              Ajouter
            </Button>
          </div>
        </Card>
      )}

      {/* Phases List */}
      <div className="space-y-4">
        {displayPhases.map((phase, index) => (
          <Card key={phase.id} className="p-6 hover:shadow-lg transition">
            <div className="flex items-center gap-6">
              {/* Order indicator */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                <span className="text-lg font-bold text-gray-600">{index + 1}</span>
              </div>

              {/* Phase info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: phase.color }}
                  />
                  {editingPhase?.id === phase.id ? (
                    <Input
                      value={editingPhase.name}
                      onChange={(e) => setEditingPhase({ ...editingPhase, name: e.target.value })}
                      className="text-lg font-semibold"
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Étape {index + 1} du processus commercial
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-gray-600">Opportunités</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E67E22]">€485K</p>
                  <p className="text-sm text-gray-600">Montant total</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-blue-50"
                  onClick={() => setEditingPhase(editingPhase?.id === phase.id ? null : phase)}
                >
                  <Edit2 size={16} className="text-blue-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-red-50"
                >
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
            </div>

            {/* Configuration */}
            {editingPhase?.id === phase.id && (
              <div className="mt-6 pt-6 border-t space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Couleur</label>
                  <div className="flex gap-3 mt-2">
                    {['#95A5A6', '#3498DB', '#9B59B6', '#E67E22', '#27AE60', '#E74C3C'].map(color => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-2 transition"
                        style={{
                          backgroundColor: color,
                          borderColor: editingPhase.color === color ? '#000' : 'transparent'
                        }}
                        onClick={() => setEditingPhase({ ...editingPhase, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="bg-green-600 hover:bg-green-700 text-white flex-1">
                    Sauvegarder
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setEditingPhase(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Best Practices */}
      <Card className="p-6 bg-blue-50 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bonnes Pratiques</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Limitez-vous à 5-7 phases pour une meilleure lisibilité</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Utilisez un ordre logique du flux commercial</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Attribuez une couleur unique à chaque phase pour meilleure identification</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <span>Incluez les phases de "gain" et "perte" pour une analyse complète</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
