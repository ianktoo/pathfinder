import React, { useState } from 'react';
import { User, MapPin, Lock, Save, Trash2, ArrowLeft, Coffee, Star, Moon, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserProfile, ViewState } from '../../types';
import { BackendService } from '../../services/storage';
import { DashboardLayout } from '../layout/DashboardLayout';

interface ProfileViewProps {
    user: UserProfile;
    onBack: () => void;
    onUpdate: (user: UserProfile) => void;
    onLogout: () => void;
    onNavigate: (view: ViewState) => void;
}

export const ProfileView = ({ user, onBack, onUpdate, onLogout, onNavigate }: ProfileViewProps) => {
    const [name, setName] = useState(user.name);
    const [city, setCity] = useState(user.city);
    const [personality, setPersonality] = useState(user.personality);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const personalities = [
        { id: 'Adventurous', icon: MapPin },
        { id: 'Chill', icon: Coffee },
        { id: 'Foodie', icon: Star },
        { id: 'Party', icon: Moon },
    ];

    const handleSave = async () => {
        setIsLoading(true);
        const updated = { ...user, name, city, personality };
        // Await the backend save operation (Local Storage + Supabase)
        await BackendService.saveUser(updated);
        onUpdate(updated);
        setIsSaved(true);
        setIsLoading(false);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure? This will wipe your local data.")) {
            onLogout();
        }
    };

    return (
        <DashboardLayout
            user={user}
            activeTab="profile"
            onNavigate={onNavigate}
            onLogout={onLogout}
        >
            {/* Mobile Header */}
            <header className="md:hidden bg-white dark:bg-neutral-900 p-6 border-b border-stone-200 dark:border-neutral-800 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 text-stone-500 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                        Profile
                    </h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-24">
                <div className="max-w-3xl mx-auto w-full space-y-8">

                    <div className="hidden md:flex items-center gap-4 mb-8">
                        <div className="w-20 h-20 rounded-full bg-stone-200 dark:bg-neutral-800 flex items-center justify-center font-black text-3xl text-stone-500 dark:text-stone-400">
                            {user.name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                                Profile & Settings
                            </h1>
                            <p className="text-stone-500 dark:text-stone-400 font-medium">Manage your identity and preferences</p>
                        </div>
                    </div>

                    <section className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm">
                        <h2 className="text-lg font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-orange-600" /> Identity
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />
                            <Input label="Home City" value={city} onChange={(e) => setCity(e.target.value)} />
                            <div className="md:col-span-2">
                                <Input label="Email Address" value={user.email} disabled className="opacity-60 cursor-not-allowed" />
                                <p className="text-xs text-stone-400 mt-1">Email cannot be changed in this version.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm">
                        <h2 className="text-lg font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                            <Star className="w-5 h-5 text-orange-600" /> Vibe Check
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {personalities.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPersonality(p.id as any)}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${personality === p.id
                                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                                        : 'border-stone-100 dark:border-neutral-800 hover:border-orange-300 dark:text-stone-400'
                                        }`}
                                >
                                    <p.icon className="w-6 h-6" />
                                    <span className="text-sm font-bold">{p.id}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-stone-200 dark:border-neutral-800 shadow-sm">
                        <h2 className="text-lg font-black text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-orange-600" /> Security
                        </h2>
                        <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-neutral-950 rounded-xl border border-stone-100 dark:border-neutral-800">
                            <div className="text-sm font-bold text-stone-600 dark:text-stone-300">Password</div>
                            <Button variant="outline" className="w-auto py-2 h-auto text-xs" onClick={() => alert("Password reset link sent to your email (Demo).")}>
                                Reset Password
                            </Button>
                        </div>
                    </section>

                    <div className="flex flex-col gap-4 pt-4">
                        <Button onClick={handleSave} isLoading={isLoading} icon={Save} className={isSaved ? "bg-green-600 hover:bg-green-700" : ""}>
                            {isSaved ? "Changes Saved!" : "Save Changes"}
                        </Button>

                        <Button variant="secondary" icon={LogOut} onClick={onLogout} className="md:hidden">
                            Sign Out
                        </Button>

                        <div className="pt-8 border-t border-stone-200 dark:border-neutral-800">
                            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-4">Danger Zone</h3>
                            <Button variant="danger" icon={Trash2} onClick={handleDeleteAccount}>
                                Delete Account & Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};