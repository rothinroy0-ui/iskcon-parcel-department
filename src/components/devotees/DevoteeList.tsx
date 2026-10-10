import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Devotee, InitiationStatus } from '../../types';
import { DevoteeAvatar } from '../common/DevoteeAvatar';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Sparkles,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';

interface DevoteeListProps {
  onSelectDevotee: (devotee: Devotee) => void;
  onEditDevotee: (devotee: Devotee) => void;
  onAddNewDevotee: () => void;
}

export const DevoteeList: React.FC<DevoteeListProps> = ({
  onSelectDevotee,
  onEditDevotee,
  onAddNewDevotee,
}) => {
  const { devotees, deleteDevotee, exportDevoteesCSV, departments } = useData();
  const { canEditDevotees, canDeleteDevotees, isViewer } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Unique cities
  const cities = useMemo(() => {
    const list = Array.from(new Set(devotees.map((d) => d.city).filter(Boolean)));
    return list.sort();
  }, [devotees]);

  // Filtered devotees
  const filteredDevotees = useMemo(() => {
    return devotees.filter((d) => {
      const matchSearch =
        searchQuery === '' ||
        d.spiritual_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.includes(searchQuery) ||
        d.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.diksha_guru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.counselor_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || d.initiation_status === statusFilter;
      const matchDept = departmentFilter === 'ALL' || d.department_id === departmentFilter;
      const matchCity = cityFilter === 'ALL' || d.city === cityFilter;

      return matchSearch && matchStatus && matchDept && matchCity;
    });
  }, [devotees, searchQuery, statusFilter, departmentFilter, cityFilter]);

  const handleDelete = async (devotee: Devotee) => {
    const title = devotee.spiritual_name || devotee.legal_name;
    if (window.confirm(`Are you sure you want to remove the devotee record for "${title}"? This action will be recorded in the audit trail.`)) {
      const res = await deleteDevotee(devotee.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  const getStatusBadge = (status: InitiationStatus) => {
    switch (status) {
      case 'SANNYASA':
        return <span className="bg-orange-100 text-orange-900 border border-orange-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Sannyasa</span>;
      case 'SECOND_DIKSHA':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">2nd Diksha (Brahmana)</span>;
      case 'FIRST_DIKSHA':
        return <span className="bg-yellow-100 text-yellow-900 border border-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full">1st Diksha (Harinama)</span>;
      case 'ASPIRANT':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">Aspirant / Sheltered</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-full">Uninitiated</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-serif tracking-tight">
            Devotee Congregation Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {filteredDevotees.length} records matching criteria ({devotees.length} total registered in database)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportDevoteesCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            title="Export roster as CSV with audit trail logging"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canEditDevotees && (
            <button
              onClick={onAddNewDevotee}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Devotee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by spiritual name, legal name, phone, city, guru, counselor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Initiation Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="ALL">All Initiation Status</option>
            <option value="SECOND_DIKSHA">2nd Diksha (Brahmana)</option>
            <option value="FIRST_DIKSHA">1st Diksha (Harinama)</option>
            <option value="ASPIRANT">Aspirant / Sheltered</option>
            <option value="UNINITIATED">Uninitiated</option>
            <option value="SANNYASA">Sannyasa</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="ALL">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Clear Filters bar */}
        {(searchQuery || statusFilter !== 'ALL' || departmentFilter !== 'ALL' || cityFilter !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filters active: showing {filteredDevotees.length} of {devotees.length} records</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
                setCityFilter('ALL');
              }}
              className="text-amber-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Content View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Devotee Name</th>
                  <th className="py-3 px-4">Status & Diksha</th>
                  <th className="py-3 px-4">Contact / WhatsApp</th>
                  <th className="py-3 px-4">City / Location</th>
                  <th className="py-3 px-4">Seva / Department</th>
                  <th className="py-3 px-4">Counselor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevotees.length > 0 ? (
                  filteredDevotees.map((dev) => (
                    <tr key={dev.id} className="hover:bg-amber-50/40 transition-colors group">
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onSelectDevotee(dev)}
                          className="cursor-pointer flex items-center space-x-3"
                        >
                          <DevoteeAvatar
                            photoUrl={dev.photo_url}
                            name={dev.spiritual_name || dev.legal_name}
                            id={dev.id}
                            size="md"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              {dev.id.includes('ISKCON_') && (
                                <span className="font-mono text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                  {dev.id}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                {dev.spiritual_name || dev.legal_name}
                              </span>
                            </div>
                            {dev.spiritual_name && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Legal Name: {dev.legal_name}
                              </div>
                            )}
                            {dev.spouse_name && (
                              <div className="text-[10px] text-slate-400">
                                Spouse: {dev.spouse_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          {getStatusBadge(dev.initiation_status)}
                          {dev.diksha_guru && (
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1" title={dev.diksha_guru}>
                              {dev.diksha_guru}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-slate-700">{dev.phone}</span>
                          {dev.phone && (
                            <a
                              href={`https://wa.me/${dev.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {dev.email && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {dev.email}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{dev.city}</div>
                        <div className="text-[11px] text-slate-400">{dev.state}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {dev.primary_seva || 'Congregation'}
                        </div>
                        <div className="text-[11px] text-amber-700 line-clamp-1">
                          {dev.department_name || 'General'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-medium line-clamp-1">
                          {dev.counselor_name || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onSelectDevotee(dev)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="View Devotee Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEditDevotees && (
                            <button
                              onClick={() => onEditDevotee(dev)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                              title="Edit Devotee Details (Audited)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDeleteDevotees && (
                            <button
                              onClick={() => handleDelete(dev)}
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                              title="Delete Devotee Record (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                      No devotee records matched your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevotees.map((dev) => (
            <div
              key={dev.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start space-x-3">
                  <DevoteeAvatar
                    photoUrl={dev.photo_url}
                    name={dev.spiritual_name || dev.legal_name}
                    id={dev.id}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="truncate">
                        <h3 
                          onClick={() => onSelectDevotee(dev)}
                          className="font-bold text-sm text-slate-900 hover:text-amber-700 cursor-pointer truncate"
                        >
                          {dev.spiritual_name || dev.legal_name}
                        </h3>
                        {dev.spiritual_name && (
                          <p className="text-[11px] text-slate-400 truncate">Legal: {dev.legal_name}</p>
                        )}
                      </div>
                      <div className="shrink-0 ml-2">{getStatusBadge(dev.initiation_status)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{dev.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dev.city}, {dev.state}</span>
                  </div>
                  {dev.primary_seva && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/50 mt-2">
                      <strong>Seva:</strong> {dev.primary_seva}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Counselor: {dev.counselor_name || 'N/A'}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onSelectDevotee(dev)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold text-[11px]"
                  >
                    View
                  </button>
                  {canEditDevotees && (
                    <button
                      onClick={() => onEditDevotee(dev)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-[11px]"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
