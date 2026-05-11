import React from 'react'

export function TimesheetView() {
  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Module Timesheet</h1>
        <p className="text-gray-500 text-sm mb-6">Suivi du temps et productivité</p>
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
          <p className="text-cyan-700 font-medium mb-2">Module en cours de développement</p>
          <p className="text-cyan-600 text-sm">Ce module inclura : Temps travaillé, Projets, Rapports, Facturation.</p>
        </div>
      </div>
    </div>
  )
}
export default TimesheetView
