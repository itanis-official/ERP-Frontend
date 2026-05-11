import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export function HRCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const events = [
    { date: 15, title: 'Team Meeting', time: '14:00', location: 'Salle A' },
    { date: 20, title: 'Training Session', time: '10:00', location: 'Salle B' },
    { date: 25, title: 'Company Event', time: '18:00', location: 'Restaurant' },
  ]

  const getEventForDate = (day: number) => {
    return events.find(e => e.date === day)
  }

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">Calendrier RH</h1>
        <p className="text-gray-600">Événements, formations et réunions d'équipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 capitalize">{monthName}</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={previousMonth}>
                <ChevronLeft size={18} />
              </Button>
              <Button size="sm" variant="outline" onClick={nextMonth}>
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const event = day ? getEventForDate(day) : null
              const isToday = day === new Date().getDate()

              return (
                <div
                  key={index}
                  className={`aspect-square p-2 rounded-lg border-2 transition ${
                    !day
                      ? 'bg-gray-50'
                      : isToday
                      ? 'border-[#E67E22] bg-orange-50'
                      : event
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-[#E67E22] hover:bg-orange-50 cursor-pointer'
                  }`}
                >
                  {day && (
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-semibold ${
                        isToday ? 'text-[#E67E22]' : 'text-gray-900'
                      }`}>
                        {day}
                      </span>
                      {event && (
                        <span className="text-xs text-blue-600 font-medium truncate mt-auto">
                          {event.title}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Événements à Venir</h3>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-[#E67E22] transition bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <span className="text-sm font-medium text-[#E67E22] bg-orange-100 px-2 py-1 rounded">
                    {event.date}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
