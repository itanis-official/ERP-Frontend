
export interface PublicHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  types: string[]
}

export async function fetchTunisiaHolidays(year: number): Promise<PublicHoliday[]> {
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TN`)
  
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des jours fériés')
  }
  
  return response.json()
}

export async function fetchHolidaysForRange(startDate: Date, endDate: Date): Promise<PublicHoliday[]> {
  const years = Array.from(
    new Set([startDate.getFullYear(), endDate.getFullYear()])
  )
  
  const holidaysPromises = years.map(year => fetchTunisiaHolidays(year))
  const holidaysArrays = await Promise.all(holidaysPromises)
  
  const allHolidays = holidaysArrays.flat()
  return allHolidays.filter(holiday => {
    const holidayDate = new Date(holiday.date)
    return holidayDate >= startDate && holidayDate <= endDate
  })
}