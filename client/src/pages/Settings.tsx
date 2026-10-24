
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

type Me = { id:string; email:string; fullName:string; role:string; phoneNumber?:string|null; isActive:boolean };

export default function Settings(){
  const {user, logout} = useAuth();
  const navigate = useNavigate();
  const [,setMe] = useState<Me|null>(null);
  const [loading,setLoading]=useState(true);
  const [fullName,setFullName]=useState('');
  const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');
  const [msg,setMsg]=useState<string|null>(null);
  const [err,setErr]=useState<string|null>(null);
  const [pwdCurr,setPwdCurr]=useState('');
  const [pwdNew,setPwdNew]=useState('');
  const [pwdMsg,setPwdMsg]=useState<string|null>(null);
  const [pwdErr,setPwdErr]=useState<string|null>(null);
  const [deactConfirm,setDeactConfirm]=useState(false);
  useEffect(()=>{
    let active=true;
    apiClient.get('/auth/me').then(r=>{ if(!active) return; const d=r.data; setMe(d); setFullName(d.fullName||''); setEmail(d.email||''); setPhone(d.phoneNumber||''); }).catch(()=>{}).finally(()=> setLoading(false));
    return ()=>{ active=false; };
  },[]);
  if(!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-slate-500">Please sign in.</div>;
  if(loading) return <div className="mx-auto max-w-3xl px-4 py-8"><div className="h-40 animate-pulse rounded-2xl bg-[#f8fafc]"/></div>;
  async function saveProfile(e:React.FormEvent){
    e.preventDefault(); setMsg(null); setErr(null);
    try{ const {data}= await apiClient.put('/auth/profile',{ fullName, email, phoneNumber: phone||null }); setMe(data); setMsg('Profile updated.'); const stored = localStorage.getItem('user'); if(stored){ const u=JSON.parse(stored); u.fullName=data.fullName; u.email=data.email; localStorage.setItem('user', JSON.stringify(u)); } }catch(ex:any){ setErr(ex?.response?.data?.message || 'Could not update profile.'); }
  }
  async function changePwd(e:React.FormEvent){
    e.preventDefault(); setPwdMsg(null); setPwdErr(null);
    try{ await apiClient.post('/auth/change-password',{ currentPassword: pwdCurr, newPassword: pwdNew }); setPwdMsg('Password changed.'); setPwdCurr(''); setPwdNew(''); }catch(ex:any){ setPwdErr(ex?.response?.data?.message || 'Could not change password.'); }
  }
  async function deactivate(){
    try{ await apiClient.post('/auth/deactivate'); logout(); navigate('/login'); }catch(ex:any){ setErr(ex?.response?.data?.message || 'Could not deactivate.'); }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">Settings</h1>
      <p className="mt-1 text-sm text-[#8a7f6f]">Manage your profile, security and account.</p>
      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Profile</h2>
          <p className="mt-1 text-xs text-[#8a7f6f]">Update your display name, email and optional phone number.</p>
          <form onSubmit={saveProfile} className="mt-4 grid gap-3">
            <label className="grid gap-1"><span className="text-xs font-medium text-[#1d1d1f]">Full name</span><input value={fullName} onChange={e=>setFullName(e.target.value)} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm outline-none focus:border-[#cbd5e1] focus:bg-white"/></label>
            <label className="grid gap-1"><span className="text-xs font-medium text-[#1d1d1f]">Email</span><input value={email} onChange={e=>setEmail(e.target.value)} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm outline-none focus:border-[#cbd5e1] focus:bg-white"/></label>
            <label className="grid gap-1"><span className="text-xs font-medium text-[#1d1d1f]">Phone number <span className="text-[#8a7f6f] font-normal">(optional)</span></span><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 ..." className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm outline-none focus:border-[#cbd5e1] focus:bg-white"/></label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            {msg && <p className="text-sm text-emerald-700">{msg}</p>}
            <button type="submit" className="mt-1 inline-flex w-fit rounded-full bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Save changes</button>
          </form>
        </section>
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Security</h2>
          <p className="mt-1 text-xs text-[#8a7f6f]">Change your password. Use a strong, unique password.</p>
          <form onSubmit={changePwd} className="mt-4 grid gap-3">
            <label className="grid gap-1"><span className="text-xs font-medium text-[#1d1d1f]">Current password</span><input type="password" value={pwdCurr} onChange={e=>setPwdCurr(e.target.value)} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm outline-none focus:border-[#cbd5e1] focus:bg-white"/></label>
            <label className="grid gap-1"><span className="text-xs font-medium text-[#1d1d1f]">New password</span><input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm outline-none focus:border-[#cbd5e1] focus:bg-white"/></label>
            {pwdErr && <p className="text-sm text-rose-600">{pwdErr}</p>}
            {pwdMsg && <p className="text-sm text-emerald-700">{pwdMsg}</p>}
            <button type="submit" className="mt-1 inline-flex w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1f] ring-1 ring-[#e2e8f0] hover:bg-[#f8fafc]">Update password</button>
          </form>
        </section>
        <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <h2 className="text-sm font-semibold text-rose-900">Danger zone</h2>
          <p className="mt-1 text-xs leading-5 text-rose-700">Deactivate your account. You will be signed out immediately and only an admin can reactivate it from User Management.</p>
          {!deactConfirm ? <button onClick={()=>setDeactConfirm(true)} className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">Deactivate account</button> : (
            <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-rose-900">Are you sure?</span><button onClick={deactivate} className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Yes, deactivate</button><button onClick={()=>setDeactConfirm(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1f] ring-1 ring-[#e2e8f0]">Cancel</button></div>
          )}
        </section>
      </div>
    </div>
  );
}
