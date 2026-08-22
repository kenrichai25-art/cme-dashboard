import React from 'react';
import { 
  RotateCcw, 
  Sliders 
} from 'lucide-react';
import { CalculatorParams } from '../../types';
import { formatGBP } from '../../utils/stratosCalculations';

interface StratosCalculatorSettingsProps {
  params: CalculatorParams;
  onChangeParams: (newParams: CalculatorParams) => void;
  onResetParams: () => void;
}

export const StratosCalculatorSettings: React.FC<StratosCalculatorSettingsProps> = ({
  params,
  onChangeParams,
  onResetParams,
}) => {
  const effectiveValue = params.recoveryPerCase * params.strikeRate;

  const setPreset = (recovery: number, strike: number) => {
    onChangeParams({
      ...params,
      recoveryPerCase: recovery,
      strikeRate: strike,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-6 mb-6 space-y-5">
      {/* Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-neutral-100 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FE5729]/10 border border-[#FE5729]/20 flex items-center justify-center text-[#FE5729]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#1C1C1C] flex items-center gap-2 font-display">
              <span>Financial Recovery Calculator Settings</span>
              <span className="text-[11px] font-bold bg-[#FE5729]/10 text-[#FE5729] px-2.5 py-0.5 rounded-full border border-[#FE5729]/20">
                Live Dynamic Model
              </span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Adjust case recovery value and strike rate across all 153 English Education Authorities
            </p>
          </div>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-neutral-400 font-medium hidden sm:inline">Presets:</span>
          <button
            id="preset-conservative-btn"
            onClick={() => setPreset(1800, 0.5)}
            className="px-3 py-1.5 text-xs font-bold rounded-full border border-neutral-200 bg-[#F4F4F6] hover:bg-neutral-200 text-[#1C1C1C] transition-all cursor-pointer"
          >
            Conservative (50%)
          </button>
          <button
            id="preset-benchmark-btn"
            onClick={() => setPreset(2800, 0.75)}
            className="px-3 py-1.5 text-xs font-bold rounded-full border border-[#FE5729] bg-[#FE5729] text-white transition-all shadow-xs cursor-pointer"
          >
            Benchmark (75%)
          </button>
          <button
            id="preset-aggressive-btn"
            onClick={() => setPreset(3600, 0.85)}
            className="px-3 py-1.5 text-xs font-bold rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all cursor-pointer"
          >
            Optimistic (85%)
          </button>
          <button
            id="reset-calculator-btn"
            onClick={onResetParams}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Reset parameters to benchmark defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        {/* Parameter 1: Recovery Per Successful Case (R) */}
        <div className="bg-[#F4F4F6] p-4 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#1C1C1C] flex items-center gap-1.5">
              <span>Avg Recovery per Case (R)</span>
              <span className="text-[10px] text-neutral-400 font-normal">(£1k – £6k)</span>
            </label>
            <span className="text-xs font-extrabold text-[#1C1C1C] bg-white px-2 py-0.5 rounded-full border border-neutral-200">
              {formatGBP(params.recoveryPerCase)}
            </span>
          </div>
          <input
            id="recovery-slider"
            type="range"
            min="1000"
            max="6000"
            step="100"
            value={params.recoveryPerCase}
            onChange={(e) =>
              onChangeParams({
                ...params,
                recoveryPerCase: Number(e.target.value),
              })
            }
            className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-[#FE5729]"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>£1,000</span>
            <span>£2,800 (Default)</span>
            <span>£6,000</span>
          </div>
        </div>

        {/* Parameter 2: Case Strike Rate (S) */}
        <div className="bg-[#F4F4F6] p-4 rounded-2xl border border-neutral-200/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#1C1C1C] flex items-center gap-1.5">
              <span>Investigation Strike Rate (S)</span>
              <span className="text-[10px] text-neutral-400 font-normal">(10% – 100%)</span>
            </label>
            <span className="text-xs font-extrabold text-[#1C1C1C] bg-white px-2 py-0.5 rounded-full border border-neutral-200">
              {Math.round(params.strikeRate * 100)}%
            </span>
          </div>
          <input
            id="strike-rate-slider"
            type="range"
            min="0.10"
            max="1.00"
            step="0.01"
            value={params.strikeRate}
            onChange={(e) =>
              onChangeParams({
                ...params,
                strikeRate: parseFloat(Number(e.target.value).toFixed(2)),
              })
            }
            className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-[#FE5729]"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>10%</span>
            <span>75% (Default)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Output: Effective Value per Opened Case */}
        <div className="bg-[#1C1C1C] p-4 rounded-2xl text-white shadow-sm border border-neutral-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#FE5729]/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs text-neutral-300 font-medium">Effective Value per Case</span>
            <span className="text-[10px] font-bold bg-[#FE5729]/20 text-[#FE5729] px-2 py-0.5 rounded-full border border-[#FE5729]/30">
              R × S
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white mt-1.5 relative z-10">
            {formatGBP(effectiveValue)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1 relative z-10">
            Projected yield per opened target investigation (8+ weeks CME)
          </p>
        </div>
      </div>
    </div>
  );
};
