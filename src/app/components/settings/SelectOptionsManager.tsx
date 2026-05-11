import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  InputAdornment,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import {
  getDefaultSelectOptionsConfig,
  type ModuleKey,
  type SelectOption,
  resetModuleSelectOptionsToDefault,
  selectOptionDefinitions,
  updateModuleSelectOptions,
  useModuleSelectOptions,
} from '../../lib/selectOptionsConfig'

interface SelectOptionsManagerProps {
  module: ModuleKey
}

type NewOptionDraft = {
  label: string
  value: string
}

const slugify = (raw: string) =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const sanitizeOptions = (options: SelectOption[]) => {
  const seen = new Set<string>()
  const cleaned: SelectOption[] = []

  options.forEach((item) => {
    const value = String(item.value || '').trim()
    const label = String(item.label || '').trim()
    if (!value || !label) return
    const key = value.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    cleaned.push({ value, label })
  })

  return cleaned
}

export function SelectOptionsManager({ module }: SelectOptionsManagerProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const colors = {
    headerBorder: isDark ? '#3D352E' : '#E2E8F0',
    headerBg: isDark
      ? 'linear-gradient(180deg, #2B241E 0%, #1F1A16 100%)'
      : 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
    panelBorder: isDark ? '#3C342C' : '#E2E8F0',
    panelMutedBorder: isDark ? '#3B342D' : '#E5E7EB',
    sidebarBg: isDark ? '#27211C' : '#F8FAFC',
    sidebarHover: isDark ? '#342C24' : '#F1F5F9',
    surface: isDark ? '#1F1A16' : '#FFFFFF',
    rowBg: isDark ? '#241F1B' : '#FFFFFF',
    rowBorder: isDark ? '#3D352E' : '#E2E8F0',
    title: isDark ? '#F1E9DE' : '#2C3E50',
    searchBg: isDark ? '#29231D' : '#F8FAFC',
    searchBorder: isDark ? '#4A4034' : '#D1D5DB',
    searchIcon: isDark ? '#A79A8E' : '#94A3B8',
    subtleText: isDark ? '#A79A8E' : '#64748B',
    activeButton: '#E67E22',
    activeButtonHover: '#D45F0C',
  }

  const moduleOptions = useModuleSelectOptions(module)
  const definitions = useMemo(
    () => selectOptionDefinitions.filter((item) => item.module === module),
    [module],
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, SelectOption[]>>({})
  const [newOptionDraft, setNewOptionDraft] = useState<Record<string, NewOptionDraft>>({})
  const [saved, setSaved] = useState<string | null>(null)
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({})

  useEffect(() => {
    const next: Record<string, SelectOption[]> = {}
    const nextNewOption: Record<string, NewOptionDraft> = {}

    definitions.forEach((definition) => {
      next[definition.key] = moduleOptions[definition.key] || []
      nextNewOption[definition.key] = { label: '', value: '' }
    })

    setDraft(next)
    setNewOptionDraft(nextNewOption)
  }, [definitions, moduleOptions])

  const hasChanges = (key: string) => {
    const left = JSON.stringify(sanitizeOptions(draft[key] || []))
    const right = JSON.stringify(sanitizeOptions(moduleOptions[key] || []))
    return left !== right
  }

  const totalOptions = useMemo(
    () => definitions.reduce((sum, definition) => sum + (draft[definition.key] || []).length, 0),
    [definitions, draft],
  )

  const changedListsCount = useMemo(
    () => definitions.filter((definition) => hasChanges(definition.key)).length,
    [definitions, draft, moduleOptions],
  )

  const filteredDefinitions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return definitions

    return definitions.filter((definition) => {
      const corpus = `${definition.title} ${definition.description}`.toLowerCase()
      return corpus.includes(query)
    })
  }, [definitions, searchTerm])

  useEffect(() => {
    if (filteredDefinitions.length === 0) {
      setSelectedKey(null)
      return
    }

    const stillExists = filteredDefinitions.some((item) => item.key === selectedKey)
    if (!selectedKey || !stillExists) {
      setSelectedKey(filteredDefinitions[0].key)
    }
  }, [filteredDefinitions, selectedKey])

  const selectedDefinition = useMemo(
    () => filteredDefinitions.find((item) => item.key === selectedKey) ?? null,
    [filteredDefinitions, selectedKey],
  )

  const handleMoveOption = (key: string, index: number, direction: 'up' | 'down') => {
    setDraft((current) => {
      const list = [...(current[key] || [])]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= list.length) return current

      const [moved] = list.splice(index, 1)
      list.splice(targetIndex, 0, moved)
      return { ...current, [key]: list }
    })
  }

  const handleChangeOption = (key: string, index: number, field: keyof SelectOption, value: string) => {
    setDraft((current) => {
      const list = [...(current[key] || [])]
      if (!list[index]) return current
      list[index] = { ...list[index], [field]: value }
      return { ...current, [key]: list }
    })
  }

  const handleDeleteOption = (key: string, index: number) => {
    setDraft((current) => {
      const list = [...(current[key] || [])]
      list.splice(index, 1)
      return { ...current, [key]: list }
    })
  }

  const handleNewOptionChange = (key: string, field: keyof NewOptionDraft, value: string) => {
    setNewOptionDraft((current) => ({
      ...current,
      [key]: {
        ...(current[key] || { label: '', value: '' }),
        [field]: value,
      },
    }))
  }

  const handleAddOption = (key: string) => {
    const currentNew = newOptionDraft[key] || { label: '', value: '' }
    const label = currentNew.label.trim()
    const value = (currentNew.value.trim() || slugify(label)).trim()

    if (!label || !value) {
      setErrorByKey((current) => ({ ...current, [key]: 'Ajoutez un libellé (et une valeur si nécessaire).' }))
      return
    }

    const exists = (draft[key] || []).some((item) => item.value.toLowerCase() === value.toLowerCase())
    if (exists) {
      setErrorByKey((current) => ({ ...current, [key]: 'Cette valeur existe déjà dans la liste.' }))
      return
    }

    setDraft((current) => ({
      ...current,
      [key]: [...(current[key] || []), { label, value }],
    }))

    setNewOptionDraft((current) => ({
      ...current,
      [key]: { label: '', value: '' },
    }))

    setErrorByKey((current) => ({ ...current, [key]: '' }))
  }

  const handleSaveKey = (key: string) => {
    const cleaned = sanitizeOptions(draft[key] || [])
    if (cleaned.length === 0) {
      setErrorByKey((current) => ({ ...current, [key]: 'La liste doit contenir au moins une option valide.' }))
      return
    }

    updateModuleSelectOptions(module, key, cleaned)
    setErrorByKey((current) => ({ ...current, [key]: '' }))
    setSaved(key)
    setTimeout(() => setSaved((current) => (current === key ? null : current)), 1500)
  }

  const handleSaveAll = () => {
    let hasError = false

    definitions.forEach((definition) => {
      const key = definition.key
      const cleaned = sanitizeOptions(draft[key] || [])
      if (cleaned.length === 0) {
        hasError = true
        setErrorByKey((current) => ({ ...current, [key]: 'La liste doit contenir au moins une option valide.' }))
        return
      }

      if (hasChanges(key)) {
        updateModuleSelectOptions(module, key, cleaned)
      }
    })

    if (!hasError) {
      setSaved('__all__')
      setTimeout(() => setSaved((current) => (current === '__all__' ? null : current)), 1500)
    }
  }

  const handleResetKey = (key: string) => {
    const defaults = getDefaultSelectOptionsConfig()
    const defaultList = defaults[module][key] || []
    if (defaultList.length === 0) return

    updateModuleSelectOptions(module, key, defaultList)
    setErrorByKey((current) => ({ ...current, [key]: '' }))
    setSaved(null)
  }

  const handleResetAll = () => {
    resetModuleSelectOptionsToDefault(module)
    setSaved(null)
    setErrorByKey({})
  }

  return (
    <Stack spacing={2.25}>
      <Card
        variant="outlined"
        sx={{
          borderColor: colors.headerBorder,
          background: colors.headerBg,
          borderRadius: 2.5,
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ py: 1.5, px: { xs: 1.5, md: 2 } }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: colors.title, letterSpacing: 0.1 }}>
                  Listes {module.toUpperCase()}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.subtleText }}>
                  Gérez les options affichées dans vos formulaires.
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={`${filteredDefinitions.length} listes`} sx={{ borderColor: colors.rowBorder }} />
                <Chip size="small" variant="outlined" label={`${totalOptions} options`} sx={{ borderColor: colors.rowBorder }} />
                <Chip
                  size="small"
                  label={`${changedListsCount} modifiée(s)`}
                  color={changedListsCount > 0 ? 'warning' : 'default'}
                  sx={changedListsCount > 0 ? { fontWeight: 600 } : undefined}
                />
                {saved === '__all__' && <Chip size="small" color="success" label="Toutes enregistrées" />}
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                size="small"
                placeholder="Rechercher une liste (ex: Statuts, Départements...)"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colors.searchBg,
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: colors.searchBorder,
                    },
                    '&:hover fieldset': {
                      borderColor: colors.searchBorder,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.activeButton,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: colors.searchIcon }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSaveAll}
                disabled={changedListsCount === 0}
                sx={{
                  bgcolor: colors.activeButton,
                  '&:hover': { bgcolor: colors.activeButtonHover },
                  minBlockSize: 36,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Enregistrer tout
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleResetAll}
                sx={{ minBlockSize: 36, textTransform: 'none', fontWeight: 600 }}
              >
                Réinitialiser tout
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {filteredDefinitions.length === 0 && (
        <Alert severity="warning" variant="outlined">
          Aucune liste ne correspond à votre recherche.
        </Alert>
      )}

      {filteredDefinitions.length > 0 && (
        <Card
          variant="outlined"
          sx={{ borderColor: colors.panelBorder, overflow: 'hidden', bgcolor: colors.surface, borderRadius: 2.5, boxShadow: 'none' }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }}>
            <Box
              sx={{
                inlineSize: { xs: '100%', md: 330 },
                borderInlineEnd: { xs: 'none', md: `1px solid ${colors.panelMutedBorder}` },
                borderBlockEnd: { xs: `1px solid ${colors.panelMutedBorder}`, md: 'none' },
                bgcolor: colors.sidebarBg,
                p: 1.25,
              }}
            >
              <Typography sx={{ px: 1, pb: 1, pt: 0.5, fontWeight: 700, color: colors.title }}>
                Listes disponibles
              </Typography>
              <Stack spacing={0.75}>
                {filteredDefinitions.map((definition) => {
                  const isActive = definition.key === selectedKey
                  return (
                    <Button
                      key={definition.key}
                      variant={isActive ? 'contained' : 'text'}
                      onClick={() => setSelectedKey(definition.key)}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        py: 1.1,
                        px: 1.25,
                        borderRadius: 1.5,
                        bgcolor: isActive ? colors.activeButton : 'transparent',
                        color: isActive ? '#fff' : colors.title,
                        border: `1px solid ${isActive ? colors.activeButton : 'transparent'}`,
                        '&:hover': {
                          bgcolor: isActive ? colors.activeButtonHover : colors.sidebarHover,
                        },
                      }}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography fontSize={13} fontWeight={600}>{definition.title}</Typography>
                        <Typography fontSize={11} sx={{ opacity: isActive ? 0.9 : 0.7 }}>
                          {(draft[definition.key] || []).length} option(s)
                        </Typography>
                      </Box>
                      {hasChanges(definition.key) && (
                        <Chip size="small" color={isActive ? 'default' : 'warning'} label="modifiée" />
                      )}
                    </Button>
                  )
                })}
              </Stack>
            </Box>

            <Box sx={{ flex: 1 }}>
              {selectedDefinition && (
                <>
                  <CardHeader
                    titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
                    subheaderTypographyProps={{ variant: 'body2' }}
                    sx={{
                      bgcolor: colors.surface,
                      borderBlockEnd: `1px solid ${colors.panelMutedBorder}`,
                      py: 1.25,
                    }}
                    title={selectedDefinition.title}
                    subheader={selectedDefinition.description}
                    action={
                      <Stack direction="row" spacing={1} alignItems="center">
                        {hasChanges(selectedDefinition.key) && <Chip color="warning" size="small" label="Non enregistrée" />}
                        <Chip variant="outlined" size="small" label={`${(draft[selectedDefinition.key] || []).length} option(s)`} />
                        {saved === selectedDefinition.key && <Chip color="success" size="small" label="Enregistré" />}
                      </Stack>
                    }
                  />

                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack spacing={1.25}>
                        {(draft[selectedDefinition.key] || []).map((item, index) => (
                          <Stack
                            key={`${selectedDefinition.key}-${index}-${item.value}`}
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={1}
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            sx={{
                              p: 1.25,
                              border: '1px solid',
                              borderColor: colors.rowBorder,
                              borderRadius: 1.5,
                              bgcolor: colors.rowBg,
                            }}
                          >
                            <TextField
                              label="Libellé"
                              size="small"
                              value={item.label}
                              onChange={(event) => handleChangeOption(selectedDefinition.key, index, 'label', event.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="Valeur"
                              size="small"
                              value={item.value}
                              onChange={(event) => handleChangeOption(selectedDefinition.key, index, 'value', event.target.value)}
                              sx={{ inlineSize: { xs: '100%', md: 240 } }}
                            />
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Monter">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveOption(selectedDefinition.key, index, 'up')}
                                    disabled={index === 0}
                                    sx={{ border: `1px solid ${colors.rowBorder}` }}
                                  >
                                    <ArrowUpwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Descendre">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMoveOption(selectedDefinition.key, index, 'down')}
                                    disabled={index === (draft[selectedDefinition.key] || []).length - 1}
                                    sx={{ border: `1px solid ${colors.rowBorder}` }}
                                  >
                                    <ArrowDownwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Supprimer">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteOption(selectedDefinition.key, index)}
                                  sx={{ border: `1px solid ${colors.rowBorder}` }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>

                      <Divider sx={{ my: 0.5 }} />

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
                        <TextField
                          label="Nouveau libellé"
                          size="small"
                          value={newOptionDraft[selectedDefinition.key]?.label || ''}
                          onChange={(event) => handleNewOptionChange(selectedDefinition.key, 'label', event.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          label="Nouvelle valeur (optionnel)"
                          size="small"
                          value={newOptionDraft[selectedDefinition.key]?.value || ''}
                          onChange={(event) => handleNewOptionChange(selectedDefinition.key, 'value', event.target.value)}
                          sx={{ inlineSize: { xs: '100%', md: 280 } }}
                        />
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddOption(selectedDefinition.key)}
                          sx={{ minBlockSize: 36, textTransform: 'none', fontWeight: 600 }}
                        >
                          Ajouter
                        </Button>
                      </Stack>

                      {!!errorByKey[selectedDefinition.key] && (
                        <Alert severity="error" variant="outlined">{errorByKey[selectedDefinition.key]}</Alert>
                      )}

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                          variant="text"
                          color="warning"
                          onClick={() => handleResetKey(selectedDefinition.key)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Réinitialiser cette liste
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => handleSaveKey(selectedDefinition.key)}
                          sx={{
                            bgcolor: colors.activeButton,
                            '&:hover': { bgcolor: colors.activeButtonHover },
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          Enregistrer cette liste
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </>
              )}
            </Box>
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
