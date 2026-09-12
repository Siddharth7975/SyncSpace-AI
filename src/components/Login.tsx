import { useState } from "react";
import { LogIn } from "lucide-react";
import { loginUser } from "../services/authService";

interface LoginProps {
  onSuccess: (token: string, user: any) => void;
  onSwitch: () => void;
}

export default function Login({ onSuccess, onSwitch }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      if (!data.success) {
        alert(data.message);
        return;
      }

      localStorage.setItem("syncspace_token", data.token);
      localStorage.setItem("syncspace_user", JSON.stringify(data.user));

      onSuccess(data.token, data.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400 mb-6">
          Login to continue to SyncSpace
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-lg py-3 text-white flex justify-center gap-2"
          >
            <LogIn size={18}/>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <button
          onClick={onSwitch}
          className="mt-5 text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Create a new account
        </button>
      </div>
    </div>
  );
}