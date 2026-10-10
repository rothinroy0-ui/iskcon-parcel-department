import React from 'react';
import { useData } from '../../context/DataContext';
import { Building2, Users, Phone, ShieldCheck } from 'lucide-react';

export const DepartmentView: React.FC = () => {
  const { departments, devotees } = useData();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
          Temple Departments & Seva Rosters
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Organizational structure of ISKCON departments, appointed leaders, and volunteer allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const deptDevotees = devotees.filter((d) => d.department_id === dept.id);

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {dept.code}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-3">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dept.description}</p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department Head:</span>
                    <strong className="text-slate-800">{dept.head_devotee}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-mono text-slate-700">{dept.head_phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Active Devotees:</span>
                    <strong className="text-amber-800 font-bold">{deptDevotees.length} registered</strong>
                  </div>
                </div>
              </div>

              {deptDevotees.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Assigned Devotees Sample
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {deptDevotees.slice(0, 3).map((d) => (
                      <span key={d.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {d.spiritual_name || d.legal_name}
                      </span>
                    ))}
                    {deptDevotees.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{deptDevotees.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
