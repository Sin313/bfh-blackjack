'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Sword, Zap } from "lucide-react";
import Image from "next/image";
export default function Home() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_BFH_CLIENT_ID || 'your_client_id_here';
    const authUrl = 'https://auth.bravefrontierheroes.com/oauth2/auth';
    const redirectUri = `${window.location.origin}/callback`;
    const scope = 'openid profile email offline_access';
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const url = `${authUrl}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = url;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -z-10 animate-pulse delay-700" />

      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-glow bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            BFH FORGE DASHBOARD
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-sans">
            Brave Frontier Heroes External API を活用して、あなたの冒険をデータでサポートします。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {[
            { icon: <Sword className="w-8 h-8 text-blue-400" />, title: "Hero Stats", desc: "ヒーローのステータスを詳細に分析" },
            { icon: <ShieldCheck className="w-8 h-8 text-green-400" />, title: "Assets", desc: "所持ユニット・スフィアを一括管理" },
            { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Battle Logs", desc: "ランクマッチのログを可視化" },
          ].map((feature, i) => (
            <Card key={i} className="glass-card hover:border-blue-500/50 transition-all duration-300">
              <CardHeader className="items-center">
                <div className="p-3 bg-white/5 rounded-2xl mb-2">{feature.icon}</div>
                <CardTitle className="font-display">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400">{feature.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleLogin}
            size="lg"
            className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-none shadow-lg shadow-blue-500/20 rounded-xl group transition-all"
          >
            ブレヒロでログイン
            <Zap className="ml-2 w-5 h-5 group-hover:animate-bounce" />
          </Button>
          <p className="text-sm text-slate-500">
            OAuth2 認証により、安全に情報を取得します
          </p>
        </div>
      </div>
    </main>
  );
}
