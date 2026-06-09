'use client'

import { useState } from 'react'

export default function EducationModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 z-10 bg-[#5BC0BE]/20 hover:bg-[#5BC0BE]/30 border border-[#5BC0BE]/50 text-[#5BC0BE] rounded-full p-3 transition-colors"
        title="Learn about Stranded Value (methane capture + Bitcoin)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    )
  }
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-[#5BC0BE]/30 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            About Stranded Value
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            <strong className="text-[#FF8C00]">Stranded methane</strong> (our starting point for Stranded Value) refers to natural gas 
            that is uneconomical to capture and transport through pipelines. This methane is 
            often vented or flared, releasing potent greenhouse gases into the atmosphere.
          </p>
          
          <div className="bg-[#0f172a] rounded-lg p-4">
            <h3 className="font-semibold text-[#5BC0BE] mb-2">The Opportunity</h3>
            <p>
              Bitcoin mining can transform this waste into value. By placing mobile mining 
              operations at stranded gas sites, we can:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
              <li>Reduce methane emissions (25x worse than CO₂)</li>
              <li>Generate clean Bitcoin with zero grid impact</li>
              <li>Create revenue for environmental remediation</li>
            </ul>
          </div>
          
          <div className="bg-[#0f172a] rounded-lg p-4">
            <h3 className="font-semibold text-[#5BC0BE] mb-2">How This Map Works</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF8C00]"></span>
                <span>Orange dots = Verified stranded gas sites</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                <span>Gray dots = Demo/projected locations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-[#5BC0BE]"></span>
                <span>Teal lines = Power transmission grid</span>
              </li>
            </ul>
          </div>
          
          <p className="text-xs text-gray-500 pt-2 border-t border-[#5BC0BE]/20">
            Data sources: Provincial energy regulators, satellite methane detection, 
            and industry partnerships. This is a prototype for demonstration purposes.
          </p>
        </div>
      </div>
    </div>
  )
}
