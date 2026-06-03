"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Users, MessageSquare, Activity } from "lucide-react";
import { Reveal } from "@/src/components/shared/reveal";

const stats = [
  {
    icon: MessageCircle,
    target: 10000000,
    label: "Messages Delivered",
    suffix: "+",
    prefix: "",
  },
  {
    icon: Users,
    target: 500000,
    label: "Active Users",
    suffix: "+",
    prefix: "",
  },
  {
    icon: MessageSquare,
    target: 50000,
    label: "Conversations Created",
    suffix: "+",
    prefix: "",
  },
  { icon: Activity, target: 99.9, label: "Uptime", suffix: "%", prefix: "" },
];

function formatValue(value: number, suffix: string): string {
  if (suffix === "%") return value.toFixed(1) + "%";
  if (value >= 1000000) return (value / 1000000).toFixed(1) + "M+";
  if (value >= 1000) return (value / 1000).toFixed(0) + "K+";
  return value.toLocaleString() + suffix;
}

function AnimatedCounter({
  target,
  suffix,
  prefix,
}: {
  target: number;
  suffix: string;
  prefix: string;
}) {
  const [display, setDisplay] = useState(prefix + "0" + suffix);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setStarted(true);
        }
      },
      { threshold: 0.1 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(increment * step, target);
      setDisplay(prefix + formatValue(current, suffix));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [started, target, suffix, prefix]);

  return <span ref={ref}>{display}</span>;
}

export function Stats() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <Reveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="stat bg-base-200/50 rounded-2xl border border-base-300/50 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="stat-figure text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="stat-title text-base-content/60">Total</div>
                  <div className="stat-value text-3xl md:text-4xl text-primary">
                    <AnimatedCounter
                      target={stat.target}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                    />
                  </div>
                  <div className="stat-desc">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
