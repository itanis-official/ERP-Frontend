import { City, Country } from "country-state-city";

export interface CountryOption {
  isoCode: string;
  name: string;
  currencyCode: string;
  phoneCode: string;
}

const normalizePhoneCode = (rawPhoneCode: string): string => {
  const digitsOnly = rawPhoneCode.replace(/[^\d]/g, "");
  return digitsOnly ? `+${digitsOnly}` : "";
};

export const countryOptions: CountryOption[] = Country.getAllCountries()
  .map((country) => ({
    isoCode: country.isoCode,
    name: country.name,
    currencyCode: country.currency || "",
    phoneCode: normalizePhoneCode(country.phonecode || ""),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const countryByName = new Map(countryOptions.map((country) => [country.name.toLowerCase(), country]));

const countryAliases: Record<string, string> = {
  tunisie: "Tunisia",
  "etats-unis": "United States",
  "etats unis": "United States",
  "etatsunis": "United States",
  "royaume-uni": "United Kingdom",
  "cote d'ivoire": "Cote D'Ivoire",
};

export const currencyOptions: string[] = Array.from(
  new Set(countryOptions.map((country) => country.currencyCode).filter(Boolean)),
).sort();

export const phoneCountryOptions: Array<{ name: string; phoneCode: string }> = Array.from(
  new Map(
    countryOptions
      .filter((country) => Boolean(country.phoneCode))
      .map((country) => [country.phoneCode, { name: country.name, phoneCode: country.phoneCode }]),
  ).values(),
).sort((a, b) => a.name.localeCompare(b.name));

export const getCountryByName = (countryName: string): CountryOption | undefined => {
  return countryByName.get(countryName.toLowerCase());
};

export const normalizeCountryName = (countryName: string): string => {
  const trimmed = countryName.trim();
  if (!trimmed) {
    return "";
  }

  const aliasMatch = countryAliases[trimmed.toLowerCase()];
  if (aliasMatch) {
    return aliasMatch;
  }

  const exactMatch = getCountryByName(trimmed);
  return exactMatch?.name || trimmed;
};

export const getCitiesByCountryName = (countryName: string): string[] => {
  const matchedCountry = getCountryByName(countryName);
  if (!matchedCountry) {
    return [];
  }

  const cities = City.getCitiesOfCountry(matchedCountry.isoCode) || [];
  return cities.map((city) => city.name).sort((a, b) => a.localeCompare(b));
};
