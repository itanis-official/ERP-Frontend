import React from 'react'

export function HelpdeskView() {
  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Module Helpdesk</h1>
        <p className="text-gray-500 text-sm mb-6">Support client et gestion des tickets</p>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
          <p className="text-rose-700 font-medium mb-2">Module en cours de développement</p>
          <p className="text-rose-600 text-sm">Ce module inclura : Tickets, Chat, Base de connaissances, SLA.</p>
        </div>
      </div>
    </div>
  )
}
export default HelpdeskView
