import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Star, Flame, Target, Trophy, ChevronRight } from "lucide-react";

export default function LessonComplete() {
  const [, setLocation] = useLocation();

  // In a real app we'd read the result from state or refetch the summary. 
  // For this demo we'll use placeholder celebration stats that look good.
  const stats = [
    { label: "Нийт XP", value: "+15", icon: Star, color: "text-yellow-500 fill-yellow-500", bg: "bg-yellow-100", border: "border-yellow-400" },
    { label: "Нарийвчлал", value: "90%", icon: Target, color: "text-green-500", bg: "bg-green-100", border: "border-green-400" },
    { label: "Хугацаа", value: "1:45", icon: Trophy, color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-400" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-32 h-32 bg-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-yellow-200 shadow-lg relative">
            <Star className="w-16 h-16 text-white fill-white relative z-10" />
            
            {/* Simple CSS animation for celebration */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-dashed border-white/50 rounded-full" 
            />
          </div>
          <h1 className="text-4xl font-black text-yellow-500 mb-2">Хичээл дууслаа!</h1>
          <p className="text-xl font-bold text-muted-foreground">Сайн хийж байна!</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 w-full mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`p-4 rounded-2xl border-2 border-b-4 ${stat.border} ${stat.bg} flex flex-col items-center justify-center text-center`}
            >
              <stat.icon className={`w-8 h-8 mb-2 ${stat.color}`} />
              <div className="font-black text-xl mb-1 text-foreground">{stat.value}</div>
              <div className="text-xs font-bold text-foreground/60 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={() => setLocation("/")}
          className="button-press w-full py-4 rounded-2xl bg-primary text-white font-black text-xl border-b-4 border-primary-border uppercase tracking-wider flex items-center justify-center"
        >
          Үргэлжлүүлэх
        </motion.button>
      </div>
    </div>
  );
}
