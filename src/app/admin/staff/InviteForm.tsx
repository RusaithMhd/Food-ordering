'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { assignRole } from '@/actions/admin/staff';
import { Mail, BadgeCheck, UserPlus, AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

interface Role {
  id: string;
  name: string;
}

export function InviteForm({ roles }: { roles: Role[] }) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('role_id', roleId);

      const result = await assignRole(formData);
      if (result.success) {
        setSuccessMsg(`Invitation sent successfully to ${email}!`);
        setEmail('');
        setRoleId('');
      } else {
        setErrorMsg(result.error || 'Failed to send invitation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="flex items-start bg-rose-50/50 backdrop-blur-sm text-rose-800 p-4 rounded-2xl border border-rose-200/60 shadow-sm shadow-rose-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-rose-500" />
          <div className="text-xs font-bold leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start bg-emerald-50/50 backdrop-blur-sm text-emerald-800 p-4 rounded-2xl border border-emerald-200/60 shadow-sm shadow-emerald-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5 shrink-0 text-emerald-500" />
          <div className="text-xs font-bold leading-relaxed">{successMsg}</div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-1">Staff Email</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="e.g. chef@hotel.com"
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400/80 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-widest pl-1">Access Role</label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
            <BadgeCheck className="w-4 h-4" />
          </div>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
            disabled={isLoading}
            className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300 disabled:opacity-50 appearance-none cursor-pointer"
          >
            <option value="" className="text-slate-400">Select Access Role</option>
            {roles.filter(r => r.name !== 'CUSTOMER').map(r => (
              <option key={r.id} value={r.id} className="text-slate-800 font-medium">{r.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors duration-200">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-950/10 active:scale-[0.98] transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:transform-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Invitation...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite & Grant Access
          </>
        )}
      </Button>
    </form>
  );
}
