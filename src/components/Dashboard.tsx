import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import type { ClaudeInstance, InstanceStatus } from '../types';
import { Header } from './Header';
import { InstanceCard } from './InstanceCard';
import { DetailPanel } from './DetailPanel';

interface DashboardProps {
  instances: ClaudeInstance[];
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | InstanceStatus;

export function Dashboard({ instances }: DashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const selectedInstance = useMemo(
    () => instances.find((i) => i.id === selectedId) || null,
    [instances, selectedId]
  );

  const activeCount = useMemo(
    () => instances.filter((i) => !['disconnected', 'offline'].includes(i.status)).length,
    [instances]
  );

  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      const matchesSearch =
        instance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instance.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || instance.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [instances, searchQuery, filterStatus]);

  // Group instances by project
  const groupedInstances = useMemo(() => {
    const groups: Record<string, ClaudeInstance[]> = {};
    filteredInstances.forEach((instance) => {
      if (!groups[instance.project]) {
        groups[instance.project] = [];
      }
      groups[instance.project].push(instance);
    });
    return groups;
  }, [filteredInstances]);

  const handleNewAgent = () => {
    console.log('New agent clicked');
    // TODO: Implement new agent modal
  };

  const handleRestart = (id: string) => {
    console.log('Restart session:', id);
    // TODO: Implement session restart
  };

  return (
    <div className="min-h-screen">
      <Header
        agentCount={instances.length}
        activeCount={activeCount}
        onNewAgent={handleNewAgent}
      />

      {/* Main content */}
      <main className={`transition-all duration-300 ${selectedId ? 'mr-[32rem]' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Toolbar */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search agents, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-ember)] focus:ring-1 focus:ring-[var(--accent-ember)] transition-colors"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="appearance-none pl-10 pr-8 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-ember)] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="idle">Idle</option>
                <option value="working">Working</option>
                <option value="waiting_input">Needs Input</option>
                <option value="disconnected">Disconnected</option>
                <option value="offline">Offline</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--accent-ember-glow)] text-[var(--accent-ember)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--accent-ember-glow)] text-[var(--accent-ember)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grouped instances */}
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedInstances).map(([project, projectInstances]) => (
                <motion.section
                  key={project}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Project header */}
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-[var(--accent-ember)]">
                      {project}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--accent-ember)]/30 to-transparent" />
                    <span className="text-xs text-[var(--text-muted)]">
                      {projectInstances.length} agent{projectInstances.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Instance grid */}
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                        : 'flex flex-col gap-3'
                    }
                  >
                    <AnimatePresence mode="popLayout">
                      {projectInstances.map((instance) => (
                        <InstanceCard
                          key={instance.id}
                          instance={instance}
                          isSelected={instance.id === selectedId}
                          onSelect={() =>
                            setSelectedId(selectedId === instance.id ? null : instance.id)
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filteredInstances.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-[var(--text-muted)]">No agents found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-sm text-[var(--accent-ember)] hover:underline"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Detail panel */}
      <DetailPanel
        instance={selectedInstance}
        onClose={() => setSelectedId(null)}
        onRestart={handleRestart}
      />

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
