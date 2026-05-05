// components/ModelSelector.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
  Bot,
  ChevronDown,
  CheckCircle,
  Cpu,
  Zap,
  Gauge,
  Sparkles,
  Brain,
  Rocket,
  AlertCircle,
} from 'lucide-react'
import { getAvailableModels, type AIModel, AVAILABLE_MODELS } from '../services/aiPlanningService'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  className?: string
  disabled?: boolean
  compact?: boolean
}

const SPEED_ICONS: Record<string, React.ReactNode> = {
  fast: <Zap className="h-3 w-3 text-green-500" />,
  medium: <Gauge className="h-3 w-3 text-yellow-500" />,
  slow: <Rocket className="h-3 w-3 text-orange-500" />,
}

const SPEED_LABELS: Record<string, string> = {
  fast: 'Rapide',
  medium: 'Moyen',
  slow: 'Précis',
}

const QUALITY_STARS = (quality: number) => {
  return '⭐'.repeat(quality) + '☆'.repeat(5 - quality)
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  className = '',
  disabled = false,
  compact = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>(AVAILABLE_MODELS)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true)
      try {
        const fetched = await getAvailableModels()
        setModels(fetched)
      } catch (error) {
        console.error('Erreur chargement modèles:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadModels()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = models.find(m => m.id === selectedModel) || models[0]

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Brain className="h-3.5 w-3.5" />
          <span>{selected.name.split(' ')[0]}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <Cpu className="h-3 w-3" /> Choisir un modèle IA
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {models.map(model => {
                const isSelected = selectedModel === model.id
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      isSelected ? 'bg-orange-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{model.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {model.provider}
                        </span>
                      </div>
                      {isSelected && <CheckCircle className="h-3.5 w-3.5 text-[#ef7c21]" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {SPEED_ICONS[model.speed]}
                        <span className="text-[10px] text-gray-500">{SPEED_LABELS[model.speed]}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">•</span>
                      <span className="text-[10px] text-gray-500">{QUALITY_STARS(model.quality)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#ef7c21] hover:text-[#ef7c21] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ef7c21]/20 to-[#ef7c21]/5 flex items-center justify-center">
          <Brain className="h-4 w-4 text-[#ef7c21]" />
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-400">Modèle IA</p>
          <p className="text-sm font-semibold">{selected.name}</p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {SPEED_ICONS[selected.speed]}
          <span className="text-xs text-gray-500">{SPEED_LABELS[selected.speed]}</span>
        </div>
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#ef7c21]" />
              Modèles d'intelligence artificielle
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Choisissez le modèle selon vos besoins
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {models.map(model => {
              const isSelected = selectedModel === model.id
              const isRecommended = model.quality >= 4 && model.speed !== 'slow'
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onModelChange(model.id)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-all ${
                    isSelected ? 'bg-orange-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#ef7c21]/20' : 'bg-gray-100'
                    }`}>
                      <Brain className={`h-5 w-5 ${isSelected ? 'text-[#ef7c21]' : 'text-gray-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-[#ef7c21]' : 'text-gray-800'}`}>
                          {model.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {model.provider}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> Recommandé
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ef7c21]/10 text-[#ef7c21] flex items-center gap-0.5">
                            <CheckCircle className="h-2.5 w-2.5" /> Actif
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">{model.description}</p>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {SPEED_ICONS[model.speed]}
                          <span className="text-[10px] text-gray-500">
                            {SPEED_LABELS[model.speed]}
                          </span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-0.5">
                          <span className="text-[10px] text-gray-500">Qualité:</span>
                          <span className="text-[10px]">{QUALITY_STARS(model.quality)}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <span className="text-[10px] text-gray-400">
                          {model.maxTokens.toLocaleString()} tokens
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-[#ef7c21] shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Modèles hébergés par Groq Cloud</span>
              </div>
              <span>Latence variable selon disponibilité</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}