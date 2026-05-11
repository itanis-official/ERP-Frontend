import React from 'react'

export function RHView() {
  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Module Ressources Humaines</h1>
        <p className="text-gray-500 text-sm mb-6">Gestion du personnel</p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <p className="text-emerald-700 font-medium mb-2">Module en cours de développement</p>
          <p className="text-emerald-600 text-sm">Ce module inclura : Employés, Recrutement, Congés, Évaluations.</p>
        </div>
      </div>
    </div>
  )
}
export default RHView
