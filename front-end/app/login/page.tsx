'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, ArrowRight, Building2, MapPin, Store, Network } from 'lucide-react';
import { encryptData, decryptData } from '@/lib/cryptoUtils';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { loginUser, clearAuthError } from '@/lib/authSlice';
import { useToast } from '@/hooks/use-toast';
import { asset } from '@/lib/config';
import { API_URL } from '@/lib/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* Mirrors the shape the backend returns from GET /auth/login-context, which is
   built from VMaster.TBL_USER_TO_STORE_MAPPING (company -> camp -> store) plus
   VMaster.TBL_COMPANY_BRANCH_MAPPING (company -> branch). */
type ContextBranch = { branchId: number; branchName: string };
type ContextStore = { storeId: number; storeName: string };
type ContextCamp = { campId: number; campName: string; stores: ContextStore[] };
type ContextCompany = {
  companyId: number;
  companyName: string;
  branches: ContextBranch[];
  camps: ContextCamp[];
};

type LoginFormData = {
  LOGIN_NAME: string;
  PASSWORD_USER_HDR: string;
  COMPANY_ID: string;
  BRANCH_ID: string;
  CAMP_ID: string;
  STORE_ID: string;
};

const REMEMBERED_LOGIN_KEY = 'rememberedLogin';

/* Long enough that a burst of typing produces one request, short enough that the
   dropdowns feel like they are reacting to typing rather than to submit. */
const CONTEXT_LOOKUP_DEBOUNCE_MS = 350;

/* Radix reserves the empty string for SelectItem, so "nothing selected" cannot
   be modelled as "". These sentinels stand in for it. */
const NONE = '__none__';

/* Shorter than this and the endpoint gets asked about every possible prefix.
   Two characters is also enough that the response cannot meaningfully narrow
   down a single account. */
const MIN_LOOKUP_LENGTH = 2;

/* Select values are strings; ids are numbers everywhere else. "" is what an
   unset select reports and must not become id 0. */
const toOptionId = (v: string): number | null => {
  if (!v || v === NONE) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const emptyForm = (): LoginFormData => ({
  LOGIN_NAME: '',
  PASSWORD_USER_HDR: '',
  COMPANY_ID: '',
  BRANCH_ID: '',
  CAMP_ID: '',
  STORE_ID: ''
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>(emptyForm());
  const [rememberMe, setRememberMe] = useState(false);

  /* The company/branch/camp/store tree for the typed username. */
  const [companies, setCompanies] = useState<ContextCompany[]>([]);
  const [contextLoading, setContextLoading] = useState(false);

  /* Monotonic request id. Typing "admin" can fire three lookups in a row and
     they can land out of order; without this a slow early response would
     overwrite a fast later one and offer the wrong company's camps. */
  const lookupSeq = useRef(0);

  /* Remember Me restores the previous pick alongside the credentials. */
  const [rememberedContext, setRememberedContext] = useState<{
    COMPANY_ID: string;
    BRANCH_ID: string;
    CAMP_ID: string;
    STORE_ID: string;
  } | null>(null);

  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.companyId) === formData.COMPANY_ID) ?? null,
    [companies, formData.COMPANY_ID]
  );

  /* Branch is a function of the COMPANY alone - TBL_USER_TO_STORE_MAPPING has no
     branch column, so a branch can never be narrowed by camp or store. */
  const branchOptions = useMemo(() => selectedCompany?.branches ?? [], [selectedCompany]);

  const campOptions = useMemo(() => selectedCompany?.camps ?? [], [selectedCompany]);

  const storeOptions = useMemo(() => {
    const camp = campOptions.find((c) => String(c.campId) === formData.CAMP_ID);
    return camp?.stores ?? [];
  }, [campOptions, formData.CAMP_ID]);

  /* Only options the user is actually mapped to can be submitted. Kept as a
     derived check rather than trusting the select values, so a restored or
     hand-edited form cannot submit a company/camp/store that does not belong
     together. */
  const isSelectionValid = useMemo(() => {
    if (!selectedCompany) return false;
    if (formData.BRANCH_ID && !branchOptions.some((b) => String(b.branchId) === formData.BRANCH_ID)) {
      return false;
    }
    if (formData.CAMP_ID) {
      const camp = campOptions.find((c) => String(c.campId) === formData.CAMP_ID);
      if (!camp) return false;
      if (formData.STORE_ID && !camp.stores.some((s) => String(s.storeId) === formData.STORE_ID)) {
        return false;
      }
    } else if (formData.STORE_ID) {
      /* A store without its camp is meaningless and the backend rejects it. */
      return false;
    }
    return true;
  }, [selectedCompany, branchOptions, campOptions, formData.BRANCH_ID, formData.CAMP_ID, formData.STORE_ID]);

  /* A username with no active mapping still gets to log in - that is a normal
     state for an admin or a service account - but there is nothing to pick, so
     the dropdowns stay empty and the form submits without a context, leaving the
     backend to apply its default. */
  const hasContextOptions = companies.length > 0;

  const canSubmit =
    formData.LOGIN_NAME.trim().length > 0 &&
    formData.PASSWORD_USER_HDR.length > 0 &&
    (!hasContextOptions || isSelectionValid) &&
    !loading;

  /* Show Redux errors as toasts */
  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearAuthError());
    }
  }, [error, dispatch, toast]);

  /* Load remembered credentials on mount */
  useEffect(() => {
    const savedEncrypted = localStorage.getItem(REMEMBERED_LOGIN_KEY);
    if (!savedEncrypted) return;

    try {
      const savedData = decryptData(savedEncrypted) as Partial<LoginFormData> | null;
      if (typeof savedData?.LOGIN_NAME === 'string' && typeof savedData?.PASSWORD_USER_HDR === 'string') {
        setFormData({
          ...emptyForm(),
          LOGIN_NAME: savedData.LOGIN_NAME,
          PASSWORD_USER_HDR: savedData.PASSWORD_USER_HDR
        });
        setRememberMe(true);
        /* The pick is only a hint. It is re-applied below, and only if it still
           matches what the freshly fetched tree offers - an admin may have
           revoked a mapping since it was saved. */
        setRememberedContext({
          COMPANY_ID: String(savedData.COMPANY_ID ?? ''),
          BRANCH_ID: String(savedData.BRANCH_ID ?? ''),
          CAMP_ID: String(savedData.CAMP_ID ?? ''),
          STORE_ID: String(savedData.STORE_ID ?? '')
        });
      }
    } catch (err) {
      console.error('Failed to load remembered login:', err);
      localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    }
  }, []);

  /* Clear credentials if Remember Me is unchecked */
  useEffect(() => {
    if (!rememberMe) {
      localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    }
  }, [rememberMe]);

  /* Look up the mapped company/camp/store/branch for whatever has been typed.
     Debounced, and skipped entirely below MIN_LOOKUP_LENGTH characters. */
  useEffect(() => {
    const loginName = formData.LOGIN_NAME.trim();

    if (loginName.length < MIN_LOOKUP_LENGTH) {
      lookupSeq.current += 1;
      setCompanies([]);
      setContextLoading(false);
      return;
    }

    const seq = ++lookupSeq.current;
    setContextLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/auth/login-context?loginName=${encodeURIComponent(loginName)}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('lookup failed');
        const json = await res.json();

        /* A newer keystroke already superseded this request. */
        if (seq !== lookupSeq.current) return;

        const parsed = json?.data?.companies;
        setCompanies(Array.isArray(parsed) ? parsed : []);
      } catch {
        if (seq !== lookupSeq.current) return;
        /* An empty list is the same thing the server sends for an unknown user,
           so a failed lookup must look identical - otherwise the dropdown state
           would tell you which usernames exist. */
        setCompanies([]);
      } finally {
        if (seq === lookupSeq.current) setContextLoading(false);
      }
    }, CONTEXT_LOOKUP_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [formData.LOGIN_NAME]);

  /* Preselect once the tree arrives, and re-apply a remembered pick when it is
     still valid. Every dropdown defaults to its first option so a single-option
     user is pre-selected without the dropdown having to be disabled. */
  useEffect(() => {
    if (companies.length === 0) {
      setFormData((prev) =>
        prev.COMPANY_ID || prev.BRANCH_ID || prev.CAMP_ID || prev.STORE_ID
          ? { ...prev, COMPANY_ID: '', BRANCH_ID: '', CAMP_ID: '', STORE_ID: '' }
          : prev
      );
      return;
    }

    setFormData((prev) => {
      const company = companies.find((c) => String(c.companyId) === prev.COMPANY_ID) ?? companies[0];
      if (!company) return prev;

      const remembered =
        rememberedContext && String(company.companyId) === rememberedContext.COMPANY_ID
          ? rememberedContext
          : null;

      const branchValueStr = (() => {
        if (remembered?.BRANCH_ID) {
          const ok = company.branches.some((b) => String(b.branchId) === remembered.BRANCH_ID);
          if (ok) return String(remembered.BRANCH_ID);
        }
        if (company.branches && company.branches.length > 0 && company.branches[0]?.branchId != null) {
          return String(company.branches[0].branchId);
        }
        return NONE;
      })();

      const campId = (() => {
        if (remembered?.CAMP_ID) {
          const ok = company.camps.some((c) => String(c.campId) === remembered.CAMP_ID);
          if (ok) return String(remembered.CAMP_ID);
        }
        if (company.camps && company.camps.length > 0 && company.camps[0]?.campId != null) {
          return String(company.camps[0].campId);
        }
        return '';
      })();
      const camp = company.camps.find((c) => String(c.campId) === campId);

      const storeValue = (() => {
        if (remembered?.STORE_ID && camp?.stores) {
          const ok = camp.stores.some((s) => String(s.storeId) === remembered.STORE_ID);
          if (ok) return String(remembered.STORE_ID);
        }
        if (camp?.stores && camp.stores.length > 0 && camp.stores[0]?.storeId != null) {
          return String(camp.stores[0].storeId);
        }
        return NONE;
      })();

      const next = {
        ...prev,
        COMPANY_ID: String(company.companyId),
        BRANCH_ID: branchValueStr,
        CAMP_ID: campId ? String(campId) : '',
        STORE_ID: storeValue
      };

      /* Nothing changed - skip the state update so this does not re-run the
         effect and re-fetch in a loop. */
      const unchanged =
        next.COMPANY_ID === prev.COMPANY_ID &&
        next.BRANCH_ID === prev.BRANCH_ID &&
        next.CAMP_ID === prev.CAMP_ID &&
        next.STORE_ID === prev.STORE_ID;
      return unchanged ? prev : next;
    });
  }, [companies, rememberedContext]);

  /* Editing the username invalidates the whole tree, so every dependent pick is
     dropped rather than left pointing at the previous user's companies. */
  const handleLoginNameChange = useCallback((value: string) => {
    lookupSeq.current += 1;
    setCompanies([]);
    setRememberedContext(null);
    setFormData((prev) => ({ ...prev, LOGIN_NAME: value, COMPANY_ID: '', BRANCH_ID: '', CAMP_ID: '', STORE_ID: '' }));
  }, []);

  const handleCompanyChange = useCallback((value: string) => {
    setFormData((prev) => {
      const company = companies.find((c) => String(c.companyId) === value);
      if (!company) return { ...prev, COMPANY_ID: '', BRANCH_ID: NONE, CAMP_ID: '', STORE_ID: NONE };

      const camp = company.camps[0];
      return {
        ...prev,
        COMPANY_ID: value,
        /* Branch belongs to the company, so it is re-defaulted here; camp and
           store are re-defaulted from the new company's own first camp. */
        BRANCH_ID: (() => {
          if (company.branches && company.branches.length > 0 && company.branches[0]?.branchId != null) {
            return String(company.branches[0].branchId);
          }
          return NONE;
        })(),
        CAMP_ID: camp ? String(camp.campId) : '',
        STORE_ID: (() => {
          if (camp?.stores && camp.stores.length > 0 && camp.stores[0]?.storeId != null) {
            return String(camp.stores[0].storeId);
          }
          return NONE;
        })()
      };
    });
  }, [companies]);

  const handleCampChange = useCallback((value: string) => {
    setFormData((prev) => {
      const company = companies.find((c) => String(c.companyId) === prev.COMPANY_ID);
      const camp = company?.camps.find((c) => String(c.campId) === value);
      return {
        ...prev,
        CAMP_ID: value,
        /* Only the store depends on the camp. The branch does not, so it is
           left alone - re-defaulting it here would discard a deliberate pick. */
        STORE_ID: camp?.stores[0]?.storeId != null ? String(camp.stores[0].storeId) : NONE
      };
    });
  }, [companies]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const LOGIN_NAME = formData.LOGIN_NAME.trim();
    const PASSWORD = formData.PASSWORD_USER_HDR;

    if (!LOGIN_NAME || !PASSWORD) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter username and password.' });
      return;
    }

    /* Guard here as well as in canSubmit: a submit can be triggered by the Enter
       key in a field while the dropdowns are still settling. */
    if (hasContextOptions && !isSelectionValid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please choose a valid company, branch, camp and store.'
      });
      return;
    }

    const contextSelection = {
      COMPANY_ID: toOptionId(formData.COMPANY_ID),
      BRANCH_ID: toOptionId(formData.BRANCH_ID),
      CAMP_ID: toOptionId(formData.CAMP_ID),
      STORE_ID: toOptionId(formData.STORE_ID)
    };

    const result = await dispatch(loginUser({
      LOGIN_NAME,
      PASSWORD,
      /* Sent only when there is something to send. A user with no mapping logs
         in bare and the backend applies its default context. */
      ...(hasContextOptions ? contextSelection : {})
    }));

    if (loginUser.fulfilled.match(result)) {
      if (rememberMe) {
        localStorage.setItem(
          REMEMBERED_LOGIN_KEY,
          encryptData({
            LOGIN_NAME,
            PASSWORD_USER_HDR: PASSWORD,
            COMPANY_ID: contextSelection.COMPANY_ID ?? '',
            BRANCH_ID: contextSelection.BRANCH_ID ?? '',
            CAMP_ID: contextSelection.CAMP_ID ?? '',
            STORE_ID: contextSelection.STORE_ID ?? ''
          })
        );
      } else {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY);
      }

      toast({ title: 'Success', description: 'Login successful! Redirecting...' });
      router.replace('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-body bg-background selection:bg-primary/20">
      {/* Background Decoration (Matching Theme Colors) */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px] opacity-50" />
      </div>

      {/* Atmospheric Hero Image */}
      <div
        className="absolute inset-0 z-0 opacity-[0.07] blur-[2px] pointer-events-none transition-opacity duration-1000"
        style={{ backgroundImage: `url("${asset('/login-bg.png')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      <div className="relative z-10 w-full max-w-md px-6 py-4">
        {/* Branding Section */}
        <div className="flex flex-col items-center mb-4 group cursor-default animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="relative">
            <div className="bg-white/90 flex items-center justify-center backdrop-blur-xl p-4 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-white transform transition-all duration-1000 group-hover:scale-[1.02]">
              <img
                src={asset('/tbgs-logo.jpg')}
                alt="tbgs Logo"
                className="w-40 h-auto max-h-20 object-contain transition-transform duration-700"
              />
            </div>
            {/* Minimalist Professional Tagline */}
            <div className="mt-4 flex flex-col items-center gap-1.5 transform transition-all duration-700">
              <div className="h-1 w-10 bg-linear-to-r from-transparent via-primary/30 to-transparent rounded-full" />
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60">
                ERP MANAGEMENT SYSTEM * v1.0
              </p>
            </div>
          </div>
        </div>

        {/* Login Card (Using Theme Card Component) */}
        <div className="bg-card/80 backdrop-blur-2xl border border-border rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-primary/5">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-black text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
              Secure access to your enterprise dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1" htmlFor="login_name">
                Username or Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="login_name"
                  type="text"
                  placeholder="Admin"
                  value={formData.LOGIN_NAME}
                  onChange={(e) => handleLoginNameChange(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold text-foreground/80" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-bold text-secondary hover:text-secondary/80 transition-colors" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={formData.PASSWORD_USER_HDR}
                  onChange={(e) => setFormData({ ...formData, PASSWORD_USER_HDR: e.target.value })}
                  autoComplete="current-password"
                  disabled={loading}
                  className="block w-full pl-11 pr-12 py-3 bg-muted/30 border border-border rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Company / Branch / Camp / Store
                Options come from GET /auth/login-context, which returns only what
                this username is mapped to. Branch depends on the company alone,
                camp on the company, and store on the camp. */}
            {hasContextOptions && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                    Scope
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80 ml-1" htmlFor="company_id">
                    Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground z-10">
                      <Building2 size={18} />
                    </div>
                    <Select
                      value={formData.COMPANY_ID}
                      onValueChange={handleCompanyChange}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="company_id"
                        className="w-full pl-11 h-12 bg-muted/30 border-border rounded-xl text-sm focus:ring-4 focus:ring-primary/10"
                      >
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.companyId} value={String(c.companyId)}>
                            {c.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 ml-1" htmlFor="camp_id">
                      Camp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground z-10">
                        <MapPin size={18} />
                      </div>
                      <Select
                        value={formData.CAMP_ID === '' ? NONE : (formData.CAMP_ID || NONE)}
                        onValueChange={handleCampChange}
                        disabled={loading}
                      >
                        <SelectTrigger
                          id="camp_id"
                          className="w-full pl-11 h-12 bg-muted/30 border-border rounded-xl text-sm focus:ring-4 focus:ring-primary/10"
                        >
                          <SelectValue placeholder="Select camp" />
                        </SelectTrigger>
                        <SelectContent>
                          {campOptions.length === 0 && (
                            <SelectItem value={NONE}>No camps mapped</SelectItem>
                          )}
                          {campOptions.map((c) => (
                            <SelectItem key={c.campId} value={String(c.campId)}>
                              {c.campName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground/80 ml-1" htmlFor="store_id">
                      Store
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground z-10">
                        <Store size={18} />
                      </div>
                      <Select
                        value={formData.STORE_ID === '' ? NONE : (formData.STORE_ID || NONE)}
                        onValueChange={(v) => setFormData({ ...formData, STORE_ID: v === NONE ? '' : v })}
                        disabled={loading}
                      >
                        <SelectTrigger
                          id="store_id"
                          className="w-full pl-11 h-12 bg-muted/30 border-border rounded-xl text-sm focus:ring-4 focus:ring-primary/10"
                        >
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {storeOptions.length === 0 && (
                            <SelectItem value={NONE}>No stores mapped</SelectItem>
                          )}
                          {storeOptions.map((s) => (
                            <SelectItem key={s.storeId} value={String(s.storeId)}>
                              {s.storeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground/80 ml-1" htmlFor="branch_id">
                    Branch
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground z-10">
                      <Network size={18} />
                    </div>
                    <Select
                        value={formData.BRANCH_ID === '' ? NONE : (formData.BRANCH_ID || NONE)}
                        onValueChange={(v) => setFormData({ ...formData, BRANCH_ID: v === NONE ? '' : v })}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="branch_id"
                        className="w-full pl-11 h-12 bg-muted/30 border-border rounded-xl text-sm focus:ring-4 focus:ring-primary/10"
                      >
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* A company with no active branch mapping is a valid
                            state, not an error - it must still be selectable
                            so the user can log in. */}
                        {branchOptions.length === 0 && (
                          <SelectItem value={NONE}>No branch mapped</SelectItem>
                        )}
                        {branchOptions.map((b) => (
                          <SelectItem key={b.branchId} value={String(b.branchId)}>
                            {b.branchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {contextLoading && (
                  <p className="text-[11px] text-muted-foreground text-center animate-pulse">
                    Loading your companies...
                  </p>
                )}
              </div>
            )}

            {/* Remember Me Toggle */}
            <div className="flex items-center ml-1 select-none">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 transition-all cursor-pointer accent-primary"
                />
              </div>
              <label htmlFor="remember" className="ml-2 block text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Remember Me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rights Information */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
            Copyright 2026 Vision Infotech Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* Branded Footer Asset */}
      <div className="fixed bottom-0 left-0 w-full h-1/4 z-[-1] opacity-5 overflow-hidden pointer-events-none grayscale mix-blend-multiply transition-opacity duration-700">
        <img
          src={asset('/agro-muted-footer.png')}
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </div>
  );
}