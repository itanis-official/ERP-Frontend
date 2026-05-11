import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import type { Article, Solution } from '../../../types';
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Lightbulb,
  Plus,
  X,
  FileText,
  Paperclip,
  MessageSquare,
  ChevronRight,
  Download,
  Clock,
  Layout
} from 'lucide-react';

interface KnowledgeDetailProps {
  article: Article;
  onBack: () => void;
}

export function KnowledgeDetail({ article: initialArticle, onBack }: KnowledgeDetailProps) {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSolution, setNewSolution] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleAddSolution = () => {
    if (!newSolution.trim()) return;

    const nextId = Math.max(...article.solutions.map((s) => s.id)) + 1;
    const newSolObj: Solution = {
      id: nextId,
      author: 'Utilisateur Actuel',
      date: new Date().toLocaleDateString('fr-FR'),
      content: newSolution,
      files: attachedFiles.map((f) => f.name)
    };

    setArticle({ ...article, solutions: [newSolObj, ...article.solutions] });
    setNewSolution('');
    setAttachedFiles([]);
    setShowAddForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#ef7c21] hover:border-[#ef7c21]/30 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              <span>Knowledge Base</span>
              <ChevronRight size={10} />
              <span className="text-[#ef7c21]">{article.service}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">{article.title}</h1>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
            showAddForm ? 'bg-slate-100 text-slate-500' : 'bg-[#ef7c21] text-white hover:bg-[#d96a1a] shadow-orange-100'
          }`}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Annuler' : 'Ajouter une solution'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Article Summary */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Layout size={14} /> Contexte du Problème
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">{article.description}</p>
          </section>

          {/* Inline Form */}
          {showAddForm && (
            <Card className="p-8 border-2 border-dashed border-[#ef7c21]/30 bg-[#ef7c21]/5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-[#ef7c21] mb-6">
                <Lightbulb size={20} className="fill-current" />
                <h4 className="text-sm font-black uppercase tracking-widest">Nouvelle Étape de Résolution</h4>
              </div>
              <textarea
                value={newSolution}
                onChange={(e) => setNewSolution(e.target.value)}
                rows={5}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-[#ef7c21]/10 outline-none font-medium resize-none mb-4"
                placeholder="Décrivez précisément les manipulations effectuées..."
              />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all">
                  <Paperclip size={14} />
                  Joindre des fichiers
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && setAttachedFiles(Array.from(e.target.files))}
                  />
                </label>
                <button
                  onClick={handleAddSolution}
                  className="px-10 py-3.5 bg-[#ef7c21] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#d96a1a] shadow-lg transition-all"
                >
                  Publier la mise à jour
                </button>
              </div>
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {attachedFiles.map((f, i) => (
                    <span key={i} className="text-[10px] font-bold bg-white px-3 py-1 rounded-lg border border-slate-100 text-slate-500">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Solutions Feed */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-8">
              <MessageSquare size={14} /> Historique des Solutions ({article.solutions.length})
            </h3>

            {article.solutions.map((sol, idx) => (
              <div
                key={sol.id}
                className="relative pl-12 before:absolute before:left-0 before:top-4 before:bottom-0 before:w-px before:bg-slate-200"
              >
                <div className="absolute left-[-6px] top-4 h-3 w-3 rounded-full bg-white border-2 border-[#ef7c21] shadow-[0_0_0_4px_rgba(239,124,33,0.1)]" />

                <Card className="p-8 hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{sol.author}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                          <Clock size={10} /> {sol.date}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      Step #{article.solutions.length - idx}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed mb-8 whitespace-pre-wrap">{sol.content}</p>

                  {sol.files.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                      {sol.files.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-[#ef7c21]/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-[#ef7c21]" />
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{file}</span>
                          </div>
                          <Download size={14} className="text-slate-300 group-hover:text-[#ef7c21] transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-8">Informations Clés</h4>
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ef7c21]">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-40">Auteur Initial</p>
                  <p className="text-sm font-bold">{article.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ef7c21]">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-40">Date de Publication</p>
                  <p className="text-sm font-bold">{article.date}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <div className="p-4 rounded-2xl bg-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-40">Référence</p>
                  <p className="text-lg font-black tracking-widest text-[#ef7c21]">{article.id}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Tags Associés</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">
                {article.category}
              </span>
              <span className="px-3 py-1 bg-orange-50 text-[#ef7c21] rounded-lg text-[10px] font-black uppercase">
                {article.service}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
