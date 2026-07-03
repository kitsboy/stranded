'use client'

interface LayerControlsProps {
  layers: {
    sites: boolean
    grid: boolean
    internet: boolean
    satellite?: boolean
    terrain?: boolean
  }
  onToggle: (layer: keyof LayerControlsProps['layers']) => void
}

export default function LayerControls({ layers, onToggle }: LayerControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-[#1e293b]/95 backdrop-blur border border-[#5BC0BE]/30 rounded-xl p-4 shadow-lg text-sm">
      <h3 className="text-sm font-bold text-[#FF8C00] mb-3 flex items-center gap-2">Map Layers <span className="text-[10px] text-gray-500">(affects visible sites)</span></h3>
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={layers.sites}
            onChange={() => onToggle('sites')}
            className="w-4 h-4 accent-[#FF8C00]"
          />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-[#FF8C00]"></span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Methane Sites
            </span>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={layers.grid}
            onChange={() => onToggle('grid')}
            className="w-4 h-4 accent-[#5BC0BE]"
          />
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#5BC0BE]"></span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Power Grid (close sites only)
            </span>
          </div>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={layers.internet}
            onChange={() => onToggle('internet')}
            className="w-4 h-4 accent-blue-400"
          />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-400/50 rounded"></span>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              Internet Coverage (fiber/starlink)
            </span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={!!layers.satellite} onChange={() => onToggle('satellite')} className="w-4 h-4 accent-purple-400" />
          <span className="text-sm text-gray-300 group-hover:text-white">Satellite Imagery</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" checked={!!layers.terrain} onChange={() => onToggle('terrain')} className="w-4 h-4 accent-emerald-400" />
          <span className="text-sm text-gray-300 group-hover:text-white">3D Terrain View</span>
        </label>
      </div>
      
      <div className="mt-4 pt-3 border-t border-[#5BC0BE]/20">
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF8C00]"></span>
            <span className="text-gray-400">Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            <span className="text-gray-400">Demo</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">Layers dynamically filter the 2,611 pins in real time.</div>
      </div>
    </div>
  )
}
