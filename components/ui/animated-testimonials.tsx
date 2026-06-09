"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Quote, Star } from "lucide-react"
import { motion, useAnimation, useInView, type Variants } from "framer-motion"
import { useEffect, useRef, useState } from "react"

export interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar: string
}

export interface AnimatedTestimonialsProps {
  title?: string
  subtitle?: string
  badgeText?: string
  testimonials?: Testimonial[]
  autoRotateInterval?: number
  trustedCompanies?: string[]
  trustedCompaniesTitle?: string
  className?: string
}

export function AnimatedTestimonials({
  title = "Loved by sellers worldwide",
  subtitle = "Don't just take our word for it.",
  badgeText = "Trusted by e-commerce sellers",
  testimonials = [],
  autoRotateInterval = 5000,
  trustedCompanies = [],
  trustedCompaniesTitle = "Used by sellers on",
  className,
}: AnimatedTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const controls = useAnimation()

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  }
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  }

  useEffect(() => {
    if (isInView) controls.start("visible")
  }, [isInView, controls])

  useEffect(() => {
    if (autoRotateInterval <= 0 || testimonials.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((c) => (c + 1) % testimonials.length)
    }, autoRotateInterval)
    return () => clearInterval(interval)
  }, [autoRotateInterval, testimonials.length])

  if (testimonials.length === 0) return null

  return (
    <section ref={sectionRef} id="testimonials" className={`overflow-hidden bg-zinc-950 py-20 ${className ?? ""}`}>
      {/* Subtle top separator */}
      <div className="mx-auto mb-16 h-px max-w-5xl" style={{ background: "linear-gradient(90deg,transparent,#6366f140,#a855f740,transparent)" }} />

      <div className="mx-auto max-w-5xl px-5">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-20"
        >
          {/* Left: heading + dots */}
          <motion.div variants={itemVariants} className="flex flex-col justify-center">
            <div className="space-y-5">
              {badgeText && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  {badgeText}
                </div>
              )}
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">{title}</h2>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-500">{subtitle}</p>

              {/* Navigation dots */}
              <div className="flex items-center gap-2.5 pt-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIndex === i ? "w-8 bg-indigo-500" : "w-2 bg-zinc-700 hover:bg-zinc-600"
                    }`}
                    aria-label={`Testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: cards */}
          <motion.div variants={itemVariants} className="relative min-h-[320px]">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 60 }}
                animate={{
                  opacity: activeIndex === i ? 1 : 0,
                  x: activeIndex === i ? 0 : 60,
                  scale: activeIndex === i ? 1 : 0.96,
                }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                style={{ zIndex: activeIndex === i ? 10 : 0 }}
              >
                <div className="flex h-full flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-7 shadow-2xl">
                  {/* Stars */}
                  <div className="mb-5 flex gap-1">
                    {Array(t.rating).fill(0).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6 flex-1">
                    <Quote className="absolute -left-1 -top-1 h-7 w-7 rotate-180 text-indigo-500/20" />
                    <p className="relative z-10 text-sm font-medium leading-relaxed text-zinc-200 sm:text-base">
                      &ldquo;{t.content}&rdquo;
                    </p>
                  </div>

                  <Separator className="my-4" />

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-zinc-700/60">
                      <AvatarImage src={t.avatar} alt={t.name} />
                      <AvatarFallback className="text-xs font-bold">{t.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{t.name}</p>
                      <p className="text-xs text-zinc-600">{t.role}, {t.company}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Decorative blobs */}
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-xl bg-indigo-500/5" />
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-xl bg-violet-500/5" />
          </motion.div>
        </motion.div>

        {/* Trusted platforms strip */}
        {trustedCompanies.length > 0 && (
          <motion.div variants={itemVariants} initial="hidden" animate={controls} className="mt-16 text-center">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-zinc-700">{trustedCompaniesTitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {trustedCompanies.map((c) => (
                <span key={c} className="text-base font-bold text-zinc-700 transition-colors hover:text-zinc-500">{c}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
