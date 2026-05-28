import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, TrendingUp, Target, AlertTriangle, CheckCircle, Lightbulb, Activity, Award, Zap } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

const SECTION_ICONS = {
  'puntos fuertes': CheckCircle,
  'puntos fuertes:': CheckCircle,
  'áreas de mejora': AlertTriangle,
  'áreas de mejora:': AlertTriangle,
  'recomendaciones': Lightbulb,
  'recomendaciones:': Lightbulb,
  'análisis': Activity,
  'análisis:': Activity,
  'conclusión': Award,
  'conclusión:': Award,
  'estrategia': Target,
  'estrategia:': Target,
  'tendencias': TrendingUp,
  'tendencias:': TrendingUp,
  'insights': Zap,
  'insights:': Zap,
};

export const AnalysisResult = ({ response }) => {
  const [expandedSections, setExpandedSections] = useState({});

  // Parsear el markdown para detectar secciones
  const parseSections = (text) => {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;
    let currentContent = [];

    lines.forEach((line, index) => {
      const headerMatch = line.match(/^###\s+(.+)$/);
      
      if (headerMatch) {
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            content: currentContent.join('\n'),
            index: currentSection.index
          });
        }
        currentSection = {
          title: headerMatch[1].trim(),
          index: index
        };
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });

    if (currentSection) {
      sections.push({
        title: currentSection.title,
        content: currentContent.join('\n'),
        index: currentSection.index
      });
    }

    // Si no hay secciones, mostrar todo como una sola sección
    if (sections.length === 0) {
      sections.push({
        title: 'Análisis Completo',
        content: text,
        index: 0
      });
    }

    return sections;
  };

  const sections = parseSections(response);

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getIconForSection = (title) => {
    const lowerTitle = title.toLowerCase();
    for (const [key, Icon] of Object.entries(SECTION_ICONS)) {
      if (lowerTitle.includes(key)) {
        return Icon;
      }
    }
    return Activity;
  };

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const Icon = getIconForSection(section.title);
        const isExpanded = expandedSections[idx] !== false; // Por defecto expandido
        
        return (
          <GlassCard key={idx} className="overflow-hidden">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent-cyan/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-accent-cyan" />
                <h3 className="text-text-primary font-semibold">{section.title}</h3>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-text-secondary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="glass-panel p-4 rounded-lg border-l-4 border-accent-cyan">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h4: ({ children }) => (
                        <h4 className="text-text-primary font-semibold mt-4 mb-2 text-sm">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p className="text-text-secondary text-sm leading-relaxed mb-3">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 mb-3">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-3">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-text-secondary text-sm">
                          {children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-accent-cyan font-semibold">
                          {children}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <code className="bg-panel-bg-solid px-2 py-1 rounded text-xs text-accent-lime font-mono">
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-accent-lime pl-4 py-2 my-3 bg-accent-lime/5 rounded-r">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};
