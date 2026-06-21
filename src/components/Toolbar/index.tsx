import React, { useState } from 'react';
import {
  FilePlus,
  Save,
  FolderOpen,
  Image,
  Trash2,
  Lightbulb,
  Download,
  Upload,
  X,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCircuitStore } from '@/store';
import { saveCircuit, listCircuits, loadCircuit, deleteCircuit } from '@/db';
import type { SavedCircuit } from '@/types/circuit';
import { EXAMPLE_CIRCUITS } from '@/examples';
import { exportCanvasAsImage } from '@/utils/export';

export const Toolbar: React.FC = () => {
  const components = useCircuitStore((s) => s.components);
  const wires = useCircuitStore((s) => s.wires);
  const clearAll = useCircuitStore((s) => s.clearAll);
  const loadCircuitData = useCircuitStore((s) => s.loadCircuit);
  const currentCircuitId = useCircuitStore((s) => s.currentCircuitId);
  const currentCircuitName = useCircuitStore((s) => s.currentCircuitName);
  const setCurrentCircuit = useCircuitStore((s) => s.setCurrentCircuit);

  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [savedList, setSavedList] = useState<SavedCircuit[]>([]);
  const [circuitName, setCircuitName] = useState('我的电路');

  const handleNew = () => {
    if (components.length > 0 || wires.length > 0) {
      if (!confirm('确定要清空当前电路吗？')) return;
    }
    clearAll();
  };

  const handleOpenSave = () => {
    setCircuitName(currentCircuitName);
    setShowSave(true);
  };

  const handleSave = async () => {
    const now = Date.now();
    const saved: SavedCircuit = {
      id: currentCircuitId || uuidv4(),
      name: circuitName || '未命名电路',
      components,
      wires,
      createdAt: now,
      updatedAt: now,
    };
    if (currentCircuitId) {
      const existing = await loadCircuit(currentCircuitId);
      if (existing) {
        saved.createdAt = existing.createdAt;
      }
    }
    await saveCircuit(saved);
    setCurrentCircuit(saved.id, saved.name);
    setShowSave(false);
  };

  const handleOpenLoad = async () => {
    const list = await listCircuits();
    setSavedList(list);
    setShowLoad(true);
  };

  const handleLoad = async (id: string) => {
    const data = await loadCircuit(id);
    if (data) {
      loadCircuitData(data.components, data.wires, data.id, data.name);
      setShowLoad(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个电路吗？')) return;
    await deleteCircuit(id);
    setSavedList(await listCircuits());
  };

  const handleLoadExample = (idx: number) => {
    const example = EXAMPLE_CIRCUITS[idx];
    loadCircuitData(example.components, example.wires, null, example.name);
    setShowExamples(false);
  };

  const handleExport = async () => {
    try {
      await exportCanvasAsImage('circuit.png');
    } catch (err) {
      alert('导出失败，请重试');
    }
  };

  return (
    <>
      <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-1">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-700 mr-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <span className="text-slate-100 font-semibold tracking-wide">电路绘制器</span>
        </div>

        <ToolbarButton icon={<FilePlus className="w-4 h-4" />} label="新建" onClick={handleNew} />
        <ToolbarButton icon={<Save className="w-4 h-4" />} label="保存" onClick={handleOpenSave} />
        <ToolbarButton icon={<FolderOpen className="w-4 h-4" />} label="打开" onClick={handleOpenLoad} />
        <ToolbarButton icon={<Download className="w-4 h-4" />} label="示例" onClick={() => setShowExamples(true)} />

        <div className="w-px h-6 bg-slate-700 mx-2" />

        <ToolbarButton icon={<Image className="w-4 h-4" />} label="导出图片" onClick={handleExport} />
        <ToolbarButton icon={<Trash2 className="w-4 h-4" />} label="清空" onClick={handleNew} danger />
      </div>

      {showSave && (
        <Modal title="保存电路" onClose={() => setShowSave(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm block mb-2">电路名称</label>
              <input
                type="text"
                value={circuitName}
                onChange={(e) => setCircuitName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSave(false)}
                className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showLoad && (
        <Modal title="打开电路" onClose={() => setShowLoad(false)}>
          {savedList.length === 0 ? (
            <div className="text-slate-500 text-center py-8">暂无保存的电路</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {savedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoad(item.id)}
                  className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors group"
                >
                  <div>
                    <div className="text-slate-100 font-medium">{item.name}</div>
                    <div className="text-slate-500 text-xs">
                      {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showExamples && (
        <Modal title="示例电路" onClose={() => setShowExamples(false)}>
          <div className="space-y-2">
            {EXAMPLE_CIRCUITS.map((ex, idx) => (
              <div
                key={idx}
                onClick={() => handleLoadExample(idx)}
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <div className="text-slate-100 font-medium">{ex.name}</div>
                <div className="text-slate-400 text-sm mt-1">{ex.description}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
};

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      danger
        ? 'text-slate-400 hover:bg-red-900/30 hover:text-red-300'
        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const Modal: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
    <div
      className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h3 className="text-slate-100 font-medium">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);
