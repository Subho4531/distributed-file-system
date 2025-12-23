import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    throw error;
                }

                if (data.session) {
                    setSuccess(true);
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 2000);
                } else {
                    // Handle the auth callback from email verification
                    const { error: authError } = await supabase.auth.getUser();
                    if (authError) {
                        throw authError;
                    }
                    
                    setSuccess(true);
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 2000);
                }
            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message || 'Authentication failed');
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-glass p-8 rounded-3xl text-center max-w-md w-full"
            >
                {loading ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
                            Verifying Account
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Please wait while we verify your email...
                        </p>
                    </div>
                ) : success ? (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
                            Email Verified
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Your account has been verified successfully. Redirecting to dashboard...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-rose-400" />
                        </div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
                            Verification Failed
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {error || 'Unable to verify your email. Please try again.'}
                        </p>
                        <p className="text-xs text-slate-500">
                            Redirecting to login page...
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}