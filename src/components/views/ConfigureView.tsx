import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, Edit2, Check, X, ChevronRight, Settings, Layers, Hash, Sparkles, Wallet, Users, Clock, MapPin, Grid, Cpu, Key } from 'lucide-react';
import { OptionService } from '../../services/options';
import { ItineraryOption, UserProfile } from '../../types';
import { ModelRegistry } from '../../services/ai';
import { useToast } from '../ui/toast';
import { BackendService } from '../../services/storage'; // Keep for isConfigured check
import { ComplianceService } from '../../services/compliance';
import { Shield, Download, AlertTriangle } from 'lucide-react';
import { AdminService } from '../../services/admin';
import { AuthorizationUtils } from '../../lib/authorization';
import { DashboardLayout } from '../layout/DashboardLayout';
import { ViewState } from '../../types';

interface ConfigureViewProps {
    user: UserProfile;
    onBack: () => void;
    onNavigate: (view: ViewState) => void;
    onLogout: () => void;
}

export const ConfigureView = ({ user, onBack, onNavigate, onLogout }: ConfigureViewProps) => {
    const [options, setOptions] = useState<ItineraryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('general');
    const { showToast } = useToast();

    // General Settings State
    const [selectedModel, setSelectedModel] = useState<string>(ModelRegistry.currentModelId);
    const hasApiKey = ModelRegistry.hasApiKey();

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ItineraryOption>>({});
    const [isCreating, setIsCreating] = useState(false);

    // Privacy State
    const [privacySettings, setPrivacySettings] = useState<any>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);

    // Section Configuration (Can be expanded)
    const settingsSections = [
        {
            title: "System",
            items: [
                { id: 'general', label: 'AI & System', icon: Cpu },
                { id: 'privacy', label: 'Privacy & Data', icon: Shield },
                ...(AuthorizationUtils.isAdmin(user) ? [{ id: 'users', label: 'User Management', icon: Users }] : [])
            ]
        },
        {
            title: "Itinerary Attributes",
            items: [
                { id: 'mood', label: 'Moods', icon: Sparkles },
                { id: 'budget', label: 'Budgets', icon: Wallet },
                { id: 'duration', label: 'Durations', icon: Clock },
                { id: 'group', label: 'Group Sizes', icon: Users },
                { id: 'type', label: 'Place Types', icon: MapPin },
            ]
        }
    ];

    const activeSectionLabel = settingsSections
        .flatMap(s => s.items)
        .find(i => i.id === activeCategory)
        ?.label;

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOptions();
    }, [activeCategory]);
    // ... (rest of methods same until return)

    const loadOptions = async () => {
        console.log("loadOptions: Starting for category:", activeCategory);
        setLoading(true);
        setError(null);
        try {
            if (activeCategory === 'general') {
                // No DB fetch needed for General, just local setup
                setSelectedModel(ModelRegistry.currentModelId);
            } else {
                // Use new OptionService
                const data = await OptionService.getOptions(activeCategory);
                console.log("loadOptions: Received data:", data);
                if (data.length === 0) {
                    // Check if it was a failure disguised as empty
                    // For now, we assume empty array means legitimate empty or handled failure.
                    // But if we want to be sure, we'd need OptionService to throw or return explicit error.
                }
                setOptions(data);
            }

            if (activeCategory === 'privacy') {
                const settings = await ComplianceService.getSettings();
                setPrivacySettings(settings);
            } else if (activeCategory === 'users' && AuthorizationUtils.isAdmin(user)) {
                const fetchedUsers = await AdminService.getUsers();
                setUsers(fetchedUsers);
            }
        } catch (error) {
            console.error("Failed to load options", error);
            setError("Failed to connect to database.");
            showToast("Failed to load configuration", "error");
        } finally {
            console.log("loadOptions: Finished (finally)");
            setLoading(false);
        }
    };

    const handleSaveModel = (model: string) => {
        ModelRegistry.setModel(model as any);
        setSelectedModel(model);
        showToast(`Model updated to ${model}`, 'success');
    };

    const startCreate = () => {
        setEditForm({ sort_order: (options.length + 1) * 10 });
        setIsCreating(true);
        setEditingId(null);
    };

    const startEdit = (option: ItineraryOption) => {
        setEditForm(option);
        setEditingId(option.id);
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!editForm.label || !editForm.value || !activeCategory) {
            showToast("Please fill in label and value", "error");
            return;
        }

        const toSave: any = {
            ...editForm,
            category: activeCategory,
            is_active: true
        };

        // Ensure numeric sort_order
        if (toSave.sort_order) toSave.sort_order = parseInt(toSave.sort_order);

        const success = await OptionService.saveOption(toSave);
        if (success) {
            showToast(editingId ? "Option updated" : "Option created", "success");
            setIsCreating(false);
            setEditingId(null);
            loadOptions();
        } else {
            showToast("Failed to save option", "error");
        }
    };

    const handlePrivacyToggle = async (key: string, value: boolean) => {
        if (!privacySettings) return;
        const newSettings = { ...privacySettings, [key]: value };
        setPrivacySettings(newSettings);

        const success = await ComplianceService.updateSettings({ [key]: value });
        if (success) {
            showToast("Privacy settings saved", "success");
        } else {
            showToast("Failed to save settings", "error");
            // Revert on failure
            setPrivacySettings(privacySettings);
        }
    };

    const handleDelete = async (option: ItineraryOption) => {
        if (!confirm("Are you sure you want to delete this option?")) return;

        const success = await OptionService.deleteOption(option.id);
        if (success) {
            showToast("Option deleted", "success");
            loadOptions();
        } else {
            showToast("Failed to delete option", "error");
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'explorer') => {
        try {
            await AdminService.setUserRole(userId, newRole);
            showToast(`Role updated to ${newRole}`, 'success');
            loadOptions();
        } catch (e) {
            console.error(e);
            showToast("Failed to update role", "error");
        }
    };

    return (
        <DashboardLayout
            user={user}
            activeTab="profile"
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            <div className="h-full flex flex-col bg-stone-50 dark:bg-neutral-950 overflow-hidden">
                {/* ... Header ... */}
                <header className="bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 h-16 flex items-center px-6 justify-between shrink-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-stone-400">
                        <button onClick={onBack} className="hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-1">
                            <Settings className="w-4 h-4" /> Settings
                        </button>
                        <ChevronRight className="w-4 h-4 text-stone-300" />
                        <span className="text-stone-900 dark:text-white font-bold">{activeSectionLabel || 'Configuration'}</span>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* ... Sidebar ... */}
                    <aside className="w-64 bg-stone-50/50 dark:bg-neutral-900/50 border-r border-stone-200 dark:border-neutral-800 flex flex-col py-6 overflow-y-auto hidden md:flex">
                        {settingsSections.map((section, idx) => (
                            <div key={idx} className="mb-6 px-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3 px-2">
                                    {section.title}
                                </h3>
                                <div className="space-y-0.5">
                                    {section.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setActiveCategory(item.id); setIsCreating(false); setEditingId(null); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-3 transition-all ${activeCategory === item.id
                                                ? 'bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-stone-200 dark:ring-neutral-700'
                                                : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-700'
                                                }`}
                                        >
                                            <item.icon className={`w-4 h-4 ${activeCategory === item.id ? 'text-orange-500' : 'opacity-70'}`} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-950">
                        {/* ... Toolbar ... */}
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-stone-100 dark:border-neutral-900">
                            <div>
                                <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                                    {activeSectionLabel}
                                </h1>
                                <p className="text-stone-500 text-sm mt-1">
                                    {activeCategory === 'general'
                                        ? 'Manage global application settings.'
                                        : activeCategory === 'privacy'
                                            ? 'Manage your personal data and compliance settings.'
                                            : `Manage available options for ${activeSectionLabel?.toLowerCase()}.`
                                    }
                                </p>
                            </div>
                            {activeCategory !== 'general' && activeCategory !== 'privacy' && !error && (
                                <button
                                    onClick={startCreate}
                                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add Option
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8">

                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-stone-300">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-400 mb-4"></div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Loading Configuration...</span>
                                </div>
                            ) : error ? (
                                <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-4">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                                        <X className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Connection Error</h3>
                                        <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                                            We couldn't load the options from the database. This is usually due to a network timeout or missing configuration.
                                        </p>
                                        <button onClick={loadOptions} className="text-sm font-bold bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 px-4 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-neutral-800 transition-colors">
                                            Retry Connection
                                        </button>
                                    </div>
                                </div>
                            ) : !BackendService.isConfigured() && activeCategory !== 'general' && activeCategory !== 'privacy' ? (
                                <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl">
                                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Configuration Missing</h3>
                                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                                        Supabase is not configured correctly. Please check your .env variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
                                        <br />
                                        Review the console for more details.
                                    </p>
                                </div>
                            ) : activeCategory === 'general' ? (
                                /* GENERAL SETTINGS UI */
                                <div className="max-w-2xl space-y-6">
                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-6 flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${hasApiKey ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Key className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Gemini API Key</h3>
                                            <p className="text-stone-500 text-sm mb-4">
                                                {hasApiKey
                                                    ? "Your API key is configured in the environment variables. You are ready to generate itineraries."
                                                    : "API Key is missing. Please check your .env file."
                                                }
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-xs font-bold uppercase text-stone-500">{hasApiKey ? 'Active' : 'Missing'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-6">
                                        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Cpu className="w-5 h-5 text-orange-500" /> AI Model
                                        </h3>
                                        <div className="grid gap-3">
                                            {['gemini-1.5-flash-001', 'gemini-1.5-pro-001', 'gemini-2.0-flash-exp'].map(model => (
                                                <button
                                                    key={model}
                                                    onClick={() => handleSaveModel(model)}
                                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${selectedModel === model
                                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                                                        : 'border-stone-100 dark:border-neutral-800 hover:border-stone-300'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className={`font-bold ${selectedModel === model ? 'text-orange-700 dark:text-orange-400' : 'text-stone-700 dark:text-stone-300'}`}>{model}</div>
                                                        <div className="text-xs text-stone-400 mt-0.5">Google DeepMind</div>
                                                    </div>
                                                    {selectedModel === model && <div className="w-4 h-4 rounded-full bg-orange-500"></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : activeCategory === 'privacy' ? (
                                /* PRIVACY SETTINGS UI */
                                <div className="max-w-2xl space-y-6">
                                    {/* Compliance Status Card */}
                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Compliance Status</h3>
                                                <p className="text-stone-500 text-sm mb-4">
                                                    We have detected your region as <strong>California, USA</strong>.
                                                    The application is running in <span className="text-orange-600 font-bold">CCPA Compliance Mode</span>.
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 rounded bg-stone-100 dark:bg-neutral-800 text-xs font-bold text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700">GDPR Ready</span>
                                                    <span className="px-2 py-1 rounded bg-stone-100 dark:bg-neutral-800 text-xs font-bold text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700">CCPA Active</span>
                                                    <span className="px-2 py-1 rounded bg-stone-100 dark:bg-neutral-800 text-xs font-bold text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700">AI Transparency</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Export Card */}
                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-6">
                                        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-orange-500" /> Consent & Permissions
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-stone-900 dark:text-white text-sm">AI Processing</div>
                                                    <div className="text-xs text-stone-500">Allow Google Gemini to process your prompts. Required for itineraries.</div>
                                                </div>
                                                <div
                                                    onClick={() => handlePrivacyToggle('ai_processing_opt_in', !privacySettings?.ai_processing_opt_in)}
                                                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${privacySettings?.ai_processing_opt_in ? 'bg-orange-500' : 'bg-stone-200 dark:bg-neutral-700'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${privacySettings?.ai_processing_opt_in ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-stone-900 dark:text-white text-sm">Product Analytics</div>
                                                    <div className="text-xs text-stone-500">Help us improve by sending anonymous usage data.</div>
                                                </div>
                                                <div
                                                    onClick={() => handlePrivacyToggle('analytics_opt_in', !privacySettings?.analytics_opt_in)}
                                                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${privacySettings?.analytics_opt_in ? 'bg-orange-500' : 'bg-stone-200 dark:bg-neutral-700'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${privacySettings?.analytics_opt_in ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-stone-900 dark:text-white text-sm">Marketing Communications</div>
                                                    <div className="text-xs text-stone-500">Receive occasional emails about new features.</div>
                                                </div>
                                                <div
                                                    onClick={() => handlePrivacyToggle('marketing_opt_in', !privacySettings?.marketing_opt_in)}
                                                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${privacySettings?.marketing_opt_in ? 'bg-orange-500' : 'bg-stone-200 dark:bg-neutral-700'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${privacySettings?.marketing_opt_in ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Export Card */}
                                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 p-6">
                                        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Download className="w-5 h-5 text-orange-500" /> Export Your Data
                                        </h3>
                                        <p className="text-stone-500 text-sm mb-6">
                                            Download a complete copy of your itineraries, preferences, and profile data in machine-readable JSON format.
                                        </p>
                                        <button
                                            onClick={() => {
                                                ComplianceService.downloadDataPackage();
                                                showToast("Data export started...", "success");
                                            }}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-stone-900 dark:text-white text-sm font-bold rounded-lg transition-colors border border-stone-200 dark:border-neutral-700"
                                        >
                                            Download My Data
                                        </button>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 p-6">
                                        <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-4 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" /> Danger Zone
                                        </h3>
                                        <p className="text-red-600 dark:text-red-300 text-sm mb-6">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                if (confirm("Are you absolutely sure? This will verify your identity then permanently delete your account.")) {
                                                    const success = await ComplianceService.deleteUserAccount();
                                                    if (success) {
                                                        // Force reload to kick to auth
                                                        window.location.href = '/';
                                                    } else {
                                                        showToast("Failed to delete account. Try again later.", "error");
                                                    }
                                                }
                                            }}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                                        >
                                            Delete My Account
                                        </button>
                                    </div>
                                </div>
                            ) : activeCategory === 'users' ? (
                                /* USER MANAGEMENT UI */
                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50/50 dark:bg-neutral-900 border-b border-stone-100 dark:border-neutral-800 text-[10px] font-black uppercase tracking-wider text-stone-400">
                                        <div className="col-span-4">User</div>
                                        <div className="col-span-4">Email</div>
                                        <div className="col-span-2">Role</div>
                                        <div className="col-span-2 text-right">Joined</div>
                                    </div>
                                    <div className="divide-y divide-stone-100 dark:divide-neutral-800">
                                        {users.map((u) => (
                                            <div key={u.email} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-stone-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <div className="col-span-4">
                                                    <div className="font-bold text-sm text-stone-900 dark:text-white">{u.name || 'Unknown'}</div>
                                                </div>
                                                <div className="col-span-4">
                                                    <div className="text-xs font-mono text-stone-500">{u.email}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <select
                                                        value={u.role || 'explorer'}
                                                        onChange={(e) => u.email && handleRoleUpdate(u.id!, e.target.value as 'admin' | 'explorer')}
                                                        className="text-xs bg-stone-100 dark:bg-neutral-800 border-none rounded px-2 py-1 font-bold text-stone-700 dark:text-stone-300 cursor-pointer focus:ring-2 focus:ring-orange-500"
                                                    >
                                                        <option value="explorer">Explorer</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <div className="text-xs text-stone-400">
                                                        {/* @ts-ignore */}
                                                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* LIST SETTINGS UI */
                                <>
                                    {/* Creation Form (Inline at top) */}
                                    {isCreating && (
                                        <div className="mb-6 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-xl p-6 animate-in slide-in-from-top-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> New {activeSectionLabel?.slice(0, -1)}
                                                </h3>
                                                <button onClick={() => setIsCreating(false)}><X className="w-4 h-4 text-orange-800/50 hover:text-orange-800" /></button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1.5">Display Label</label>
                                                    <input
                                                        value={editForm.label || ''}
                                                        onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                                        placeholder="e.g. Romantic Dinner"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1.5">Internal Value</label>
                                                    <input
                                                        value={editForm.value || ''}
                                                        onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-sm font-mono text-stone-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                                        placeholder="e.g. romantic_dinner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1.5">Priority</label>
                                                    <input
                                                        type="number"
                                                        value={editForm.sort_order || 0}
                                                        onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-stone-500 hover:text-stone-700 text-sm font-bold">Cancel</button>
                                                <button onClick={handleSave} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">Save Item</button>
                                            </div>
                                        </div>
                                    )}

                                    {options.length === 0 ? (
                                        <div className="py-20 text-center border-2 border-dashed border-stone-100 dark:border-neutral-800 rounded-2xl">
                                            <p className="text-stone-400 font-medium">No options configured yet.</p>
                                            <button onClick={startCreate} className="mt-4 text-orange-600 font-bold hover:underline">Add the first one</button>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-stone-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50/50 dark:bg-neutral-900 border-b border-stone-100 dark:border-neutral-800 text-[10px] font-black uppercase tracking-wider text-stone-400">
                                                <div className="col-span-1">Order</div>
                                                <div className="col-span-8 md:col-span-4">Label</div>
                                                <div className="hidden md:block col-span-3">Value</div>
                                                <div className="hidden md:block col-span-2">Icon</div>
                                                <div className="col-span-3 md:col-span-2 text-right">Actions</div>
                                            </div>
                                            <div className="divide-y divide-stone-100 dark:divide-neutral-800">
                                                {options.map((option) => (
                                                    <div key={option.id} className="group hover:bg-stone-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                        {editingId === option.id ? (
                                                            /* Inline Edit Row */
                                                            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-blue-50/50 dark:bg-blue-900/10">
                                                                <div className="md:col-span-1">
                                                                    <input
                                                                        type="number"
                                                                        value={editForm.sort_order}
                                                                        onChange={e => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) })}
                                                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-neutral-900"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-4">
                                                                    <input
                                                                        value={editForm.label}
                                                                        onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-neutral-900"
                                                                        placeholder="Label"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-3">
                                                                    <input
                                                                        value={editForm.value}
                                                                        onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                                                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-neutral-900 font-mono"
                                                                        placeholder="Value"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2">
                                                                    <input
                                                                        value={editForm.icon || ''}
                                                                        onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                                                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-neutral-900"
                                                                        placeholder="Icon Name"
                                                                    />
                                                                </div>
                                                                <div className="md:col-span-2 flex justify-end gap-2">
                                                                    <button onClick={handleSave} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4" /></button>
                                                                    <button onClick={() => setEditingId(null)} className="p-2 bg-stone-100 text-stone-500 rounded hover:bg-stone-200"><X className="w-4 h-4" /></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Display Row */
                                                            <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                                                                <div className="col-span-1">
                                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 dark:bg-neutral-800 text-xs font-bold text-stone-500">
                                                                        {option.sort_order}
                                                                    </span>
                                                                </div>
                                                                <div className="col-span-8 md:col-span-4">
                                                                    <div className="font-bold text-sm text-stone-900 dark:text-white">{option.label}</div>
                                                                </div>
                                                                <div className="hidden md:block col-span-3">
                                                                    <code className="text-xs bg-stone-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 font-mono">
                                                                        {option.value}
                                                                    </code>
                                                                </div>
                                                                <div className="hidden md:block col-span-2">
                                                                    {option.icon ? (
                                                                        <span className="text-xs text-stone-500 flex items-center gap-1.5">
                                                                            <Layers className="w-3 h-3 opacity-50" /> {option.icon}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-xs text-stone-300 italic">None</span>
                                                                    )}
                                                                </div>
                                                                <div className="col-span-3 md:col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => startEdit(option)} className="p-2 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg text-stone-400 hover:text-stone-900 transition-colors" title="Edit">
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(option)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-stone-400 hover:text-red-500 transition-colors" title="Delete">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </DashboardLayout>
    );
};
