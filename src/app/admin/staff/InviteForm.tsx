'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { assignRole } from '@/actions/admin/staff';
import { Mail, BadgeCheck, UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="flex items-start bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-100 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 mr-2.5 mt-0.5 shrink-0 text-rose-500" />
          <div className="text-xs font-bold leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 mr-2.5 mt-0.5 shrink-0 text-emerald-500" />
          <div className="text-xs font-bold leading-relaxed">{successMsg}</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff Email</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="e.g. chef@hotel.com"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Access Role</label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <BadgeCheck className="w-4 h-4" />
          </div>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer font-semibold"
          >
            <option value="">Select Role</option>
            {roles.filter(r => r.name !== 'CUSTOMER').map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all mt-2 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Invite...
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
