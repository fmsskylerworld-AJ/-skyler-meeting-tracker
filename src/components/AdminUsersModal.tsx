import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2, XCircle, Clock, X, Loader2, ShieldAlert, Building2, Mail, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types/meeting';
import { supabase } from '../services/supabaseClient';

interface AdminUsersModalProps {
  onClose: () => void;
  onRefreshProfiles?: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ onClose, onRefreshProfiles }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: UserProfile[] = data.map(item => ({
          id: item.id,
          name: item.name || 'N/A',
          email: item.email,
          role: item.role || 'Team Member',
          unit: item.unit || 'Unassigned',
          department: item.department || '',
          isActive: item.is_active ?? false,
          approvalStatus: item.approval_status || (item.is_active ? 'approved' : 'pending'),
          createdAt: item.created_at,
        }));
        setProfiles(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching user profiles:', err);
      setErrorMsg(err.message || 'Failed to load user profiles.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    setActionLoadingId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!supabase) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: newStatus,
          is_active: newStatus === 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMsg(`User status updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccessMsg(null), 3000);

      // Refresh list locally
      setProfiles(prev =>
        prev.map(p =>
          p.id === userId
            ? { ...p, approvalStatus: newStatus, isActive: newStatus === 'approved' }
            : p
        )
      );

      if (onRefreshProfiles) onRefreshProfiles();
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setErrorMsg(err.message || 'Failed to update user approval status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = profiles.filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = profiles.filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = profiles.filter(p => p.approvalStatus === 'rejected').length;

  const filteredProfiles = profiles.filter(p => {
    if (statusFilter === 'all') return true;
    return p.approvalStatus === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  User Access Management
                </h3>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Approve or reject new employee registration requests for Meeting Tracker access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProfiles}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'approved'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Approved ({approvedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-rose-50 border border-rose-300 text-rose-900 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Rejected ({rejectedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-blue-50 border border-blue-300 text-blue-900 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>All ({profiles.length})</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* User Table Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-sm font-bold text-slate-700">Loading user registration requests...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200 p-8">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No users found under this filter</h4>
              <p className="text-xs text-slate-500 mt-1">Select another filter tab above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3.5 pl-4">User Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Assigned Unit</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map(p => {
                    const isUpdating = actionLoadingId === p.id;
                    const isPending = p.approvalStatus === 'pending';
                    const isApproved = p.approvalStatus === 'approved';
                    const isRejected = p.approvalStatus === 'rejected';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 pl-4 font-extrabold text-slate-900">
                          {p.name}
                        </td>
                        <td className="p-3.5 font-medium text-slate-600 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.email}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {p.unit || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.role === 'Admin' 
                              ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                              : 'bg-blue-50 text-blue-900 border border-blue-200'
                          }`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          ) : isRejected ? (
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right pr-4">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-auto" />
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {!isApproved && (
                                <button
                                  onClick={() => handleUpdateStatus(p.id, 'approved')}
                                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {!isRejected && p.role !== 'Admin' && (
                                <button
                                  onClick={() => handleUpdateStatus(p.id, 'rejected')}
                                  className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95 flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Protected by PostgreSQL RLS Policy: Non-Admins are blocked from updating user status.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
