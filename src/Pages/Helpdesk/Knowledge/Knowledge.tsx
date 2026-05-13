import { useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { KnowledgeDetail } from './KnowledgeDetail';
import type { Article } from '../../../types';
import {
  BookOpen,
  Layers,
  Users,
  Search,
  User as UserIcon,
  Calendar,
  ChevronDown,
  Plus,
  X,
  Upload,
  CheckCircle2
} from 'lucide-react';

// Initial mock articles
const INITIAL_ARTICLES: Article[] = [
  {
    id: 'T-234',
    title: 'Migration serveurs Azure',
    description: 'Guide complet pour la migration des serveurs vers Azure Cloud',
    service: 'Help Desk',
    category: 'Gestion Serveur',
    author: 'Marc Dupont',
    date: '2026-02-20',
    solutions: [
      {
        id: 1,
        author: 'Marc Dupont',
        date: '2026-02-20',
        content: 'Audit initial et migration via Azure Site Recovery (ASR). Configuration des VNETs terminée.',
        files: ['audit_report.pdf', 'network_schema.png']
      },
      {
        id: 2,
        author: 'Jean Perrin',
        date: '2026-02-22',
        content: "Alternative pour les serveurs legacy : Utilisation de Azure Migrate avec appliance locale pour éviter les incompatibilités d'OS.",
        files: ['legacy_fix.docx']
      }
    ]
  },
  {
    id: 'T-789',
    title: 'Optimisation Pipeline CI/CD',
    description: 'Réduction du temps de build pour les projets React',
    service: 'Développement',
    category: 'DevOps',
    author: 'Lucas Vasseur',
    date: '2026-02-22',
    solutions: [
      {
        id: 3,
        author: 'Lucas Vasseur',
        date: '2026-02-22',
        content: 'Mise en cache des node_modules et parallélisation des tests unitaires sur GitHub Actions.',
        files: ['workflow.yml']
      }
    ]
  },
  {
    id: 'T-321',
    title: 'Déploiement Image W11',
    description: 'Masterisation des nouveaux postes Dell XPS',
    service: 'Windows',
    category: 'Poste de travail',
    author: 'Julie Martin',
    date: '2026-02-25',
    solutions: [
      {
        id: 4,
        author: 'Julie Martin',
        date: '2026-02-25',
        content: "Utilisation de MDT pour le déploiement de l'image Windows 11 Pro 23H2.",
        files: ['config_mdt.txt']
      }
    ]
  }
];

export function Knowledge() {
  const [articles] = useState<Article[]>(INITIAL_ARTICLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [activeService, setActiveService] = useState('Tous les services');

  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Filtering
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService = activeService === 'Tous les services' || article.service === activeService;
      return matchesSearch && matchesService;
    });
  }, [searchQuery, activeService, articles]);

  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNewFiles([...newFiles, ...Array.from(e.target.files)]);
  };

  // If an article is selected, show KnowledgeDetail
  if (selectedArticle) {
    return <KnowledgeDetail article={selectedArticle} onBack={() => setSelectedArticleId(null)} />;
  }

  // List view
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Article Creation Modal */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl border-none">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Nouvel Article</h2>
                <p className="text-slate-500 text-sm font-medium">Documentez une nouvelle problématique</p>
              </div>
              <button onClick={() => setIsArticleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom de l'article</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium"
                    placeholder="Titre..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium"
                    placeholder="Cloud, Réseau..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium"
                  placeholder="Résumé..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Première Solution</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium resize-none"
                  placeholder="Détails..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pièces jointes</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center group cursor-pointer relative">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  <Upload className="mx-auto h-8 w-8 text-slate-300 group-hover:text-[#ef7c21] mb-2" />
                  <p className="text-xs font-bold text-slate-500">Cliquez pour ajouter des fichiers</p>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="flex-1 py-4 rounded-xl font-black text-xs uppercase text-slate-500 bg-slate-100 hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="flex-[2] py-4 rounded-xl font-black text-xs uppercase text-white bg-[#ef7c21] hover:bg-[#d96a1a] shadow-lg shadow-orange-100"
                >
                  Créer l'article
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="text-slate-500 font-medium mt-1">Exploitez le savoir-faire technique partagé par l'équipe</p>
        </div>
        <button
          onClick={() => setIsArticleModalOpen(true)}
          className="flex items-center gap-2 bg-[#ef7c21] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d96a1a] transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} /> Nouvel Article
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#ef7c21]/10 outline-none font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer shadow-sm min-w-[240px]"
            value={activeService}
            onChange={(e) => setActiveService(e.target.value)}
          >
            <option>Tous les services</option>
            <option>Help Desk</option>
            <option>Windows</option>
            <option>Développement</option>
          </select>
          <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Articles', value: articles.length, icon: BookOpen, color: 'bg-[#ef7c21]' },
          { label: 'Secteurs', value: '3', icon: Layers, color: 'bg-blue-600' },
          { label: 'Contributeurs', value: '8', icon: Users, color: 'bg-[#00b341]' }
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group`}>
            <div className="relative z-10">
              <stat.icon className="h-10 w-10 mb-4 opacity-80" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{stat.label}</p>
              <p className="text-5xl font-black mt-2">{stat.value}</p>
            </div>
            <stat.icon className="absolute -right-6 -bottom-6 h-40 w-40 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        ))}
      </div>

      {/* Articles List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className="group hover:border-[#ef7c21]/40 transition-all shadow-sm cursor-pointer"
            noPadding
            onClick={() => setSelectedArticleId(article.id)}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ef7c21] group-hover:bg-[#ef7c21] group-hover:text-white transition-colors">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#ef7c21] transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                        {article.service}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase">{article.category}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-300">#{article.id}</span>
              </div>
              <p className="text-slate-500 font-medium mb-8 line-clamp-2 leading-relaxed">{article.description}</p>
              <div className="flex flex-wrap gap-6 items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                    <UserIcon size={14} /> {article.author}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                    <Calendar size={14} /> {article.date}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#00b341] bg-green-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                  <CheckCircle2 size={14} /> {article.solutions.length} solutions validées
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <Search size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-bold">Aucun article ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
